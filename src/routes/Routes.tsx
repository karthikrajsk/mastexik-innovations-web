
// src/routes/Routes.tsx
import React, { useEffect, useMemo } from 'react';
import { Routes, Route as ReactRouterRoute, Navigate, useLocation, useSearchParams, Outlet, RouteProps } from 'react-router-dom';
import { TitleContext, buildRouteMap } from './TitleContext';

const Route = ReactRouterRoute as React.FC<RouteProps & { title?: string; hideTitle?: boolean }>;
import { ToastContainer } from 'react-toastify';
import { Dashboard } from '../pages/Dashboard';
// Import all other pages as before
import { CategoryMaster } from '../pages/masters/category';
import { ConsigneeMaster } from '../pages/masters/consignee';
import PrivateRoute from './PrivateRoute';
// ... (other imports remain the same)
import { CustomerMaster } from '@/pages/masters/customer';
import { FabricCategoryMaster } from '@/pages/masters/fabric-category';
import { FinishFabricMaster } from '@/pages/masters/finishFabric-master';
import { SubCategoryMaster } from '@/pages/masters/sub-category';
import { UomMaster } from '@/pages/masters/uom-master';
import { VendorMaster } from '@/pages/masters/vendor';
import { MillMaster } from '@/pages/masters/mill';
import { ShiftMaster } from '@/pages/masters/shift-master';

import { YarnMaster } from '@/pages/masters/yarn-master';
import { FabricTypeMaster } from '@/pages/masters/fabric-type';
import WovenFabricMaster from '@/pages/masters/fabric-master';
import { GstMaster } from '@/pages/masters/gst-master';
import KnittedFabricMaster from '@/pages/masters/knitted-fabric-master';
import { FlangeMaster } from '@/pages/masters/flange-master';
import { LoomMaster } from '@/pages/masters/loom-master';
import { MachineMaster } from '@/pages/masters/machine-master';
import { WarehouseMaster } from '@/pages/masters/warehouse-master';
import CustomerManagement from '@/pages/masters/customer-management';
import LocationManagement from '@/pages/masters/location-management';
import FabricManagement from '@/pages/masters/fabric-management';
import SalesOrderManagement from '@/pages/transaction/sales-order-management';
import OrderEntryManagement from '@/pages/transaction/order-entry-management';
import ApprovalManagement from '@/pages/transaction/approval-management';
// Location Masters
import { CityMaster } from '@/pages/location-masters/city-master';
import { CountryMaster } from '@/pages/location-masters/country-master';
import { StateMaster } from '@/pages/location-masters/state-master';
// Trade Shipping Masters
import { ShipmentModeMaster } from '@/pages/trade-shipping-master/shipment-mode-master';
import { ShipmentTermMaster } from '@/pages/trade-shipping-master/shipment-terms-master';
import { CurrencyMaster } from '@/pages/trade-shipping-master/currency-master';
import { PaymentTermsMaster } from '@/pages/trade-shipping-master/payment-terms-master';
// Transactions
import PackingList from '@/pages/transaction/generate-packing-list';
import { PackingListDetails } from '@/pages/transaction/generate-packing-list-details';
import GenerateInvoice from '@/pages/transaction/invoice';
import JobworkFabricReceive from '@/pages/transaction/jobwork-fabric-receive';
import LotDetails from '@/pages/transaction/lot-details';
import PieceDetails from '@/pages/transaction/piece-details';
import { ProcessContractDetails } from '@/pages/transaction/process-contract-details';
import { ProcessContractEntry } from '@/pages/transaction/process-contract-entry';
import { ProcessingIssue } from '@/pages/transaction/processing-issue';
import PurchaseInward from '@/pages/transaction/purchase-inward';
import { PurchaseInwardDetails } from '@/pages/transaction/purchase-inward-details';
import { PurchaseIndentEntry } from '@/pages/transaction/purchase-indent-entry';
import { PurchaseIndentDetails } from '@/pages/transaction/purchase-indent-details';
import { PurchaseOrderEntry } from '@/pages/transaction/purchase-order';
import { PurchaseOrderDetails } from '@/pages/transaction/purchase-order-details';
import SalesOrderEntry from '@/pages/transaction/sales-order';
import { SalesOrderDetails } from '@/pages/transaction/sales-order-details';
import { WeavingContractDetails } from '@/pages/transaction/weaving-contract-details';
import { WeavingContractEntry } from '@/pages/transaction/weaving-contract-entry';
import WeavingJobWorkOrderEntry from '@/pages/transaction/weaving-jobwork-order-entry';
import WeavingJobWorkOrderDetails from '@/pages/transaction/weaving-jobwork-order-details';
import SizingJobWorkOrderEntry from '@/pages/transaction/sizing-jobwork-order-entry';
import SizingJobWorkOrderDetails from '@/pages/transaction/sizing-jobwork-order-details';
import { WeavingYarnIssue } from '@/pages/transaction/weaving-yarn-issue';
import WeavingYarnOutwardPage from '@/pages/transaction/weaving-yarn-outward';
import WeavingYarnOutwardDetails from '@/pages/transaction/weaving-yarn-outward-details';
import { SalesOrderExportDetails } from '@/pages/transaction/sales-order-export-details';
import { SizingPlanDetails } from '@/pages/transaction/sizing-plan-details';
import { SizingYarnIssue } from '@/pages/transaction/sizing-yarn-issue';
import SizingPlanEntry from '@/pages/transaction/sizing-plan-entry';
import { SizingProduction } from '@/pages/transaction/sizing-production';
import { SizingProductionFormPage } from '@/pages/transaction/sizing-production-form';
import { SizingBeamOutward } from '@/pages/transaction/sizing-beam-outward';
import { SizingBeamOutwardFormPage } from '@/pages/transaction/sizing-beam-outward-form';
import SizingYarnOutwardDetails from '@/pages/transaction/sizing-yarn-outward-details';
import SizingYarnOutwardPage from '@/pages/transaction/sizing-yarn-outward';
import { WarpingProduction } from '@/pages/transaction/warping-production';
import { WarpingProductionFormPage } from '@/pages/transaction/warping-production-form';
import { WeavingProduction } from '@/pages/transaction/weaving-production';
import { WeavingProductionFormPage } from '@/pages/transaction/weaving-production-form';
import BeamCardPage from '@/pages/transaction/beam-card';
import BeamCardReportPage from '@/pages/transaction/beam-card-report';
import BeamInwardEntry from '@/pages/transaction/beam-inward-entry';
import BeamOutwardEntry from '@/pages/transaction/beam-outward';
import BeamOutwardDetails from '@/pages/transaction/beam-outward-details';
import BeamOutwardView from '@/pages/transaction/beam-outward-view';
import { SizingYarnIssueDetails } from '@/pages/transaction/sizing-yarn-issue-details';
import { BeamInwardDetails } from '@/pages/transaction/beam-inward-details';
import { WeavingIssueDetails } from '@/pages/transaction/weaving-issue-details';
import { JobworkFabricReceiveDetails } from '@/pages/transaction/jobwork-fabric-details';
import { ProcessingIssueDetails } from '@/pages/transaction/processing-issue-details';
import PackingListManagement from '@/pages/transaction/packing-list-management';
import { InvoiceDetails } from '@/pages/transaction/invoice-details';
import InvoicePrint from '@/pages/transaction/invoice-print';
import { FinishFabricReceiveDetails } from '@/pages/transaction/finish-fabric-receive-details';
import { ProcessingReceive } from '@/pages/transaction/processing-receive';
import { GradeMaster } from '@/pages/masters/grade-master';
import { HolidayMaster } from '@/pages/masters/holiday-master';
import { DefectMaster } from '@/pages/masters/defect-master';
import ProcessContactManagement from '@/pages/transaction/process-contact-management';
import ProcessingIssueManagement from '@/pages/transaction/processing-issue-management';
import InvoiceManagement from '@/pages/transaction/invoice-management';
import { ProcessContractYarnEntry } from '@/pages/transaction/process-contract-yarn-entry';
import Login from '@/pages/login';
import { ProcessMaster } from '@/pages/masters/process-master';
// import FabricInspectionManagement from '@/pages/transaction/fabric-inspection-management';
import { FinishFabricInspectionDetails } from '@/pages/transaction/finish-fabric-inspection-dtails';
import { useAuth } from '@/contexts/AuthContext';
import { TermsConditionMaster } from '@/pages/trade-shipping-master/terms-condition-master';
import { CompanyMaster } from '@/pages/masters/company';
import ApplicationUserPage from '@/pages/settings/application-user';
import EmployeePage from '@/pages/masters/employee';
import EmployeeMasterPage from '@/pages/settings/employee-master';
import AttendanceDownloadPage from '@/pages/settings/attendance-download';
import EmployeeRelievedPage from '@/pages/settings/employee-relieved';
import EmployeeGrowthPage from '@/pages/settings/employee-growth';
import LeaveRequestsPage from '@/pages/settings/leave-requests';
import AttendanceIncentivePage from '@/pages/hr/attendance-incentive';
import CanteenDeductionPage from '@/pages/hr/canteen-deduction';
import EmployeePropertyAssignmentPage from '@/pages/hr/employee-property-assignment';
import BaleRollPackingDetails from '@/pages/transaction/bale-roll-packing-details';
import BaleRollPacking from '@/pages/transaction/bale-roll-packing';
import BarcodeStickerPage from '@/pages/transaction/barcode-sticker-page';
import BarcodeStickerFabricItemsPage from '@/pages/transaction/barcode-sticker-fabric-items';
import ScanDispatchEntry from '@/pages/transaction/scan-dispatch-entry';
import ScanDispatchRegister from '@/pages/transaction/scan-dispatch-register';
import ProcessingReceiveManagement from '@/pages/transaction/process-receive-management';
import { FinishYarnReceiveDetails } from '@/pages/transaction/finish-yarn-receive-details';
import { ProcessingReceiveFabric } from '@/pages/transaction/ProcessingReceiveFabric';
import { ProcessingReceiveYarn } from '@/pages/transaction/ProcessingReceiveYarn';
import { ProcessingIssueFabricDetails } from '@/pages/transaction/processing-issue-fabric-details';
import { ProcessingFabricIssue } from '@/pages/transaction/processing-fabric-issue';
import { ProcessingYarnIssue } from '@/pages/transaction/processing-yarn-issue';
import { BrushingReceive } from '@/pages/transaction/brushing-receive';
import { BrushingReceiveDetails } from '@/pages/transaction/brushing-receive-details';
import { BrushingProcessFlow } from '@/pages/transaction/brushing-process-flow';
import BrushingReturn from '@/pages/transaction/brushing-return';
import BrushingReject from '@/pages/transaction/brushing-reject';
import BrushingStock from '@/pages/transaction/brushing-stock';
import BrushingUnitFabricStatus from '@/pages/reports/BrushingUnitFabricStatus';
import YarnReturn from '@/pages/transaction/yarn-return';
import { YarnReturnDetails } from '@/pages/transaction/yarn-return-details';
import PurchaseReturnDetails from '@/pages/transaction/purchase-return-details';
import PurchaseReturnEntry from '@/pages/transaction/purchase-return';
import MenuMasterPage from '@/pages/settings/menu-master';
import Level1MenuPage from '@/pages/settings/level1-menu';
import Level2MenuPage from '@/pages/settings/level2-menu';
import FlangeManagement from '@/pages/transaction/flange-management';
import { FlangeIssueDetails } from '@/pages/transaction/flange-issue-details';
import FlangeIssue from '@/pages/transaction/flange-issue';
import FlangeInwardEntry from '@/pages/transaction/flange-inward-entry';
import FlangeInwardDetails from '@/pages/transaction/flange-inward-details';
import BeamManagement from '@/pages/transaction/beam-management';
import { EmptyBeamIssueDetails } from '@/pages/transaction/empty-beam-issue-details';
import EmptyBeamIssue from '@/pages/transaction/empty-beam-issue';
import { FactoryBeamInwardDetails } from '@/pages/transaction/factory-beam-inward-details';
import FactoryBeamInward from '@/pages/transaction/factory-beam-inward';
import FactoryBeamInwardEntry from '@/pages/transaction/factory-beam-inward-entry';
import WeftInwardEntry from '@/pages/transaction/weft-inward';
import WeftInwardDetails from '@/pages/transaction/weft-inward-details';
import SizingYarnInwardEntry from '@/pages/transaction/sizing-yarn-inward';
import SizingYarnInwardDetails from '@/pages/transaction/sizing-yarn-inward-details';
import BeamGaitingEntry from '@/pages/transaction/beam-gaiting';
import BeamGaitingDetails from '@/pages/transaction/beam-gaiting-details';
import DoffingEntryPage from '@/pages/transaction/doffing-entry';
import BeamCutEntry from '@/pages/transaction/beam-cut';
import BeamCutDetails from '@/pages/transaction/beam-cut-details';
import PieceSplitJoinPage from '@/pages/transaction/piece-split-join';
import PieceSplitJoinDetails from '@/pages/transaction/piece-split-join-details';
import { FactoryFabricInspection } from '@/pages/transaction/fabric-inspection';
import { FabricInspectionDetails } from '@/pages/transaction/greige-fabric-inspection';
import { TradingFabricInspection } from '@/pages/transaction/trading-fabric-inspection';
import FabricInspectionManagement from '@/pages/transaction/trading-fabric-inspection-management';
import { TradingFabricInspectionDetails } from '@/pages/transaction/trading-fabric-inspection-dtails';
import TradingFabricInspectionManagement from '@/pages/transaction/trading-fabric-inspection-management';
import { FinishFabricInspection } from '@/pages/transaction/finish-fabric-inspection';
import OldFabricStockUpload from '@/pages/transaction/old-fabric-stock-upload';
import BeamOpeningStockUpload from '@/pages/transaction/beam-opening-stock';
import YarnSalesOrderList from '@/pages/transaction/yarn-sales-order-list';
import YarnSalesOrderEntry from '@/pages/transaction/yarn-sales-order-entry';
import YarnChallan from '@/pages/transaction/yarn-challan';
import { YarnChallanDetails } from '@/pages/transaction/yarn-challan-details';
import YarnDeliveryChallanPrint from '@/pages/transaction/yarn-delivery-challan-print';
import PackingListPrint from '@/pages/transaction/packing-list-print';
import SizingPlanPrint from '@/pages/transaction/sizing-plan-print';
import { dynamicIdConfig } from './dynamicIdConfig';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { getAllReports } from '@/state/reportConfigSlice';
import { toReportSlug } from '@/lib/utils';
import PaginationDemo from '@/components/common/Pagination';
import ReportViewer from '@/pages/reports/ReportViewer';
import BrushingStockLedger from '@/pages/reports/BrushingStockLedger';
import BrushingStockLedgerReport from '@/pages/reports/BrushingStockLedgerReport';
import BrushingStockLedgerView from '@/pages/reports/BrushingStockLedgerView';
import GenerateReport from '@/pages/reports/GenerateReport';
import WeavingProductionLiveReport from '@/pages/reports/WeavingProductionLiveReport';
import WeavingProductionReportView from '@/pages/reports/WeavingProductionReportView';
import CommonReportView from '@/pages/reports/CommonReportView';
import NumberFormatConfigurationList from '@/pages/transaction/number-format-configuration-list';
import NumberFormatConfigurationForm from '@/pages/transaction/number-format-configuration';
import OpeningBalance from '@/pages/transaction/opening-balance';
import OpeningBalanceDetails from '@/pages/transaction/opening-balance-details';
import AgentMaster from '@/pages/masters/agent-master';
import QualityMaster from '@/pages/masters/quality-master';
import AgentForm from '@/pages/masters/agent-form';
import ItemMasterDetail from '@/pages/masters/item-master-detail';
import ItemMasterForm from '@/pages/masters/item_master';
import { PoTypeMaster } from '@/pages/masters/po-type-master';
import ReportConfigurationList from '@/pages/settings/report-configuration-list';
import ReportConfigurationForm from '@/pages/settings/report-configuration-form';
import CostingList from '@/pages/transaction/costing-list';
import CostingForm from '@/pages/transaction/costing-form';
import StockTransferList from '@/pages/transaction/stock-transfer';
import StockTransferDetails from '@/pages/transaction/stock-transfer-details';
import SalesReturnManagement from '@/pages/transaction/sales-return-management';
import { SalesReturnForm } from '@/pages/transaction/sales-return';
import { SalesReturnDetails } from '@/pages/transaction/sales-return-details';
import ItemOutward from '@/pages/transaction/item-outward';
import ItemOutwardStockDetails from '@/pages/transaction/item-outward-stock-details';
import { PortMaster } from '@/pages/masters/port-master';
import { TransportMaster } from '@/pages/masters/transport-master';
import { TransportForm } from '@/pages/masters/transport-form';
import ApprovalSummaryPage from '@/pages/transaction/approval-summary';
import ApprovalListPage from '@/pages/transaction/approval-list';
import ApprovalNotificationPage from '@/pages/transaction/approval-notification';
import WorkingTimeFixingList from '@/pages/settings/working-time-fixing-list';
import WorkingTimeFixing from '@/pages/settings/working-time-fixing';
import SalaryManagement from '@/pages/settings/salary-management';
import SalaryReportPage from '@/pages/settings/salary-report';
import EmployeePayoutListPage from '@/pages/settings/employee-payout-list';
import EmployeePayoutAddPage from '@/pages/settings/employee-payout-add';
import SalaryReportViewPage from '@/pages/settings/salary-report-view';
import SalaryReportGenerate from '@/pages/settings/SalaryReportGenerate';
import { FactoryFabricInspectionDetails } from '@/pages/transaction/fabric-inspection-dtails';
import AgencyContractsPage from '@/pages/agency/AgencyContractsPage';
import AgencyContractEntryPage from '@/pages/agency/AgencyContractEntryPage';
import AgencyMillDispatchPage from '@/pages/agency/AgencyMillDispatchPage';
import AgencyMillDispatchEntryPage from '@/pages/agency/AgencyMillDispatchEntryPage';
import AgencyPaymentRealizationPage from '@/pages/agency/AgencyPaymentRealizationPage';
import AgencyPaymentRealizationEntryPage from '@/pages/agency/AgencyPaymentRealizationEntryPage';
import AgencyBuyerOutstandingPage from '@/pages/agency/AgencyBuyerOutstandingPage';
import AgencyCommissionStatementPage from '@/pages/agency/AgencyCommissionStatementPage';
import AgencyCommissionStatementEntryPage from '@/pages/agency/AgencyCommissionStatementEntryPage';
import AgencyPlaceholderPage from '@/pages/agency/AgencyPlaceholderPage';




function DynamicIdWrapper() {
  const location = useLocation();
  const [params] = useSearchParams();

  const path = location.pathname;

  const config = dynamicIdConfig[path];

  if (!config) {
    return <Outlet />;
  }

  const parentId = params.get(config.parentKey);
  const childId = params.get(config.childKey);

  return (
    <IdsContext.Provider value={{ parentId, childId }}>
      <Outlet />
    </IdsContext.Provider>
  );
}


interface IdsContextType {
  parentId: string | null;
  childId: string | null;
}

export const IdsContext = React.createContext<IdsContextType>({
  parentId: null,
  childId: null,
});

const ReportsPlaceholder: React.FC = () => (
  <div className="p-6 pt-16">
    <h1 className="text-2xl font-semibold">Reports</h1>
    <p className="mt-2 text-sm text-gray-600">No reports configured yet.</p>
  </div>
);



const RoutesConfig: React.FC = () => {
  const { isInitializing, isAuthenticated, selectedCompany } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { reportList, fetched, loading, lastFetchedCompanyId } = useSelector((state: RootState) => state.reportConfig);
  useEffect(() => {
    const shouldFetch = !fetched || (selectedCompany !== null && selectedCompany !== lastFetchedCompanyId);
    if (shouldFetch && !loading) {
      dispatch(getAllReports({ companyId: selectedCompany }));
    }
  }, [dispatch, fetched, loading, selectedCompany, lastFetchedCompanyId]);

  const firstReportSlug = reportList && reportList.length > 0
    ? toReportSlug(reportList[0]?.reportName ?? '', reportList[0]?.id ?? reportList[0]?.reportName ?? '')
    : null;

  const routesJSX = useMemo(() => (
    <Routes>
      {/* Public Route for Login */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Public Print Route */}
      <Route path="/transaction/yarn-delivery-challan-print" element={<YarnDeliveryChallanPrint />} />
      <Route path="/transaction/packing-list-print" element={<PackingListPrint />} />
      <Route path="/transaction/sizing-plan-print/:id" element={<SizingPlanPrint />} />
      <Route path="/transaction/barcode-sticker" element={<BarcodeStickerPage />} />
      <Route path="/transaction/barcode-sticker-fabric-items" element={<BarcodeStickerFabricItemsPage />} />

      {/* Protected Routes */}
      <Route element={<DynamicIdWrapper />}>
        <Route
          path="/*"
          element={<PrivateRoute />}
        >
          <Route index element={<Dashboard />} title="Dashboard" hideTitle={true} />
          <Route path="dashboard" element={<Dashboard />} title="Dashboard" hideTitle={true} />
          {/* Masters Routes */}
          <Route path="masters">
            <Route path="category" element={<CategoryMaster />} title="Category Master" />
            <Route path="sub-category" element={<SubCategoryMaster />} title="Sub Category Master" />
            <Route path="yarn-master" element={<YarnMaster />} title="Yarn Master" />
            <Route path="woven-fabric-master" element={<WovenFabricMaster />} title="Woven Fabric Master" />
            <Route path="knitted-fabric-master" element={<KnittedFabricMaster />} title="Knitted Fabric Master" />
            <Route path="fabric-type" element={<FabricTypeMaster />} title="Fabric Type Master" />
            <Route path="fabric-category" element={<FabricCategoryMaster />} title="Fabric Category Master" />
            <Route path="customer" element={<CustomerMaster />} title="Customer Master" />
            <Route path="vendor" element={<VendorMaster />} title="Supplier/Vendor Master" />
            <Route path="mill" element={<MillMaster />} title="Mill Master" />

            <Route path="consignee" element={<ConsigneeMaster />} title="Consignee Master" />
            <Route path="uom-master" element={<UomMaster />} title="UOM Master" />
            <Route path="gst-master" element={<GstMaster />} title="GST Master" />
            <Route path="finishFabric-master" element={<FinishFabricMaster />} title="Finish Fabric Master" />
            <Route path="flange-master" element={<FlangeMaster />} title="Flange Master" />
            <Route path="warehouse" element={<WarehouseMaster />} title="Warehouse Master" />
            <Route path="loom-master" element={<LoomMaster />} title="Loom Master" />
            <Route path="shift-master" element={<ShiftMaster />} title="Shift Master" />
            <Route path="machine-master" element={<MachineMaster />} title="Machine Master" />
            <Route path="customer-management" element={<CustomerManagement />} title="Buyer/Customer Management" />
            <Route path="location-management" element={<LocationManagement />} title="Location Management" />
            <Route path="fabric-management" element={<FabricManagement />} title="Sort Master" />
            <Route path="shipment-mode-master" element={<ShipmentModeMaster />} title="Shipment Mode Master" />
            <Route path="shipment-terms-master" element={<ShipmentTermMaster />} title="Shipment Terms Master" />
            <Route path="payment-terms-master" element={<PaymentTermsMaster />} title="Payment Terms Master" />
            <Route path="terms-condition-master" element={<TermsConditionMaster />} title="Terms & Conditions Master" />
            <Route path="currency-master" element={<CurrencyMaster />} title="Currency Master" />
            <Route path="grade-master" element={<GradeMaster />} title="Grade Master" />
            <Route path="defect-master" element={<DefectMaster />} title="Defect Master" />
            <Route path="process-master" element={<ProcessMaster />} title="Process Master" />
            <Route path="agent-master" element={<AgentMaster />} title="Agent Master" hideTitle = {true}  />
            <Route path="quality-master" element={<QualityMaster />} title="Quality Master" />
            <Route path="agent-form" element={<AgentForm />} title="Agent Form" hideTitle = {true}  />
            <Route path="holiday-master" element={<HolidayMaster />} title="Holiday / Festival Master" />
            <Route path="po-type-master" element={<PoTypeMaster />} title="PO Type Master" />
            <Route path="item-master-detail" element={<ItemMasterDetail />} title="Item Master Detail" />
            <Route path="item-master" element={<ItemMasterForm />} title="Item Master" />
            <Route path="port-master" element={<PortMaster />} title="Port Master" />
            <Route path="transport-master" element={<TransportMaster />} title="Transport Master" />
            <Route path="transport-master-add" element={<TransportForm />} title="Add Transport" />
            <Route path="transport-master/edit/:id" element={<TransportForm />} title="Edit Transport" />
          </Route>

          {/* Location Masters */}
          <Route path="location-masters">
            <Route path="country-master" element={<CountryMaster />} title="Country Master" />
            <Route path="state-master" element={<StateMaster />} title="State Master" />
            <Route path="city-master" element={<CityMaster />} title="City Master" />
          </Route>

          {/* Transaction Routes */}
          <Route path="transaction">
            <Route path="sales-order-management" element={<SalesOrderManagement />} title="Sales Order Management" />
            <Route path="order-entry-management" element={<OrderEntryManagement />} title="Order Entry Management" />
            <Route path="approval-management" element={<ApprovalManagement />} title="Approval Management" />
            <Route path="sales-order" element={<SalesOrderEntry />} title="Sales Order" hideTitle = {true} />
            <Route path="sales-order-details" element={<SalesOrderDetails />} title="Sales Order Details" />
            <Route path="sales-order-export-details" element={<SalesOrderExportDetails />} title="Sales Order Export Details" />
            <Route path="purchase-order" element={<PurchaseOrderEntry />} title="Purchase Order" hideTitle = {true} />
            <Route path="purchase-order-details" element={<PurchaseOrderDetails />} title="Purchase Order Details" />
            <Route path="purchase-indent-details" element={<PurchaseIndentDetails />} title="Purchase Indent Details" />
            <Route path="purchase-indent-entry" element={<PurchaseIndentEntry />} title="Purchase Indent Entry" hideTitle = {true} />
            <Route path="purchase-inward" element={<PurchaseInward />} title="Purchase Inward"  hideTitle = {true}/>
            <Route path="purchase-inward-details" element={<PurchaseInwardDetails />} title="Purchase Inward / GRN Details" />
            <Route path="lot-details" element={<LotDetails />} title="Lot Details"  hideTitle = {true}/>
            <Route path="weaving-contract-entry" element={<WeavingContractEntry />} title="Weaving Contract Entry" hideTitle = {true}/>
            <Route path="weaving-contract-details" element={<WeavingContractDetails />} title="Weaving Contract Details" />
            <Route path="weaving-jobwork-order" element={<WeavingJobWorkOrderEntry />} title="Weaving Job Work Order Entry" hideTitle = {true} />
            <Route path="weaving-jobwork-order-details" element={<WeavingJobWorkOrderDetails />} title="Weaving Job Work Order Details" />
            <Route path="sizing-jobwork-order" element={<SizingJobWorkOrderEntry />} title="Sizing Job Work Order Entry" hideTitle = {true}/>
            <Route path="sizing-jobwork-order-details" element={<SizingJobWorkOrderDetails />} title="Sizing Job Work Order Details" />
            <Route path="weaving-yarn-issue" element={<WeavingYarnIssue />} title="Weaving Yarn Issue" hideTitle = {true}/>
            <Route path="weaving-yarn-outward" element={<WeavingYarnOutwardPage />} title="Weaving Yarn Outward" hideTitle = {true}/>
            <Route path="weaving-yarn-outward-details" element={<WeavingYarnOutwardDetails />} title="Weaving Yarn Outward Details" />
            <Route path="jobwork-fabric-receive" element={<JobworkFabricReceive />} title="Jobwork Fabric Receive" hideTitle = {true}/>
            <Route path="trading-fabric-inspection" element={<TradingFabricInspection />} title="Trading Fabric Inspection" hideTitle = {true}/>
            <Route path="trading-fabric-inspection-details" element={<TradingFabricInspectionDetails />} title="Trading Fabric Inspection Details" />
            <Route path="fabric-inspection" element={<FactoryFabricInspection />} title="Factory Fabric Inspection" hideTitle = {true}/>
            <Route path="fabric-inspection-details" element={<FactoryFabricInspectionDetails />} title="Factory Fabric Inspection Details" />
            <Route path="finish-fabric-inspection" element={<FinishFabricInspection />} title="Finish Fabric Inspection" hideTitle = {true}/>
            <Route path="piece-details" element={<PieceDetails />} title="Piece Details" />
            <Route path="old-fabric-stock-upload" element={<OldFabricStockUpload />} title="Upload Old Fabric Stock" />
            <Route path="beam-opening-stock" element={<BeamOpeningStockUpload />} title="Beam Opening Stock" />
            <Route path="invoice" element={<GenerateInvoice />} title="Generate Invoice" hideTitle = {true} />
            <Route path="generate-packing-list" element={<PackingList />} title="Generate Packing List" hideTitle = {true}/>
            <Route path="generate-packing-list-details" element={<PackingListDetails />} title="Generate Packing List Details" />
            <Route path="process-contract-entry" element={<ProcessContractEntry />} title="Process Contract Entry" hideTitle = {true}/>
            <Route path="process-contract-yarn-entry" element={<ProcessContractYarnEntry />} title="Process Contract Yarn Entry" hideTitle = {true}/>
            <Route path="process-contract-details" element={<ProcessContractDetails />} title="Process Contract Details" />
            <Route path="processing-issue" element={<ProcessingIssue />} title="Processing Issue" hideTitle = {true}/>
            <Route path="processing-receive" element={<ProcessingReceive />} title="Processing Receive" hideTitle = {true}/>
            <Route path="flange-issue" element={<FlangeIssue />} title="Flange Issue" hideTitle = {true}/>
            <Route path="sizing-plan-entry" element={<SizingPlanEntry />} title="Sizing Plan Entry" hideTitle = {true} />
            <Route path="sizing-plan-details" element={<SizingPlanDetails />} title="Sizing Plan Details" />
            <Route path="sizing-yarn-issue" element={<SizingYarnIssue />} title="Sizing Yarn Issue" hideTitle = {true}/>
            <Route path="flange-issue-details" element={<FlangeIssueDetails />} title="Flange Issue Details" />
            <Route path="flange-inward" element={<FlangeInwardEntry />} title="Flange Inward" hideTitle = {true}/>
            <Route path="flange-inward-details" element={<FlangeInwardDetails />} title="Flange Inward Details" />
            <Route path="sizing-yarn-issue-details" element={<SizingYarnIssueDetails />} title="Sizing Yarn Issue Details" />
            <Route path="beam-management" element={<BeamManagement />} title="Beam Inward" />
            <Route path="beam-outward" element={<BeamOutwardEntry />} title="Beam Outward" hideTitle = {true} />
            <Route path="beam-outward-details" element={<BeamOutwardDetails />} title="Beam Outward Details" />
            <Route path="beam-outward-view" element={<BeamOutwardView />} title="Beam Outward View" />
            <Route path="factory-beam-inward" element={<FactoryBeamInward />} title="Factory Beam Inward" />
            <Route path="empty-beam-issue" element={<EmptyBeamIssue />} title="Empty Beam Issue" hideTitle = {true} />
            <Route path="empty-beam-issue-details" element={<EmptyBeamIssueDetails />} title="Empty Beam Issue Details" />
            <Route path="flange-management" element={<FlangeManagement />} title="Flange Management" />
            <Route path="beam-inward-entry/:id?" element={<BeamInwardEntry />} title="Beam Inward Entry" hideTitle = {true}/>
            <Route path="factory-beam-inward-entry" element={<FactoryBeamInwardEntry />} title="Factory Beam Inward Entry" hideTitle = {true} />
            <Route path="beam-inward-details" element={<BeamInwardDetails />} title="Beam Inward Details" />
            <Route path="factory-beam-inward-details" element={<FactoryBeamInwardDetails />} title="Factory Beam Inward Details" />
            <Route path="weft-inward" element={<WeftInwardEntry />} title="Weft Inward" hideTitle = {true} />
            <Route path="weft-inward-details" element={<WeftInwardDetails />} title="Weft Inward Details" />
            <Route path="sizing-yarn-inward" element={<SizingYarnInwardEntry />} title="Sizing Yarn Inward" hideTitle = {true}/>
            <Route path="sizing-yarn-inward-details" element={<SizingYarnInwardDetails />} title="Sizing Yarn Inward Details" />
            <Route path="sizing-yarn-outward" element={<SizingYarnOutwardPage />} title="Sizing Yarn Outward" hideTitle = {true}/>
            <Route path="sizing-yarn-outward-details" element={<SizingYarnOutwardDetails />} title="Sizing Yarn Outward Details" />
            <Route path="sizing-production" element={<SizingProduction />} title="Sizing Production" />
            <Route path="sizing-production-form" element={<SizingProductionFormPage />} title="Sizing Production Form" hideTitle = {true}/>
            <Route path="sizing-production-form/:id" element={<SizingProductionFormPage />} title="Sizing Production Form" hideTitle = {true}/>
            <Route path="sizing-beam-outward" element={<SizingBeamOutward />} title="Sizing Beam Outward" />
            <Route path="sizing-beam-outward-form" element={<SizingBeamOutwardFormPage />} title="Sizing Beam Outward Form" hideTitle = {true}/>
            <Route path="sizing-beam-outward-form/:id" element={<SizingBeamOutwardFormPage />} title="Sizing Beam Outward Form" hideTitle = {true}/>
            <Route path="warping-production" element={<WarpingProduction />} title="Warping Production" />
            <Route path="warping-production-form" element={<WarpingProductionFormPage />} title="Warping Production Form" hideTitle = {true} />
            <Route path="warping-production-form/:id" element={<WarpingProductionFormPage />} title="Warping Production Form" hideTitle = {true}/>
            <Route path="weaving-production" element={<WeavingProduction />} title="Weaving Production" />
            <Route path="weaving-production-form" element={<WeavingProductionFormPage />} title="Weaving Production Form" hideTitle = {true}/>
            <Route path="weaving-production-form/:id" element={<WeavingProductionFormPage />} title="Weaving Production Form" hideTitle = {true}/>
            <Route path="beam-gaiting" element={<BeamGaitingEntry />} title="Beam Gaiting" hideTitle = {true} />
            <Route path="beam-gaiting-details" element={<BeamGaitingDetails />} title="Beam Gaiting/Knotting Details" />
            <Route path="beam-card" element={<BeamCardPage />} title="Beam Card" hideTitle = {true}/>
            <Route path="beam-card/:beamNo" element={<BeamCardPage />} title="Beam Card" hideTitle = {true} />
            <Route path="beam-card-report" element={<BeamCardReportPage />} title="Beam Card Report" hideTitle = {true} />
            <Route path="beam-card-report/:beamNo" element={<BeamCardReportPage />} title="Beam Card Report" hideTitle = {true} />
            <Route path="beam-cut" element={<BeamCutEntry />} title="Beam Cut" hideTitle = {true}/>
            <Route path="beam-cut-details" element={<BeamCutDetails />} title="Beam Cut Details" />
            <Route path="piece-split-join" element={<PieceSplitJoinPage />} title="Piece Split/Join" hideTitle = {true} />
            <Route path="piece-split-join-details" element={<PieceSplitJoinDetails />} title="Piece Split/Join Details" />
            <Route path="doffing-entry" element={<DoffingEntryPage />} title="Doffing Entry" hideTitle = {true}/>
            <Route path="weaving-issue-details" element={<WeavingIssueDetails />} title="Weaving Issue Details" />
            <Route path="jobwork-fabric-receive-details" element={<JobworkFabricReceiveDetails />} title="Jobwork Fabric Receive Details" />
            <Route path="processing-issue-details" element={<ProcessingIssueDetails />} title="Processing Issue Details" />
            <Route path="packing-list-mamagement" element={<PackingListManagement />} title="Packing List Management" />
            <Route path="scan-dispatch" element={<ScanDispatchRegister />} title="Scan Dispatch" />
            <Route path="scan-dispatch-entry" element={<ScanDispatchEntry />} title="Scan Dispatch Entry" />
            <Route path="invoice-details" element={<InvoiceDetails />} title="Invoice Details" />
            <Route path="invoice-print" element={<InvoicePrint />} title="Invoice Print" />
            <Route path="finish-fabric-receive-details" element={<FinishFabricReceiveDetails />} title="Finish Fabric Receive Details" />
            <Route path="process-contract-managemant" element={<ProcessContactManagement />} title="Process Contract Management" />
            <Route path="processing-issue-management" element={<ProcessingIssueManagement />} title="Processing Issue Management" />
            <Route path="processing-receive-management" element={<ProcessingReceiveManagement />} title="Processing Receive Management" />
            <Route path="invoice-management" element={<InvoiceManagement />} title="Invoice Management" />
            <Route path="trading-fabric-inspection-management" element={<TradingFabricInspectionManagement />} title="Trading Fabric Inspection Management" />
            <Route path="finish-fabric-inspection-details" element={<FinishFabricInspectionDetails />} title="Finish Fabric Inspection Details" />
            <Route path="bale-roll-packing-details" element={<BaleRollPackingDetails />} title="Bale Roll Packing Details" />
            <Route path="bale-roll-packing" element={<BaleRollPacking />} title="Bale Roll Packing" hideTitle = {true}/>
            <Route path="finish-yarn-receive-details" element={<FinishYarnReceiveDetails />} title="Finish Yarn Receive Details" />
            <Route path="processing-receive-fabric" element={<ProcessingReceiveFabric />} title="Processing Receive Fabric" hideTitle = {true} />
            <Route path="processing-receive-yarn" element={<ProcessingReceiveYarn />} title="Processing Receive Yarn" hideTitle = {true} />
            <Route path="processing-issue-fabric-details" element={<ProcessingIssueFabricDetails />} title="Processing Issue Fabric Details" />
            <Route path="processing-fabric-issue" element={<ProcessingFabricIssue />} title="Processing Fabric Issue" hideTitle = {true} />
            <Route path="processing-yarn-issue" element={<ProcessingYarnIssue />} title="Processing Yarn Issue" hideTitle = {true}/>
            <Route path="brushing-receive" element={<BrushingReceive />} title="Brushing Fabric Receive" hideTitle={true} />
            <Route path="brushing-receive-details" element={<BrushingReceiveDetails />} title="Brushing Fabric Receive Details" />
            <Route path="brushing-process-flow" element={<BrushingProcessFlow />} hideTitle={true} />
            <Route path="brushing-unwind-rolls" element={<BrushingProcessFlow activeTabProp="unwinding"/>}  />
            <Route path="brushing-rolling" element={<BrushingProcessFlow activeTabProp="rolling" />} />
            <Route path="brushing-ready-dispatch" element={<BrushingProcessFlow activeTabProp="dispatch" />} />
            <Route path="brushing-return" element={<BrushingReturn />} title="Brushing Return" />
            <Route path="brushing-reject" element={<BrushingReject />} title="Brushing Reject" />
            <Route path="brushing-stock" element={<BrushingStock />} title="Opening Dispatched Rolls" />
            <Route path="brushing-stock-ledger" element={<BrushingStockLedger />} hideTitle={true}/>
            <Route path="brushing-stock-ledger-report" element={<BrushingStockLedgerReport />} hideTitle={true}/>
            <Route path="brushing-stock-ledger-view" element={<BrushingStockLedgerView />} hideTitle={true}/>
            <Route path="brushing-unit-fabric-status" element={<BrushingUnitFabricStatus />} hideTitle={true}/>
            <Route path="yarn-return-details" element={<YarnReturnDetails />} title="Yarn Return Details" />
            <Route path="yarn-return" element={<YarnReturn />} title="Yarn Return" hideTitle = {true}  />
            <Route path="purchase-return-details" element={<PurchaseReturnDetails />} title="Purchase Return / GRN Return Details" />
            <Route path="purchase-return" element={<PurchaseReturnEntry />} title="Purchase Return / GRN Return" hideTitle = {true} />
            <Route path="yarn-sales-order-list" element={<YarnSalesOrderList />} title="Yarn Sales Order List" />
            <Route path="yarn-sales-order-entry" element={<YarnSalesOrderEntry />} title="Yarn Sales Order Entry" hideTitle = {true}/>
            <Route path="yarn-challan" element={<YarnChallan />} title="Yarn Challan" hideTitle = {true}/>
            <Route path="yarn-challan-management" element={<YarnChallanDetails />} title="Yarn Challan Management" />
           
            <Route path='opening-balance' element={<OpeningBalance />} title="Opening Balance" />
            <Route path='opening-balance-details' element={<OpeningBalanceDetails />} title="Opening Balance Details" hideTitle = {true}/>
            <Route path="costing-list" element={<CostingList />} title="Costing List" />
            <Route path="costing-form/:id?" element={<CostingForm />} title="Costing Form" hideTitle = {true}/>
            <Route path="stock-transfers" element={<StockTransferList />} title="Stock Transfers" />
            <Route path="stock-transfer-details" element={<StockTransferDetails />} title="Stock Transfer Details" hideTitle = {true}/>
            <Route path="sales-return-management" element={<SalesReturnManagement />} title="Sales Return Management" />
            <Route path="sales-return" element={<SalesReturnForm />} title="Sales Return" hideTitle = {true}/>
            <Route path="sales-return-details" element={<SalesReturnDetails />} title="Sales Return Details" />
            <Route path="item-outward" element={<ItemOutward />} title="Material Issue"/>
            <Route path="item-outward-stock-details" element={<ItemOutwardStockDetails />} title="Material Issue Stock Details" hideTitle = {true}/>
          </Route>

          <Route path="settings">
            <Route path="application-user" element={<ApplicationUserPage />} title="Application User" />
            <Route path="company" element={<CompanyMaster />} title="Company Master" />
            <Route path="employee" element={<EmployeePage />} title="Employee" />
            <Route path="employee-master" element={<EmployeeMasterPage />} title="Employee Master" />
            <Route path="working-time-fixing-list" element={<WorkingTimeFixingList />} title="Working Time Fixing List" />
            <Route path="working-time-fixing" element={<WorkingTimeFixing />} title="Working Time Fixing" />
            <Route path="attendance" element={<AttendanceDownloadPage />} title="Attendance" />
            <Route path="employee-relieved" element={<EmployeeRelievedPage />} title="Employee Relieved" />
            <Route path="employee-growth" element={<EmployeeGrowthPage />} title="Employee Growth" />
            <Route path="leave-requests" element={<LeaveRequestsPage />} title="Leave & Requests" />
            <Route path="menu-master" element={<MenuMasterPage />} title="Menu Master" />
            <Route path="level1-menu" element={<Level1MenuPage />} title="Level 1 Menu" />
            <Route path="level2-menu" element={<Level2MenuPage />} title="Level 2 Menu" />
            <Route path="report-configuration-list" element={<ReportConfigurationList />} title="Report Configuration List" />
            <Route path="report-configuration-form" element={<ReportConfigurationForm />} title="Report Configuration" />
            <Route path="approval-summary" element={<ApprovalSummaryPage />} title="Approval Summary" />
            <Route path="approval-list" element={<ApprovalListPage />} title="Approval List" />
            <Route path="approval-notification/:id" element={<ApprovalNotificationPage />} title="Approval Notification" />
            <Route path="salary-management" element={<SalaryManagement />} title="Salary Management" />
            <Route path="salary-report" element={<SalaryReportPage />} title="Salary Report" />
            <Route path="salary-report-view" element={<SalaryReportGenerate />} title="Salary Report View" hideTitle={true} />
            <Route path="salary-report-list" element={<SalaryReportViewPage />} title="Salary Report List" hideTitle={true} />
            <Route path="salary-advance" element={<EmployeePayoutListPage />} title="Salary Advance/Loan" />
            <Route path="salary-advance-add" element={<EmployeePayoutAddPage />} title="Salary Advance/Loan Add" hideTitle = {true} />
            <Route path="attendance-incentive" element={<AttendanceIncentivePage />} title="Attendance Incentive" hideTitle = {true} />
            <Route path="canteen-deduction" element={<CanteenDeductionPage />} title="Canteen Deduction" />
            <Route path="employee-property-assignment" element={<EmployeePropertyAssignmentPage />} title="Employee Property Assignment" hideTitle = {true} />
            <Route path="property-assignment" element={<EmployeePropertyAssignmentPage />} title="Employee Property Assignment" hideTitle = {true} />
             <Route path="number-format-configuration-list" element={<NumberFormatConfigurationList />} title="Number Format Configuration List" />
            <Route path="number-format-configuration" element={<NumberFormatConfigurationForm />} title="Number Format Configuration" hideTitle = {true}/>
          </Route>

          <Route path="hr">
            <Route path="attendance-incentive" element={<AttendanceIncentivePage />} title="Attendance Incentive" hideTitle = {true} />
            <Route path="canteen-deduction" element={<CanteenDeductionPage />} title="Canteen Deduction" hideTitle = {true} />
            <Route path="employee-property-assignment" element={<EmployeePropertyAssignmentPage />} title="Employee Property Assignment" hideTitle = {true} />
            <Route path="property-assignment" element={<EmployeePropertyAssignmentPage />} title="Employee Property Assignment" hideTitle = {true} />
          </Route>

          {/* Agency Module Routes */}
          <Route path="agency">
            <Route path="order-status" element={<AgencyContractsPage />} title="Order Status & Contracts" />
            <Route path="contracts" element={<AgencyContractsPage />} title="Agency Contracts" />
            <Route path="contract-entry" element={<AgencyContractEntryPage />} title="Contract Entry"  hideTitle={true}/>
            <Route path="mill-dispatch" element={<AgencyMillDispatchPage />} title="Mill Dispatch Tracking" hideTitle={true}/>
            <Route path="mill-dispatch-entry" element={<AgencyMillDispatchEntryPage />} title="Mill Dispatch Entry" hideTitle={true} />
            <Route path="payment-realization" element={<AgencyPaymentRealizationPage />} title="Payment Realization" hideTitle = {true}/>
            <Route path="payment-realization-entry" element={<AgencyPaymentRealizationEntryPage />} title="Payment Realization Entry" hideTitle={true} />
            <Route path="buyer-outstanding" element={<AgencyBuyerOutstandingPage />} title="Buyer Outstanding" hideTitle = {true} />
            <Route path="commission-statement" element={<AgencyCommissionStatementPage />} title="Commission Statement" hideTitle = {true} />
            <Route path="commission-statement-entry" element={<AgencyCommissionStatementEntryPage />} title="Commission Bill Entry" hideTitle={true} />
          </Route>

          {/* Reports */}
          <Route path="reports">
            <Route
              index
              element={
                firstReportSlug
                  ? <Navigate to={`/reports/${firstReportSlug}`} replace />
                  : <ReportsPlaceholder />
              }
              title="Reports"
            />
            <Route path="generate-report" element={<GenerateReport />} title="Generate Report" hideTitle = {true} />
            <Route path="weaving-production-report" element={<WeavingProductionLiveReport />} title="Weaving Production Live Report" hideTitle = {true} />
            <Route path="weaving-production-report-view" element={<WeavingProductionReportView />} title="Weaving Production Report View" hideTitle = {true} />
            <Route path="common-report-view" element={<CommonReportView />} title="Common Report View" hideTitle = {true}/>
            <Route path=":reportSlug" element={<ReportViewer />} title="Report Viewer" />
          </Route>
        </Route>
        <Route path="common">
          <Route path="pagination" element={<PaginationDemo />} title="Pagination" />
        </Route>
      </Route>
      {/* Redirect unknown routes to login or dashboard based on auth state */}
      <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
    </Routes>
  ), [isAuthenticated, firstReportSlug]);

  const titleMap = useMemo(() => buildRouteMap(routesJSX.props.children), [routesJSX]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <TitleContext.Provider value={{ titleMap }}>
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            {routesJSX}
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
          </div>
        </div>
      </div>
    </TitleContext.Provider>
  );
};

export default RoutesConfig;