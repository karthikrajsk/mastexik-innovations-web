export interface PackingListItem {
  remarks: string;
  sNo: number;
  rollNo: string;
  pieceNo: string;
  meters: number;
  yards: number;
  netWeight: number;
  grossWeight: number;
  avgWeight: number;
  noOfPieces: number;
  pieceMeter: string;
  invoiceNo?: string;
  // Weaving self inspection fields
  loomNo?: string;
  supplierRefNo?: string;
  pts4?: number;
  pts3?: number;
  pts2?: number;
  pts1?: number;
  totalPoints?: number;
  pointsPer100Mtr?: number;
  grade?: string;
  warpLotNo?: string;
  weftLotNo?: string;
  defectsDetail?: string;
}

export interface PackingListData {
  company: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    cityPincode: string;
    stateCode: string;
    displayState?: string;
    gst: string;
    phone?: string;
    email?: string;
  };
  buyer: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    cityPincode: string;
    stateCode: string;
    displayState?: string;
    gst: string;
  };
  consignee: {
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    cityPincode: string;
    stateCode: string;
    displayState?: string;
    gst: string;
  };
  invoiceNo?: string;
  invoiceDate?: string;
  poNumber?: string;
  fabricCode: string;
  fabricQuality: string;
  packingListNo: string;
  orderNo: string;
  orderDate?: string;
  items: PackingListItem[];
  // New fields for brushing flow
  isBrushChecked?: number | boolean;
  poNo?: string;
  poDate?: string;
  lrNo?: string;
  lrDate?: string;
  truckNo?: string;
  transportName?: string;
  remarks?: string;

  // Weaving self inspection abstract fields
  loomTypeSelvedge?: string;
  glm?: number | string;
  weave?: string;
  fabricLotNo?: string;
}
