import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorker } from '@/components/service-worker';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://concretequantitymixandcostcalculator.vindk.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Concrete Quantity, Mix and Cost Calculator | ConcreteMix Pro',
    template: '%s | ConcreteMix Pro'
  },
  description: 'A fast offline-ready concrete calculator for quantities, mix ratios, cement bags, materials and job costs.',
  applicationName: 'ConcreteMix Pro',
  manifest: '/manifest.webmanifest',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'ConcreteMix Pro',
    description: 'Concrete quantity, mix and cost calculator for contractors and owner-builders.',
    url: siteUrl,
    siteName: 'ConcreteMix Pro',
    type: 'website'
  },
  appleWebApp: {
    capable: true,
    title: 'ConcreteMix Pro',
    statusBarStyle: 'default'
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8f4' },
    { media: '(prefers-color-scheme: dark)', color: '#101418' }
  ],
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
