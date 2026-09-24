import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupBucket() {
  const { data, error } = await supabase.storage.createBucket('tenders', {
    public: false,
    allowedMimeTypes: ['application/pdf'],
    fileSizeLimit: 52428800 // 50MB
  });
  if (error && error.message !== 'The resource already exists') {
    console.error('Bucket creation failed:', error.message);
  } else {
    console.log('Bucket "tenders" is ready!');
  }
}
setupBucket();
