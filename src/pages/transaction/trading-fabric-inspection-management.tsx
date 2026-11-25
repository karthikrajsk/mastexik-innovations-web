import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { FabricInspectionDetails } from "./greige-fabric-inspection";
import { FinishFabricInspectionDetails } from "./finish-fabric-inspection-dtails";


export default function TradingFabricInspectionManagement() {

  const location = useLocation();
  const defaultTab = location.state?.tab || "greigeFabricInspection";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Update tab when location state changes
  React.useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  return (
    <div className="p-6 pt-16">

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        <button
          className={`pb-2 px-4 ${activeTab === "greigeFabricInspection" ? "border-b-2 border-blue-500 text-blue-500 text-sm font-semibold" : "text-gray-600 text-sm"}`}
          onClick={() => setActiveTab("greigeFabricInspection")}
        >
          Greige Fabric Inspection
        </button> 
        <button
          className={`pb-2 px-4 ${activeTab === "finishedFabricInspection" ? "border-b-2 border-blue-500 text-blue-500 font-semibold text-sm" : "text-gray-600 text-sm"}`}
          onClick={() => setActiveTab("finishedFabricInspection")}
        >
          Finished Fabric Inspection
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "greigeFabricInspection" && (
          <div>
            <FabricInspectionDetails />
          </div>
        )}
        {activeTab === "finishedFabricInspection" && (
          <div>
            <FinishFabricInspectionDetails />
          </div>
        )}
      </div>
    </div>
  );
}