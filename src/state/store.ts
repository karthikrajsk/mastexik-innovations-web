import { configureStore } from "@reduxjs/toolkit";
import countryReducer from './countrySlice'
import stateReducer from './stateSlice'
import cityReducer from './citySlice'
import shipmentModeRducer from './shipmentModeSlice'
import shipmentTermRducer from './shipmentTermsSlice'
import paymentTermRducer from './paymentTermsSlice'
import currencyReducer from './currencySlice'
import fabricTypeReducer from './fabricTypeSlice'
import categoryReducer from './categorySlice'
import subCategoryReducer from './subCategorySlice'
import yarnSliceReducer from './yarnSlice'
import customerSliceReducer from './customerSlice'
import purchaseOrderSliceReducer from './purchaseOrderSlice'
import productCategorySliceReducer from './productCategorySlice'
import purchaseInwardSliceReducer from './purchaseInwardSlice'
import vendorSliceReducer from './vendorSlice'
import termsConditionsSliceReducer from './termsConditions'
import fabricMasterSliceReducer from './fabricMasterSlice'
import weavingContractsSliceReducer from './weavingContractSlice'
import weavingYarnIssueSliceReducer from './weavingYarnIssueSlice'
import consigneeSliceReducer from './consigneeSlice'
import fabricInspectionsSliceReducer from './fabricInspectionsSlice'
import invoiceSliceReducer from './invoiceSlice'
import dyeingWorkOrdeSliceReducer from './processContractSlice'
import uomSliceReducer from './uomMasterSlice'
import finishFabricSliceReducer from './finishMasterSlice'
import fabricCategorySliceReducer from './fabricCategorySlice'
import gstReducer from './gstMasterSlice'
import flangeReducer from './flangeSlice'
import flangeIssueReducer from './flangeIssueSlice'
import flangeInwardReducer from './flangeInwardSlice'
import emptyBeamIssueReducer from './emptyBeamIssueSlice'
import sizingPlanReducer from './sizingPlanSlice'
import salesOrderSliceReducer from './salesOrderSlice'
import knittedMastersReducer from './knittedMasterSlice'
import jobworkFabricReceiveReducer from './jobFabricReceiveSlice'
import fabricDispatchDyeingReducer from './processIssueSlice'
import warehouseReducer from './warehouseSlice'
import generatePackingReducer from './generatePackingSlice'
import SizingYarnIssueReducer from './sizingYarnIssueSlice'
import beamInwardReducer from './beamInwardSlice'
import customerInternationalReducer from './customerInternationalSlice'
import finishFabricReceiveReducer from './finishFabricReceiveSlice'
import gradeReducer from './gradeMasterSlice'
import defectReducer from './defectMasterSlice'
import processReducer from './processMasterSlice'
import companyMasterReducer from './company-master-slice'
import applicationUserSliceReducer from './application-user-slice'
import employeeReducer from './employeeSlice'
import baleRollPackingReducer from './baleRollPackingSlice'
import yarnDispatchForDyeingReducer from './yarn-dispatch-for-dyeing-slice'
import yarnReturnReducer from './yarnReturnSlice'
import scanDispatchReducer from './scanDispatchSlice'
import purchaseReturnReducer from './purchaseReturnSlice'
import menuMasterReducer from './menuMasterSlice'
import level1MenuReducer from './level1MenuSlice'
import level2MenuReducer from './level2MenuSlice'
import loomMasterReducer from './loomMasterSlice'
import machineMasterReducer from './machineMasterSlice'
import weavingJobWorkOrderReducer from './weavingJobWorkOrderSlice'
import sizingJobWorkOrderReducer from './sizingJobWorkOrderSlice'
import beamOutwardReducer from './beamOutwardSlice'
import factoryBeamInwardReducer from './factoryBeamInwardSlice'
import weftInwardReducer from './weftInwardSlice'
import sizingYarnInwardReducer from './sizingYarnInwardSlice'
import beamGaitingReducer from './beamGaitingSlice'
import factoryPieceEntryReducer from './factoryPieceEntrySlice'
import beamCutReducer from './beamCutSlice'
import pieceSplitJoinReducer from './pieceSplitJoinSlice'
import yarnSalesReducer from './yarnSalesSlice'
import yarnChallanReducer from './yarnChallanSlice'
import reportConfigReducer from './reportConfigSlice'
import numberFormatConfigurationReducer from './numberFormatConfigurationSlice'
import openingBalanceReducer from './openingBalanceSlice'
import agentMasterReducer from './agentMasterSlice'
import poTypeMasterReducer from './poTypeMasterSlice'
import costingReducer from './costingSlice'
import stockTransferReducer from './stockTransferSlice'
import salesReturnReducer from './salesReturnSlice';
import itemMasterReducer from './itemSlice';
import itemOutwardReducer from './itemOutwardSlice';
import portReducer from './portSlice';
import transportReducer from './transportSlice';
import warpingProductionReducer from './warpingProductionSlice'
import weavingProductionReducer from './weavingProductionSlice'
import sizingProductionReducer from './sizingProductionSlice'
import sizingBeamOutwardReducer from './sizingBeamOutwardSlice'
import sizingYarnOutwardReducer from './sizingYarnOutwardSlice'
import weavingYarnOutwardReducer from './weavingYarnOutwardSlice'
import approvalReducer from './approvalSlice';
import permissionReducer from './permissionSlice';
import employeeMasterReducer from './employeeMasterSlice';
import attendanceReducer from './attendanceSlice';
import employeeManagementReducer from './employeeManagementSlice';
import employeePerformanceReducer from './employeePerformanceSlice';
import employeeRelievedReducer from './employeeRelievedSlice';
import leaveRequestReducer from './leaveRequestSlice';
import salaryReducer from './salarySlice';
import allowanceAdvanceReducer from './allowanceAdvanceSlice';
import employeeLoanReducer from './employeeLoanSlice';
import employeeLoanSkipRequestReducer from './employeeLoanSkipRequestSlice';
import permissionRequestReducer from './permissionRequestSlice';
import notificationReducer from './notificationSlice';
import brushingReducer from './brushingSlice';
import holidayReducer from './holidaySlice';
import millSliceReducer from './millSlice';
import attendanceIncentiveReducer from './attendanceIncentiveSlice';
import attendanceIncentiveSlabReducer from './attendanceIncentiveSlabSlice';
import productionIncentiveReducer from './productionIncentiveSlice';
import canteenDeductionReducer from './canteenDeductionSlice';
import employeePropertyAssignmentReducer from './employeePropertyAssignmentSlice';
import oldFabricStockReducer from './oldFabricStockSlice';
import beamStockReducer from './beamStockSlice';
import weavingProductionLiveReducer from './weavingProductionLiveSlice';
import purchaseIndentReducer from './purchaseIndentSlice';
import agencyContractReducer from './agencyContractSlice';
import agencyDispatchReducer from './agencyDispatchSlice';
import agencyPaymentReducer from './agencyPaymentSlice';
import agencyCommissionReducer from './agencyCommissionSlice';
import shiftReducer from './shiftSlice';

export const store = configureStore({
  reducer: {
    beamStock: beamStockReducer,
    weavingProductionLive: weavingProductionLiveReducer,
    oldFabricStock: oldFabricStockReducer,
    attendanceIncentive: attendanceIncentiveReducer,
    attendanceIncentiveSlab: attendanceIncentiveSlabReducer,
    productionIncentive: productionIncentiveReducer,
    canteenDeduction: canteenDeductionReducer,
    employeePropertyAssignment: employeePropertyAssignmentReducer,
    holiday: holidayReducer,
    brushing: brushingReducer,
    mill: millSliceReducer,
    country: countryReducer,
    state: stateReducer,
    city: cityReducer,
    shipmentMode: shipmentModeRducer,
    shipmentTerms: shipmentTermRducer,
    paymentTerms: paymentTermRducer,
    currency: currencyReducer,
    fabricType: fabricTypeReducer,
    category: categoryReducer,
    subCategory: subCategoryReducer,
    yarn: yarnSliceReducer,
    customer: customerSliceReducer,
    vendor: vendorSliceReducer,
    purchaseOrder: purchaseOrderSliceReducer,
    productCategory: productCategorySliceReducer,
    salesOrder: salesOrderSliceReducer,
    purchaseInward: purchaseInwardSliceReducer,
    termsConditions: termsConditionsSliceReducer,
    fabricMaster: fabricMasterSliceReducer,
    weavingContracts: weavingContractsSliceReducer,
    weavingYarnIssue: weavingYarnIssueSliceReducer,
    consignee: consigneeSliceReducer,
    fabricInspections: fabricInspectionsSliceReducer,
    invoice: invoiceSliceReducer,
    dyeingWorkOrde: dyeingWorkOrdeSliceReducer,
    uom: uomSliceReducer,
    finishFabric: finishFabricSliceReducer,
    fabricCategoty: fabricCategorySliceReducer,
    gst: gstReducer,
    flange: flangeReducer,
    flangeIssue: flangeIssueReducer,
    flangeInward: flangeInwardReducer,
    emptyBeamIssue: emptyBeamIssueReducer,
    sizingPlan: sizingPlanReducer,
    knittedMasters: knittedMastersReducer,
    JobworkFabricReceive: jobworkFabricReceiveReducer,
    fabricDispatchDyeing: fabricDispatchDyeingReducer,
    warehouse: warehouseReducer,
    generatePacking: generatePackingReducer,
    sizingYarnIssue: SizingYarnIssueReducer,
    beamInward: beamInwardReducer,
    customerInternational: customerInternationalReducer,
    finishFabricReceive: finishFabricReceiveReducer,
    grade: gradeReducer,
    defect: defectReducer,
    process: processReducer,
    companyMaster: companyMasterReducer,
    applicationUser: applicationUserSliceReducer,
    employee: employeeReducer,
    baleRollPacking: baleRollPackingReducer,
    yarnDispatchForDyeing: yarnDispatchForDyeingReducer,
    yarnReturn: yarnReturnReducer,
    scanDispatch: scanDispatchReducer,
    purchaseReturn: purchaseReturnReducer,
    menuMaster: menuMasterReducer,
    level1Menu: level1MenuReducer,
    level2Menu: level2MenuReducer,
    loomMaster: loomMasterReducer,
    machineMaster: machineMasterReducer,
    warpingProduction: warpingProductionReducer,
    weavingProduction: weavingProductionReducer,
    sizingProduction: sizingProductionReducer,
    sizingBeamOutward: sizingBeamOutwardReducer,
    sizingYarnOutward: sizingYarnOutwardReducer,
    weavingYarnOutward: weavingYarnOutwardReducer,
    weavingJobWorkOrder: weavingJobWorkOrderReducer,
    sizingJobWorkOrder: sizingJobWorkOrderReducer,
    beamOutward: beamOutwardReducer,
    factoryBeamInward: factoryBeamInwardReducer,
    weftInward: weftInwardReducer,
    sizingYarnInward: sizingYarnInwardReducer,
    beamGaiting: beamGaitingReducer,
    factoryPieceEntry: factoryPieceEntryReducer,
    beamCut: beamCutReducer,
    pieceSplitJoin: pieceSplitJoinReducer,
    yarnSales: yarnSalesReducer,
    yarnChallan: yarnChallanReducer,
    reportConfig: reportConfigReducer,
    numberFormatConfiguration: numberFormatConfigurationReducer,
    openingBalance: openingBalanceReducer,
    poTypeMaster: poTypeMasterReducer,
    agentMaster: agentMasterReducer,
    costing: costingReducer,
    StockTransfer: stockTransferReducer,
    salesReturn: salesReturnReducer,
    itemMaster: itemMasterReducer,
    itemOutward: itemOutwardReducer,
    port: portReducer,
    transport: transportReducer,
    approval: approvalReducer,
    permission: permissionReducer,
    employeeMaster: employeeMasterReducer,
    attendance: attendanceReducer,
    employeeManagement: employeeManagementReducer,
    employeePerformance: employeePerformanceReducer,
    employeeRelieved: employeeRelievedReducer,
    leaveRequest: leaveRequestReducer,
    salary: salaryReducer,
    allowanceAdvance: allowanceAdvanceReducer,
    employeeLoan: employeeLoanReducer,
    employeeLoanSkipRequest: employeeLoanSkipRequestReducer,
    permissionRequest: permissionRequestReducer,
    notifications: notificationReducer,
    purchaseIndent: purchaseIndentReducer,
    agencyContract: agencyContractReducer,
    agencyDispatch: agencyDispatchReducer,
    agencyPayment: agencyPaymentReducer,
    agencyCommission: agencyCommissionReducer,
    shift: shiftReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
