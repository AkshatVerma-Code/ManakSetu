import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
// Keeping the model name exactly as it was configured
const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

async function generateContentWithRetry(model: any, prompt: any, inlineData: any, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const result = await model.generateContent([prompt, inlineData]);
      return result;
    } catch (error: any) {
      if (error && error.status === 503) {
        attempt++;
        if (attempt >= maxRetries) throw error;
        console.warn(`[503 Service Unavailable] Gemini experiencing high demand. Retrying in ${attempt * 4} seconds...`);
        await new Promise(res => setTimeout(res, attempt * 4000)); // Exponential-ish fallback 4s, 8s, 12s
      } else {
        throw error;
      }
    }
  }
}

export async function POST(request: Request) {
  try {
    const { tenderId } = await request.json();

    if (!tenderId) return NextResponse.json({ error: 'Missing tenderId' }, { status: 400 });

    const { data: tender, error: fetchErr } = await supabase
      .from('tenders')
      .select('storage_path, status, id')
      .eq('id', tenderId)
      .single();

    if (fetchErr || !tender) throw new Error('Tender not found');

    // Download the PDF from storage
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from('tenders')
      .download(tender.storage_path);

    if (downloadErr || !fileData) throw new Error(`Download failed: ${downloadErr?.message}`);

    // Convert Blob to Base64 for Gemini
    const arrayBuffer = await fileData.arrayBuffer();
    const base64PDF = Buffer.from(arrayBuffer).toString('base64');

    const prompt = `
      You are an expert procurement and technical standards extractor.
      Read this tender document and extract specific, measurable technical requirements (e.g., dimensions, load limits, electrical specs, safety codes, material grades, IP ratings).
      Ignore generic clauses. Focus on the core physical product or service specifications!

      Return the results as a JSON array of objects strictly in this format:
      [
        {
          "category": "Electrical / Physical / Safety / etc",
          "requirement": "Clean name of requirement, e.g. Power Output or Material",
          "value": "e.g. 90W or 304 Grade",
          "unit": "W",
          "source_text": "A brief quote from the document proving this",
          "page_number": 1
        }
      ]

      Respond with ONLY the raw JSON array. Do not include markdown code block formatting like \`\`\`json.
    `;

    // Process with Gemini Vision / Context with internal retry logic
    const result = await generateContentWithRetry(model, prompt, { inlineData: { data: base64PDF, mimeType: "application/pdf" } });

    let textResp = result.response.text().trim();
    if (textResp.startsWith('```json')) {
      textResp = textResp.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    let extractedReqs = JSON.parse(textResp);

    console.log(`Extracted ${extractedReqs.length} requirements`);

    // Generate Embeddings and Insert
    for (const req of extractedReqs) {
      if (!req.requirement || !req.value) continue;

      const embedText = `${req.category} | ${req.requirement} | ${req.value} | ${req.source_text}`;
      const embedResp = await embeddingModel.embedContent(embedText);
      const embedding = embedResp.embedding.values.slice(0, 768);

      await supabase.from('tender_requirements').insert({
        tender_id: tender.id,
        category: req.category,
        requirement: req.requirement,
        value: req.value,
        unit: req.unit,
        source_text: req.source_text,
        page_number: req.page_number || 1,
        embedding: embedding
      });
    }

    // Update status to analyzed
    await supabase.from('tenders').update({ status: 'analyzed' }).eq('id', tender.id);

    return NextResponse.json({ success: true, count: extractedReqs.length });

  } catch (err: any) {
    console.error('Analyze Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
