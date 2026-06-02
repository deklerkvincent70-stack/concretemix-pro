import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help',
  description: 'How to use ConcreteMix Pro for projects, pour locations, mix ratios, ready-mix, costs, material order PDFs, progress tracking and local backups.'
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
      'Use the Progress & Order Status dashboard to save or share PDFs.'
    ]
  },
  {
    title: 'Projects and Locations',
    items: [
      'A project is the main job, for example a house, site address or building.',
      'A location is a specific pour inside that project, for example driveway slab, bedroom floor or beam over patio.',
      'Saved projects appear in the Project Name dropdown.',
      'Saved locations appear in the Location in project dropdown after a project is selected.',
      'The Save button near the top saves the current project or location values on this device.',
      'The dashboard can then show all saved locations for that project in one place.'
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
    title: 'PDF Save, Share and Progress',
    items: [
      'Save and Share in the dashboard create a PDF from the selected dashboard rows.',
      'Use the Material row selector to include locations in the progress/details section.',
      'Use the CM, SD, ST and AD status buttons to build the shopping list section for cement, sand, stone and additive.',
      'For ready-mix locations, use the blue PRE status button to track ordered and received ready-mix.',
      'When more than one order location is selected, the PDF shows each location and a combined material total to buy.',
      'If no saved project is selected, Save and Share use the current calculation only.',
      'Material status colors are red for not ordered, amber for on the order PDF/not received, and green for received.',
      'Only amber material items are added to the order list PDF.',
      'The Progress percentage tracks pour progress from 0 to 100 percent.',
      'P follows the Progress percentage color: red at low progress, amber in the middle and green at 100 percent.',
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

const dashboardSteps = [
  {
    title: '1. Save the project and locations first',
    text: 'Example: create a project called House slab project. Then save locations such as Driveway slab, Garage floor and Patio. The dashboard can only list locations that were saved inside the selected project.'
  },
  {
    title: '2. Choose the project',
    text: 'Use the Project dropdown at the top of the dashboard. The app then shows every saved location in that project with volume, strength, mix type, cost and progress.'
  },
  {
    title: '3. Use the Material circle to choose report rows',
    text: 'Tap the first circle in a row to include or remove that location from the PDF progress/details section. Select all chooses every location. Clear removes all rows from that section.'
  },
  {
    title: '4. Use CM, SD, ST and AD for site-mix orders',
    text: 'For site mix locations, tap CM for cement, SD for sand, ST for stone and AD for additive. Each tap changes the color: red means not ordered, amber means add this item to the next order PDF, and green means received.'
  },
  {
    title: '5. Use PRE for ready-mix orders',
    text: 'For ready-mix locations, the PRE button replaces the site-mix buttons. Tap PRE until it is amber when you want the ready-mix volume added to the next order PDF. Tap again to mark it green after it was received.'
  },
  {
    title: '6. Update the Progress percentage',
    text: 'Enter the actual pour progress from 0 to 100 percent. The P circle changes color as progress improves. Use 0 before work starts, 50 for halfway, and 100 when the pour is complete.'
  },
  {
    title: '7. Save or share the PDF',
    text: 'If no material buttons are amber, Save and Share create a progress/details PDF from the selected Material rows. If any material button is amber, Save Order and Share Order create an order PDF using only amber items.'
  }
];

const dashboardSettings = [
  'Project actual cost is the total estimated cost of all saved locations in the selected project.',
  'Material rows counts how many locations are selected with the first circle. These rows go into the progress/details section.',
  'Order items counts locations that have at least one amber material or PRE button. These are used for the shopping/order list.',
  'Select all marks all locations for the progress/details PDF section.',
  'Clear removes all Material row selections, but it does not change material order colors or progress numbers.',
  'The Cost column uses the saved cost settings for each location. Update costs in Settings before saving a location if prices changed.'
];

const dashboardExamples = [
  'Example 1: You need cement and sand for the Driveway slab. Tap CM until amber and tap SD until amber. Leave ST red if you do not want stone on this order. Press Save Order.',
  'Example 2: The cement has arrived. Tap CM again until it turns green. It will no longer be added to the next order PDF.',
  'Example 3: The Garage floor is ready-mix. Tap PRE until amber, then Share Order to send the ready-mix volume to your supplier.',
  'Example 4: The Patio is 75 percent poured. Type 75 in Progress. The PDF will show that the location is not yet complete.',
  'Example 5: You only want a progress report. Make sure no CM, SD, ST, AD or PRE buttons are amber, select the Material rows you want, then press Save.'
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

        <section className="mt-8 rounded-md border border-[#1f7a5a]/30 bg-[#eef1e8] p-4 dark:border-[#1f7a5a]/50 dark:bg-[#18261f] sm:p-5">
          <h2 className="text-2xl font-black leading-tight">Dashboard Step-by-Step Guide</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-relaxed text-black/70 dark:text-white/72">
            The dashboard is used for two jobs: tracking pour progress and making material order PDFs. The picture below shows the main controls.
          </p>
          <figure className="mt-4 overflow-hidden rounded-md border border-black/10 bg-white dark:border-white/10 dark:bg-[#121412]">
            <img
              src="/help/dashboard-guide.svg"
              alt="Illustrated guide to the Progress and Order Status Dashboard controls"
              className="w-full"
            />
            <figcaption className="border-t border-black/10 px-3 py-2 text-xs font-bold text-black/55 dark:border-white/10 dark:text-white/60">
              Dashboard example: row selection on the left, material order buttons in the middle, progress and PDF actions at the bottom.
            </figcaption>
          </figure>

          <div className="mt-5 grid gap-3">
            {dashboardSteps.map((step) => (
              <section key={step.title} className="rounded-md border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-[#121412]">
                <h3 className="text-base font-black">{step.title}</h3>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-black/70 dark:text-white/72">{step.text}</p>
              </section>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <section className="rounded-md border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#121412]">
              <h3 className="text-lg font-black">What Each Setting Does</h3>
              <ul className="mt-3 space-y-2 text-sm font-semibold text-black/70 dark:text-white/72">
                {dashboardSettings.map((item) => (
                  <li key={item} className="pl-3 before:-ml-3 before:pr-2 before:text-[#1f7a5a] before:content-['-']">
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-md border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#121412]">
              <h3 className="text-lg font-black">Simple Examples</h3>
              <ul className="mt-3 space-y-2 text-sm font-semibold text-black/70 dark:text-white/72">
                {dashboardExamples.map((item) => (
                  <li key={item} className="pl-3 before:-ml-3 before:pr-2 before:text-[#b8562f] before:content-['-']">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </section>

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
