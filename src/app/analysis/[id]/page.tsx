import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import { createClient } from '@supabase/supabase-js';

// We do data fetching here server-side!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function AnalysisPage(props: Props) {
  const params = await props.params;

  // 1. Fetch DB
  const { data: tender, error } = await supabase
    .from('tenders')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !tender) {
    return <div className="p-8 text-center text-danger font-bold">Error: Tender not found.</div>;
  }

  // 2. Fetch requirements that belong to this tender
  const { data: reqs } = await supabase
    .from('tender_requirements')
    .select('*')
    .eq('tender_id', params.id);

  // If status is still 'uploaded', we could trigger an API right here (server-side fetch) 
  // or instruct the client to ping it. For simplicity, let's trigger it directly here if missing.
  let requirements = reqs || [];
  let isAnalyzing = tender.status === 'uploaded';
  
  if (isAnalyzing && typeof fetch !== 'undefined') {
    // In a real app we'd use a background worker. For prototype, we do it inline or client-side fetch.
    // However, server rendering will block until done, which could be slow.
    // So we will just show a "Processing..." state and use a Client Component for polling.
  }

  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      <Header />
      
      <div className="bg-surface p-4 flex justify-between items-center shadow-sm border-b border-border-primary">
        <h2 className="text-lg font-bold">Tender Analysis</h2>
        <Link href="/" className="flex items-center gap-2 text-sm text-secondary hover:underline">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      <main className="flex-grow p-4 md:p-8 max-w-5xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
             {tender.filename} 
          </h2>
          <div className="flex flex-wrap gap-4 text-text-secondary text-sm">
            <span><strong>File:</strong> {tender.filename}</span>
            <span><strong>Status:</strong> {tender.status}</span>
            {tender.status === 'analyzed' ? (
               <span className="flex items-center gap-1 text-success font-medium">
                 <CheckCircle2 size={16} /> Extraction Complete
               </span>
            ) : tender.status === 'analysis_failed' ? (
               <span className="flex items-center gap-1 text-danger font-medium">
                 <span className="text-lg leading-none">!</span> AI extraction failed. Please retry later.
               </span>
            ) : (
               <span className="flex items-center gap-1 text-warning font-medium">
                 <Loader2 className="animate-spin" size={16} /> Analyzing PDF Structure (Refresh in 10s...)
               </span>
            )}
          </div>
        </div>

        <div className="bg-surface rounded-lg border border-border-primary shadow-sm overflow-hidden mb-8">
          <div className="p-4 bg-gray-50 border-b border-border-primary flex justify-between items-center">
            <h3 className="font-semibold text-primary">Extracted Technical Requirements</h3>
            {requirements.length > 0 && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{requirements.length} Found</span>}
          </div>
          <div className="p-4">
            {requirements.length === 0 ? (
              <div className="text-center p-8 text-text-secondary">
                 No requirements extracted yet. If analyzing, please wait.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requirements.map(req => (
                  <div key={req.id} className="p-3 border border-border-primary rounded bg-background-primary">
                    <div className="text-xs text-secondary font-medium uppercase mb-1">{req.category}</div>
                    <div className="flex justify-between items-end">
                      <span className="text-text-primary font-medium">{req.requirement}</span>
                      <span className="text-primary font-bold">{req.value}</span>
                    </div>
                    {req.source_text && (
                       <div className="text-xs text-text-secondary mt-2 bg-white p-1 rounded font-mono truncate">"{req.source_text}"</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <Link 
            href={`/analysis/${params.id}/recommendations`}
            className={`bg-primary text-surface px-6 py-3 rounded font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors ${tender.status !== 'analyzed' || requirements.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}
          >
            Retrieve Standard Recommendations
            <ChevronRight size={20} />
          </Link>
        </div>
      </main>
    </div>
  );
}
