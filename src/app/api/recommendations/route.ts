import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function POST(request: Request) {
  try {
    const { tenderId } = await request.json();

    if (!tenderId) return NextResponse.json({ error: 'Missing tenderId' }, { status: 400 });

    // 1. Fetch requirements for this tender
    const { data: reqs, error: reqErr } = await supabase
      .from('tender_requirements')
      .select('*')
      .eq('tender_id', tenderId);

    if (reqErr || !reqs || reqs.length === 0) throw new Error('No requirements found. Did extraction finish?');

    // 2. We will average the requirement embeddings to create a single Tender Query Vector, OR find nearest neighbors for each requirement.
    // For simplicity, let's find standards that match any of the requirements strongly.
    
    // Fetch all standards (there are ~33 for the demo)
    const { data: standards, error: stdErr } = await supabase
      .from('standards')
      .select('id, standard_number, title, embedding, scope_summary, requirement_cues');

    if (stdErr || !standards) throw new Error('Failed to fetch standards');

    let recommendationsMap = new Map();

    // Match each requirement against all standards
    reqs.forEach((req: any) => {
      // req.embedding might be a JSON array or string, parse it.
      const reqVec = typeof req.embedding === 'string' ? JSON.parse(req.embedding) : req.embedding;
      if (!reqVec || reqVec.length === 0) return;

      standards.forEach((std: any) => {
        const stdVec = typeof std.embedding === 'string' ? JSON.parse(std.embedding) : std.embedding;
        if (!stdVec || stdVec.length === 0) return;

        const sim = cosineSimilarity(reqVec, stdVec);
        
        if (sim > 0.65) { // Threshold
          if (!recommendationsMap.has(std.id)) {
            recommendationsMap.set(std.id, {
              ...std,
              maxSimilarity: sim,
              matchedReqs: [{ req: req.requirement, val: req.value, sim, source: req.source_text }]
            });
          } else {
            const current = recommendationsMap.get(std.id);
            if (sim > current.maxSimilarity) current.maxSimilarity = sim;
            current.matchedReqs.push({ req: req.requirement, val: req.value, sim, source: req.source_text });
          }
        }
      });
    });

    // Sort by max similarity
    let finalRecs = Array.from(recommendationsMap.values()).sort((a, b) => b.maxSimilarity - a.maxSimilarity).slice(0, 5);

    // Format for Frontend
    const results = finalRecs.map(r => {
      let relevance = 'Low';
      if (r.maxSimilarity > 0.8) relevance = 'High';
      else if (r.maxSimilarity > 0.70) relevance = 'Medium';

      return {
        id: r.id,
        standard_number: r.standard_number,
        title: r.title,
        relevance,
        reasons: r.matchedReqs.map((m: any) => `Requirement Match: ${m.req} = ${m.val}`),
        tender_evidence: [...new Set(r.matchedReqs.map((m: any) => `Tender Source: "${m.source}"`))],
        ai_note: `Candidate identified via vector search score: ${(r.maxSimilarity * 100).toFixed(1)}%. Scope: ${r.scope_summary}`
      };
    });

    return NextResponse.json({ recommendations: results });

  } catch (err: any) {
    console.error('Recommendations API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
