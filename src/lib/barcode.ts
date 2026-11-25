export interface FabricBarcodePiece {
  barcode: string;
  fabricCode?: string;
  fabricQuality?: string;
  grade?: string;
  meter?: string | number;
  netWeight?: string | number;
  avgWeight?: string | number;
  yards?: string | number;
  grossWeight?: string | number;
  companyId?: string | number;
}

export interface FabricBarcodeParams {
  barcode: string;
  fabricCode?: string;
  fabricQuality?: string;
  grade?: string;
  meter?: string | number;
  netWeight?: string | number;
  avgWeight?: string | number;
  yards?: string | number;
  grossWeight?: string | number;
  companyId?: string | number;
  fabricCodeId?: string | number;
  fabricQualityId?: string | number;
  pieceEntries?: FabricBarcodePiece[];
}

const FABRIC_BARCODE_ROUTE = "/transaction/barcode-sticker-fabric-items";

const appendParam = (searchParams: URLSearchParams, key: string, value: string | number | undefined) => {
  if (value === undefined || value === null || value === "") {
    return;
  }
  searchParams.append(key, String(value));
};

export const buildFabricBarcodeQuery = (params: FabricBarcodeParams) => {
  if (!params.barcode) {
    return "";
  }

  const searchParams = new URLSearchParams();
  appendParam(searchParams, "barcode", params.barcode);
  appendParam(searchParams, "fabricCode", params.fabricCode);
  appendParam(searchParams, "fabricQuality", params.fabricQuality);
  appendParam(searchParams, "grade", params.grade);
  appendParam(searchParams, "meter", params.meter);
  appendParam(searchParams, "netWeight", params.netWeight);
  appendParam(searchParams, "avgWeight", params.avgWeight);
  appendParam(searchParams, "yards", params.yards);
  appendParam(searchParams, "grossWeight", params.grossWeight);
  appendParam(searchParams, "companyId", params.companyId);
  appendParam(searchParams, "fabricCodeId", params.fabricCodeId);
  appendParam(searchParams, "fabricQualityId", params.fabricQualityId);
  if (params.pieceEntries && params.pieceEntries.length > 0) {
    appendParam(searchParams, "pieceEntries", JSON.stringify(params.pieceEntries));
  }

  return searchParams.toString();
};

export const getFabricBarcodeLink = (params: FabricBarcodeParams) => {
  const query = buildFabricBarcodeQuery(params);
  if (!query) {
    return "";
  }

  return `#${FABRIC_BARCODE_ROUTE}?${query}`;
};

export { FABRIC_BARCODE_ROUTE };
