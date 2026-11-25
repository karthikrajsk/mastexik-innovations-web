import { useState } from "react";
import { EmptyBeamIssueDetails } from "./empty-beam-issue-details";
import BeamInwardEntry from "./beam-inward-entry";
import { BeamInwardDetails } from "./beam-inward-details";
import { useLocation } from "react-router-dom";


export default function BeamManagement() {

  const location = useLocation();
  const defaultTab = location.state?.tab || "beamInward";
  const [activeTab, setActiveTab] = useState(defaultTab);
  // const [activeTab, setActiveTab] = useState("emptyBeam");

  return (
    <div className="p-6 pt-16">
      

      {/* Tab Content */}
      <div>
         <BeamInwardDetails />
       
      </div>
    </div>
  );
}