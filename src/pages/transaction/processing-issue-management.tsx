import { useState } from "react";
import { useLocation } from "react-router-dom";
import { ProcessContractDetails } from "./process-contract-details";
import { ProcessingIssueYarnDetails } from "./processing-issue-yarn-details";
import { ProcessingIssueFabricDetails } from "./processing-issue-fabric-details";


export default function ProcessingIssueManagement() {

  const location = useLocation();
  const initialTab = (location.state as any)?.activeTab || "processIssueFabric";
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="p-6 pt-16">

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        <button
          className={`pb-2 px-4 ${activeTab === "processIssueFabric" ? "border-b-2 border-blue-500 text-blue-500 font-semibold" : "text-gray-600"}`}
          onClick={() => setActiveTab("processIssueFabric")}
        >
          Processing Issue Fabric
        </button>
        <button
          className={`pb-2 px-4 ${activeTab === "processIssueYarn" ? "border-b-2 border-blue-500 text-blue-500 font-semibold" : "text-gray-600"}`}
          onClick={() => setActiveTab("processIssueYarn")}
        >
          Processing Issue Yarn
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "processIssueFabric" && (
          <div>
            <ProcessingIssueFabricDetails />
          </div>
        )}
        {activeTab === "processIssueYarn" && (
          <div>
            <ProcessingIssueYarnDetails />
          </div>
        )}
      </div>
    </div>
  );
}
