import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('tenders')
      .upload(filePath, file, { contentType: file.type });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Insert into 'tenders' table
    const { data, error: dbError } = await supabase
      .from('tenders')
      .insert({
        filename: file.name,
        storage_path: filePath,
        page_count: 0, // Calculate later
        status: 'uploaded',
      })
      .select('id')
      .single();

    if (dbError) {
      throw new Error(`DB Insert failed: ${dbError.message}`);
    }

    return NextResponse.json({ tenderId: data.id });
  } catch (err: any) {
    console.error('Upload Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
