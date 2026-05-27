import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://concretequantitymixandcostcalculator.vindk.com';
  return [{ url: siteUrl, priority: 1 }];
}
