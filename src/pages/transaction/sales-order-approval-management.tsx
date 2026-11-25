import { useState } from "react";
import { SalesOrderExportApprovalDetails } from "./sales-order-export-approval-details";
import { SalesOrderApprovalDetails } from "./sales-order-approval-details";

export default function SalesOrderApprovalManagement() {
  const [activeTab, setActiveTab] = useState("domestic");

  return (
    <div className="p-4">
      {/* Sub Tabs */}
      <div className="flex gap-4 border-b mb-6">
        <button
          className={`pb-2 px-4 transition-colors ${
            activeTab === "domestic"
              ? "border-b-2 border-primary-500 text-primary-600 font-semibold"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("domestic")}
        >
          Domestic
        </button>
        <button
          className={`pb-2 px-4 transition-colors ${
            activeTab === "export"
              ? "border-b-2 border-primary-500 text-primary-600 font-semibold"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("export")}
        >
          Export
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "domestic" && <SalesOrderApprovalDetails />}
        {activeTab === "export" && <SalesOrderExportApprovalDetails />}
      </div>
    </div>
  );
}
