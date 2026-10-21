import './globals.css';
import '../packages/studio/dist/tailwind.css';
import { TIMECAPSULE_BRAND } from '@/branding';

export const metadata = {
  title: TIMECAPSULE_BRAND.title,
  description: TIMECAPSULE_BRAND.description,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
