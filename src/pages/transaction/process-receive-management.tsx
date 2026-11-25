import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FinishFabricReceiveDetails } from "./finish-fabric-receive-details";
import { FinishYarnReceiveDetails } from "./finish-yarn-receive-details";

export default function ProcessingReceiveManagement() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"fabric" | "yarn">("fabric");

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state?.activeTab]);

  return (
    <div className="p-6 pt-16">

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        <button
          className={`pb-2 px-4 ${
            activeTab === "fabric" 
              ? "border-b-2 border-blue-500 text-blue-500 font-semibold" 
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("fabric")}
        >
          Processing Receive Fabric
        </button>
        <button
          className={`pb-2 px-4 ${
            activeTab === "yarn" 
              ? "border-b-2 border-blue-500 text-blue-500 font-semibold" 
              : "text-gray-600"
          }`}
          onClick={() => setActiveTab("yarn")}
        >
          Processing Receive Yarn
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "fabric" && <FinishFabricReceiveDetails />}
        {activeTab === "yarn" && <FinishYarnReceiveDetails />}
      </div>
    </div>
  );
}