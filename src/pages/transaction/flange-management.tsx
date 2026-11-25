import { useState } from "react";
import BeamInwardEntry from "./beam-inward-entry";
import { BeamInwardDetails } from "./beam-inward-details";
import { useLocation } from "react-router-dom";
import { FlangeIssueDetails } from "./flange-issue-details";


export default function FlangeManagement() {

  const location = useLocation();
  const defaultTab = location.state?.tab || "beamInward";
  const [activeTab, setActiveTab] = useState(defaultTab);
  // const [activeTab, setActiveTab] = useState("emptyBeam");

  return (
    <div className="p-6 pt-16">
      {/* <h1 className="text-2xl font-semibold mb-4">Flange Management</h1> */}
      <div>
        <FlangeIssueDetails />
      </div>
    </div>
  );
}