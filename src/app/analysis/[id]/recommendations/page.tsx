import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import Header from '@/components/layout/Header';
import RecommendationsClient from './RecommendationsClient';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function RecommendationsPage(props: Props) {
  const params = await props.params;
  
  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      <Header />
      
      <div className="bg-surface p-4 flex justify-between items-center shadow-sm border-b border-border-primary">
        <h2 className="text-lg font-bold">Standard Recommendations</h2>
        <div className="flex gap-4 items-center">
          <Link href={`/analysis/${params.id}`} className="flex items-center gap-2 text-sm text-secondary hover:underline">
            <ArrowLeft size={16} /> Back
          </Link>
          <Link href={`/analysis/${params.id}/report`} className="bg-secondary text-surface px-4 py-2 rounded text-sm font-medium flex items-center gap-2 hover:bg-secondary/90 transition-colors">
            <FileText size={16} /> Generate Report
          </Link>
        </div>
      </div>

      <main className="flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full">
        <RecommendationsClient tenderId={params.id} />
      </main>
    </div>
  );
}
