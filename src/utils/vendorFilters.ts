export const VENDOR_TYPE_ALL = 307;

export const DEFAULT_VENDOR_TYPE_MAP: Record<string, number[]> = {
  "1": [301],
  "2": [306],
  "3": [305],
  "11": [306],
  "4": [305],
};

// Helper function to parse comma-separated values into array of strings
export const parseIds = (value: string | number | null | undefined): string[] => {
  if (value === null || value === undefined || value === "") {
    return [];
  }
  return String(value)
    .split(",")
    .map(v => v.trim())
    .filter(v => v !== "");
};

// Helper function to parse comma-separated vendor type IDs into array of numbers
export const parseVendorTypeIds = (vendor: any): number[] => {
  if (!vendor) return [];
  
  // Try to get vendor type ID from various possible fields
  const candidates = [
    vendor?.vendorTypeId,
    vendor?.vendor_type_id,
    vendor?.vendorType?.id,
    vendor?.vendorType?.vendorTypeId,
    vendor?.vendorTypeCode,
    vendor?.vendorTypeValue,
    vendor?.typeId,
  ];
  
  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && candidate !== "") {
      const idStrings = parseIds(candidate);
      const numbers = idStrings
        .map(id => Number(id))
        .filter(num => Number.isFinite(num));
      
      if (numbers.length > 0) {
        return numbers;
      }
    }
  }
  
  return [];
};

const normalizeVendorList = (vendors: any): any[] => {
  if (Array.isArray(vendors)) return vendors;
  if (vendors && Array.isArray(vendors.data)) return vendors.data;
  return [];
};

export const resolveVendorTypeId = (vendor: any): number | null => {
  if (!vendor) return null;
  const candidates = [
    vendor?.vendorTypeId,
    vendor?.vendor_type_id,
    vendor?.vendorType?.id,
    vendor?.vendorType?.vendorTypeId,
    vendor?.vendorTypeCode,
    vendor?.vendorTypeValue,
    vendor?.typeId,
  ];
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null || candidate === "") continue;
    const parsed = Number(candidate);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const resolvePoTypeName = (poTypeId: string | number | null | undefined, poTypes?: any[]): string => {
  if (!poTypeId || !Array.isArray(poTypes)) return "";
  const key = String(poTypeId);
  const match = poTypes.find((entry: any) => String(entry?.id ?? entry?.poTypeId) === key);
  return (match?.poTypeName || match?.typeName || match?.name || "").toLowerCase();
};

const buildKeyword = (value?: string | null) => (value || "").trim().toLowerCase();

export interface VendorTypeMatchOptions {
  includeAllVendorTypeId?: number | null;
}

export interface FilterVendorsByTypeIdsOptions extends VendorTypeMatchOptions {}

export interface FilterVendorsOptions {
  purchaseOrderTypes?: any[];
  vendorTypeMap?: Record<string, number[]>;
  includeAllVendorTypeId?: number | null;
  includeVendorTypeIds?: Array<number | string>;
  fallbackKeyword?: string;
}

const shouldIncludeAllVendorType = (value: number | null | undefined) => (value === null ? null : value ?? VENDOR_TYPE_ALL);

export const vendorMatchesTypeIds = (
  vendor: any,
  vendorTypeIds: Array<number | string>,
  options: VendorTypeMatchOptions = {},
) => {
  if (!vendor || !Array.isArray(vendorTypeIds) || vendorTypeIds.length === 0) {
    return false;
  }
  
  // Parse vendor's type IDs (now supports comma-separated values)
  const vendorTypeNumbers = parseVendorTypeIds(vendor);
  
  // Build set of allowed IDs from the filter criteria
  const allowedIds = new Set<number>();
  vendorTypeIds.forEach((value) => {
    const numericId = Number(value);
    if (Number.isFinite(numericId)) {
      allowedIds.add(numericId);
    }
  });
  
  const includeAllId = shouldIncludeAllVendorType(options.includeAllVendorTypeId);
  if (includeAllId != null) {
    allowedIds.add(Number(includeAllId));
  }
  
  // Check if any of the vendor's type IDs match the allowed IDs
  const hasMatchingType = vendorTypeNumbers.some(vendorTypeId => 
    vendorTypeId != null && allowedIds.has(vendorTypeId)
  );
  
  if (hasMatchingType) {
    return true;
  }
  
  // Fallback: check vendor type label for "all" keyword
  if (includeAllId != null) {
    const vendorTypeLabel = buildKeyword(vendor?.vendorType || vendor?.vendorTypeName);
    if (vendorTypeLabel.includes("all")) {
      return true;
    }
  }
  
  return false;
};

export const filterVendorsByTypeIds = (
  vendors: any,
  vendorTypeIds: Array<number | string>,
  options: FilterVendorsByTypeIdsOptions = {},
) => {
  const list = normalizeVendorList(vendors);
  const activeList = list.filter((vendor: any) => 
    vendor?.isActive !== false && vendor?.activeFlag !== false
  );
  if (!Array.isArray(vendorTypeIds) || !vendorTypeIds.length) {
    return activeList;
  }
  return activeList.filter((vendor: any) => vendorMatchesTypeIds(vendor, vendorTypeIds, options));
};

export const filterVendorsByPoType = (
  vendors: any,
  poTypeId: string | number | null | undefined,
  options: FilterVendorsOptions = {},
) => {
  const list = normalizeVendorList(vendors);
  const activeList = list.filter((vendor: any) => 
    vendor?.isActive !== false && vendor?.activeFlag !== false
  );
  if (!poTypeId) {
    return activeList;
  }

  const poTypeKey = String(poTypeId);
  const map = options.vendorTypeMap ?? DEFAULT_VENDOR_TYPE_MAP;
  const allowedIds = new Set<number>();
  (map[poTypeKey] || []).forEach((id) => allowedIds.add(Number(id)));

  const includeAllId = shouldIncludeAllVendorType(options.includeAllVendorTypeId);
  if (includeAllId != null) {
    allowedIds.add(Number(includeAllId));
  }

  (options.includeVendorTypeIds || []).forEach((value) => {
    const numericId = Number(value);
    if (Number.isFinite(numericId)) {
      allowedIds.add(numericId);
    }
  });

  const poTypeName = resolvePoTypeName(poTypeId, options.purchaseOrderTypes);
  const fallbackKeyword = buildKeyword(options.fallbackKeyword);

  return activeList.filter((vendor: any) => {
    // Parse vendor's type IDs (now supports comma-separated values)
    const vendorTypeNumbers = parseVendorTypeIds(vendor);
    
    // Check if any of the vendor's type IDs match the allowed IDs
    const hasMatchingType = vendorTypeNumbers.some(vendorTypeId => 
      vendorTypeId != null && allowedIds.has(vendorTypeId)
    );
    
    if (hasMatchingType) {
      return true;
    }

    const vendorTypeLabel = buildKeyword(vendor?.vendorType || vendor?.vendorTypeName);
    if (vendorTypeLabel && includeAllId != null && vendorTypeLabel.includes("all")) {
      return true;
    }

    const keyword = poTypeName || fallbackKeyword;
    if (!keyword) {
      return false;
    }

    return vendorTypeLabel.includes(keyword);
  });
};
