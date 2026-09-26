import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set. Gemini requests will fail until it is configured.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const GEMINI_MODEL_FALLBACKS = [
  GEMINI_MODEL,
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
].filter((value, index, array) => value && array.indexOf(value) === index);

function getGeminiModel(modelName: string) {
  return genAI.getGenerativeModel({ model: modelName });
}

function formatGeminiError(error: any) {
  if (!error) return 'Unknown Gemini error';

  const status = error.status ?? error.code ?? 'unknown';
  const message = error.message || 'No details provided';

  if (status === 404 || status === 400) {
    return `Gemini model configuration error: ${message}. Check GEMINI_MODEL and GEMINI_API_KEY.`;
  }

  return `Gemini request failed (${status}): ${message}`;
}

async function generateContentWithRetry(prompt: any, inlineData: any, maxRetries = 3) {
  let lastError: any = null;

  for (const modelName of GEMINI_MODEL_FALLBACKS) {
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const model = getGeminiModel(modelName);
        const result = await model.generateContent([prompt, inlineData]);
        return result;
      } catch (error: any) {
        lastError = error;

        const status = error?.status ?? error?.code;
        const isRetryable = status === 503 || status === 429 || status === 500;

        if (isRetryable && attempt < maxRetries - 1) {
          attempt++;
          console.warn(`[${status}] Gemini ${modelName} is temporarily unavailable. Retrying in ${attempt * 4} seconds...`);
          await new Promise(res => setTimeout(res, attempt * 4000));
          continue;
        }

        if (status === 404 || status === 400) {
          console.warn(`Gemini model ${modelName} is unavailable; trying fallback models...`);
          break;
        }

        throw new Error(formatGeminiError(error));
      }
    }
  }

  throw new Error(formatGeminiError(lastError));
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

    let extractedReqs: any[] = [];

    try {
      // Process with Gemini Vision / Context with internal retry logic
      const result = await generateContentWithRetry(prompt, { inlineData: { data: base64PDF, mimeType: "application/pdf" } });

      let textResp = result.response.text().trim();
      if (textResp.startsWith('```json')) {
        textResp = textResp.replace(/```json/g, '').replace(/```/g, '').trim();
      }

      extractedReqs = JSON.parse(textResp);
    } catch (err: any) {
      console.error('Gemini extraction failed:', err);
      await supabase.from('tenders').update({ status: 'analysis_failed' }).eq('id', tender.id);
      return NextResponse.json({ 
        error: 'Gemini AI is temporarily unavailable. Please try again later or check the service status.'
      }, { status: 503 });
    }

    console.log(`Extracted ${extractedReqs.length} requirements`);

    // Generate Embeddings and Insert
    for (const req of extractedReqs) {
      if (!req.requirement || !req.value) continue;

      const embedText = `${req.category} | ${req.requirement} | ${req.value} | ${req.source_text}`;
      let embedding = new Array(768).fill(0);

      try {
        const embeddingModel = getGeminiModel(EMBEDDING_MODEL);
        const embedResp = await embeddingModel.embedContent(embedText);
        embedding = embedResp.embedding.values.slice(0, 768);
      } catch (embedErr) {
        console.warn('Embedding failed, using zero vector fallback:', embedErr);
      }

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
