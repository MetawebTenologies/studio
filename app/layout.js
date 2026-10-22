import './globals.css';
import { TIMECAPSULE_BRAND } from '@/branding';

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'
  ),
  title: TIMECAPSULE_BRAND.title,
  description: TIMECAPSULE_BRAND.description,
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32 48x48 64x64', type: 'image/x-icon' },
    ],
    apple: { url: '/assets/brand/timecapsule-app-icon.svg', type: 'image/svg+xml' },
  },
  openGraph: {
    title: TIMECAPSULE_BRAND.title,
    description: TIMECAPSULE_BRAND.description,
    images: [{ url: '/opengraph-image.png', width: 1200, height: 630 }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
