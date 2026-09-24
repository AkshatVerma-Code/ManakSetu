import Link from 'next/link';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import Header from '@/components/layout/Header';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReportPage(props: Props) {
  const params = await props.params;

  // Mock accepted/verified standard stats
  const stats = {
    total: 3,
    accepted: 2,
    needsVerification: 1
  };

  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      <Header />
      
      <div className="bg-surface p-4 flex justify-between items-center shadow-sm border-b border-border-primary print:hidden">
        <h2 className="text-lg font-bold">Final Recommendation Report</h2>
        <div className="flex gap-4 items-center">
          <Link href={`/analysis/${params.id}/recommendations`} className="flex items-center gap-2 text-sm text-secondary hover:underline">
            <ArrowLeft size={16} /> Edit Review
          </Link>
          <button className="bg-surface text-primary px-4 py-2 rounded text-sm font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors border border-border-primary">
            <Printer size={16} /> Print
          </button>
          <button className="bg-secondary text-surface px-4 py-2 rounded text-sm font-medium flex items-center gap-2 hover:bg-secondary/90 transition-colors">
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>

      <main className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full">
        <div className="bg-surface border border-border-primary p-6 md:p-12 shadow-sm">
          <div className="text-center mb-10 border-b border-border-primary pb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Standards Applicability Report</h1>
            <p className="text-text-secondary text-lg">Tender Name: LED Street Lighting System 2024</p>
            <p className="text-text-secondary mt-2">Generated on: {new Date().toLocaleDateString()}</p>
          </div>
          
          <div className="mb-10 content-section">
            <h2 className="text-xl font-bold text-primary border-b border-border-primary pb-2 mb-4">1. Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gray-50 border border-border-primary rounded text-center">
                <div className="text-3xl font-bold text-primary">{stats.total}</div>
                <div className="text-sm font-medium text-text-secondary">Candidates Reviewed</div>
              </div>
              <div className="p-4 bg-success/10 border border-success/30 rounded text-center">
                <div className="text-3xl font-bold text-success">{stats.accepted}</div>
                <div className="text-sm font-medium text-success">Accepted</div>
              </div>
              <div className="p-4 bg-warning/10 border border-warning/30 rounded text-center">
                <div className="text-3xl font-bold text-warning">{stats.needsVerification}</div>
                <div className="text-sm font-medium text-warning">Needs Verification</div>
              </div>
            </div>
            <p className="text-text-primary">
              This report contains potentially applicable Indian Standards based on the technical requirements extracted from the tender document. 
              <strong> All standards must be verified for current BIS status and legal applicability before final procurement use.</strong>
            </p>
          </div>

          <div className="mb-10 content-section">
            <h2 className="text-xl font-bold text-primary border-b border-border-primary pb-2 mb-4">2. Accepted Standards</h2>
            
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="font-bold text-lg text-primary mb-1">IS 10322 (Part 5/Sec 3):2012</h3>
              <p className="text-sm font-medium text-text-secondary mb-3">Luminaires - Part 5: Particular Requirements - Section 3: Luminaires for Road and Street Lighting</p>
              
              <div className="bg-gray-50 p-4 text-sm font-mono border border-border-primary mb-3">
                Evidence: Tender Page 12 - "LED Street Lighting System for Outdoor use"
              </div>
              
              <p className="text-sm text-text-primary">
                <strong>Reasoning:</strong> Direct match for outdoor street lighting specifications.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-lg text-primary mb-1">IS 10322 (Part 1):2014</h3>
              <p className="text-sm font-medium text-text-secondary mb-3">Luminaires - Part 1: General Requirements and Tests</p>
              
              <div className="bg-gray-50 p-4 text-sm font-mono border border-border-primary mb-3">
                Evidence: Tender Page 17 - "Ingress Protection: IP66"
              </div>
              
              <p className="text-sm text-text-primary">
                <strong>Reasoning:</strong> Required for testing the ingress protection (IP66) as mentioned in the tender.
              </p>
            </div>
          </div>

          <div className="content-section">
            <h2 className="text-xl font-bold text-warning border-b border-border-primary pb-2 mb-4">3. Standards Pending Verification</h2>
            
            <div className="mb-6">
              <h3 className="font-bold text-lg text-primary mb-1">IS 16102 (Part 1):2012</h3>
              <p className="text-sm font-medium text-text-secondary mb-3">Self-Ballasted LED Lamps for General Lighting Services - Part 1: Safety Requirements</p>
              
              <div className="bg-gray-50 p-4 text-sm font-mono border border-border-primary mb-3">
                Evidence: Tender Page 14 - "Must conform to general safety for LED."
              </div>
              
              <p className="text-sm text-text-primary">
                <strong>Notes for Verification:</strong> General safety applicability. Needs human verification to check if a dedicated street lighting standard supersedes this requirement.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
