import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FactoryFabricInspectionDetails } from "./fabric-inspection-dtails";
import { TradingFabricInspectionDetails } from "./trading-fabric-inspection-dtails";

const tabs: { id: "factory" | "trading"; label: string }[] = [
  { id: "factory", label: "Factory" },
  { id: "trading", label: "Trading" },
];

export function FabricInspectionDetails() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"factory" | "trading">("factory");

  // Update tab based on location state
  useEffect(() => {
    const locationState = location.state as any;
    if (locationState?.returnTab === 'factory') {
      setActiveTab('factory');
    } else if (locationState?.returnTab === 'trading') {
      setActiveTab('trading');
    }
  }, [location.state]);

  return (
    <div className="space-y-6">
      {/* <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Greige Fabric Inspection</h1>
          </div>
        </div>
       
      </div> */}

      <div>
         <div className="mt-5 flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeTab === "factory" ? (
          <FactoryFabricInspectionDetails />
        ) : (
          <TradingFabricInspectionDetails hideHeader />
        )}
      </div>
    </div>
  );
}
