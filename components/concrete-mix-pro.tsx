'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, HelpCircle, Moon, Save, Share2, ShieldCheck, Sun } from 'lucide-react';
import { cementDescriptions, defaultSettings, purposes, strengthDatabase } from '@/lib/concrete/data';
import { calculateConcrete, formatRatio, getMixByStrength, recommendedForPurpose } from '@/lib/concrete/engine';
import { downloadOrderPdf, downloadProjectDashboardPdf, shareOrderPdf, shareProjectDashboardPdf } from '@/lib/concrete/pdf';
import { clearAllConcreteData, clearCustomMixes, clearHistory, clearProjects, createBackup, defaultCosts, loadCosts, loadCustomMixes, loadProjects, loadSettings, restoreBackup, saveCosts, saveCustomMix, saveProject, saveSettings } from '@/lib/concrete/storage';
import type { AdditiveUnit, BagSize, CalculationInput, CementType, ConcreteBackup, Costs, CustomMixPreset, Dimensions, LengthUnit, MaterialOrderItem, MaterialOrderStatus, Purpose, SavedProject, SavedProjectLocation, Settings, Shape } from '@/lib/concrete/types';
import { kgToPounds, round } from '@/lib/concrete/units';

const shapes: { id: Shape; label: string }[] = [
  { id: 'rectangle', label: 'Slab' },
  { id: 'circle', label: 'Circle' },
  { id: 'column', label: 'Column' },
  { id: 'beam', label: 'Beam' },
  { id: 'stair', label: 'Stair' },
  { id: 'custom', label: 'Custom' }
];

const materialOrderItems: { id: MaterialOrderItem; label: string }[] = [
  { id: 'cement', label: 'CEMENT' },
  { id: 'sand', label: 'SAND' },
  { id: 'aggregate', label: 'STONE' },
  { id: 'additive', label: 'ADDITIVE' }
];

const units: LengthUnit[] = ['mm', 'cm', 'm', 'in', 'ft'];
const cementTypes: CementType[] = ['Type I', 'Type II', 'Type III', 'Type IV', 'Type V', 'Custom'];
const baseCementTypes = cementTypes.filter((type) => type !== 'Custom');
const additiveUnits: AdditiveUnit[] = ['L', 'ml', 'gal', 'fl oz'];
const emptyDimensions: Dimensions = { length: 0, width: 0, depth: 0, diameter: 0, height: 0, steps: 0, rise: 0, run: 0, customVolume: 0 };
const PSI_PER_MPA = 145.0377377;
const LITERS_PER_GALLON = 3.785411784;
const LITERS_PER_FLUID_OUNCE = 0.0295735296;

interface ClearDataOptions {
  projects: boolean;
  currentLocation: boolean;
  calculations: boolean;
  customMixes: boolean;
  cementTypes: boolean;
  costs: boolean;
  global: boolean;
}

export function ConcreteMixPro() {
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [costs, setCosts] = useState<Costs>(defaultCosts);
  const [customMixes, setCustomMixes] = useState<CustomMixPreset[]>([]);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [addingProject, setAddingProject] = useState(false);
  const [addingLocation, setAddingLocation] = useState(false);
  const [savedInputSnapshot, setSavedInputSnapshot] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const [shape, setShape] = useState<Shape>('rectangle');
  const [unit, setUnit] = useState<LengthUnit>('m');
  const [purposeChoice, setPurposeChoice] = useState('Domestic slab');
  const [purpose, setPurpose] = useState<Purpose>('Domestic slab');
  const [customPurposeName, setCustomPurposeName] = useState('Custom concrete');
  const [projectName, setProjectName] = useState('Site pour');
  const [locationInProject, setLocationInProject] = useState('');
  const [notes, setNotes] = useState('');
  const [dimensions, setDimensions] = useState<Dimensions>(emptyDimensions);
  const [strengthMpa, setStrengthMpa] = useState(20);
  const [cementType, setCementType] = useState<CementType>('Type I');
  const [cementChoice, setCementChoice] = useState('Type I');
  const [customCementName, setCustomCementName] = useState('Custom cement');
  const [manualMix, setManualMix] = useState(false);
  const [manualRatio, setManualRatio] = useState<[number, number, number]>([1, 1.5, 3]);
  const [openSettings, setOpenSettings] = useState(false);
  const [selectedOrderLocationIds, setSelectedOrderLocationIds] = useState<string[]>([]);

  useEffect(() => {
    const storedSettings = loadSettings();
    const storedCosts = loadCosts();
    setSettings(storedSettings);
    setUnit(storedSettings.defaultUnit);
    setCosts(storedCosts);
    setCustomMixes(loadCustomMixes());
    const projects = loadProjects();
    setSavedProjects(projects);
    const latestProject = projects[0];
    const latestLocation = latestProject?.locations[0];
    if (latestProject && latestLocation) {
      const nextInput = latestLocation.input;
      setSelectedProjectId(latestProject.id);
      setSelectedLocationId(latestLocation.id);
      setAddingProject(false);
      setAddingLocation(false);
      setSavedInputSnapshot(JSON.stringify(nextInput));
      setProjectName(nextInput.projectName || latestProject.name);
      setLocationInProject(nextInput.locationInProject || latestLocation.name);
      setNotes(nextInput.notes);
      setShape(nextInput.shape);
      setUnit(nextInput.unit);
      setPurpose(nextInput.purpose);
      setPurposeChoice(nextInput.purpose);
      setCementType(nextInput.cementType);
      setCustomCementName(nextInput.customCementName || storedSettings.cementTypeNames[nextInput.cementType]);
      setCementChoice(nextInput.customCementName || storedSettings.cementTypeNames[nextInput.cementType]);
      setStrengthMpa(nextInput.strengthMpa);
      if (nextInput.ratio) setManualRatio(nextInput.ratio);
      setManualMix(Boolean(nextInput.ratio));
      setDimensions(nextInput.dimensions);
      setSettings(nextInput.settings);
      setCosts(nextInput.costs);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    saveSettings(settings);
  }, [hydrated, settings]);

  useEffect(() => {
    if (hydrated) saveCosts(costs);
  }, [costs, hydrated]);

  useEffect(() => {
    if (manualMix || purpose === 'Custom') return;
    const recommendation = recommendedForPurpose(purpose);
    setStrengthMpa(recommendation.strengthMpa);
    setCementType(recommendation.cementType);
    if (recommendation.mix.ratio) setManualRatio(recommendation.mix.ratio);
  }, [purpose, manualMix]);

  const selectedMix = getMixByStrength(strengthMpa);
  const ratio = manualMix ? manualRatio : selectedMix.ratio;
  const currency = settings.currencySymbol || '$';
  const isCustomMix = purpose === 'Custom';
  const approximateCustomStrength = isCustomMix ? estimateStrengthFromRatio(manualRatio) : null;
  const strengthSelectValue = isCustomMix ? 'Custom' : settings.strengthUnit === 'PSI' ? String(selectedMix.strengthPsi) : String(strengthMpa);
  const strengthOptions = useMemo(
    () => [...strengthDatabase.map((mix) => String(settings.strengthUnit === 'PSI' ? mix.strengthPsi : mix.strengthMpa)), 'Custom'],
    [settings.strengthUnit]
  );
  const purposeOptions = useMemo(() => [...purposes, ...customMixes.map((mix) => mix.name)], [customMixes]);
  const savedCustomCements = useMemo(() => costs.customCements.filter((cement) => isSavedCustomCement(cement.name)), [costs.customCements]);
  const cementOptions = useMemo(() => [...baseCementTypes.map((type) => settings.cementTypeNames[type]), ...savedCustomCements.map((cement) => cement.name)], [savedCustomCements, settings.cementTypeNames]);
  const selectedProject = useMemo(() => savedProjects.find((project) => project.id === selectedProjectId), [savedProjects, selectedProjectId]);
  const projectLocations = selectedProject?.locations ?? [];

  useEffect(() => {
    setSelectedOrderLocationIds((current) => {
      const availableIds = projectLocations.map((location) => location.id);
      const keptIds = current.filter((id) => availableIds.includes(id));
      return keptIds.length > 0 ? keptIds : availableIds;
    });
  }, [selectedProjectId, projectLocations.length]);

  const input: CalculationInput = useMemo(
    () => ({ projectName, locationInProject, notes, shape, unit, purpose, cementType, customCementName, strengthMpa, ratio, dimensions, settings, costs }),
    [projectName, locationInProject, notes, shape, unit, purpose, cementType, customCementName, strengthMpa, ratio, dimensions, settings, costs]
  );
  const result = useMemo(() => calculateConcrete(input), [input]);
  const inputSnapshot = useMemo(() => JSON.stringify(input), [input]);
  const hasUnsavedProjectChanges = Boolean(selectedProjectId && savedInputSnapshot && savedInputSnapshot !== inputSnapshot);
  const waterDisplay = formatLiquid(result.materials.waterLiters, settings.unitSystem);
  const additiveDisplay = formatLiquid(result.materials.additiveLiters, settings.unitSystem);
  const dashboardSummaries = useMemo(
    () => projectLocations.map((location) => ({ location, result: calculateConcrete(location.input) })),
    [projectLocations]
  );
  const projectActualCost = dashboardSummaries.length > 0 ? dashboardSummaries.reduce((sum, item) => sum + item.result.costs.total, 0) : result.costs.total;
  const selectedDashboardCost = dashboardSummaries
    .filter((item) => selectedOrderLocationIds.includes(item.location.id))
    .reduce((sum, item) => sum + item.result.costs.total, 0);
  const selectedShoppingCost = dashboardSummaries
    .filter((item) => hasPendingMaterialOrders(item.location))
    .reduce((sum, item) => sum + item.result.costs.total, 0);
  const pendingMaterialOrderLocations = projectLocations.filter((location) => hasPendingMaterialOrders(location));
  const hasPendingMaterialOrder = pendingMaterialOrderLocations.length > 0;

  function saveCustomCurrent() {
    const name = customPurposeName.trim();
    if (!name) return;
    const saved = saveCustomMix({
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      strengthMpa,
      cementType,
      customCementName,
      ratio: manualRatio,
      updatedAt: new Date().toISOString()
    });
    setCustomMixes(saved);
    setPurposeChoice(name);
  }

  function loadInput(nextInput: CalculationInput) {
    setSettings(nextInput.settings);
    setCosts(nextInput.costs);
    setProjectName(nextInput.projectName);
    setLocationInProject(nextInput.locationInProject || '');
    setNotes(nextInput.notes);
    setShape(nextInput.shape);
    setUnit(nextInput.unit);
    setPurpose(nextInput.purpose);
    setPurposeChoice(nextInput.purpose);
    setCementType(nextInput.cementType);
    setCustomCementName(nextInput.customCementName || settings.cementTypeNames[nextInput.cementType]);
    setCementChoice(nextInput.customCementName || settings.cementTypeNames[nextInput.cementType]);
    setStrengthMpa(nextInput.strengthMpa);
    if (nextInput.ratio) setManualRatio(nextInput.ratio);
    setManualMix(Boolean(nextInput.ratio));
    setDimensions(nextInput.dimensions);
  }

  function loadSavedInput(project: SavedProject, location = project.locations[0]) {
    setSelectedProjectId(project.id);
    setAddingProject(false);
    setProjectName(project.name);
    if (!location) {
      setSelectedLocationId('');
      setAddingLocation(true);
      setLocationInProject('');
      setNotes('');
      setDimensions(emptyDimensions);
      setSavedInputSnapshot('');
      return;
    }
    setSelectedLocationId(location.id);
    setAddingLocation(false);
    loadInput(location.input);
    setSavedInputSnapshot(JSON.stringify(location.input));
  }

  function startNewProject() {
    setSelectedProjectId('');
    setSelectedLocationId('');
    setAddingProject(true);
    setAddingLocation(false);
    setSavedInputSnapshot('');
    setProjectName('');
    setLocationInProject('');
    setNotes('');
    setDimensions(emptyDimensions);
  }

  function addProject() {
    if (projectName.trim()) saveProjectCurrent();
    startNewProject();
  }

  function startNewLocation() {
    if (!selectedProject) return;
    setSelectedLocationId('');
    setAddingLocation(true);
    setSavedInputSnapshot('');
    setLocationInProject('');
    setNotes('');
    setDimensions(emptyDimensions);
  }

  function addLocation() {
    if (!selectedProject) return;
    if (selectedLocationId || locationInProject.trim()) saveProjectCurrent();
    startNewLocation();
  }

  function runWithUnsavedCheck(action: () => void) {
    if (!hasUnsavedProjectChanges) {
      action();
      return;
    }
    setPendingAction(() => action);
    setShowUnsavedPrompt(true);
  }

  function saveProjectCurrent() {
    const name = projectName.trim() || 'Concrete project';
    const locationName = locationInProject.trim();
    saveSettings(settings);
    saveCosts(costs);
    const existingByName = savedProjects.find((project) => project.name.toLowerCase() === name.toLowerCase());
    const project = selectedProject ?? existingByName;
    const projectId = project?.id || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    if (!locationName) {
      const savedProject = {
        id: projectId,
        name,
        locations: project?.locations ?? [],
        updatedAt: new Date().toISOString()
      };
      const saved = saveProject(savedProject);
      setSavedProjects(saved);
      setSelectedProjectId(projectId);
      setSelectedLocationId('');
      setAddingProject(false);
      setAddingLocation(true);
      setProjectName(name);
      setSavedInputSnapshot('');
      return;
    }
    const existingLocation = project?.locations.find((location) => location.id === selectedLocationId || location.name.toLowerCase() === locationName.toLowerCase());
    const locationId = existingLocation?.id || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const savedInput = { ...input, projectName: name, locationInProject: locationName };
    const location = {
      id: locationId,
      name: locationName,
      input: savedInput,
      updatedAt: new Date().toISOString()
    };
    const savedProject = {
      id: projectId,
      name,
      locations: [location, ...(project?.locations ?? []).filter((item) => item.id !== locationId && item.name.toLowerCase() !== locationName.toLowerCase())],
      updatedAt: new Date().toISOString()
    };
    const saved = saveProject(savedProject);
    setSavedProjects(saved);
    setSelectedProjectId(projectId);
    setSelectedLocationId(locationId);
    setAddingProject(false);
    setAddingLocation(false);
    setProjectName(name);
    setLocationInProject(locationName);
    setSavedInputSnapshot(JSON.stringify(savedInput));
  }

  function handleProjectNameChange(value: string) {
    setProjectName(value);
    setSelectedProjectId('');
    setSelectedLocationId('');
    setSavedInputSnapshot('');
  }

  function handleLocationNameChange(value: string) {
    setLocationInProject(value);
    setSelectedLocationId('');
    setSavedInputSnapshot('');
  }

  function deleteSelectedLocation(confirmDelete = true) {
    if (!selectedProject || !selectedLocationId) return;
    const location = selectedProject.locations.find((item) => item.id === selectedLocationId);
    if (!location) return;
    const confirmed = !confirmDelete || window.confirm(`Delete location "${location.name}" from project "${selectedProject.name}"?`);
    if (!confirmed) return;
    const nextProject = {
      ...selectedProject,
      locations: selectedProject.locations.filter((item) => item.id !== selectedLocationId),
      updatedAt: new Date().toISOString()
    };
    const nextProjects = saveProject(nextProject);
    setSavedProjects(nextProjects);
    setSelectedLocationId('');
    setAddingLocation(true);
    setSavedInputSnapshot('');
    setLocationInProject('');
    setNotes('');
    setDimensions(emptyDimensions);
  }

  function clearCurrentLocation() {
    if (!selectedProject || !selectedLocationId) {
      window.alert('Select a saved project location first.');
      return;
    }
    deleteSelectedLocation(false);
  }

  function confirmSaveBeforeAction() {
    saveProjectCurrent();
    setShowUnsavedPrompt(false);
    pendingAction?.();
    setPendingAction(null);
  }

  function discardBeforeAction() {
    setShowUnsavedPrompt(false);
    pendingAction?.();
    setPendingAction(null);
  }

  function cancelPendingAction() {
    setShowUnsavedPrompt(false);
    setPendingAction(null);
  }

  function clearSelectedData(options: ClearDataOptions) {
    const labels = [
      options.projects && 'saved projects',
      options.currentLocation && 'current location in project',
      options.calculations && 'saved calculations',
      options.customMixes && 'custom mixes',
      options.cementTypes && 'cement types',
      options.costs && 'costs',
      options.global && 'global settings'
    ].filter(Boolean);
    if (labels.length === 0) return;
    const confirmed = window.confirm(`Delete selected data from this device?\n\n${labels.join(', ')}`);
    if (!confirmed) return;
    if (options.projects && options.calculations && options.customMixes && options.cementTypes && options.costs && options.global) {
      clearAllConcreteData();
    }

    if (options.currentLocation && !options.projects) clearCurrentLocation();
    if (options.projects) {
      clearProjects();
      setSavedProjects([]);
      setSelectedProjectId('');
      setSelectedLocationId('');
      setAddingProject(true);
      setAddingLocation(false);
      setSavedInputSnapshot('');
      setProjectName('Site pour');
      setLocationInProject('');
      setNotes('');
      setDimensions(emptyDimensions);
    }
    if (options.calculations) clearHistory();
    if (options.customMixes) {
      clearCustomMixes();
      setCustomMixes([]);
      setPurposeChoice('Domestic slab');
      setPurpose('Domestic slab');
      setCustomPurposeName('Custom concrete');
      setManualMix(false);
    }
    if (options.cementTypes) {
      setSettings((next) => ({ ...next, cementTypeNames: { ...next.cementTypeNames, Custom: defaultSettings.cementTypeNames.Custom } }));
      setCosts((next) => ({
        ...next,
        customCements: [],
        cementPerBagByType: { ...next.cementPerBagByType, Custom: defaultCosts.cementPerBagByType.Custom }
      }));
      setCementType('Type I');
      setCementChoice(settings.cementTypeNames['Type I']);
      setCustomCementName(defaultSettings.cementTypeNames.Custom);
    }
    if (options.costs) setCosts(defaultCosts);
    if (options.global) {
      setSettings((next) => ({
        ...next,
        theme: defaultSettings.theme,
        defaultUnit: defaultSettings.defaultUnit,
        unitSystem: defaultSettings.unitSystem,
        strengthUnit: defaultSettings.strengthUnit,
        currencySymbol: defaultSettings.currencySymbol
      }));
      setUnit(defaultSettings.defaultUnit);
    }
  }

  function getSelectedOrderProject() {
    if (!selectedProject) return null;
    const selectedLocations = selectedProject.locations.filter((location) => selectedOrderLocationIds.includes(location.id));
    return selectedLocations.length > 0 ? { ...selectedProject, locations: selectedLocations } : null;
  }

  function getSelectedShoppingProject() {
    if (!selectedProject) return null;
    const selectedLocations = selectedProject.locations.filter((location) => hasPendingMaterialOrders(location));
    return selectedLocations.length > 0 ? { ...selectedProject, locations: selectedLocations } : null;
  }

  function saveDashboardPdf() {
    const statusProject = getSelectedOrderProject();
    const shoppingProject = getSelectedShoppingProject();
    if (statusProject || shoppingProject) {
      downloadProjectDashboardPdf(statusProject, shoppingProject);
      return;
    }
    downloadOrderPdf(input, result);
  }

  async function shareDashboardPdf() {
    const statusProject = getSelectedOrderProject();
    const shoppingProject = getSelectedShoppingProject();
    if (statusProject || shoppingProject) {
      await shareProjectDashboardPdf(statusProject, shoppingProject);
      return;
    }
    await shareOrderPdf(input, result);
  }

  function toggleOrderLocation(locationId: string) {
    setSelectedOrderLocationIds((current) => current.includes(locationId) ? current.filter((id) => id !== locationId) : [...current, locationId]);
  }

  function cycleMaterialOrderStatus(locationId: string, item: MaterialOrderItem) {
    if (!selectedProject) return;
    const locationToUpdate = selectedProject.locations.find((location) => location.id === locationId);
    if (!locationToUpdate) return;
    const current = getMaterialOrderStatus(locationToUpdate, item);
    const next: MaterialOrderStatus = current === 'none' ? 'ordered' : current === 'ordered' ? 'received' : 'none';
    const orderStatuses = { ...(locationToUpdate.orderStatuses ?? {}), [item]: next };
    if (next === 'none') delete orderStatuses[item];
    const updatedLocation = {
      ...locationToUpdate,
      orderStatuses,
      orderedAt: Object.values(orderStatuses).some((status) => status === 'ordered' || status === 'received') ? (locationToUpdate.orderedAt ?? new Date().toISOString()) : undefined,
      updatedAt: new Date().toISOString()
    };
    const updatedProject = {
      ...selectedProject,
      locations: selectedProject.locations.map((location) => location.id === locationId ? updatedLocation : location),
      updatedAt: new Date().toISOString()
    };
    const saved = saveProject(updatedProject);
    setSavedProjects(saved);
    if (next === 'ordered') setSelectedOrderLocationIds([]);
  }

  function selectAllOrderLocations() {
    setSelectedOrderLocationIds(projectLocations.map((location) => location.id));
  }

  function clearOrderLocations() {
    setSelectedOrderLocationIds([]);
  }

  function setLocationCompleted(locationId: string, completed: boolean) {
    if (!selectedProject) return;
    const locationToUpdate = selectedProject.locations.find((location) => location.id === locationId);
    if (!locationToUpdate) return;
    const updatedLocation = {
      ...locationToUpdate,
      completedAt: completed ? new Date().toISOString() : undefined,
      progressPercent: completed ? 100 : Math.min(locationToUpdate.progressPercent ?? 0, 99),
      updatedAt: new Date().toISOString()
    };
    const updatedProject = {
      ...selectedProject,
      locations: selectedProject.locations.map((location) => location.id === locationId ? updatedLocation : location),
      updatedAt: new Date().toISOString()
    };
    const saved = saveProject(updatedProject);
    setSavedProjects(saved);
  }

  function setLocationProgress(locationId: string, progressPercent: number) {
    if (!selectedProject) return;
    const locationToUpdate = selectedProject.locations.find((location) => location.id === locationId);
    if (!locationToUpdate) return;
    const progress = Math.max(0, Math.min(100, Number.isFinite(progressPercent) ? progressPercent : 0));
    const updatedLocation = {
      ...locationToUpdate,
      progressPercent: progress,
      completedAt: progress >= 100 ? (locationToUpdate.completedAt ?? new Date().toISOString()) : undefined,
      updatedAt: new Date().toISOString()
    };
    const updatedProject = {
      ...selectedProject,
      locations: selectedProject.locations.map((location) => location.id === locationId ? updatedLocation : location),
      updatedAt: new Date().toISOString()
    };
    const saved = saveProject(updatedProject);
    setSavedProjects(saved);
  }

  return (
    <main className="min-h-screen bg-[#f4f2ea] text-[#101418] dark:bg-[#121412] dark:text-[#f7f5ed] lg:bg-[#e7eaed] lg:dark:bg-[#101214]">
      <div className="mx-auto grid w-full max-w-[1600px] gap-3 px-2 pb-20 pt-2 sm:gap-4 sm:px-5 sm:pb-24 sm:pt-3 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-5 lg:pt-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <header className="sticky top-0 z-20 -mx-2 border-b border-black/10 bg-[#f4f2ea]/95 px-2 py-2 backdrop-blur dark:border-white/10 dark:bg-[#121412]/95 sm:-mx-5 sm:px-5 sm:py-3 lg:static lg:col-span-2 lg:mx-0 lg:rounded-sm lg:border lg:border-[#b8c0c7] lg:bg-[#f8f9fb] lg:px-4 lg:py-3 lg:shadow-sm lg:dark:border-white/10 lg:dark:bg-[#171a1d]">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div>
              <p className="hidden text-[10px] font-black uppercase tracking-wide text-[#b8562f] sm:block sm:text-xs">Concrete Quantity, Mix and Cost Calculator, Material Order Creator and Progress Dashboard</p>
              <h1 className="mt-0.5 text-xl font-black leading-tight sm:mt-1 sm:text-3xl lg:text-2xl">ConcreteMix Pro</h1>
              <p className="mt-1 text-xs font-black sm:hidden">Project total: {currency}{formatMoney(projectActualCost)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden rounded-sm bg-[#101418] px-3 py-2 text-right text-white dark:bg-white dark:text-[#101418] sm:block lg:py-1.5">
                <p className="text-[10px] font-black uppercase opacity-70">Project total</p>
                <p className="text-lg font-black leading-tight">{currency}{formatMoney(projectActualCost)}</p>
              </div>
              <a
                className="grid h-10 w-10 place-items-center rounded-md border border-black/15 bg-white text-[#101418] shadow-sm dark:border-white/15 dark:bg-[#1d211e] dark:text-white sm:h-12 sm:w-12 lg:h-9 lg:w-9 lg:rounded-sm"
                href="/help"
                aria-label="Open help"
                title="Help"
              >
                <HelpCircle size={22} />
              </a>
              <a
                className="grid h-10 w-10 place-items-center rounded-md border border-black/15 bg-white text-[#101418] shadow-sm dark:border-white/15 dark:bg-[#1d211e] dark:text-white sm:h-12 sm:w-12 lg:h-9 lg:w-9 lg:rounded-sm"
                href="/privacy"
                aria-label="Open privacy policy"
                title="Privacy"
              >
                <ShieldCheck size={22} />
              </a>
              <button
                className="grid h-10 w-10 place-items-center rounded-md border border-black/15 bg-white text-[#101418] shadow-sm dark:border-white/15 dark:bg-[#1d211e] dark:text-white sm:h-12 sm:w-12 lg:h-9 lg:w-9 lg:rounded-sm"
                onClick={() => setSettings((next) => ({ ...next, theme: next.theme === 'dark' ? 'light' : 'dark' }))}
                aria-label="Toggle theme"
              >
                {settings.theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
              </button>
            </div>
          </div>
        </header>

        <div className="min-w-0 space-y-3 sm:space-y-4">
          <Panel title="Main Calculator" description="Type a project name and press Save first. Then add a location, save it, and enter the pour size. Calculations update instantly. Use Settings at the bottom for material, cost and global values.">
            <div className="grid grid-cols-[minmax(0,1fr)_82px] gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px_90px] sm:gap-3">
              <div className="col-span-2 grid grid-cols-[minmax(0,1fr)_44px] gap-2 sm:col-span-1">
                {addingProject || savedProjects.length === 0 ? (
                  <Field label="Project Name" value={projectName} onChange={handleProjectNameChange} />
                ) : (
                  <Select
                    label="Project Name"
                    value={selectedProjectId}
                    onChange={(value) => {
                      const project = savedProjects.find((item) => item.id === value);
                      if (project) runWithUnsavedCheck(() => loadSavedInput(project));
                    }}
                    options={savedProjects.map((project) => project.id)}
                    labels={Object.fromEntries(savedProjects.map((project) => [project.id, project.name]))}
                  />
                )}
                <MiniButton label="Add project" onClick={addProject}>Add</MiniButton>
              </div>
              <div className="col-span-2 grid grid-cols-[minmax(0,1fr)_44px] gap-2 sm:col-span-1">
                {addingLocation || projectLocations.length === 0 ? (
                  <Field label="Location in project" value={locationInProject} onChange={handleLocationNameChange} disabled={!selectedProjectId && !projectName.trim()} />
                ) : (
                  <Select
                    label="Location in project"
                    value={selectedLocationId}
                    onChange={(value) => {
                      const location = projectLocations.find((item) => item.id === value);
                      if (selectedProject && location) runWithUnsavedCheck(() => loadSavedInput(selectedProject, location));
                    }}
                    options={projectLocations.map((location) => location.id)}
                    labels={Object.fromEntries(projectLocations.map((location) => [location.id, location.name]))}
                    disabled={!selectedProjectId}
                  />
                )}
                <MiniButton label="Add location" onClick={addLocation} disabled={!selectedProjectId}>Add</MiniButton>
              </div>
              <Select label="Unit" value={unit} onChange={(value) => setUnit(value as LengthUnit)} options={units} />
              <MiniButton label="Save project or location" onClick={saveProjectCurrent}>Save</MiniButton>
            </div>
            <DimensionFields shape={shape} setShape={setShape} unit={unit} dimensions={dimensions} setDimensions={setDimensions} />
            <div className="mt-3">
              <Field label="Notes" value={notes} onChange={setNotes} />
            </div>
          </Panel>

          <Panel title="Mix for This Pour" description="Choose the purpose, strength and supply for this project location. Strength and ratio are saved with each location because they may change between pours.">
            <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_120px_minmax(0,1.6fr)_130px_160px]">
              <Select
                label="Purpose"
                value={purposeChoice}
                onChange={(value) => {
                  const savedMix = customMixes.find((mix) => mix.name === value);
                  if (savedMix) {
                    setPurposeChoice(savedMix.name);
                    setPurpose('Custom');
                    setCustomPurposeName(savedMix.name);
                    setStrengthMpa(savedMix.strengthMpa);
                    setCementType(savedMix.cementType);
                    setCustomCementName(savedMix.customCementName || settings.cementTypeNames[savedMix.cementType]);
                    setCementChoice(savedMix.customCementName || settings.cementTypeNames[savedMix.cementType]);
                    setManualRatio(savedMix.ratio);
                    setManualMix(true);
                    return;
                  }
                  const nextPurpose = value as Purpose;
                  setPurposeChoice(value);
                  setPurpose(nextPurpose);
                  if (nextPurpose === 'Custom') {
                    setManualMix(true);
                    return;
                  }
                  setManualMix(false);
                }}
                options={purposeOptions}
              />
              <Select
                label={`Strength ${settings.strengthUnit}`}
                value={strengthSelectValue}
                onChange={(value) => {
                  if (value === 'Custom') {
                    setPurpose('Custom');
                    setPurposeChoice('Custom');
                    setManualMix(true);
                    return;
                  }
                  const nextMixByUnit = settings.strengthUnit === 'PSI'
                    ? strengthDatabase.find((mix) => String(mix.strengthPsi) === value)
                    : strengthDatabase.find((mix) => String(mix.strengthMpa) === value);
                  const nextStrength = nextMixByUnit?.strengthMpa ?? Number(value);
                  setStrengthMpa(nextStrength);
                  const nextMix = nextMixByUnit ?? getMixByStrength(nextStrength);
                  if (nextMix.ratio) setManualRatio(nextMix.ratio);
                  setManualMix(true);
                }}
                options={strengthOptions}
              />
              <CementTypeSelect
                label="Cement Type"
                value={cementChoice}
                onChange={(value) => {
                  const builtInType = baseCementTypes.find((type) => settings.cementTypeNames[type] === value);
                  if (builtInType) {
                    setCementChoice(value);
                    setCementType(builtInType);
                    setCustomCementName(settings.cementTypeNames[builtInType]);
                    return;
                  }
                  setCementChoice(value);
                  setCementType('Custom');
                  setCustomCementName(value);
                }}
                options={cementOptions}
                disabled={costs.readyMixEnabled}
              />
              <NumberField
                label="Additive %"
                value={costs.additivePercentOfWater}
                onChange={(value) => setCosts({ ...costs, additivePercentOfWater: value })}
                disabled={costs.readyMixEnabled}
              />
              <Select
                label="Supply"
                value={costs.readyMixEnabled ? 'Ready-mix' : 'Site mix'}
                onChange={(value) => setCosts({ ...costs, readyMixEnabled: value === 'Ready-mix' })}
                options={['Site mix', 'Ready-mix']}
              />
            </div>
            {isCustomMix && (
              <div className="mt-3">
                <Field label="Custom purpose name" value={customPurposeName} onChange={setCustomPurposeName} />
              </div>
            )}
            {isCustomMix && (
              <div className="mt-3">
                <NumberField
                  label={`Approximate custom strength ${settings.strengthUnit}`}
                  value={settings.strengthUnit === 'PSI' ? Math.round(strengthMpa * PSI_PER_MPA) : strengthMpa}
                  onChange={(value) => setStrengthMpa(settings.strengthUnit === 'PSI' ? value / PSI_PER_MPA : value)}
                />
              </div>
            )}
            <div className="mt-3 rounded-md border border-black/10 bg-[#eef1e8] p-3 dark:border-white/10 dark:bg-[#20251f]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1 text-sm">
                  <p className="font-black">
                    {isCustomMix ? customPurposeName : selectedMix.label} / {isCustomMix ? `${formatStrength(approximateCustomStrength?.strengthMpa ?? strengthMpa, settings.strengthUnit)} approximate custom` : formatStrength(strengthMpa, settings.strengthUnit)}
                  </p>
                  {!costs.readyMixEnabled && <p className="font-bold">Mix ratio: {formatRatio(ratio)}</p>}
                  {!costs.readyMixEnabled && <p className="text-xs font-black uppercase text-black/55 dark:text-white/55">Cement : Sand : Stone</p>}
                  {!costs.readyMixEnabled && <p className="font-bold">Water: {waterDisplay.value} {waterDisplay.unit} at w/c {settings.waterCementRatio}</p>}
                  {approximateCustomStrength && (
                    <p className="rounded-md bg-[#fff4ea] p-2 font-bold text-[#8a3b1d] dark:bg-[#311f18] dark:text-[#ffbd91]">
                      Approximate ratio only: similar to about {formatStrength(approximateCustomStrength.strengthMpa, settings.strengthUnit)}. Not substantiated. Custom mixes depend on water, aggregate, cement, additives, curing and site practice.
                    </p>
                  )}
                  <p className="text-black/70 dark:text-white/70">{costs.readyMixEnabled ? 'Ready-mix mode uses the calculated wet volume plus wastage for delivered concrete cost.' : isCustomMix ? 'User-defined concrete mix.' : selectedMix.typicalUse}</p>
                  {!costs.readyMixEnabled && <p className="text-black/70 dark:text-white/70">
                    {customCementName} - {cementType === 'Custom' ? 'User-defined cement, no Type I-V technical description applied.' : cementDescriptions[cementType]}
                  </p>}
                  {!isCustomMix && !selectedMix.ratio && <p className="font-bold text-[#b8562f]">Uses a provisional 1 : 1 : 2 quantity estimate until a verified design mix is entered.</p>}
                </div>
                {!costs.readyMixEnabled && <button className="min-h-11 rounded-md bg-[#1f7a5a] px-4 font-black text-white lg:min-h-8 lg:rounded-sm lg:border lg:border-[#6f7b85] lg:bg-[#e9edf0] lg:px-3 lg:text-sm lg:text-[#101418] lg:shadow-sm lg:hover:bg-[#dce3e8] lg:active:bg-[#cfd8de] lg:dark:border-white/20 lg:dark:bg-[#252a2f] lg:dark:text-white lg:dark:hover:bg-[#30363c]" onClick={() => setManualMix((value) => !value)}>
                  {manualMix ? 'Done' : 'Edit ratio'}
                </button>}
              </div>
              {manualMix && !costs.readyMixEnabled && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {manualRatio.map((part, index) => (
                    <NumberField
                      key={index}
                      label={['Cement', 'Sand', 'Stone'][index]}
                      value={part}
                      onChange={(value) => {
                        const nextRatio = manualRatio.map((item, i) => (i === index ? value : item)) as [number, number, number];
                        setManualRatio(nextRatio);
                        setPurpose('Custom');
                        setPurposeChoice('Custom');
                        setManualMix(true);
                        const estimate = estimateStrengthFromRatio(nextRatio);
                        if (estimate) setStrengthMpa(estimate.strengthMpa);
                      }}
                    />
                  ))}
                </div>
              )}
              {isCustomMix && (
                <button className="mt-3 min-h-11 w-full rounded-md bg-[#1f7a5a] px-4 font-black text-white active:bg-[#2f9f75] lg:min-h-8 lg:rounded-sm lg:border lg:border-[#6f7b85] lg:bg-[#e9edf0] lg:text-sm lg:text-[#101418] lg:shadow-sm lg:hover:bg-[#dce3e8] lg:active:bg-[#cfd8de] lg:dark:border-white/20 lg:dark:bg-[#252a2f] lg:dark:text-white lg:dark:hover:bg-[#30363c]" onClick={saveCustomCurrent}>
                  SAVE CUSTOM
                </button>
              )}
            </div>
          </Panel>

          <Panel title="Materials" action={<Badge>{formatRatio(ratio)}</Badge>}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Metric label="Cement" value={round(result.materials.cementKg, 1)} unit="kg" sub={`${round(result.materials.cementBags, 1)} bags`} />
              <Metric label="Sand" value={round(result.materials.sandM3, 3)} unit="m3" sub={`${round(result.materials.sandKg, 0)} kg`} />
              <Metric label="Aggregate" value={round(result.materials.aggregateM3, 3)} unit="m3" sub={`${round(result.materials.aggregateKg, 0)} kg`} />
              <Metric label="Water" value={waterDisplay.value} unit={waterDisplay.unit} sub={`w/c ${settings.waterCementRatio}`} />
              <Metric label={costs.otherName || 'Additive'} value={additiveDisplay.value} unit={additiveDisplay.unit} sub={`${round(result.materials.additiveContainers, 2)} containers`} />
            </div>
            {settings.unitSystem === 'imperial' && (
              <p className="mt-3 text-sm font-semibold text-black/65 dark:text-white/70">
                Imperial weights: cement {round(kgToPounds(result.materials.cementKg), 0)} lb, sand {round(kgToPounds(result.materials.sandKg), 0)} lb, aggregate {round(kgToPounds(result.materials.aggregateKg), 0)} lb.
              </p>
            )}
          </Panel>

          <Panel title="Costs">
            <div className="grid grid-cols-2 gap-2 text-center text-sm font-bold sm:grid-cols-4">
              {costs.readyMixEnabled ? (
                <>
                  <SummaryPill label="Ready-mix" value={`${currency}${formatMoney(result.costs.readyMixCost)}`} />
                  <SummaryPill label="Volume" value={`${round(result.wetVolumeM3 * (1 + settings.wastagePercent / 100), 2)} m3`} />
                  <SummaryPill label="Rate" value={`${currency}${formatMoney(costs.readyMixPerM3)} / m3`} />
                  <SummaryPill label="Wastage" value={`${settings.wastagePercent}%`} />
                </>
              ) : (
                <>
                  <SummaryPill label="Cement" value={`${currency}${formatMoney(result.costs.cementCost)}`} />
                  <SummaryPill label="Sand" value={`${currency}${formatMoney(result.costs.sandCost)}`} />
                  <SummaryPill label="Stone" value={`${currency}${formatMoney(result.costs.aggregateCost)}`} />
                  <SummaryPill label={costs.otherName || 'Additive'} value={`${currency}${formatMoney(result.costs.otherCost)}`} />
                </>
              )}
            </div>
            <p className="mt-3 text-sm font-semibold text-black/65 dark:text-white/70">Cost rates are set in Settings so they stay saved for the next calculation. Ready-mix mode prices delivered concrete by volume.</p>
          </Panel>

          <Panel title="Current Pour">
            <div className="grid grid-cols-2 gap-2 text-center text-sm font-bold sm:grid-cols-4">
              <SummaryPill label="Wet volume" value={`${round(result.wetVolumeM3, 3)} m3`} />
              <SummaryPill label="Dry volume" value={`${round(result.dryVolumeM3, 3)} m3`} />
              <SummaryPill label="Strength" value={formatStrength(strengthMpa, settings.strengthUnit)} />
              <SummaryPill label="Actual cost" value={`${currency}${formatMoney(result.costs.total)}`} />
            </div>
          </Panel>

          {result.warnings.length > 0 && (
            <Panel title="Warnings" action={<AlertTriangle size={20} className="text-[#b8562f]" />}>
              <div className="space-y-2 text-sm font-semibold">
                {result.warnings.map((warning) => (
                  <p key={warning} className="rounded-md border border-[#b8562f]/30 bg-[#fff4ea] p-3 dark:bg-[#311f18] lg:rounded-sm lg:p-2">{warning}</p>
                ))}
              </div>
            </Panel>
          )}

          <Panel title="Progress & Order Status Dashboard" description="Select Material rows for the status section and amber order items for the shopping list section. Save and Share use those selections.">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px_150px_150px]">
              <Select
                label="Project"
                value={selectedProjectId}
                onChange={(value) => {
                  const project = savedProjects.find((item) => item.id === value);
                  if (project) runWithUnsavedCheck(() => loadSavedInput(project));
                }}
                options={savedProjects.map((project) => project.id)}
                labels={Object.fromEntries(savedProjects.map((project) => [project.id, project.name]))}
                disabled={savedProjects.length === 0}
              />
              <SummaryPill label="Project actual cost" value={`${currency}${formatMoney(projectActualCost)}`} />
              <SummaryPill label="Material rows" value={`${selectedOrderLocationIds.length}`} />
              <SummaryPill label="Order items" value={`${pendingMaterialOrderLocations.length}`} />
            </div>

            {selectedProject ? (
              <>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-black/65 dark:text-white/70">
                  <span>{pendingMaterialOrderLocations.length} locations with pending order items | {projectLocations.filter((location) => location.completedAt).length} poured</span>
                  <span className="flex gap-2">
                    <button className="rounded-md bg-black/5 px-3 py-2 font-black text-[#1f7a5a] dark:bg-white/10 lg:rounded-sm lg:border lg:border-[#6f7b85] lg:bg-[#e9edf0] lg:py-1.5 lg:text-sm lg:text-[#101418] lg:shadow-sm lg:hover:bg-[#dce3e8] lg:dark:border-white/20 lg:dark:bg-[#252a2f] lg:dark:text-white" onClick={selectAllOrderLocations}>Select all</button>
                    <button className="rounded-md bg-black/5 px-3 py-2 font-black text-[#b8562f] dark:bg-white/10 lg:rounded-sm lg:border lg:border-[#6f7b85] lg:bg-[#e9edf0] lg:py-1.5 lg:text-sm lg:text-[#101418] lg:shadow-sm lg:hover:bg-[#dce3e8] lg:dark:border-white/20 lg:dark:bg-[#252a2f] lg:dark:text-white" onClick={clearOrderLocations}>Clear</button>
                  </span>
                </div>
                <div className="mt-3 overflow-hidden rounded-md border border-black/10 bg-white text-sm font-semibold dark:border-white/10 dark:bg-[#121412]">
                  <div className="hidden grid-cols-[64px_minmax(180px,1fr)_88px_92px_56px_56px_56px_56px_70px_56px_84px_235px] items-center gap-2 bg-black/5 px-3 py-2 text-[9.5px] font-black uppercase leading-tight text-black/55 dark:bg-white/10 dark:text-white/60 sm:grid">
                    <span>Material</span>
                    <span>Location</span>
                    <span>Wet vol</span>
                          <span>Strength</span>
                    <span className="text-center">Mix</span>
                    <span className="text-center">CEMENT</span>
                    <span className="text-center">SAND</span>
                    <span className="text-center">STONE</span>
                    <span className="text-center">ADDITIVE</span>
                    <span className="text-center">Pour</span>
                    <span>Progress</span>
                    <span>Cost</span>
                  </div>
                  <div className="max-h-72 overflow-auto">
                    {dashboardSummaries.map(({ location, result: locationResult }) => {
                      const selected = selectedOrderLocationIds.includes(location.id);
                      const progressPercent = location.progressPercent ?? (location.completedAt ? 100 : 0);
                      return (
                        <div key={location.id} className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2 border-t border-black/10 px-3 py-2 dark:border-white/10 sm:grid-cols-[64px_minmax(180px,1fr)_88px_92px_56px_56px_56px_56px_70px_56px_84px_235px] sm:gap-2">
                          <button
                            className={`grid h-7 w-7 place-items-center rounded-full border-2 bg-white text-[#101418] dark:bg-[#121412] lg:h-4 lg:w-4 lg:rounded-none lg:border lg:bg-white lg:shadow-inner lg:dark:bg-[#171a1d] ${selected ? 'border-[#1f7a5a] lg:border-[#101418] lg:dark:border-white' : 'border-black/25 dark:border-white/35 lg:border-[#6f7b85]'}`}
                            type="button"
                            onClick={() => toggleOrderLocation(location.id)}
                            aria-label={selected ? `Remove ${location.name} from PDF` : `Include ${location.name} on PDF`}
                            title={selected ? 'Selected for PDF' : 'Not selected for PDF'}
                          >
                            <span className={`h-3 w-3 rounded-full lg:hidden ${selected ? 'bg-[#1f7a5a]' : 'bg-transparent'}`} />
                            <span className={`hidden text-[13px] leading-none lg:block ${selected ? 'text-[#101418] dark:text-white' : 'text-transparent'}`}>✓</span>
                          </button>
                          <div className="min-w-0">
                            <p className="truncate font-black">{location.name}</p>
                            <p className="text-xs text-black/55 dark:text-white/60 sm:hidden">{currency}{formatMoney(locationResult.costs.total)}</p>
                          </div>
                          <span className="hidden truncate text-xs font-black sm:block">{formatDashboardVolume(locationResult, settings.unitSystem)}</span>
                          <span className="hidden truncate text-xs font-black sm:block">{formatStrength(location.input.strengthMpa, location.input.settings.strengthUnit)}</span>
                          <div className="col-span-3 flex flex-wrap items-center gap-1.5 sm:contents">
                            {location.input.costs.readyMixEnabled ? (
                              <button
                                className={`grid h-8 w-8 place-items-center rounded-full text-[9px] font-black text-white sm:h-9 sm:w-9 sm:text-[10px] lg:h-6 lg:w-6 lg:justify-self-center lg:text-[7px] ${materialOrderStatusClass(getMaterialOrderStatus(location, 'readyMix'))}`}
                                type="button"
                                onClick={() => cycleMaterialOrderStatus(location.id, 'readyMix')}
                                title={`PREMIX: ${materialOrderStatusLabel(getMaterialOrderStatus(location, 'readyMix'))}. Click to change.`}
                              >
                                PRE
                              </button>
                            ) : (
                              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#101418] text-[8px] font-black text-white dark:bg-white dark:text-[#101418] sm:h-9 sm:w-9 sm:text-[10px] lg:h-6 lg:w-6 lg:justify-self-center lg:text-[6px]">SITE</span>
                            )}
                            {materialOrderItems.map((item) => (
                              <button
                                key={item.id}
                                className={`grid h-8 w-8 place-items-center rounded-full text-[9px] font-black text-white sm:h-9 sm:w-9 sm:text-[10px] lg:h-6 lg:w-6 lg:justify-self-center lg:text-[7px] ${location.input.costs.readyMixEnabled ? 'cursor-not-allowed bg-black/20 text-black/35 dark:bg-white/15 dark:text-white/35' : materialOrderStatusClass(getMaterialOrderStatus(location, item.id))}`}
                                type="button"
                                disabled={location.input.costs.readyMixEnabled}
                                onClick={() => cycleMaterialOrderStatus(location.id, item.id)}
                                aria-label={`${item.label} ${materialOrderStatusLabel(getMaterialOrderStatus(location, item.id))}`}
                                title={location.input.costs.readyMixEnabled ? 'Premix location uses the PRE order status.' : `${item.label}: ${materialOrderStatusLabel(getMaterialOrderStatus(location, item.id))}. Click to change.`}
                              >
                                {materialOrderShortLabel(item.id)}
                              </button>
                            ))}
                            <span
                              className={`grid h-8 w-8 place-items-center rounded-full text-[10px] font-black text-white sm:h-9 sm:w-9 sm:text-[11px] lg:h-6 lg:w-6 lg:justify-self-center lg:text-[8px] ${pourProgressClass(progressPercent)}`}
                              aria-label={`Pour progress ${progressPercent}%`}
                              title={`Pour progress ${progressPercent}%`}
                            >
                              P
                            </span>
                          </div>
                          <div className="col-span-3 sm:col-span-1">
                            <NumberField
                              label=""
                              value={progressPercent}
                              onChange={(value) => setLocationProgress(location.id, value)}
                              suffix="%"
                            />
                          </div>
                          <span className="hidden truncate text-left font-black sm:block">{currency}{formatMoney(locationResult.costs.total)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-3 rounded-md border border-black/10 bg-white p-3 text-sm font-semibold text-black/65 dark:border-white/10 dark:bg-[#121412] dark:text-white/70">
                Save a project and location first. Until then Save and Share create a PDF for the current calculation only.
              </p>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Action icon={<Save size={18} />} label={hasPendingMaterialOrder ? 'Save Order' : 'Save'} onClick={saveDashboardPdf} />
              <Action icon={<Share2 size={18} />} label={hasPendingMaterialOrder ? 'Share Order' : 'Share'} onClick={shareDashboardPdf} />
            </div>
            <p className="mt-2 text-xs font-bold text-black/55 dark:text-white/60">
              Red means not ordered, amber means on the next order PDF, and green means received. When any material is amber, Save and Share create an order PDF from amber items only.
            </p>
          </Panel>

          <Panel title="Settings" action={<button className="rounded-md px-2 py-1 text-sm font-black text-[#1f7a5a] lg:rounded-sm lg:border lg:border-[#6f7b85] lg:bg-[#e9edf0] lg:text-xs lg:text-[#101418] lg:shadow-sm lg:hover:bg-[#dce3e8] lg:dark:border-white/20 lg:dark:bg-[#252a2f] lg:dark:text-white" onClick={() => setOpenSettings((value) => !value)}>{openSettings ? 'Hide' : 'Edit'}</button>}>
            {openSettings && <SettingsEditor settings={settings} setSettings={setSettings} setUnit={setUnit} costs={costs} setCosts={setCosts} currency={currency} onClearSelected={clearSelectedData} onBackupRestored={() => window.location.reload()} />}
          </Panel>
        </div>

        <div className="hidden lg:block" aria-hidden="true" />
      </div>
      {showUnsavedPrompt && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4">
          <div className="w-full max-w-sm rounded-lg border border-black/10 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-[#191d1a]">
            <h2 className="text-lg font-black">Save project?</h2>
            <p className="mt-2 text-sm font-semibold text-black/65 dark:text-white/70">
              Do you want to save project "{projectName || 'Concrete project'}" before creating or loading another record?
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button className="min-h-11 rounded-md border border-black/15 px-3 font-black dark:border-white/15 lg:min-h-8 lg:rounded-sm lg:border-[#6f7b85] lg:bg-[#e9edf0] lg:text-sm lg:text-[#101418] lg:shadow-sm lg:hover:bg-[#dce3e8] lg:dark:border-white/20 lg:dark:bg-[#252a2f] lg:dark:text-white" onClick={cancelPendingAction}>Cancel</button>
              <button className="min-h-11 rounded-md bg-[#b8562f] px-3 font-black text-white lg:min-h-8 lg:rounded-sm lg:border lg:border-[#6f7b85] lg:bg-[#e9edf0] lg:text-sm lg:text-[#101418] lg:shadow-sm lg:hover:bg-[#dce3e8] lg:dark:border-white/20 lg:dark:bg-[#252a2f] lg:dark:text-white" onClick={discardBeforeAction}>No</button>
              <button className="min-h-11 rounded-md bg-[#1f7a5a] px-3 font-black text-white lg:min-h-8 lg:rounded-sm lg:border lg:border-[#6f7b85] lg:bg-[#e9edf0] lg:text-sm lg:text-[#101418] lg:shadow-sm lg:hover:bg-[#dce3e8] lg:dark:border-white/20 lg:dark:bg-[#252a2f] lg:dark:text-white" onClick={confirmSaveBeforeAction}>Yes</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function DimensionFields({ shape, setShape, unit, dimensions, setDimensions }: { shape: Shape; setShape: (next: Shape) => void; unit: LengthUnit; dimensions: Dimensions; setDimensions: (next: Dimensions) => void }) {
  const update = (key: keyof Dimensions, value: number) => setDimensions({ ...dimensions, [key]: value });
  const shapeSelect = (
    <Select
      label="Shape"
      value={shape}
      onChange={(value) => setShape(value as Shape)}
      options={shapes.map((item) => item.id)}
      labels={Object.fromEntries(shapes.map((item) => [item.id, item.label]))}
    />
  );
  if (shape === 'custom') return <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">{shapeSelect}<NumberField label="Volume m3" value={dimensions.customVolume} onChange={(value) => update('customVolume', value)} /></div>;
  if (shape === 'circle') return <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">{shapeSelect}<NumberField label={`Diameter (${unit})`} value={dimensions.diameter} onChange={(value) => update('diameter', value)} /><NumberField label={`Depth (${unit})`} value={dimensions.depth} onChange={(value) => update('depth', value)} /></div>;
  if (shape === 'column') return <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">{shapeSelect}<NumberField label={`Diameter (${unit})`} value={dimensions.diameter} onChange={(value) => update('diameter', value)} /><NumberField label={`Height (${unit})`} value={dimensions.height} onChange={(value) => update('height', value)} /></div>;
  if (shape === 'stair') return <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">{shapeSelect}<NumberField label={`Width (${unit})`} value={dimensions.width} onChange={(value) => update('width', value)} /><NumberField label="Steps" value={dimensions.steps} onChange={(value) => update('steps', value)} /><NumberField label={`Rise (${unit})`} value={dimensions.rise} onChange={(value) => update('rise', value)} /><NumberField label={`Run (${unit})`} value={dimensions.run} onChange={(value) => update('run', value)} /></div>;
  return <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">{shapeSelect}<NumberField label={`Length (${unit})`} value={dimensions.length} onChange={(value) => update('length', value)} /><NumberField label={`Width (${unit})`} value={dimensions.width} onChange={(value) => update('width', value)} /><NumberField label={`Depth (${unit})`} value={dimensions.depth} onChange={(value) => update('depth', value)} /></div>;
}

function SettingsEditor({
  settings,
  setSettings,
  setUnit,
  costs,
  setCosts,
  currency,
  onClearSelected,
  onBackupRestored
}: {
  settings: Settings;
  setSettings: (next: Settings) => void;
  setUnit: (unit: LengthUnit) => void;
  costs: Costs;
  setCosts: (next: Costs) => void;
  currency: string;
  onClearSelected: (options: ClearDataOptions) => void;
  onBackupRestored: () => void;
}) {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings({ ...settings, [key]: value });
  const [clearOptions, setClearOptions] = useState<ClearDataOptions>({
    projects: false,
    currentLocation: false,
    calculations: false,
    customMixes: false,
    cementTypes: false,
    costs: false,
    global: false
  });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Material: true,
    Cost: false,
    Global: false,
    Data: false
  });
  const toggleGroup = (title: string) => {
    setOpenGroups((next) => ({ ...next, [title]: !next[title] }));
  };
  const allClearOptionsSelected = Object.values(clearOptions).every(Boolean);
  const anyClearOptionSelected = Object.values(clearOptions).some(Boolean);
  const updateClearOption = (key: keyof ClearDataOptions, value: boolean) => {
    setClearOptions((next) => ({ ...next, [key]: value }));
  };
  const setAllClearOptions = (value: boolean) => {
    setClearOptions({
      projects: value,
      currentLocation: value,
      calculations: value,
      customMixes: value,
      cementTypes: value,
      costs: value,
      global: value
    });
  };
  const deleteSelectedData = () => {
    onClearSelected(clearOptions);
    setAllClearOptions(false);
  };
  const saveCustomCementType = () => {
    const name = settings.cementTypeNames.Custom.trim();
    if (!isSavedCustomCement(name)) return;
    const nextCustomCements = [
      {
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name,
        costPerBag: costs.cementPerBagByType.Custom,
        updatedAt: new Date().toISOString()
      },
      ...costs.customCements.filter((cement) => isSavedCustomCement(cement.name) && cement.name.toLowerCase() !== name.toLowerCase())
    ].slice(0, 30);
    setCosts({
      ...costs,
      customCements: nextCustomCements,
      cementPerBagByType: { ...costs.cementPerBagByType, Custom: 0 }
    });
    update('cementTypeNames', { ...settings.cementTypeNames, Custom: 'Custom cement' });
  };
  const exportBackup = () => {
    const backup = createBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `concretemix-pro-backup-${date}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };
  const importBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const backup = JSON.parse(await file.text()) as ConcreteBackup;
        const confirmed = window.confirm('Import this ConcreteMix Pro backup? This will replace saved projects, settings, costs and custom mixes on this device.');
        if (!confirmed) return;
        restoreBackup(backup);
        onBackupRestored();
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Could not import this backup file.');
      }
    };
    input.click();
  };
  return (
    <div className="mt-3 space-y-4">
      <SettingsGroup title="Material" open={openGroups.Material} onToggle={() => toggleGroup('Material')}>
        <Select label="Bag size" value={String(settings.bagSize)} onChange={(value) => update('bagSize', Number(value) as BagSize)} options={['25', '42.5', '50']} suffix="kg" />
        <NumberField label="Wastage %" value={settings.wastagePercent} onChange={(value) => update('wastagePercent', value)} />
        <NumberField label="Water-cement ratio" value={settings.waterCementRatio} onChange={(value) => update('waterCementRatio', value)} />
        <p className="text-sm font-semibold text-black/60 dark:text-white/65 sm:col-span-2">
          Example: 0.50 means 50 L water per 100 kg cement.
        </p>
      </SettingsGroup>

      <SettingsGroup title="Cost" open={openGroups.Cost} onToggle={() => toggleGroup('Cost')}>
        {baseCementTypes.map((type) => (
          <div key={type} className="grid gap-2 sm:col-span-2 sm:grid-cols-[minmax(0,1fr)_150px]">
            <CompactField
              ariaLabel={`${type} name`}
              value={settings.cementTypeNames[type]}
              onChange={(value) => update('cementTypeNames', { ...settings.cementTypeNames, [type]: value })}
            />
            <CompactNumberField
              ariaLabel={`${type} cost per bag`}
              value={costs.cementPerBagByType[type]}
              onChange={(value) => setCosts({ ...costs, cementPerBagByType: { ...costs.cementPerBagByType, [type]: value } })}
              prefix={currency}
              money
            />
          </div>
        ))}
        {costs.customCements.filter((cement) => isSavedCustomCement(cement.name)).map((cement) => (
          <div key={cement.id} className="grid gap-2 sm:col-span-2 sm:grid-cols-[minmax(0,1fr)_150px]">
            <CompactField
              ariaLabel="Saved cement name"
              value={cement.name}
              onChange={(value) => setCosts({
                ...costs,
                customCements: costs.customCements.map((item) => item.id === cement.id ? { ...item, name: value, updatedAt: new Date().toISOString() } : item)
              })}
            />
            <CompactNumberField
              ariaLabel="Saved cement cost per bag"
              value={cement.costPerBag}
              onChange={(value) => setCosts({
                ...costs,
                customCements: costs.customCements.map((item) => item.id === cement.id ? { ...item, costPerBag: value, updatedAt: new Date().toISOString() } : item)
              })}
              prefix={currency}
              money
            />
          </div>
        ))}
        <div className="grid gap-2 sm:col-span-2 sm:grid-cols-[minmax(0,1fr)_150px]">
          <CompactField
            ariaLabel="Custom cement name"
            value={settings.cementTypeNames.Custom}
            onChange={(value) => update('cementTypeNames', { ...settings.cementTypeNames, Custom: value })}
          />
          <MiniButton label="Save cement type" onClick={saveCustomCementType} compact>Save</MiniButton>
        </div>
        <NumberField label="Sand / m3" value={costs.sandPerM3} onChange={(value) => setCosts({ ...costs, sandPerM3: value })} prefix={currency} money />
        <NumberField label="Stone / m3" value={costs.aggregatePerM3} onChange={(value) => setCosts({ ...costs, aggregatePerM3: value })} prefix={currency} money />
        <NumberField label="Ready-mix / m3" value={costs.readyMixPerM3} onChange={(value) => setCosts({ ...costs, readyMixPerM3: value })} prefix={currency} money />
        <Field label="Additive name" value={costs.otherName} onChange={(value) => setCosts({ ...costs, otherName: value })} />
        <NumberField label="Additive cost / container" value={costs.additiveContainerCost} onChange={(value) => setCosts({ ...costs, additiveContainerCost: value })} prefix={currency} money />
        <NumberField label="Container size" value={costs.additiveContainerSize} onChange={(value) => setCosts({ ...costs, additiveContainerSize: value })} />
        <Select label="Container unit" value={costs.additiveUnit} onChange={(value) => setCosts({ ...costs, additiveUnit: value as AdditiveUnit })} options={additiveUnits} />
      </SettingsGroup>

      <SettingsGroup title="Global" open={openGroups.Global} onToggle={() => toggleGroup('Global')}>
        <Select label="Unit system" value={settings.unitSystem} onChange={(value) => update('unitSystem', value as Settings['unitSystem'])} options={['metric', 'imperial']} />
        <Select label="Default unit" value={settings.defaultUnit} onChange={(value) => { update('defaultUnit', value as LengthUnit); setUnit(value as LengthUnit); }} options={units} />
        <Select label="Strength unit" value={settings.strengthUnit} onChange={(value) => update('strengthUnit', value as Settings['strengthUnit'])} options={['MPa', 'PSI']} />
        <Field label="Currency" value={settings.currencySymbol} onChange={(value) => update('currencySymbol', value)} />
      </SettingsGroup>

      <SettingsGroup title="Data" open={openGroups.Data} onToggle={() => toggleGroup('Data')}>
        <div className="sm:col-span-2 rounded-md border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-[#121412]">
          <p className="text-sm font-black">Local backup transfer</p>
          <p className="mt-1 text-sm font-semibold text-black/60 dark:text-white/65">
            Export a backup on one device, move the JSON file by USB, email, WhatsApp or Quick Share, then import it on another device. No cloud account is used.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="min-h-11 rounded-md bg-[#1f7a5a] px-3 text-sm font-black text-white active:bg-[#2f9f75] lg:min-h-8 lg:rounded-sm lg:border lg:border-[#6f7b85] lg:bg-[#e9edf0] lg:text-[13px] lg:text-[#101418] lg:shadow-sm lg:hover:bg-[#dce3e8] lg:dark:border-white/20 lg:dark:bg-[#252a2f] lg:dark:text-white" onClick={exportBackup}>Export Backup</button>
            <button className="min-h-11 rounded-md bg-[#1f7a5a] px-3 text-sm font-black text-white active:bg-[#2f9f75] lg:min-h-8 lg:rounded-sm lg:border lg:border-[#6f7b85] lg:bg-[#e9edf0] lg:text-[13px] lg:text-[#101418] lg:shadow-sm lg:hover:bg-[#dce3e8] lg:dark:border-white/20 lg:dark:bg-[#252a2f] lg:dark:text-white" onClick={importBackup}>Import Backup</button>
          </div>
        </div>
        <ClearCheck label="Saved projects" checked={clearOptions.projects} onChange={(value) => updateClearOption('projects', value)} />
        <ClearCheck label="Current location in project" checked={clearOptions.currentLocation} onChange={(value) => updateClearOption('currentLocation', value)} />
        <ClearCheck label="Saved calculations" checked={clearOptions.calculations} onChange={(value) => updateClearOption('calculations', value)} />
        <ClearCheck label="Custom mixes" checked={clearOptions.customMixes} onChange={(value) => updateClearOption('customMixes', value)} />
        <ClearCheck label="Custom cement types" checked={clearOptions.cementTypes} onChange={(value) => updateClearOption('cementTypes', value)} />
        <ClearCheck label="Costs" checked={clearOptions.costs} onChange={(value) => updateClearOption('costs', value)} />
        <ClearCheck label="Global" checked={clearOptions.global} onChange={(value) => updateClearOption('global', value)} />
        <div className="sm:col-span-2 rounded-md border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-[#121412]">
          <ClearCheck label="ALL" checked={allClearOptionsSelected} onChange={setAllClearOptions} />
          <button
            className={`mt-3 min-h-11 w-full rounded-md px-4 font-black text-white lg:min-h-8 lg:rounded-sm lg:border lg:px-3 lg:text-[13px] lg:shadow-sm ${anyClearOptionSelected ? 'bg-[#b8562f] active:bg-[#d46b3f] lg:border-[#6f7b85] lg:bg-[#e9edf0] lg:text-[#101418] lg:hover:bg-[#dce3e8] lg:dark:border-white/20 lg:dark:bg-[#252a2f] lg:dark:text-white' : 'cursor-not-allowed bg-black/20 dark:bg-white/20 lg:border-[#b8c0c7] lg:bg-[#edf0f2] lg:text-black/35 lg:dark:bg-white/10 lg:dark:text-white/35'}`}
            onClick={deleteSelectedData}
            disabled={!anyClearOptionSelected}
          >
            CLEAR SELECTED
          </button>
          <p className="mt-2 text-sm font-semibold text-black/60 dark:text-white/65">Deletes only the ticked data from this device.</p>
        </div>
      </SettingsGroup>
    </div>
  );
}

function Panel({ children, title, description, action, emphasis = false }: { children: ReactNode; title: string; description?: string; action?: ReactNode; emphasis?: boolean }) {
  return (
    <section className={`rounded-md border p-3 shadow-sm sm:p-4 lg:rounded-sm lg:p-3 lg:shadow-none ${emphasis ? 'border-[#1f7a5a] bg-[#e5efe6] dark:bg-[#18261f]' : 'border-black/10 bg-white dark:border-white/10 dark:bg-[#191d1a] lg:border-[#b8c0c7] lg:bg-[#fbfcfd] lg:dark:border-white/10 lg:dark:bg-[#171a1d]'}`}>
      <div className="mb-2 flex items-start justify-between gap-2 sm:mb-3 sm:gap-3 lg:mb-2">
        <div>
          <h2 className="text-base font-black leading-tight sm:text-lg lg:text-[15px] lg:uppercase lg:tracking-wide">{title}</h2>
          {description && <p className="mt-1 hidden text-xs font-semibold leading-snug text-black/55 dark:text-white/60 sm:block sm:text-sm">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

function SettingsGroup({ title, children, open = true, onToggle }: { title: string; children: ReactNode; open?: boolean; onToggle?: () => void }) {
  return (
    <div className="rounded-md border border-black/10 bg-black/[0.03] p-2.5 dark:border-white/10 dark:bg-white/[0.04] sm:p-3">
      <button className="flex min-h-10 w-full items-center justify-between text-left" onClick={onToggle} type="button">
        <h3 className="text-sm font-black uppercase text-[#b8562f]">{title}</h3>
        <span className="text-sm font-black text-black/45 dark:text-white/50">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && <div className="mt-2 grid gap-2 sm:mt-3 sm:gap-3 sm:grid-cols-2">{children}</div>}
    </div>
  );
}

function ClearCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-11 items-center gap-3 rounded-md border border-black/10 bg-white px-3 text-sm font-black dark:border-white/10 dark:bg-[#121412] lg:min-h-8 lg:rounded-sm lg:border-[#b8c0c7] lg:px-2 lg:text-[13px] lg:font-semibold">
      <input
        className="h-5 w-5 accent-[#1f7a5a] lg:h-4 lg:w-4"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function Field({ label, value, onChange, disabled = false }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return <label className={`block text-xs font-bold sm:text-sm lg:text-xs lg:font-semibold ${disabled ? 'text-black/35 dark:text-white/35' : 'text-black/70 dark:text-white/70 lg:text-[#1f2326]'}`}>{label}<input className={`mt-1 h-11 w-full rounded-md border px-2.5 text-sm font-bold outline-none focus:border-[#1f7a5a] sm:h-12 sm:px-3 sm:text-base lg:h-8 lg:rounded-none lg:px-2 lg:text-[13px] lg:font-semibold lg:shadow-inner ${disabled ? 'border-black/10 bg-black/[0.04] text-black/40 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/40' : 'border-black/15 bg-white text-[#101418] dark:border-white/15 dark:bg-[#121412] dark:text-white lg:border-[#8f9aa3]'}`} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} /></label>;
}

function NumberField({ label, value, onChange, prefix = '', suffix = '', money = false, disabled = false }: { label: string; value: number; onChange: (value: number) => void; prefix?: string; suffix?: string; money?: boolean; disabled?: boolean }) {
  const formatValue = (next: number) => (money ? next.toFixed(2) : String(Number.isFinite(next) ? next : 0));
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(formatValue(Number.isFinite(value) ? value : 0));

  useEffect(() => {
    if (!focused) setDraft(formatValue(Number.isFinite(value) ? value : 0));
  }, [focused, money, value]);

  return (
    <label className={`block text-xs font-bold sm:text-sm lg:text-xs lg:font-semibold ${disabled ? 'text-black/35 dark:text-white/35' : 'text-black/70 dark:text-white/70 lg:text-[#1f2326]'}`}>
      {label}
      <span className={`mt-1 flex h-11 items-center rounded-md border px-2 focus-within:border-[#1f7a5a] sm:h-12 lg:h-8 lg:rounded-none lg:shadow-inner ${disabled ? 'border-black/10 bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.04]' : 'border-black/15 bg-white dark:border-white/15 dark:bg-[#121412] lg:border-[#8f9aa3]'}`}>
        {prefix && <span className="pr-1 text-black/50 dark:text-white/60">{prefix}</span>}
        <input
          className="w-full bg-transparent text-sm font-bold text-[#101418] outline-none dark:text-white sm:text-base lg:text-[13px] lg:font-semibold"
          inputMode="decimal"
          value={draft}
          disabled={disabled}
          onFocus={() => {
            setFocused(true);
            if (value === 0) setDraft('');
          }}
          onBlur={() => {
            setFocused(false);
            const parsed = Number(draft);
            const nextValue = draft.trim() === '' || !Number.isFinite(parsed) ? 0 : parsed;
            onChange(nextValue);
            setDraft(formatValue(nextValue));
          }}
          onChange={(event) => {
            setDraft(event.target.value);
            onChange(Number(event.target.value) || 0);
          }}
        />
        {suffix && <span className="pl-1 text-black/50 dark:text-white/60">{suffix}</span>}
      </span>
    </label>
  );
}

function CompactField({ ariaLabel, value, onChange }: { ariaLabel: string; value: string; onChange: (value: string) => void }) {
  return (
    <input
      aria-label={ariaLabel}
      className="h-11 w-full rounded-md border border-black/15 bg-white px-2.5 text-sm font-bold text-[#101418] outline-none focus:border-[#1f7a5a] dark:border-white/15 dark:bg-[#121412] dark:text-white sm:px-3 sm:text-base lg:h-8 lg:rounded-none lg:border-[#8f9aa3] lg:px-2 lg:text-[13px] lg:font-semibold lg:shadow-inner"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function CompactNumberField({ ariaLabel, value, onChange, prefix = '', money = false }: { ariaLabel: string; value: number; onChange: (value: number) => void; prefix?: string; money?: boolean }) {
  const formatValue = (next: number) => (money ? next.toFixed(2) : String(Number.isFinite(next) ? next : 0));
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(formatValue(Number.isFinite(value) ? value : 0));

  useEffect(() => {
    if (!focused) setDraft(formatValue(Number.isFinite(value) ? value : 0));
  }, [focused, money, value]);

  return (
    <span className="flex h-11 items-center rounded-md border border-black/15 bg-white px-2 focus-within:border-[#1f7a5a] dark:border-white/15 dark:bg-[#121412] lg:h-8 lg:rounded-none lg:border-[#8f9aa3] lg:shadow-inner">
      {prefix && <span className="pr-1 text-black/50 dark:text-white/60">{prefix}</span>}
      <input
        aria-label={ariaLabel}
        className="w-full bg-transparent text-sm font-bold text-[#101418] outline-none dark:text-white sm:text-base lg:text-[13px] lg:font-semibold"
        inputMode="decimal"
        value={draft}
        onFocus={() => {
          setFocused(true);
          if (value === 0) setDraft('');
        }}
        onBlur={() => {
          setFocused(false);
          const parsed = Number(draft);
          const nextValue = draft.trim() === '' || !Number.isFinite(parsed) ? 0 : parsed;
          onChange(nextValue);
          setDraft(formatValue(nextValue));
        }}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange(Number(event.target.value) || 0);
        }}
      />
    </span>
  );
}

function Select({ label, value, onChange, options, suffix = '', labels = {}, disabled = false }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[]; suffix?: string; labels?: Record<string, string>; disabled?: boolean }) {
  return <label className={`block text-xs font-bold sm:text-sm lg:text-xs lg:font-semibold ${disabled ? 'text-black/35 dark:text-white/35' : 'text-black/70 dark:text-white/70 lg:text-[#1f2326]'}`}>{label}<span className={`mt-1 flex h-11 items-center rounded-md border px-2 sm:h-12 lg:h-8 lg:rounded-none lg:shadow-inner ${disabled ? 'border-black/10 bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.04]' : 'border-black/15 bg-white dark:border-white/15 dark:bg-[#121412] lg:border-[#8f9aa3]'}`}><select className="w-full bg-transparent text-sm font-bold text-[#101418] outline-none disabled:text-black/40 dark:text-white dark:disabled:text-white/40 sm:text-base lg:text-[13px] lg:font-semibold" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>{options.map((option) => <option key={option} value={option}>{labels[option] ?? option}</option>)}</select>{suffix && <span className="pl-1 text-black/50 dark:text-white/60">{suffix}</span>}</span></label>;
}

function CementTypeSelect({ label, value, onChange, options, disabled = false }: { label: string; value: string; onChange: (value: string) => void; options: string[]; disabled?: boolean }) {
  return (
    <label className={`block text-xs font-bold sm:text-sm lg:text-xs lg:font-semibold ${disabled ? 'text-black/35 dark:text-white/35' : 'text-black/70 dark:text-white/70 lg:text-[#1f2326]'}`}>
      {label}
      <span className={`mt-1 flex h-11 items-center rounded-md border px-2 sm:h-12 lg:h-8 lg:rounded-none lg:shadow-inner ${disabled ? 'border-black/10 bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.04]' : 'border-black/15 bg-white dark:border-white/15 dark:bg-[#121412] lg:border-[#8f9aa3]'}`}>
        <select className="w-full bg-transparent text-sm font-bold text-[#101418] outline-none disabled:text-black/40 dark:text-white dark:disabled:text-white/40 sm:text-base lg:text-[13px] lg:font-semibold" value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </span>
    </label>
  );
}

function estimateStrengthFromRatio(ratio: [number, number, number]) {
  const validRatio = ratio.every((part) => Number.isFinite(part) && part > 0);
  if (!validRatio) return null;
  const normalized = ratio.map((part) => part / ratio[0]);
  const candidates = strengthDatabase.filter((mix) => mix.ratio);
  const closest = candidates.reduce<{ strengthMpa: number; score: number } | null>((best, mix) => {
    const mixRatio = mix.ratio as [number, number, number];
    const mixNormalized = mixRatio.map((part) => part / mixRatio[0]);
    const score = Math.abs(normalized[1] - mixNormalized[1]) + Math.abs(normalized[2] - mixNormalized[2]);
    if (!best || score < best.score) return { strengthMpa: mix.strengthMpa, score };
    return best;
  }, null);
  return closest;
}

function formatStrength(strengthMpa: number, unit: Settings['strengthUnit']) {
  if (unit === 'PSI') return `${Math.round(strengthMpa * PSI_PER_MPA)} PSI`;
  return `${round(strengthMpa, 1)} MPa`;
}

function formatLiquid(liters: number, unitSystem: Settings['unitSystem']) {
  if (unitSystem === 'imperial') {
    if (liters < LITERS_PER_GALLON) return { value: round(liters / LITERS_PER_FLUID_OUNCE, 1), unit: 'fl oz' };
    return { value: round(liters / LITERS_PER_GALLON, 2), unit: 'gal' };
  }
  if (liters < 1) return { value: round(liters * 1000, 0), unit: 'ml' };
  return { value: round(liters, 1), unit: 'L' };
}

function formatMoney(value: number) {
  return round(value, 2).toFixed(2);
}

function formatDashboardVolume(result: { wetVolumeM3: number; volumeFt3: number }, unitSystem: Settings['unitSystem']) {
  if (unitSystem === 'imperial') return `${round(result.volumeFt3, 2)} ft3`;
  return `${round(result.wetVolumeM3, 3)} m3`;
}

function pourProgressClass(value: number) {
  if (value >= 100) return 'bg-[#1f7a5a]';
  if (value >= 80) return 'bg-[#5f8f3a]';
  if (value >= 60) return 'bg-[#9b8a22]';
  if (value >= 40) return 'bg-[#c88722]';
  if (value >= 20) return 'bg-[#e24a2f]';
  return 'bg-[#d71920]';
}

function getMaterialOrderStatus(location: SavedProjectLocation, item: MaterialOrderItem): MaterialOrderStatus {
  return location.orderStatuses?.[item] ?? 'none';
}

function hasPendingMaterialOrders(location: SavedProjectLocation) {
  return getMaterialOrderStatus(location, 'readyMix') === 'ordered' || materialOrderItems.some((item) => getMaterialOrderStatus(location, item.id) === 'ordered');
}

function materialOrderStatusClass(status: MaterialOrderStatus) {
  if (status === 'received') return 'bg-[#1f7a5a]';
  if (status === 'ordered') return 'bg-[#f0a51a] text-[#101418]';
  return 'bg-[#d71920]';
}

function materialOrderStatusLabel(status: MaterialOrderStatus) {
  if (status === 'received') return 'received';
  if (status === 'ordered') return 'on order list, not received';
  return 'not ordered';
}

function materialOrderShortLabel(item: MaterialOrderItem) {
  if (item === 'cement') return 'CM';
  if (item === 'sand') return 'SD';
  if (item === 'aggregate') return 'ST';
  if (item === 'additive') return 'AD';
  return 'PR';
}

function isSavedCustomCement(name: string) {
  const normalized = name.trim().toLowerCase();
  return normalized.length > 0 && normalized !== 'custom cement';
}

function Metric({ label, value, unit, sub, strong = false }: { label: string; value: number; unit: string; sub: string; strong?: boolean }) {
  return <div className="min-w-0 rounded-md border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-[#121412] sm:p-3 lg:rounded-sm lg:border-[#b8c0c7] lg:p-2"><p className="truncate text-[11px] font-bold uppercase text-black/55 dark:text-white/55 sm:text-xs lg:text-[10px]">{label}</p><p className={`${strong ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'} truncate font-black leading-tight lg:text-lg`}>{value}<span className="ml-1 text-xs sm:text-sm">{unit}</span></p><p className="truncate text-[11px] font-bold text-black/55 dark:text-white/55 sm:text-xs lg:text-[10px]">{sub}</p></div>;
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-black/5 p-2 dark:bg-white/10 lg:rounded-sm lg:border lg:border-[#c5ccd2] lg:bg-white lg:dark:border-white/10 lg:dark:bg-[#101214]"><p className="text-[11px] text-black/55 dark:text-white/60 sm:text-xs lg:text-[10px] lg:uppercase">{label}</p><p className="truncate text-sm font-black sm:text-base lg:text-sm">{value}</p></div>;
}

function Badge({ children }: { children: ReactNode }) {
  return <p className="rounded-md bg-[#b8562f] px-3 py-1 text-sm font-black text-white">{children}</p>;
}

function Action({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <button className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#1f7a5a] px-3 text-sm font-black text-white active:bg-[#2f9f75] sm:min-h-12 sm:text-base lg:min-h-8 lg:rounded-sm lg:border lg:border-[#6f7b85] lg:bg-[#e9edf0] lg:text-[#101418] lg:shadow-sm lg:hover:bg-[#dce3e8] lg:active:bg-[#cfd8de] lg:dark:border-white/20 lg:dark:bg-[#252a2f] lg:dark:text-white lg:dark:hover:bg-[#30363c]" onClick={onClick}>{icon}{label}</button>;
}

function MiniButton({ children, label, onClick, disabled = false, compact = false }: { children: ReactNode; label: string; onClick: () => void; disabled?: boolean; compact?: boolean }) {
  return (
    <button
      className={`${compact ? 'h-10 sm:h-11 lg:h-8' : 'mt-5 h-11 sm:mt-6 sm:h-12 lg:mt-5 lg:h-8'} rounded-md border px-2 text-xs font-black lg:rounded-sm lg:font-semibold lg:shadow-sm ${disabled ? 'cursor-not-allowed border-black/10 bg-black/[0.04] text-black/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/30' : 'border-[#b8562f]/40 bg-[#fff4ea] text-[#8a3b1d] active:bg-[#ffe5d1] dark:bg-[#311f18] dark:text-[#ffbd91] lg:border-[#6f7b85] lg:bg-[#e9edf0] lg:text-[#101418] lg:hover:bg-[#dce3e8] lg:active:bg-[#cfd8de] lg:dark:border-white/20 lg:dark:bg-[#252a2f] lg:dark:text-white lg:dark:hover:bg-[#30363c]'}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}



