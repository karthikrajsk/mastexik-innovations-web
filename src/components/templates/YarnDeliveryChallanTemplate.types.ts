export interface YarnDeliveryChallanData {
  company: {
    name: string;
    address: string;
    cityPincode: string;
    stateCode: string;
    gst: string;
    country: string;
    phone?: string;
    pan?: string;
  };
  erpCompany?: {
    name: string;
    address: string;
    cityPincode: string;
    stateCode: string;
    gst: string;
  };
  vendor: {
    name: string;
    address: string;
    cityPincode: string;
    stateCode: string;
    gst: string;
    country: string;
  };
  consignee?: {
    name: string;
    address: string;
    cityPincode: string;
    stateCode: string;
    gst: string;
    country: string;
  };
  dcDetails: {
    dcNoCardNo: string;
    vehicleNo: string;
    dcDate: string;
    remarks: string;
    transportName: string;
    vanNo?: string;
    approxValue?: string | number;
  };
  planNoLabel?: string;
  items: Array<{
    sNo: number;
    sizingPlanNo: string;
    yarnName: string;
    millName: string;
    noOfBags: string | number;
    noOfCones: string | number;
    netWt: string | number;
    grossWt: string | number;
    lotNo: string;
    location: string;
    kgsPerBag?: string | number;
    setNo?: string;
    type?: string;
    hsnCode?: string;
    rate?: string | number;
    amount?: string | number;
  }>;
}
