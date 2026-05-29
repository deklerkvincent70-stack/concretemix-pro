import { ConcreteMixPro } from '@/components/concrete-mix-pro';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://concretequantitymixandcostcalculator.vindk.com';

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ConcreteMix Pro',
    alternateName: 'Concrete Quantity, Mix and Cost Calculator',
    url: siteUrl,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Android, iOS, Windows, Web',
    browserRequirements: 'Requires JavaScript. Works offline after installation as a PWA.',
    description: 'A concrete quantity, mix ratio and cost calculator for estimating volume, cement bags, sand, aggregate, water, additives and material costs.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    audience: {
      '@type': 'Audience',
      audienceType: 'Contractors, builders and owner-builders'
    },
    featureList: [
      'Concrete volume calculator',
      'Concrete mix ratio recommendations',
      'Cement bag, sand, aggregate, water and additive estimates',
      'Material cost estimate',
      'PDF estimate and order list export',
      'Offline-first project storage'
    ]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ConcreteMixPro />
    </>
  );
}
