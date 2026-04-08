import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NavBar } from '@/components/nav/NavBar';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Huertonga — Mi huerto en Urretxu',
  description: 'Seguimiento de plantas, alertas agronómicas y clima para tu huerto en Urretxu.',
};

export const viewport: Viewport = {
  themeColor: '#f0fdf4',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen bg-background`}>
        <ThemeProvider>
          <NavBar />
          <main className="max-w-5xl mx-auto px-4 py-6 pb-24">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
