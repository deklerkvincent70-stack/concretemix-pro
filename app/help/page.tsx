import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help',
  description: 'How to use ConcreteMix Pro for projects, pour locations, mix ratios, ready-mix, costs, PDFs and local backups.'
};

const sections = [
  {
    title: 'Quick Start',
    items: [
      'Type a Project Name and press Save.',
      'Enter a Location in project and press Save again.',
      'Choose the shape, unit and dimensions for the pour.',
      'Choose the purpose, strength, cement type and supply method.',
      'Open Settings to enter material prices, currency and project defaults.',
      'Use Save, Share, Save Order or Share Order to create PDFs.'
    ]
  },
  {
    title: 'Projects and Locations',
    items: [
      'A project is the main job, for example a house, site address or building.',
      'A location is a specific pour inside that project, for example driveway slab, bedroom floor or beam over patio.',
      'Saved projects appear in the Project Name dropdown.',
      'Saved locations appear in the Location in project dropdown after a project is selected.',
      'The Save button near the top saves the current project or location values on this device.'
    ]
  },
  {
    title: 'Shapes and Dimensions',
    items: [
      'Slab and beam use length x width x depth.',
      'Circle uses diameter x depth.',
      'Column uses diameter x height.',
      'Stair uses width, number of steps, rise and run.',
      'Custom lets you enter a known concrete volume directly.',
      'Changing units updates calculations instantly.'
    ]
  },
  {
    title: 'Mix for This Pour',
    items: [
      'Purpose selects a practical concrete use such as slab, driveway, foundation, beam or column.',
      'Strength is saved with each location because different pours can need different MPa or PSI values.',
      'Edit ratio lets you change the cement : sand : stone ratio manually.',
      'Done closes manual ratio editing.',
      'Custom mixes can be saved under a user-defined purpose name for reuse.',
      'The displayed custom strength is approximate only and depends on cement, water, aggregate, additives, curing and site practice.'
    ]
  },
  {
    title: 'Site Mix and Ready-Mix',
    items: [
      'Site mix calculates cement bags, sand, aggregate, water, additive quantities and material costs.',
      'Ready-mix prices delivered concrete by calculated volume plus wastage.',
      'Set the Ready-mix / m3 price in Settings, Cost.',
      'Ready-mix order PDFs show the delivered volume to order.'
    ]
  },
  {
    title: 'Materials and Costs',
    items: [
      'Materials show cement, sand, aggregate, water and additive requirements.',
      'Costs show the material cost estimate for the selected supply method.',
      'Cement costs can be entered per cement type.',
      'Sand, stone, additive and ready-mix costs are set in Settings, Cost.',
      'Currency, unit system and strength unit are set in Settings, Global.'
    ]
  },
  {
    title: 'PDF Save, Share and Order Lists',
    items: [
      'Save creates a PDF estimate for the current calculation.',
      'Share opens the device share options where supported.',
      'Save Order creates a shopping/order-list PDF.',
      'Share Order shares the order-list PDF.',
      'On Android, the app uses the native share sheet so you can choose apps such as Files, Gmail, WhatsApp or Quick Share.'
    ]
  },
  {
    title: 'Local Backup Transfer',
    items: [
      'Export Backup creates one JSON backup file with saved projects, locations, settings, costs, custom mixes and saved calculations.',
      'Move the backup file by USB, email, WhatsApp, Quick Share or another method you choose.',
      'Import Backup loads that file into another device or browser.',
      'Import replaces the local ConcreteMix Pro data on that device after confirmation.',
      'No cloud account or backend database is used.'
    ]
  },
  {
    title: 'Settings and Data Clearing',
    items: [
      'Material settings include bag size, wastage and water-cement ratio.',
      'Cost settings include cement names/prices, sand, stone, ready-mix and additive costs.',
      'Global settings include unit system, default unit, strength unit and currency.',
      'Data settings let you export/import backups or clear selected local data.',
      'Clearing selected data only affects the current device/browser.'
    ]
  }
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#f4f2ea] px-4 py-8 text-[#101418] dark:bg-[#121412] dark:text-[#f7f5ed]">
      <article className="mx-auto max-w-4xl rounded-lg border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#191d1a] sm:p-8">
        <p className="text-xs font-black uppercase tracking-wide text-[#b8562f]">ConcreteMix Pro</p>
        <h1 className="mt-2 text-3xl font-black leading-tight">Help</h1>
        <p className="mt-3 max-w-2xl font-semibold text-black/65 dark:text-white/70">
          This guide explains the main calculator functions and how to move saved project data between devices without using cloud storage.
        </p>
        <a className="mt-5 inline-flex min-h-11 items-center rounded-md bg-[#1f7a5a] px-4 font-black text-white" href="/">
          Back to calculator
        </a>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <section key={section.title} className="rounded-md border border-black/10 bg-[#f4f2ea] p-4 dark:border-white/10 dark:bg-[#121412]">
              <h2 className="text-lg font-black">{section.title}</h2>
              <ul className="mt-3 space-y-2 text-sm font-semibold text-black/70 dark:text-white/70">
                {section.items.map((item) => (
                  <li key={item} className="pl-3 before:-ml-3 before:pr-2 before:text-[#1f7a5a] before:content-['-']">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-6 rounded-md border border-[#b8562f]/30 bg-[#fff4ea] p-4 text-sm font-semibold text-[#8a3b1d] dark:bg-[#311f18] dark:text-[#ffbd91]">
          ConcreteMix Pro is an estimating tool. Structural mixes, reinforcement, design strength and compliance requirements should be confirmed with local specifications, supplier data or a qualified professional where required.
        </section>
      </article>
    </main>
  );
}
