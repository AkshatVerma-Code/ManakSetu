import { createClient } from '@supabase/supabase-js';
import Header from '@/components/layout/Header';
import ReportActionsClient from './ReportActionsClient';
import ReportContentClient from './ReportContentClient';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReportPage(props: Props) {
  const params = await props.params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const { data: tender, error: tenderError } = await supabase
    .from('tenders')
    .select('*')
    .eq('id', params.id)
    .single();

  if (tenderError || !tender) {
    return <div className="p-8 text-center text-red-600 font-bold">Tender not found.</div>;
  }

  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      <Header />

      <div className="bg-surface p-4 flex justify-between items-center shadow-sm border-b border-border-primary print:hidden">
        <h2 className="text-lg font-bold">Final Recommendation Report</h2>
        <ReportActionsClient tenderId={params.id} />
      </div>

      <ReportContentClient tenderId={params.id} tenderName={tender.filename} />
    </div>
  );
}
