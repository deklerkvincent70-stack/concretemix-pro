import { getSelectedCementBagCost } from './costing';
import { calculateConcrete, formatRatio } from './engine';
import type { CalculationInput, CalculationResult, MaterialOrderItem, MaterialOrderStatus, SavedProject, SavedProjectLocation } from './types';
import { round } from './units';

const pageWidth = 595;
const pageHeight = 842;

const orderItems: { id: MaterialOrderItem; label: string }[] = [
  { id: 'cement', label: 'Cement' },
  { id: 'sand', label: 'Sand' },
  { id: 'aggregate', label: 'Stone / Aggregate' },
  { id: 'additive', label: 'Additive' }
];

export function downloadOrderPdf(input: CalculationInput, result: CalculationResult) {
  const blob = createOrderPdfBlob(input, result);
  const fileName = `${calculationFileName(input, 'order')}.pdf`;
  void savePdf(blob, fileName, 'ConcreteMix Pro order list');
}

export async function shareOrderPdf(input: CalculationInput, result: CalculationResult) {
  const blob = createOrderPdfBlob(input, result);
  const fileName = `${calculationFileName(input, 'order')}.pdf`;

  if (await shareNativePdf(blob, fileName, 'ConcreteMix Pro order list')) return;

  const file = new File([blob], fileName, { type: 'application/pdf' });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: 'ConcreteMix Pro order list', files: [file] });
    return;
  }

  downloadOrderPdf(input, result);
}

export function downloadProjectDashboardPdf(statusProject: SavedProject | null, shoppingProject: SavedProject | null) {
  const project = statusProject ?? shoppingProject;
  if (!project) return;
  const blob = createProjectDashboardPdfBlob(statusProject, shoppingProject);
  const fileName = `${projectDashboardFileName(project)}.pdf`;
  downloadWebPdf(blob, fileName);
}

export async function shareProjectDashboardPdf(statusProject: SavedProject | null, shoppingProject: SavedProject | null) {
  const project = statusProject ?? shoppingProject;
  if (!project) return;
  const blob = createProjectDashboardPdfBlob(statusProject, shoppingProject);
  const fileName = `${projectDashboardFileName(project)}.pdf`;

  if (await shareNativePdf(blob, fileName, 'ConcreteMix Pro project PDF')) return;

  const file = new File([blob], fileName, { type: 'application/pdf' });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: 'ConcreteMix Pro project PDF', files: [file] });
    return;
  }

  downloadWebPdf(blob, fileName);
}

async function savePdf(blob: Blob, fileName: string, title: string) {
  if (await shareNativePdf(blob, fileName, title)) return;
  downloadWebPdf(blob, fileName);
}

function downloadWebPdf(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function shareNativePdf(blob: Blob, fileName: string, title: string) {
  try {
    const [{ Capacitor }, { Filesystem, Directory }, { Share }] = await Promise.all([
      import('@capacitor/core'),
      import('@capacitor/filesystem'),
      import('@capacitor/share')
    ]);

    if (!Capacitor.isNativePlatform()) return false;

    const data = await blobToBase64(blob);
    const saved = await Filesystem.writeFile({
      path: fileName,
      data,
      directory: Directory.Cache,
      recursive: true
    });

    await Share.share({
      title,
      text: title,
      url: saved.uri,
      dialogTitle: 'Save or share PDF'
    });
    return true;
  } catch (error) {
    console.error('Unable to save or share PDF', error);
    return false;
  }
}

async function blobToBase64(blob: Blob) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return dataUrl.split(',')[1] ?? '';
}

function createOrderPdfBlob(input: CalculationInput, result: CalculationResult) {
  const lines = wrapLines(buildOrderText(input, result), 82);
  return createPdfBlob(lines);
}

function createProjectDashboardPdfBlob(statusProject: SavedProject | null, shoppingProject: SavedProject | null) {
  const lines = wrapLines(buildProjectDashboardText(statusProject, shoppingProject), 82);
  return createPdfBlob(lines);
}

function createPdfBlob(lines: string[]) {
  const chunks = chunkLines(lines.length > 0 ? lines : [''], 54);
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const pageRefs: string[] = [];

  chunks.forEach((chunk) => {
    const contentLines = ['BT', '/F1 11 Tf', '50 790 Td', '14 TL'];
    chunk.forEach((line, index) => {
      if (index > 0) contentLines.push('T*');
      contentLines.push(`(${escapePdfText(line)}) Tj`);
    });
    contentLines.push('ET');
    const content = contentLines.join('\n');
    const pageObjectId = objects.length + 1;
    const contentObjectId = pageObjectId + 1;
    pageRefs.push(`${pageObjectId} 0 R`);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`);
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });

  objects[1] = `<< /Type /Pages /Kids [${pageRefs.join(' ')}] /Count ${pageRefs.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

function buildOrderText(input: CalculationInput, result: CalculationResult) {
  const currency = input.settings.currencySymbol;
  const order = getOrderSummary(input, result);
  return [
    'ConcreteMix Pro Shopping / Order List',
    `Date: ${new Date().toLocaleDateString()}`,
    `Project: ${input.projectName || 'Concrete project'}`,
    `Location: ${input.locationInProject || 'Not specified'}`,
    '',
    'Concrete Required',
    `Purpose: ${input.purpose}`,
    `Shape: ${input.shape}`,
    `Supply: ${input.costs.readyMixEnabled ? 'Ready-mix delivered concrete' : 'Site mix materials'}`,
    `Wet volume: ${round(result.wetVolumeM3, 3)} m3`,
    `Dry volume: ${round(result.dryVolumeM3, 3)} m3`,
    `Mix ratio: ${formatRatio(input.ratio)}`,
    `Wastage included: ${input.settings.wastagePercent}%`,
    '',
    'Order Items',
    ...(input.costs.readyMixEnabled ? [
      `[ ] Ready-mix delivered concrete: ${round(order.readyMixVolume, 2)} m3 including wastage`
    ] : [
      `[ ] Cement - ${input.customCementName}: ${order.cementBags} bags (${round(result.materials.cementKg, 1)} kg calculated)`,
      `[ ] Sand: ${round(result.materials.sandM3, 3)} m3 (${round(result.materials.sandKg, 0)} kg)`,
      `[ ] Stone / Aggregate: ${round(result.materials.aggregateM3, 3)} m3 (${round(result.materials.aggregateKg, 0)} kg)`,
      `[ ] Water: ${round(result.materials.waterLiters, 1)} L`,
      `[ ] ${input.costs.otherName || 'Additive'}: ${round(result.materials.additiveLiters, 3)} L (${round(result.materials.additiveContainers, 2)} containers)`
    ]),
    '',
    'Estimated Costs',
    ...(input.costs.readyMixEnabled ? [
      `Ready-mix: ${currency}${formatMoney(result.costs.readyMixCost)} (${round(order.readyMixVolume, 2)} m3 x ${currency}${formatMoney(input.costs.readyMixPerM3)})`
    ] : [
      `Cement: ${currency}${formatMoney(order.cementCost)} (${order.cementBags} bags x ${currency}${formatMoney(order.cementBagCost)})`,
      `Sand: ${currency}${formatMoney(result.costs.sandCost)}`,
      `Stone / Aggregate: ${currency}${formatMoney(result.costs.aggregateCost)}`,
      `${input.costs.otherName || 'Additive'}: ${currency}${formatMoney(result.costs.otherCost)}`
    ]),
    `Total material estimate: ${currency}${formatMoney(order.total)}`,
    '',
    'Notes',
    input.notes || 'No notes.'
  ].join('\n');
}

function buildProjectOrderText(project: SavedProject) {
  const currency = project.locations[0]?.input.settings.currencySymbol ?? '$';
  const locationSummaries = project.locations.map((location) => {
    const result = calculateConcrete(location.input);
    return { location, result, order: getOrderSummary(location.input, result) };
  });
  const total = locationSummaries.reduce((sum, item) => sum + pendingOrderCost(item.location, item.result, item.order), 0);
  const ordered = locationSummaries.filter((item) => item.location.orderedAt).length;
  const completed = locationSummaries.filter((item) => item.location.completedAt).length;

  return [
    'ConcreteMix Pro Shopping / Order List',
    `Date: ${new Date().toLocaleDateString()}`,
    `Project: ${project.name || 'Concrete project'}`,
    `Selected locations: ${project.locations.length}`,
    `Progress: ${ordered} ordered / ${completed} poured`,
    '',
    ...locationSummaries.flatMap(({ location, result, order }, index) => [
      `${index + 1}. ${location.name}`,
      `Status: ${location.orderedAt ? `Ordered ${new Date(location.orderedAt).toLocaleDateString()}` : 'Not ordered'}; ${location.completedAt ? `Poured ${new Date(location.completedAt).toLocaleDateString()}` : 'Not poured'}; Progress ${location.progressPercent ?? (location.completedAt ? 100 : 0)}%`,
      `Purpose: ${location.input.purpose}`,
      `Shape: ${location.input.shape}`,
      `Supply: ${location.input.costs.readyMixEnabled ? 'Ready-mix delivered concrete' : 'Site mix materials'}`,
      `Dimensions: ${formatDimensions(location.input)}`,
      `Strength: ${round(location.input.strengthMpa, 1)} MPa`,
      `Mix ratio: ${location.input.costs.readyMixEnabled ? 'Ready-mix by volume' : formatRatio(location.input.ratio)}`,
      `Cement: ${location.input.customCementName}`,
      `Wet volume: ${round(result.wetVolumeM3, 3)} m3`,
      `Dry volume: ${round(result.dryVolumeM3, 3)} m3`,
      `Wastage included: ${location.input.settings.wastagePercent}%`,
      ...(location.input.costs.readyMixEnabled ? [
        ...(getMaterialOrderStatus(location, 'readyMix') === 'ordered' ? [`Ready-mix: ${round(order.readyMixVolume, 2)} m3`] : []),
        `Cost: ${currency}${formatMoney(pendingOrderCost(location, result, order))}`
      ] : [
        ...buildLocationOrderItemLines(location, result, order),
        `Cost: ${currency}${formatMoney(pendingOrderCost(location, result, order))}`
      ]),
      `Notes: ${location.input.notes || 'No notes.'}`,
      ''
    ]),
    'Project Total',
    `Total material estimate: ${currency}${formatMoney(total)}`
  ].join('\n');
}

function buildProjectStatusText(project: SavedProject) {
  const currency = project.locations[0]?.input.settings.currencySymbol ?? '$';
  const locationSummaries = project.locations.map((location) => {
    const result = calculateConcrete(location.input);
    return { location, result };
  });
  const total = locationSummaries.reduce((sum, item) => sum + item.result.costs.total, 0);
  const ordered = locationSummaries.filter((item) => item.location.orderedAt).length;
  const completed = locationSummaries.filter((item) => item.location.completedAt).length;

  return [
    'ConcreteMix Pro Progress Status',
    `Date: ${new Date().toLocaleDateString()}`,
    `Project: ${project.name || 'Concrete project'}`,
    `Selected locations: ${project.locations.length}`,
    `Ordered: ${ordered} / ${project.locations.length}`,
    `Poured/completed: ${completed} / ${project.locations.length}`,
    `Selected actual cost: ${currency}${formatMoney(total)}`,
    '',
    ...locationSummaries.flatMap(({ location, result }, index) => [
      `${index + 1}. ${location.name}`,
      `Status: ${location.orderedAt ? `Ordered ${new Date(location.orderedAt).toLocaleDateString()}` : 'Not ordered'}; ${location.completedAt ? `Poured ${new Date(location.completedAt).toLocaleDateString()}` : 'Not poured'}; Progress ${location.progressPercent ?? (location.completedAt ? 100 : 0)}%`,
      `Purpose: ${location.input.purpose}`,
      `Supply: ${location.input.costs.readyMixEnabled ? 'Ready-mix delivered concrete' : 'Site mix materials'}`,
      `Wet volume: ${round(result.wetVolumeM3, 3)} m3`,
      `Actual cost estimate: ${currency}${formatMoney(result.costs.total)}`,
      `Notes: ${location.input.notes || 'No notes.'}`,
      ''
    ])
  ].join('\n');
}

function buildProjectDashboardText(statusProject: SavedProject | null, shoppingProject: SavedProject | null) {
  const project = statusProject ?? shoppingProject;
  if (!project) return 'ConcreteMix Pro Project PDF';
  const statusLines = statusProject ? buildProjectStatusText(statusProject).split('\n') : [];
  const shoppingLines = shoppingProject ? buildProjectOrderText(shoppingProject).split('\n') : [];

  return [
    'ConcreteMix Pro Project PDF',
    `Date: ${new Date().toLocaleDateString()}`,
    `Project: ${project.name || 'Concrete project'}`,
    '',
    ...(statusLines.length > 0 ? ['Progress / Status Section', ...statusLines.slice(4), ''] : []),
    ...(shoppingLines.length > 0 ? ['Shopping / Order Section', ...shoppingLines.slice(4), ''] : []),
    ...(shoppingProject ? buildCombinedShoppingTotals(shoppingProject) : [])
  ].join('\n');
}

function buildCombinedShoppingTotals(project: SavedProject) {
  const currency = project.locations[0]?.input.settings.currencySymbol ?? '$';
  const summaries = project.locations.map((location) => {
    const result = calculateConcrete(location.input);
    return { location, result, order: getOrderSummary(location.input, result) };
  });
  const cementBags = summaries.reduce((sum, item) => sum + (getMaterialOrderStatus(item.location, 'cement') === 'ordered' ? item.order.cementBags : 0), 0);
  const sandM3 = summaries.reduce((sum, item) => sum + (getMaterialOrderStatus(item.location, 'sand') === 'ordered' ? item.result.materials.sandM3 : 0), 0);
  const stoneM3 = summaries.reduce((sum, item) => sum + (getMaterialOrderStatus(item.location, 'aggregate') === 'ordered' ? item.result.materials.aggregateM3 : 0), 0);
  const waterLiters = summaries.reduce((sum, item) => sum + (hasAnyPendingSiteMaterial(item.location) ? item.result.materials.waterLiters : 0), 0);
  const additiveLiters = summaries.reduce((sum, item) => sum + (getMaterialOrderStatus(item.location, 'additive') === 'ordered' ? item.result.materials.additiveLiters : 0), 0);
  const readyMixM3 = summaries.reduce((sum, item) => sum + (getMaterialOrderStatus(item.location, 'readyMix') === 'ordered' ? item.order.readyMixVolume : 0), 0);
  const total = summaries.reduce((sum, item) => sum + pendingOrderCost(item.location, item.result, item.order), 0);

  return [
    'Combined Materials To Buy',
    `Locations included: ${project.locations.map((location) => location.name).join(', ')}`,
    ...(readyMixM3 > 0 ? [`Ready-mix: ${round(readyMixM3, 2)} m3`] : []),
    ...(cementBags > 0 ? [`Cement: ${cementBags} bags`] : []),
    ...(sandM3 > 0 ? [`Sand: ${round(sandM3, 3)} m3`] : []),
    ...(stoneM3 > 0 ? [`Stone / Aggregate: ${round(stoneM3, 3)} m3`] : []),
    ...(waterLiters > 0 ? [`Water: ${round(waterLiters, 1)} L`] : []),
    ...(additiveLiters > 0 ? [`Additive: ${round(additiveLiters, 3)} L`] : []),
    `Combined material estimate: ${currency}${formatMoney(total)}`
  ];
}

function buildLocationOrderItemLines(location: SavedProjectLocation, result: CalculationResult, order: ReturnType<typeof getOrderSummary>) {
  return orderItems.flatMap((item) => {
    if (getMaterialOrderStatus(location, item.id) !== 'ordered') return [];
    if (item.id === 'cement') return [`Cement: ${round(result.materials.cementKg, 1)} kg / ${order.cementBags} bags to order`];
    if (item.id === 'sand') return [`Sand: ${round(result.materials.sandM3, 3)} m3 / ${round(result.materials.sandKg, 0)} kg`];
    if (item.id === 'aggregate') return [`Stone: ${round(result.materials.aggregateM3, 3)} m3 / ${round(result.materials.aggregateKg, 0)} kg`];
    return [`${location.input.costs.otherName || item.label}: ${round(result.materials.additiveLiters, 3)} L / ${round(result.materials.additiveContainers, 2)} containers`];
  });
}

function pendingOrderCost(location: SavedProjectLocation, result: CalculationResult, order: ReturnType<typeof getOrderSummary>) {
  if (getMaterialOrderStatus(location, 'readyMix') === 'ordered') return result.costs.readyMixCost;
  let total = 0;
  if (getMaterialOrderStatus(location, 'cement') === 'ordered') total += order.cementCost;
  if (getMaterialOrderStatus(location, 'sand') === 'ordered') total += result.costs.sandCost;
  if (getMaterialOrderStatus(location, 'aggregate') === 'ordered') total += result.costs.aggregateCost;
  if (getMaterialOrderStatus(location, 'additive') === 'ordered') total += result.costs.otherCost;
  return total;
}

function hasAnyPendingSiteMaterial(location: SavedProjectLocation) {
  return orderItems.some((item) => getMaterialOrderStatus(location, item.id) === 'ordered');
}

function getMaterialOrderStatus(location: SavedProjectLocation, item: MaterialOrderItem): MaterialOrderStatus {
  return location.orderStatuses?.[item] ?? 'none';
}

function getOrderSummary(input: CalculationInput, result: CalculationResult) {
  const cementBags = Math.ceil(result.materials.cementBags);
  const cementBagCost = getSelectedCementBagCost(input);
  const cementCost = cementBagCost > 0 ? cementBags * cementBagCost : result.costs.cementCost;
  const readyMixVolume = result.wetVolumeM3 * (1 + Math.max(0, input.settings.wastagePercent) / 100);
  const total = input.costs.readyMixEnabled ? result.costs.readyMixCost : cementCost + result.costs.sandCost + result.costs.aggregateCost + result.costs.otherCost;
  return { cementBags, cementBagCost, cementCost, readyMixVolume, total };
}

function wrapLines(text: string, width: number) {
  return text.split('\n').flatMap((line) => {
    if (line.length <= width) return [line];
    const words = line.split(' ');
    const lines: string[] = [];
    let current = '';

    words.forEach((word) => {
      if (`${current} ${word}`.trim().length > width) {
        lines.push(current);
        current = word;
      } else {
        current = `${current} ${word}`.trim();
      }
    });

    if (current) lines.push(current);
    return lines;
  });
}

function chunkLines(lines: string[], size: number) {
  const chunks: string[][] = [];
  for (let index = 0; index < lines.length; index += size) {
    chunks.push(lines.slice(index, index + size));
  }
  return chunks;
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function safeFileName(value: string) {
  return value.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'concretemix-estimate';
}

function calculationFileName(input: CalculationInput, suffix: string) {
  return safeFileName([
    input.projectName || 'concretemix',
    input.locationInProject || 'location',
    suffix,
    shortDate()
  ].join('-'));
}

function projectDashboardFileName(project: SavedProject) {
  const locationPart = project.locations.length === 1 ? project.locations[0]?.name : 'selected-locations';
  return safeFileName([
    project.name || 'concretemix',
    locationPart || 'project',
    'project-pdf',
    shortDate()
  ].join('-'));
}

function formatDimensions(input: CalculationInput) {
  const unit = input.unit;
  const dimensions = input.dimensions;
  if (input.shape === 'custom') return `${round(dimensions.customVolume, 3)} m3 custom volume`;
  if (input.shape === 'circle') return `diameter ${dimensions.diameter} ${unit}, depth ${dimensions.depth} ${unit}`;
  if (input.shape === 'column') return `diameter ${dimensions.diameter} ${unit}, height ${dimensions.height} ${unit}`;
  if (input.shape === 'stair') return `${dimensions.steps} steps, width ${dimensions.width} ${unit}, rise ${dimensions.rise} ${unit}, run ${dimensions.run} ${unit}`;
  return `length ${dimensions.length} ${unit}, width ${dimensions.width} ${unit}, depth ${dimensions.depth} ${unit}`;
}

function shortDate(date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

function formatMoney(value: number) {
  return round(value, 2).toFixed(2);
}
