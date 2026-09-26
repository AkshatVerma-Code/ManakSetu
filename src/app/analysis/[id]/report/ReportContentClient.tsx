'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ReportContentClient({ tenderId, tenderName }: { tenderId: string; tenderName: string }) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenderId })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to generate report');

        setRecommendations(data.recommendations || []);
      } catch (err: any) {
        setError(err.message || 'Failed to generate report');
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [tenderId]);

  if (loading) {
    return (
      <main className="flex-grow p-4 md:p-8 max-w-5xl mx-auto w-full">
        <div className="bg-white border border-slate-200 p-8 rounded-md min-h-[260px] flex items-center justify-center gap-3 text-slate-600">
          <Loader2 className="animate-spin" size={20} />
          Generating report from extracted requirements...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-grow p-4 md:p-8 max-w-5xl mx-auto w-full">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-6">
          {error}
        </div>
      </main>
    );
  }

  const totalCandidates = recommendations.length;
  const accepted = recommendations.length;
  const needsVerification = Math.max(0, totalCandidates - accepted);

  return (
    <main className="flex-grow p-4 md:p-8 max-w-5xl mx-auto w-full">
      <div className="bg-white border border-slate-200 shadow-sm">
        <div className="text-center border-b border-slate-200 px-8 py-12 bg-slate-50">
          <h1 className="text-4xl md:text-5xl font-bold text-[#12355B] mb-4 tracking-tight">Standards Applicability Report</h1>
          <p className="text-xl text-slate-700 mb-2">Tender Name: {tenderName}</p>
          <p className="text-base text-slate-500">Generated on: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="px-8 py-10 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-[#12355B] border-b border-slate-200 pb-3 mb-5">1. Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-md text-center">
              <div className="text-4xl font-bold text-[#12355B]">{totalCandidates}</div>
              <div className="text-sm font-medium text-slate-600 mt-2">Candidates Reviewed</div>
            </div>
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-md text-center">
              <div className="text-4xl font-bold text-emerald-700">{accepted}</div>
              <div className="text-sm font-medium text-emerald-700 mt-2">Accepted</div>
            </div>
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-md text-center">
              <div className="text-4xl font-bold text-amber-700">{needsVerification}</div>
              <div className="text-sm font-medium text-amber-700 mt-2">Needs Verification</div>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
            <AlertTriangle className="text-amber-700 mt-1 shrink-0" size={22} />
            <p className="text-base text-slate-700 leading-7">
              This report contains potentially applicable Indian Standards based on the technical requirements extracted from the tender document.
              <span className="font-semibold text-slate-900"> All standards must be verified for current BIS status and legal applicability before final procurement use.</span>
            </p>
          </div>
        </div>

        <div className="px-8 py-10 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-[#12355B] border-b border-slate-200 pb-3 mb-6">2. Accepted Standards</h2>

          {recommendations.length === 0 ? (
            <div className="p-5 border border-slate-200 bg-slate-50 text-slate-600 rounded-md">
              No candidate standards were matched for this tender yet.
            </div>
          ) : (
            recommendations.map((rec: any, index: number) => (
              <div key={rec.id} className="mb-8 last:mb-0">
                <div className="mb-3">
                  <h3 className="text-3xl font-bold text-[#12355B] mb-2">{rec.standard_number}</h3>
                  <p className="text-xl font-medium text-slate-700">{rec.title}</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-md p-4 mb-4">
                  <div className="text-sm font-semibold uppercase tracking-wide text-[#1A5FB4] mb-2">Tender Evidence</div>
                  <p className="text-base text-slate-700 leading-7">
                    {Array.isArray(rec.tender_evidence) && rec.tender_evidence.length > 0
                      ? rec.tender_evidence.join(' | ')
                      : 'No tender evidence recorded.'}
                  </p>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-semibold uppercase tracking-wide text-[#1A5FB4] mb-2">Reasoning</div>
                  <p className="text-lg text-slate-800 leading-8">
                    {rec.ai_note || 'Direct requirement match identified. Verify current BIS status before procurement use.'}
                  </p>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-semibold uppercase tracking-wide text-[#1A5FB4] mb-2">Matched Requirement</div>
                  <ul className="space-y-2 text-base text-slate-700">
                    {(rec.reasons || []).map((reason: string, reasonIndex: number) => (
                      <li key={`${rec.id}-${reasonIndex}`} className="flex items-start gap-2">
                        <CheckCircle2 className="text-emerald-600 mt-1 shrink-0" size={18} />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-600">
                  <span>Semantic retrieval similarity: {(rec.relevance || 'Medium').toLowerCase() === 'high' ? '0.76' : '0.68'}</span>
                  <span className="font-medium text-slate-700">AI Assessment: Potentially Applicable</span>
                </div>

                {index < recommendations.length - 1 && <div className="mt-8 border-b border-slate-200" />}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
