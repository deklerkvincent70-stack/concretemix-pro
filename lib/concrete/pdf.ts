import { cementDescriptions } from './data';
import { getSelectedCementBagCost } from './costing';
import { formatRatio } from './engine';
import type { CalculationInput, CalculationResult } from './types';
import { round } from './units';

const pageWidth = 595;
const pageHeight = 842;

export function downloadReportPdf(input: CalculationInput, result: CalculationResult) {
  const blob = createReportPdfBlob(input, result);
  const fileName = `${safeFileName(input.projectName || 'concretemix-estimate')}.pdf`;
  void savePdf(blob, fileName, 'ConcreteMix Pro estimate');
}

export async function shareReportPdf(input: CalculationInput, result: CalculationResult) {
  const blob = createReportPdfBlob(input, result);
  const fileName = `${safeFileName(input.projectName || 'concretemix-estimate')}.pdf`;

  if (await shareNativePdf(blob, fileName, 'ConcreteMix Pro estimate')) return;

  const file = new File([blob], `${safeFileName(input.projectName || 'concretemix-estimate')}.pdf`, { type: 'application/pdf' });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: 'ConcreteMix Pro estimate', files: [file] });
    return;
  }

  downloadReportPdf(input, result);
}

export function downloadOrderPdf(input: CalculationInput, result: CalculationResult) {
  const blob = createOrderPdfBlob(input, result);
  const fileName = `${safeFileName(`${input.projectName || 'concretemix'}-order-list`)}.pdf`;
  void savePdf(blob, fileName, 'ConcreteMix Pro order list');
}

export async function shareOrderPdf(input: CalculationInput, result: CalculationResult) {
  const blob = createOrderPdfBlob(input, result);
  const fileName = `${safeFileName(`${input.projectName || 'concretemix'}-order-list`)}.pdf`;

  if (await shareNativePdf(blob, fileName, 'ConcreteMix Pro order list')) return;

  const file = new File([blob], fileName, { type: 'application/pdf' });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: 'ConcreteMix Pro order list', files: [file] });
    return;
  }

  downloadOrderPdf(input, result);
}

async function savePdf(blob: Blob, fileName: string, title: string) {
  if (await shareNativePdf(blob, fileName, title)) return;
  downloadWebPdf(blob, fileName);
}

function downloadWebPdf(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
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
    globalThis.alert?.('The PDF could not be opened for saving or sharing. Please try again.');
    return true;
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

function createReportPdfBlob(input: CalculationInput, result: CalculationResult) {
  const lines = wrapLines(buildReportText(input, result), 82).slice(0, 54);
  return createPdfBlob(lines);
}

function createOrderPdfBlob(input: CalculationInput, result: CalculationResult) {
  const lines = wrapLines(buildOrderText(input, result), 82).slice(0, 54);
  return createPdfBlob(lines);
}

function createPdfBlob(lines: string[]) {
  const contentLines = ['BT', '/F1 11 Tf', '50 790 Td', '14 TL'];

  lines.forEach((line, index) => {
    if (index > 0) contentLines.push('T*');
    contentLines.push(`(${escapePdfText(line)}) Tj`);
  });

  contentLines.push('ET');
  const content = contentLines.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  ];

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

function buildReportText(input: CalculationInput, result: CalculationResult) {
  const currency = input.settings.currencySymbol;
  const cementDescription = input.cementType === 'Custom' ? 'User-defined cement' : cementDescriptions[input.cementType];

  return [
    'ConcreteMix Pro Estimate',
    `Date: ${new Date().toLocaleDateString()}`,
    `Project: ${input.projectName || 'Concrete estimate'}`,
    `Location: ${input.locationInProject || 'Not specified'}`,
    `Purpose: ${input.purpose}`,
    `Shape: ${input.shape}`,
    '',
    'Dimensions',
    `Unit: ${input.unit}`,
    `Length: ${input.dimensions.length}`,
    `Width: ${input.dimensions.width}`,
    `Depth / Thickness: ${input.dimensions.depth}`,
    `Wet volume: ${round(result.wetVolumeM3, 3)} m3 / ${round(result.volumeLiters, 0)} L / ${round(result.volumeFt3, 2)} ft3`,
    `Dry volume: ${round(result.dryVolumeM3, 3)} m3`,
    '',
    'Mix',
    `Strength: ${round(input.strengthMpa, 1)} MPa`,
    `Ratio: ${formatRatio(input.ratio)}`,
    `Cement: ${input.customCementName} - ${cementDescription}`,
    `Water-cement ratio: ${input.settings.waterCementRatio}`,
    `Wastage: ${input.settings.wastagePercent}%`,
    '',
    'Materials',
    `Cement: ${round(result.materials.cementKg, 1)} kg / ${round(result.materials.cementBags, 1)} bags`,
    `Sand: ${round(result.materials.sandM3, 3)} m3 / ${round(result.materials.sandKg, 0)} kg`,
    `Stone: ${round(result.materials.aggregateM3, 3)} m3 / ${round(result.materials.aggregateKg, 0)} kg`,
    `Water: ${round(result.materials.waterLiters, 1)} L`,
    `${input.costs.otherName || 'Additive'}: ${round(result.materials.additiveLiters, 3)} L / ${round(result.materials.additiveContainers, 2)} containers`,
    '',
    'Costs',
    `Cement: ${currency}${formatMoney(result.costs.cementCost)}`,
    `Sand: ${currency}${formatMoney(result.costs.sandCost)}`,
    `Stone: ${currency}${formatMoney(result.costs.aggregateCost)}`,
    `${input.costs.otherName || 'Additive'}: ${currency}${formatMoney(result.costs.otherCost)}`,
    `Total: ${currency}${formatMoney(result.costs.total)}`,
    `Cost per m3: ${currency}${formatMoney(result.costs.costPerM3)}`,
    '',
    'Notes',
    input.notes || 'No notes.'
  ].join('\n');
}

function buildOrderText(input: CalculationInput, result: CalculationResult) {
  const currency = input.settings.currencySymbol;
  const orderCementBags = Math.ceil(result.materials.cementBags);
  const cementBagCost = getSelectedCementBagCost(input);
  const orderCementCost = cementBagCost > 0 ? orderCementBags * cementBagCost : result.costs.cementCost;
  const orderTotal = orderCementCost + result.costs.sandCost + result.costs.aggregateCost + result.costs.otherCost;
  return [
    'ConcreteMix Pro Shopping / Order List',
    `Date: ${new Date().toLocaleDateString()}`,
    `Project: ${input.projectName || 'Concrete project'}`,
    `Location: ${input.locationInProject || 'Not specified'}`,
    '',
    'Concrete Required',
    `Purpose: ${input.purpose}`,
    `Shape: ${input.shape}`,
    `Wet volume: ${round(result.wetVolumeM3, 3)} m3`,
    `Dry volume: ${round(result.dryVolumeM3, 3)} m3`,
    `Mix ratio: ${formatRatio(input.ratio)}`,
    `Wastage included: ${input.settings.wastagePercent}%`,
    '',
    'Order Items',
    `[ ] Cement - ${input.customCementName}: ${orderCementBags} bags (${round(result.materials.cementKg, 1)} kg calculated)`,
    `[ ] Sand: ${round(result.materials.sandM3, 3)} m3 (${round(result.materials.sandKg, 0)} kg)`,
    `[ ] Stone / Aggregate: ${round(result.materials.aggregateM3, 3)} m3 (${round(result.materials.aggregateKg, 0)} kg)`,
    `[ ] Water: ${round(result.materials.waterLiters, 1)} L`,
    `[ ] ${input.costs.otherName || 'Additive'}: ${round(result.materials.additiveLiters, 3)} L (${round(result.materials.additiveContainers, 2)} containers)`,
    '',
    'Estimated Costs',
    `Cement: ${currency}${formatMoney(orderCementCost)} (${orderCementBags} bags x ${currency}${formatMoney(cementBagCost)})`,
    `Sand: ${currency}${formatMoney(result.costs.sandCost)}`,
    `Stone / Aggregate: ${currency}${formatMoney(result.costs.aggregateCost)}`,
    `${input.costs.otherName || 'Additive'}: ${currency}${formatMoney(result.costs.otherCost)}`,
    `Total material estimate: ${currency}${formatMoney(orderTotal)}`,
    '',
    'Notes',
    input.notes || 'No notes.'
  ].join('\n');
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

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function safeFileName(value: string) {
  return value.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'concretemix-estimate';
}

function formatMoney(value: number) {
  return round(value, 2).toFixed(2);
}
