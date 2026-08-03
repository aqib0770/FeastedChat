import type { Metadata } from 'next';
import { Geist, Geist_Mono, IBM_Plex_Sans, Roboto_Slab, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';

const robotoSlab = Roboto_Slab({ subsets: ['latin'], variable: '--font-serif' });

const spaceGroteskHeading = Space_Grotesk({ subsets: ['latin'], variable: '--font-heading' });

const ibmPlexSans = IBM_Plex_Sans({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FeastedChat — Multi-Model AI Comparison',
  description:
    'Compare multiple AI models side-by-side. Send one prompt, get streaming responses from GPT, Claude, Gemini, Grok, DeepSeek, and Qwen simultaneously.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        'dark h-full antialiased',
        geistSans.variable,
        geistMono.variable,
        'font-sans',
        robotoSlab.variable,
        spaceGroteskHeading.variable,
        'font-sans',
        ibmPlexSans.variable
      )}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
