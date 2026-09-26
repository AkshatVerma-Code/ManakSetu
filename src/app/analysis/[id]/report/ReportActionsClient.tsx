'use client';

import Link from 'next/link';
import { ArrowLeft, Download, Printer } from 'lucide-react';

export default function ReportActionsClient({ tenderId }: { tenderId: string }) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadPdf = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="flex gap-4 items-center">
      <Link href={`/analysis/${tenderId}/recommendations`} className="flex items-center gap-2 text-sm text-secondary hover:underline">
        <ArrowLeft size={16} /> Edit Review
      </Link>
      <button
        onClick={handlePrint}
        className="bg-surface text-primary px-4 py-2 rounded text-sm font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors border border-border-primary"
      >
        <Printer size={16} /> Print
      </button>
      <button
        onClick={handleDownloadPdf}
        className="bg-secondary text-surface px-4 py-2 rounded text-sm font-medium flex items-center gap-2 hover:bg-secondary/90 transition-colors"
      >
        <Download size={16} /> Download PDF
      </button>
    </div>
  );
}
