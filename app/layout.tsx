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
  description: 'Free concrete quantity, mix ratio and cost calculator for slabs, beams, columns, footings and driveways. Estimate volume, cement bags, sand, aggregate, water, additives and material cost.',
  keywords: [
    'concrete quantity calculator',
    'concrete mix calculator',
    'concrete cost calculator',
    'concrete bags calculator',
    'cement sand aggregate calculator',
    'concrete slab calculator',
    'concrete volume calculator',
    'concrete mix ratio calculator'
  ],
  applicationName: 'ConcreteMix Pro',
  category: 'Construction calculator',
  manifest: '/manifest.webmanifest',
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1
    }
  },
  openGraph: {
    title: 'Concrete Quantity, Mix and Cost Calculator | ConcreteMix Pro',
    description: 'Estimate concrete volume, mix ratio, cement bags, sand, aggregate, water, additives and material costs.',
    url: siteUrl,
    siteName: 'ConcreteMix Pro',
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary',
    title: 'Concrete Quantity, Mix and Cost Calculator',
    description: 'Fast concrete quantity, mix ratio and cost calculator for contractors, builders and owner-builders.'
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
