import type { CementType, MixDesign, Purpose, Settings } from './types';

export const defaultSettings: Settings = {
  theme: 'light',
  defaultUnit: 'm',
  unitSystem: 'metric',
  strengthUnit: 'MPa',
  bagSize: 50,
  wastagePercent: 5,
  dryVolumeFactor: 1.54,
  waterCementRatio: 0.5,
  cementDensityKgM3: 1440,
  sandDensityKgM3: 1600,
  aggregateDensityKgM3: 1500,
  mixerCapacityLiters: 200,
  wheelbarrowCapacityLiters: 65,
  currencySymbol: '$',
  cementTypeNames: {
    'Type I': 'Type I - General purpose',
    'Type II': 'Type II - Moderate sulfate resistance',
    'Type III': 'Type III - High early strength',
    'Type IV': 'Type IV - Low heat hydration',
    'Type V': 'Type V - High sulfate resistance',
    Custom: 'Custom cement'
  }
};

export const strengthDatabase: MixDesign[] = [
  {
    strengthMpa: 5,
    strengthPsi: 725,
    label: '5 MPa',
    ratio: [1, 5, 10],
    waterCementRatio: 0.6,
    typicalUse: 'Site leveling, sub-bases, blinding concrete.'
  },
  {
    strengthMpa: 10,
    strengthPsi: 1450,
    label: '10 MPa',
    ratio: [1, 3, 6],
    waterCementRatio: 0.58,
    typicalUse: 'Driveway base layers, pathways, shed bases.'
  },
  {
    strengthMpa: 15,
    strengthPsi: 2175,
    label: '15 MPa',
    ratio: [1, 2, 4],
    waterCementRatio: 0.55,
    typicalUse: 'Domestic footings, garden walls, drainage works.'
  },
  {
    strengthMpa: 20,
    strengthPsi: 2900,
    label: '20 MPa',
    ratio: [1, 1.5, 3],
    waterCementRatio: 0.5,
    typicalUse: 'Domestic slabs, driveways, light RCC works.'
  },
  {
    strengthMpa: 25,
    strengthPsi: 3625,
    label: '25 MPa',
    ratio: [1, 1, 2],
    waterCementRatio: 0.45,
    typicalUse: 'Structural slabs, foundations, house floors.'
  },
  {
    strengthMpa: 30,
    strengthPsi: 4350,
    label: '30 MPa+',
    ratio: null,
    waterCementRatio: 0.42,
    typicalUse: 'Columns, beams, heavily loaded structures. Use a verified design mix.'
  }
];

export const purposeRecommendations: Record<Purpose, { strengthMpa: number; cementType: CementType }> = {
  'Site leveling': { strengthMpa: 5, cementType: 'Type I' },
  'Blinding concrete': { strengthMpa: 5, cementType: 'Type I' },
  'Sub-base': { strengthMpa: 5, cementType: 'Type II' },
  Footpath: { strengthMpa: 10, cementType: 'Type I' },
  'Shed base': { strengthMpa: 10, cementType: 'Type I' },
  'Domestic slab': { strengthMpa: 20, cementType: 'Type I' },
  Driveway: { strengthMpa: 20, cementType: 'Type II' },
  Foundation: { strengthMpa: 25, cementType: 'Type II' },
  'Reinforced slab': { strengthMpa: 25, cementType: 'Type I' },
  Beam: { strengthMpa: 30, cementType: 'Type III' },
  Column: { strengthMpa: 30, cementType: 'Type III' },
  'Heavy-duty industrial': { strengthMpa: 30, cementType: 'Type V' },
  Custom: { strengthMpa: 20, cementType: 'Type I' }
};

export const cementDescriptions: Record<CementType, string> = {
  'Type I': 'General purpose',
  'Type II': 'Moderate sulfate resistance',
  'Type III': 'High early strength',
  'Type IV': 'Low heat hydration',
  'Type V': 'High sulfate resistance',
  Custom: 'User-defined cement'
};

export const purposes = Object.keys(purposeRecommendations) as Purpose[];
