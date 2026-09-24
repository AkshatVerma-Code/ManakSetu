import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function check() {
  const models = ['gemini-embedding-001', 'text-embedding-004']; // text-embedding-004 gives 404
  for (const m of models) {
    try {
        const model = genAI.getGenerativeModel({ model: m });
        const result = await model.embedContent('Hello');
        console.log(`${m}: ${result.embedding.values.length}`);
    } catch(e: any) {
        console.log(`${m} failed: ${e.message}`);
    }
  }
}
check().catch(console.error);
