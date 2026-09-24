import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Amiri } from 'next/font/google';
import './globals.css';
import { PwaPrompt } from '@/components/shared/PwaPrompt';
import Script from 'next/script';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Arsip Haul & Majelis | Digital Heritage Repository',
  description:
    'Repositori arsip digital media haul, majelis ta\'lim, dan khazanah warisan ulama nusantara. Galeri foto, rekaman audio manaqib, video dokumentasi, dan risalah kitab.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/logo-haol.png',
    shortcut: '/icons/logo-haol.png',
    apple: '/icons/logo-haol.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Arsip Haul',
  },
};

export const viewport: Viewport = {
  themeColor: '#064e3b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${sans.variable} ${amiri.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/logo-haol.png" />
        <link rel="apple-touch-icon" href="/icons/logo-haol.png" />
        <meta name="theme-color" content="#064e3b" />
      </head>
      <body className="font-sans min-h-screen flex flex-col bg-ivory-bg text-stone-900 antialiased selection:bg-gold-light selection:text-emerald-islamic">
        {children}
        <PwaPrompt />

        {/* Register Service Worker */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('SW registration successful with scope: ', registration.scope);
                  },
                  function(err) {
                    console.log('SW registration failed: ', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
