export type Shape = 'rectangle' | 'circle' | 'column' | 'beam' | 'stair' | 'custom';

export type LengthUnit = 'mm' | 'cm' | 'm' | 'in' | 'ft';

export type BagSize = 25 | 42.5 | 50;

export type WastageOption = 0 | 5 | 10;

export type CementType = 'Type I' | 'Type II' | 'Type III' | 'Type IV' | 'Type V' | 'Custom';

export type AdditiveUnit = 'L' | 'ml' | 'gal' | 'fl oz';

export type Purpose =
  | 'Site leveling'
  | 'Blinding concrete'
  | 'Sub-base'
  | 'Footpath'
  | 'Shed base'
  | 'Domestic slab'
  | 'Driveway'
  | 'Foundation'
  | 'Reinforced slab'
  | 'Beam'
  | 'Column'
  | 'Heavy-duty industrial'
  | 'Custom';

export interface MixDesign {
  strengthMpa: number;
  strengthPsi: number;
  label: string;
  ratio: [number, number, number] | null;
  waterCementRatio: number;
  typicalUse: string;
}

export interface Settings {
  theme: 'light' | 'dark';
  defaultUnit: LengthUnit;
  unitSystem: 'metric' | 'imperial';
  strengthUnit: 'MPa' | 'PSI';
  bagSize: BagSize;
  wastagePercent: number;
  dryVolumeFactor: number;
  waterCementRatio: number;
  cementDensityKgM3: number;
  sandDensityKgM3: number;
  aggregateDensityKgM3: number;
  mixerCapacityLiters: number;
  wheelbarrowCapacityLiters: number;
  currencySymbol: string;
  cementTypeNames: Record<CementType, string>;
}

export interface Costs {
  cementPerBag: number;
  cementPerBagByType: Record<CementType, number>;
  customCements: CustomCementPreset[];
  cementPerKg: number;
  sandPerM3: number;
  aggregatePerM3: number;
  water: number;
  labor: number;
  transport: number;
  otherName: string;
  otherCost: number;
  readyMixEnabled: boolean;
  readyMixPerM3: number;
  additivePercentOfWater: number;
  additiveContainerCost: number;
  additiveContainerSize: number;
  additiveUnit: AdditiveUnit;
}

export interface Dimensions {
  length: number;
  width: number;
  depth: number;
  diameter: number;
  height: number;
  steps: number;
  rise: number;
  run: number;
  customVolume: number;
}

export interface CalculationInput {
  projectName: string;
  locationInProject: string;
  notes: string;
  shape: Shape;
  unit: LengthUnit;
  purpose: Purpose;
  cementType: CementType;
  customCementName: string;
  strengthMpa: number;
  ratio: [number, number, number] | null;
  dimensions: Dimensions;
  settings: Settings;
  costs: Costs;
}

export interface MaterialOutput {
  cementKg: number;
  cementBags: number;
  sandM3: number;
  sandKg: number;
  aggregateM3: number;
  aggregateKg: number;
  waterLiters: number;
  additiveLiters: number;
  additiveContainers: number;
}

export interface CostOutput {
  cementCost: number;
  sandCost: number;
  aggregateCost: number;
  otherCost: number;
  readyMixCost: number;
  materialSubtotal: number;
  laborSubtotal: number;
  total: number;
  costPerM3: number;
}

export interface CalculationResult {
  wetVolumeM3: number;
  dryVolumeM3: number;
  volumeLiters: number;
  volumeFt3: number;
  materials: MaterialOutput;
  costs: CostOutput;
  mixerBatches: number;
  wheelbarrows: number;
  warnings: string[];
}

export interface SavedCalculation {
  id: string;
  createdAt: string;
  input: CalculationInput;
  result: CalculationResult;
}

export interface SavedProject {
  id: string;
  name: string;
  locations: SavedProjectLocation[];
  updatedAt: string;
}

export interface SavedProjectLocation {
  id: string;
  name: string;
  input: CalculationInput;
  orderedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface CustomMixPreset {
  id: string;
  name: string;
  strengthMpa: number;
  cementType: CementType;
  customCementName: string;
  ratio: [number, number, number];
  updatedAt: string;
}

export interface CustomCementPreset {
  id: string;
  name: string;
  costPerBag: number;
  updatedAt: string;
}

export interface ConcreteBackup {
  app: 'ConcreteMix Pro';
  version: 1;
  exportedAt: string;
  settings: Settings;
  costs: Costs;
  history: SavedCalculation[];
  customMixes: CustomMixPreset[];
  projects: SavedProject[];
}
