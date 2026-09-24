'use client';

import Link from 'next/link';
import { HandHelping, Volume2, VolumeX } from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';

export default function Header() {
  const { 
    textSize, setTextSize, 
    highContrast, setHighContrast,
    language, setLanguage,
    isReading, stopReadAloud, readAloud
  } = useAccessibility();

  const handleReadScreen = () => {
    // In a real app, this would extract text more intelligently
    const text = document.body.innerText;
    readAloud(text);
  };

  return (
    <header className="bg-primary text-surface p-4 flex flex-col md:flex-row justify-between items-center shadow-md print:hidden gap-4">
      <div>
        <h1 className="text-xl font-bold">Government of India | Standards Intelligence System</h1>
        <p className="text-sm opacity-80">Indian Standards Recommendation Engine</p>
      </div>
      <div className="flex flex-wrap gap-4 items-center justify-center">
        <button 
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          className="text-sm cursor-pointer hover:underline font-medium"
        >
          {language === 'en' ? 'English | हिन्दी' : 'हिन्दी | English'}
        </button>
        
        <div className="flex gap-2 bg-black/10 px-2 py-1 rounded">
          <button 
            onClick={() => setTextSize('normal')}
            className={`text-sm font-medium ${textSize === 'normal' ? 'font-bold underline' : ''}`}
            aria-label="Default text size"
          >A-</button>
          <button 
            onClick={() => setTextSize('large')}
            className={`text-base font-medium ${textSize === 'large' ? 'font-bold underline' : ''}`}
            aria-label="Large text size"
          >A</button>
          <button 
            onClick={() => setTextSize('xlarge')}
            className={`text-lg font-medium ${textSize === 'xlarge' ? 'font-bold underline' : ''}`}
            aria-label="Extra large text size"
          >A+</button>
        </div>

        <button 
          onClick={() => setHighContrast(!highContrast)}
          className={`text-sm underline ${highContrast ? 'font-bold text-yellow-300' : ''}`} 
          aria-label="Toggle High Contrast"
        >
          Contrast
        </button>

        {isReading ? (
          <button onClick={stopReadAloud} className="flex items-center gap-1 text-sm bg-danger text-white px-2 py-1 rounded" aria-label="Stop reading aloud">
            <VolumeX size={16} /> Stop
          </button>
        ) : (
          <button onClick={handleReadScreen} className="flex items-center gap-1 text-sm hover:underline" aria-label="Read screen aloud">
            <Volume2 size={16} /> Read
          </button>
        )}

        <Link href="/help" className="flex items-center gap-1 text-sm underline hover:opacity-80">
          <HandHelping size={16} /> Help
        </Link>
      </div>
    </header>
  );
}
