export interface SelectOption {
  value: string;
  label: string;
}

const ensureArray = <T>(items?: T[] | null): T[] => (Array.isArray(items) ? items : []);

const isActiveItem = (item: { activeFlag?: boolean } | undefined | null) => {
  if (!item) return false;
  return item.activeFlag ?? true;
};

export const filterActiveMasterRecords = <T extends { activeFlag?: boolean }>(items?: T[] | null): T[] =>
  ensureArray(items).filter((item) => isActiveItem(item));

export const buildActiveMasterOptions = <T extends { activeFlag?: boolean }>(
  items: T[] | null | undefined,
  mapper: (item: T) => SelectOption | null | undefined
): SelectOption[] =>
  filterActiveMasterRecords(items)
    .map(mapper)
    .filter((option): option is SelectOption => Boolean(option));
