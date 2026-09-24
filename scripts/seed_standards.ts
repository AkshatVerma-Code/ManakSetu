import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// Load environment variables from .env or .env.local
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase URL or Service Role Key in environment variables.");
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error("❌ Missing Gemini API Key in environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

async function seedStandards() {
  console.log("🚀 Starting Indian Standards Seeder...");

  const csvFilePath = path.join(process.cwd(), 'indian_standards_prototype.csv');
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ CSV file not found at ${csvFilePath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  
  const records: any[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true, 
  });

  console.log(`📄 Found ${records.length} standards to process.`);

  let successCount = 0;
  let failCount = 0;

  for (const record of records) {
    try {
      const standardNumber = record.standard_id;
      const embeddingText = record.embedding_text;

      const keywords = record.keywords ? record.keywords.split(';').map((k: string) => k.trim()).filter((k: string) => k) : [];
      let requirementCues = record.requirement_cues;

      console.log(`Processing: ${standardNumber}...`);

      const { data: existing } = await supabase
        .from('standards')
        .select('id')
        .eq('standard_number', standardNumber)
        .single();
        
      if (existing) {
        console.log(`   ⏭️ Skipping ${standardNumber}: Already exists in database.`);
        continue;
      }

      if (!embeddingText) {
         console.warn(`   ⚠️ Missing embedding text for ${standardNumber}. Skipping...`);
         continue;
      }
      
      const result = await embeddingModel.embedContent(embeddingText);
      const embedding = result.embedding.values.slice(0, 768);

      const { error } = await supabase
        .from('standards')
        .insert({
          standard_number: standardNumber,
          title: record.title,
          department: record.department,
          sector: record.sector,
          keywords: keywords,
          scope_summary: record.scope_summary,
          requirement_cues: requirementCues,
          status: record.status_for_demo,
          source_url: record.source_url,
          prototype_note: record.prototype_note,
          embedding: embedding 
        });

      if (error) {
        console.error(`   ❌ Failed to insert ${standardNumber}:`, error.message);
        failCount++;
      } else {
        console.log(`   ✅ Successfully inserted ${standardNumber}`);
        successCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (err: any) {
      console.error(`   ❌ Error processing ${record.standard_id}:`, err.message);
      failCount++;
    }
  }

  console.log(`\n🎉 Seeding Completed!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
}

seedStandards().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
