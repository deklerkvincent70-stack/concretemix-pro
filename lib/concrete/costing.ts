import type { CalculationInput } from './types';

export function getSelectedCementBagCost(input: CalculationInput) {
  const normalizedName = input.customCementName.trim().toLowerCase();
  const customCementCost = input.costs.customCements.find((cement) => cement.name.trim().toLowerCase() === normalizedName)?.costPerBag ?? 0;
  if (customCementCost > 0) return customCementCost;

  const namedBuiltInType = (Object.keys(input.settings.cementTypeNames) as CalculationInput['cementType'][]).find(
    (type) => input.settings.cementTypeNames[type].trim().toLowerCase() === normalizedName
  );
  if (namedBuiltInType) {
    const namedCost = input.costs.cementPerBagByType[namedBuiltInType];
    if (namedCost > 0) return namedCost;
  }

  return input.costs.cementPerBagByType[input.cementType] || (input.costs.cementPerBag ?? 0);
}
