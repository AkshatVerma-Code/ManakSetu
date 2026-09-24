import type { Metadata } from 'next';
import './globals.css';
import { AccessibilityProvider } from '@/components/layout/AccessibilityProvider';

export const metadata: Metadata = {
  title: 'ManakSetu | Standards Intelligence System',
  description: 'AI-Powered Indian Standards Recommendation Engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AccessibilityProvider>
          {children}
        </AccessibilityProvider>
      </body>
    </html>
  );
}
