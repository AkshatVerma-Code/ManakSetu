'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, ExternalLink, Network, FileSearch, Loader2 } from 'lucide-react';
import Link from 'next/link';
import RelationshipGraph from '@/components/graph/RelationshipGraph';

export default function RecommendationsClient({ tenderId }: { tenderId: string }) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedRec, setSelectedRec] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchRecs() {
      try {
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenderId })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to fetch recommendations');
        
        setRecommendations(data.recommendations);
        if (data.recommendations.length > 0) {
          setSelectedRec(data.recommendations[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchRecs();
  }, [tenderId]);

  if (loading) {
    return <div className="flex flex-col items-center justify-center h-64 text-secondary"><Loader2 className="animate-spin w-8 h-8 mb-4" /><p>Finding relevant standards...</p></div>;
  }

  if (error) {
    return <div className="text-danger p-4 border border-danger/20 bg-danger/5 rounded-lg flex items-center gap-2"><ShieldAlert /> {error}</div>;
  }

  if (recommendations.length === 0) {
    return <div className="text-text-secondary text-center p-8 bg-surface rounded-lg border border-border-primary">No applicable standards found matching the extracted constraints.</div>;
  }

  const activeRec = recommendations.find(r => r.id === selectedRec);

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Left panel - List of Recommendations */}
      <div className={`w-full ${selectedRec ? 'hidden md:flex md:w-1/3' : 'flex md:w-full'} flex-col gap-4 overflow-y-auto`}>
        <div className="bg-warning/10 border-l-4 border-warning p-4 rounded-r flex gap-3 text-sm text-text-primary mb-2 flex-shrink-0">
          <ShieldAlert className="text-warning flex-shrink-0" />
          <p>
            <strong>Disclaimer:</strong> AI recommendations — requires technical/BIS verification. Ensure current BIS status before final procurement use.
          </p>
        </div>

        {recommendations.map(rec => (
          <div 
            key={rec.id} 
            className={`flex-shrink-0 border rounded-lg p-5 cursor-pointer transition-all ${
              selectedRec === rec.id 
                ? 'border-primary ring-2 ring-primary/20 bg-surface' 
                : 'border-border-primary bg-surface hover:border-secondary'
            }`}
            onClick={() => setSelectedRec(rec.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-primary">{rec.standard_number}</h3>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                rec.relevance === 'High' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
              }`}>
                {rec.relevance} Relevance
              </span>
            </div>
            
            <p className="text-text-secondary text-sm mb-4 line-clamp-2">{rec.title}</p>
            
            <ul className="text-sm space-y-1 mb-4">
              {rec.reasons.map((reason: string, idx: number) => (
                <li key={idx} className="flex gap-2 items-center text-text-primary">
                  <CheckCircle size={14} className="text-success flex-shrink-0" />
                  <span className="truncate">{reason}</span>
                </li>
              ))}
            </ul>

            <button 
              className="text-secondary text-sm font-medium flex items-center gap-1 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRec(rec.id);
              }}
            >
              <FileSearch size={16} /> View Evidence
            </button>
          </div>
        ))}
      </div>

      {/* Right panel - Evidence + Relationships */}
      {selectedRec && activeRec && (
        <div className="w-full md:w-2/3 bg-surface border border-border-primary rounded-lg flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-border-primary flex justify-between items-center bg-gray-50 flex-shrink-0">
            <h2 className="font-bold text-primary">{activeRec.standard_number} <span className="text-text-secondary font-normal block sm:inline ml-0 sm:ml-2 text-sm">{activeRec.title}</span></h2>
            <button 
              className="text-text-secondary hover:text-text-primary text-sm font-medium underline block md:hidden"
              onClick={() => setSelectedRec(null)}
            >
              Close Panel
            </button>
          </div>
          
          <div className="p-6 flex-grow overflow-y-auto flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-bold uppercase text-secondary mb-3 flex items-center gap-2">
                <FileSearch size={16} /> Tender Evidence
              </h3>
              <div className="bg-background-primary p-4 rounded text-sm font-mono border border-border-primary flex flex-col gap-2">
                {activeRec.tender_evidence.map((ev: string, i: number) => (
                  <p key={i}>{ev}</p>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-bold uppercase text-secondary mb-3">AI Assessment</h3>
              <p className="text-text-primary text-sm leading-relaxed">{activeRec.ai_note}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-border-primary flex-grow min-h-[300px] flex flex-col">
              <h3 className="text-sm font-bold uppercase text-secondary mb-3 flex items-center gap-2">
                <Network size={16} /> Related Standards Graph (Demo)
              </h3>
              <div className="bg-background-primary w-full h-full rounded border border-border-primary overflow-hidden">
                <RelationshipGraph standardNumber={activeRec.standard_number} />
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-border-primary bg-gray-50 flex gap-4 justify-end flex-shrink-0">
            <Link 
              href="#" 
              target="_blank"
              className="text-secondary font-medium text-sm flex items-center gap-2 hover:underline mr-auto"
            >
              <ExternalLink size={16} /> Optional BIS URL
            </Link>
            
            <button className="px-4 py-2 bg-text-secondary/10 text-text-primary rounded font-medium text-sm hover:bg-text-secondary/20 transition-colors">
              Needs Verification
            </button>
            <button className="px-4 py-2 bg-success text-surface rounded font-medium text-sm hover:bg-success/90 transition-colors">
              Accept
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
