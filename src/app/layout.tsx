import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import InstallAppBanner from '@/components/InstallAppBanner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#FF6B00',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Skyland Attendance Portal',
  description: 'Skyland Energy Workforce & Live GPS Attendance Portal',
  manifest: '/manifest-v6.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Skyland',
  },
  icons: {
    icon: [
      { url: '/icon-192-v6.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512-v6.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

const EARLY_PWA_CAPTURE_SCRIPT = `
(function() {
  try {
    window.__deferredPwaPrompt = window.__deferredPwaPrompt || null;
    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      window.__deferredPwaPrompt = e;
      window.dispatchEvent(new CustomEvent('pwa-prompt-captured'));
    });
    if ('caches' in window) {
      caches.keys().then(function(keys) {
        var hadOldCache = false;
        keys.forEach(function(k) {
          if (k !== 'skyland-pwa-v6') {
            hadOldCache = true;
            caches.delete(k);
          }
        });
        if (hadOldCache && !sessionStorage.getItem('skyland_v6_reloaded')) {
          sessionStorage.setItem('skyland_v6_reloaded', '1');
          window.location.reload();
        }
      });
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(function(reg) {
        reg.update();
      }).catch(function() {});
    }
  } catch (err) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: EARLY_PWA_CAPTURE_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <InstallAppBanner />
      </body>
    </html>
  );
}
