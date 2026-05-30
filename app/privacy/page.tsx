import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for ConcreteMix Pro, an offline-first concrete quantity, mix and cost calculator.'
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f4f2ea] px-4 py-8 text-[#101418] dark:bg-[#121412] dark:text-[#f7f5ed]">
      <article className="mx-auto max-w-3xl rounded-lg border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#191d1a] sm:p-8">
        <p className="text-xs font-black uppercase tracking-wide text-[#b8562f]">ConcreteMix Pro</p>
        <h1 className="mt-2 text-3xl font-black leading-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm font-semibold text-black/60 dark:text-white/65">Last updated: May 30, 2026</p>

        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-black">Overview</h2>
          <p>
            ConcreteMix Pro is an offline-first concrete quantity, mix and cost calculator for contractors,
            builders and owner-builders. The app is designed to work without an account, backend server or
            cloud sync.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-black">Information We Collect</h2>
          <p>
            We do not collect personal information through ConcreteMix Pro. The app does not require login,
            registration, cloud storage or a user account.
          </p>
          <p>
            Project names, locations, notes, calculator values, material prices and settings are stored locally
            on your device or in your browser storage so the calculator can work offline.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-black">Local Storage</h2>
          <p>
            ConcreteMix Pro uses local device storage only. Saved projects and settings remain on the device
            where they were created unless you choose to export or share a PDF.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-black">PDF Export and Sharing</h2>
          <p>
            The app can create PDF estimates and order lists from the values you enter. When you use Save or
            Share, your device may offer options such as Files, email, messaging apps or nearby sharing. Sharing
            is controlled by you and by the apps you choose to use.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-black">Internet and Analytics</h2>
          <p>
            The calculator is designed to work offline after installation. We do not operate a backend database
            for calculator data. If analytics or advertising are added in a future version, this policy will be
            updated before release.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          <h2 className="text-lg font-black">Contact</h2>
          <p>
            For privacy questions about ConcreteMix Pro, contact: <a className="font-black text-[#1f7a5a]" href="mailto:vincent@vindk.com">vincent@vindk.com</a>
          </p>
        </section>
      </article>
    </main>
  );
}
