'use client';

import { useState } from 'react';
import { FileUp, Search, Upload, Loader2, Cpu } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;

    setErrorMessage(null);
    setUploading(true);
    
    try {
      // 1. Upload
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', { 
        method: 'POST', 
        body: formData 
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      const tenderId = data.tenderId;

      // 2. Trigger analysis!
      setUploading(false);
      setAnalyzing(true);
      
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tenderId })
      });
      
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error);

      // Successfully processed! Push!
      router.push(`/analysis/${tenderId}`);

    } catch (e: any) {
      setErrorMessage(e.message || 'Pipeline failed. Please try again later.');
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-surface border border-border-primary rounded-lg p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-primary mb-6 text-center">Upload Tender / RFP PDF</h2>
      
      <label className={`border-2 border-dashed border-border-primary rounded-lg p-12 flex flex-col items-center justify-center mb-6 cursor-pointer hover:bg-background-primary transition-colors ${uploading || analyzing ? 'bg-background-primary opacity-50 cursor-not-allowed' : 'bg-background-primary/50'}`}>
        <input 
          type="file" 
          className="hidden" 
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={uploading || analyzing}
        />
        <Upload className="w-12 h-12 text-secondary mb-4" />
        <p className="text-text-primary font-medium mb-1">
          {file ? file.name : "Click to upload or drag and drop"}
        </p>
        <p className="text-text-secondary text-sm">
          {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF (Max 50MB)"}
        </p>
      </label>

      {errorMessage && (
        <div className="mb-4 rounded border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="flex justify-center gap-4">
        <button 
          onClick={handleUploadAndAnalyze}
          disabled={!file || uploading || analyzing}
          className="bg-primary text-surface px-6 py-3 rounded font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {analyzing ? <Cpu className="animate-pulse" size={20} /> : uploading ? <Loader2 className="animate-spin" size={20} /> : <FileUp size={20} />}
          {analyzing ? 'Gemini AI Extracting...' : uploading ? 'Uploading to Cloud...' : 'Start Extraction & Analysis'}
        </button>
      </div>
    </div>
  );
}
