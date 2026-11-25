import { useState } from "react";
import { EmptyBeamIssueDetails } from "./empty-beam-issue-details";
import BeamInwardEntry from "./beam-inward-entry";
import { useLocation } from "react-router-dom";
import { FactoryBeamInwardDetails } from "./factory-beam-inward-details";


export default function FactoryBeamInward() {

  const location = useLocation();
  const defaultTab = location.state?.tab || "beamInward";
  const [activeTab, setActiveTab] = useState(defaultTab);
  // const [activeTab, setActiveTab] = useState("emptyBeam");

  return (
    <div className="p-6 pt-16">
      {/* Tab Content */}
      <div>
         <FactoryBeamInwardDetails />
        {/* {activeTab === "beamInward" && (
          <div>
            <BeamInwardDetails />
          </div>
        )}
          {activeTab === "emptyBeam" && (
          <div>
            <EmptyBeamIssueDetails />
          </div>
        )} */}
      </div>
    </div>
  );
}