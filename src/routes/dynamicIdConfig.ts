export const dynamicIdConfig: Record<
  string,
  { parentKey: string; childKey: string }
> = {
  "/masters/category": {
    parentKey: "categoryId",
    childKey: "categoryItemId",
  },

  "/transaction/purchase-inward": {
    parentKey: "purchaseInwardId",
    childKey: "purchaseInwardItemId",
  },

  "/transaction/sales-order": {
    parentKey: "salesOrderId",
    childKey: "salesOrderItemId",
  },

  "/transaction/purchase-order": {
    parentKey: "purchaseOrderId",
    childKey: "purchaseOrderItemsDtlId",
  },

    "/transaction/weaving-contract-entry": {
    parentKey: "purchaseOrderId",
    childKey: "purchaseOrderItemsDtlId",
  },

  "/transaction/customer-inquiry-form": {
    parentKey: "parentId",
    childKey: "childId",
  },

  "/transaction/costing-form": {
    parentKey: "parentId",
    childKey: "childId",
  },

  "/transaction/quotation-form": {
    parentKey: "parentId",
    childKey: "childId",
  },

  // Add more if needed
};
