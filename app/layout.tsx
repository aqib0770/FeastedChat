import type { Metadata } from 'next';
import { Geist, Geist_Mono, Inter, Roboto_Slab, Instrument_Sans } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';

const robotoSlab = Roboto_Slab({ subsets: ['latin'], variable: '--font-serif' });

const instrumentSansHeading = Instrument_Sans({ subsets: ['latin'], variable: '--font-heading' });

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

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
      suppressHydrationWarning
      className={cn(
        'h-full antialiased font-sans',
        geistSans.variable,
        geistMono.variable,
        robotoSlab.variable,
        inter.variable,
        instrumentSansHeading.variable
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
