import { defaultSettings } from './data';
import type { CalculationInput, CementType, ConcreteBackup, Costs, CustomMixPreset, SavedCalculation, SavedProject, Settings } from './types';

const SETTINGS_KEY = 'concretemix:settings';
const COSTS_KEY = 'concretemix:costs';
const HISTORY_KEY = 'concretemix:history';
const CUSTOM_MIXES_KEY = 'concretemix:custom-mixes';
const PROJECTS_KEY = 'concretemix:projects';

export const defaultCosts: Costs = {
  cementPerBag: 0,
  cementPerBagByType: {
    'Type I': 0,
    'Type II': 0,
    'Type III': 0,
    'Type IV': 0,
    'Type V': 0,
    Custom: 0
  },
  customCements: [],
  cementPerKg: 0,
  sandPerM3: 0,
  aggregatePerM3: 0,
  water: 0,
  labor: 0,
  transport: 0,
  otherName: 'Additive',
  otherCost: 0,
  readyMixEnabled: false,
  readyMixPerM3: 0,
  additivePercentOfWater: 0,
  additiveContainerCost: 0,
  additiveContainerSize: 1,
  additiveUnit: 'L'
};

export function loadSettings(): Settings {
  const stored = readJson<Partial<Settings>>(SETTINGS_KEY, {});
  const storedCementNames = (stored.cementTypeNames ?? {}) as Partial<Record<CementType, string>>;
  return {
    ...defaultSettings,
    ...stored,
    cementTypeNames: {
      ...defaultSettings.cementTypeNames,
      ...storedCementNames,
      'Type I': storedCementNames['Type I'] === 'Type I' || !storedCementNames['Type I'] ? defaultSettings.cementTypeNames['Type I'] : storedCementNames['Type I'],
      'Type II': storedCementNames['Type II'] === 'Type II' || !storedCementNames['Type II'] ? defaultSettings.cementTypeNames['Type II'] : storedCementNames['Type II'],
      'Type III': storedCementNames['Type III'] === 'Type III' || !storedCementNames['Type III'] ? defaultSettings.cementTypeNames['Type III'] : storedCementNames['Type III'],
      'Type IV': storedCementNames['Type IV'] === 'Type IV' || !storedCementNames['Type IV'] ? defaultSettings.cementTypeNames['Type IV'] : storedCementNames['Type IV'],
      'Type V': storedCementNames['Type V'] === 'Type V' || !storedCementNames['Type V'] ? defaultSettings.cementTypeNames['Type V'] : storedCementNames['Type V'],
      Custom: storedCementNames.Custom || defaultSettings.cementTypeNames.Custom
    }
  };
}

export function saveSettings(settings: Settings) {
  writeJson(SETTINGS_KEY, settings);
}

export function loadCosts(): Costs {
  const stored = readJson<Partial<Costs>>(COSTS_KEY, {});
  return {
    ...defaultCosts,
    ...stored,
    cementPerBagByType: {
      ...defaultCosts.cementPerBagByType,
      ...stored.cementPerBagByType
    },
    customCements: stored.customCements ?? []
  };
}

export function saveCosts(costs: Costs) {
  writeJson(COSTS_KEY, costs);
}

export function loadHistory(): SavedCalculation[] {
  return readJson<SavedCalculation[]>(HISTORY_KEY, []);
}

export function saveCalculation(calculation: SavedCalculation) {
  const next = [calculation, ...loadHistory().filter((item) => item.id !== calculation.id)].slice(0, 20);
  writeJson(HISTORY_KEY, next);
  return next;
}

export function loadProjects(): SavedProject[] {
  return readJson<Array<SavedProject | FlatSavedProject>>(PROJECTS_KEY, []).map((project) => {
    if ('locations' in project && Array.isArray(project.locations)) return project;
    const flatProject = project as FlatSavedProject;
    const locationName = flatProject.locationInProject || flatProject.input.locationInProject || 'Main location';
    return {
      id: flatProject.id,
      name: flatProject.name,
      locations: [
        {
          id: `${flatProject.id}-location`,
          name: locationName,
          input: flatProject.input,
          updatedAt: flatProject.updatedAt
        }
      ],
      updatedAt: flatProject.updatedAt
    };
  });
}

export function saveProject(project: SavedProject) {
  const next = [project, ...loadProjects().filter((item) => item.id !== project.id && item.name.toLowerCase() !== project.name.toLowerCase())].slice(0, 50);
  writeJson(PROJECTS_KEY, next);
  return next;
}

export function deleteProject(projectId: string) {
  const next = loadProjects().filter((item) => item.id !== projectId);
  writeJson(PROJECTS_KEY, next);
  return next;
}

export function clearProjects() {
  writeJson(PROJECTS_KEY, []);
}

export function clearHistory() {
  writeJson(HISTORY_KEY, []);
}

export function clearCustomMixes() {
  writeJson(CUSTOM_MIXES_KEY, []);
}

export function loadCustomMixes(): CustomMixPreset[] {
  return readJson<CustomMixPreset[]>(CUSTOM_MIXES_KEY, []);
}

export function saveCustomMix(preset: CustomMixPreset) {
  const name = preset.name.trim();
  const existing = loadCustomMixes().filter((item) => item.name.toLowerCase() !== name.toLowerCase() && item.id !== preset.id);
  const next = [{ ...preset, name }, ...existing].slice(0, 30);
  writeJson(CUSTOM_MIXES_KEY, next);
  return next;
}

export function clearAllConcreteData() {
  if (typeof window === 'undefined') return;
  [SETTINGS_KEY, COSTS_KEY, HISTORY_KEY, CUSTOM_MIXES_KEY, PROJECTS_KEY].forEach((key) => {
    window.localStorage.removeItem(key);
  });
}

export function createBackup(): ConcreteBackup {
  return {
    app: 'ConcreteMix Pro',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: loadSettings(),
    costs: loadCosts(),
    history: loadHistory(),
    customMixes: loadCustomMixes(),
    projects: loadProjects()
  };
}

export function restoreBackup(backup: ConcreteBackup) {
  if (backup.app !== 'ConcreteMix Pro' || backup.version !== 1) {
    throw new Error('This is not a valid ConcreteMix Pro backup file.');
  }
  writeJson(SETTINGS_KEY, backup.settings);
  writeJson(COSTS_KEY, backup.costs);
  writeJson(HISTORY_KEY, backup.history);
  writeJson(CUSTOM_MIXES_KEY, backup.customMixes);
  writeJson(PROJECTS_KEY, backup.projects);
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

interface FlatSavedProject {
  id: string;
  name: string;
  locationInProject: string;
  input: CalculationInput;
  updatedAt: string;
}
