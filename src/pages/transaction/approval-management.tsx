import { useState } from "react";
import SalesOrderApprovalManagement from "./sales-order-approval-management";
import PurchaseOrderApprovalManagement from "./purchase-order-approval-management";
import PurchaseIndentApprovalManagement from "./purchase-indent-approval-management";
import SizingJobWorkOrderApprovalManagement from "./sizing-jobwork-order-approval-management";
import WeavingJobWorkOrderApprovalManagement from "./weaving-jobwork-order-approval-management";
import AgencyContractApprovalManagement from "./agency-contract-approval-management";

export default function ApprovalManagement() {
  const [activeTab, setActiveTab] = useState("salesOrder");

  return (
    <div className="p-6 pt-16">

      {/* Main Tabs */}
      <div className="flex flex-wrap gap-6 border-b mb-4">
        <button
          className={`pb-3 px-2 transition-all ${
            activeTab === "salesOrder"
              ? "border-b-2 border-primary-500 text-primary-600 font-bold"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("salesOrder")}
        >
          Sales Order Management
        </button>
        <button
          className={`pb-3 px-2 transition-all ${
            activeTab === "purchaseOrder"
              ? "border-b-2 border-primary-500 text-primary-600 font-bold"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("purchaseOrder")}
        >
          Purchase Order
        </button>
        <button
          className={`pb-3 px-2 transition-all ${
            activeTab === "purchaseIndent"
              ? "border-b-2 border-primary-500 text-primary-600 font-bold"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("purchaseIndent")}
        >
          Purchase Indent
        </button>
        <button
          className={`pb-3 px-2 transition-all ${
            activeTab === "sizingJobWorkOrder"
              ? "border-b-2 border-primary-500 text-primary-600 font-bold"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("sizingJobWorkOrder")}
        >
          Sizing JobWork Order
        </button>

        <button
          className={`pb-3 px-2 transition-all ${
            activeTab === "weavingJobWorkOrder"
              ? "border-b-2 border-primary-500 text-primary-600 font-bold"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("weavingJobWorkOrder")}
        >
          Weaving JobWork Order
        </button>
        <button
          className={`pb-3 px-2 transition-all ${
            activeTab === "agencyContract"
              ? "border-b-2 border-primary-500 text-primary-600 font-bold"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("agencyContract")}
        >
          Agency Sales Contract
        </button>
        {/* Support for future tabs */}
        <button
          disabled
          className="pb-3 px-2 text-gray-300 cursor-not-allowed"
          title="Coming soon"
        >
          More...
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 min-h-[600px]">
        {activeTab === "salesOrder" && <SalesOrderApprovalManagement />}
        {activeTab === "purchaseOrder" && <PurchaseOrderApprovalManagement />}
        {activeTab === "purchaseIndent" && <PurchaseIndentApprovalManagement />}
        {activeTab === "sizingJobWorkOrder" && <SizingJobWorkOrderApprovalManagement />}
        {activeTab === "weavingJobWorkOrder" && <WeavingJobWorkOrderApprovalManagement />}
        {activeTab === "agencyContract" && <AgencyContractApprovalManagement />}
      </div>
    </div>
  );
}
