import { useState } from "react";
import { PackingListDetails } from "./generate-packing-list-details";
import { useLocation } from "react-router-dom";

export default function PackingListManagement() {

  const location = useLocation();
  const defaultTab = location.state?.tab || "domestic";
  const [activeTab, setActiveTab] = useState(defaultTab);
  // const [activeTab, setActiveTab] = useState("domestic");

  return (
    <div className="p-6 pt-16">
        <PackingListDetails />
    </div>
  );
}
