import { useState } from "react";
import { useLocation } from "react-router-dom";
import { FabricInspectionDetails } from "./greige-fabric-inspection";


export default function FactoryFabricInspectionManagement() {

  const location = useLocation();
  const defaultTab = location.state?.tab || "greigeFabricInspection";
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="p-6 pt-16">
      {/* <h1 className="text-2xl font-semibold mb-4">Fabric Inspection Management</h1> */}
   
       <FabricInspectionDetails />
     
    </div>
  );
}