import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch, RootState } from "@/state/store";
import { getAllEmployees } from "@/state/employeeSlice";
import { Button } from "@/components/ui/button";
import { Calendar, Layers, Printer, FileText, Briefcase, UserCheck } from "lucide-react";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import { toast } from "react-toastify";

export default function SalaryReportGenerate() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { employeeList } = useSelector((state: RootState) => state.employee);

  const [filterType, setFilterType] = useState<"month" | "range" | "single">("month");
  const [month, setMonth] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [singleDate, setSingleDate] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<"A-Unit" | "C-Unit" | "">("A-Unit");
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [pfFilter, setPfFilter] = useState<"all" | "pf" | "non-pf">("all");

  useEffect(() => {
    dispatch(getAllEmployees({ fetchAll: true }));
  }, [dispatch]);

  // Extract unique departments and designations from employeeList
  const departments = useMemo(() => {
    const set = new Set<string>();
    (employeeList || []).forEach((emp: any) => {
      const dep = emp.employmentDetails?.department || emp.department;
      if (dep && dep.trim()) {
        set.add(dep.trim());
      }
    });
    return Array.from(set).sort();
  }, [employeeList]);

  const unitDepartments = useMemo(() => {
    if (selectedUnit === "A-Unit") {
      return departments.filter(dept => dept.trim().toLowerCase() !== 'brushing');
    } else if (selectedUnit === "C-Unit") {
      return departments.filter(dept => dept.trim().toLowerCase() === 'brushing');
    }
    return departments;
  }, [departments, selectedUnit]);

  const designations = useMemo(() => {
    const set = new Set<string>();
    (employeeList || []).forEach((emp: any) => {
      const dep = emp.employmentDetails?.department || emp.department || "";
      const isBrushing = dep.trim().toLowerCase() === "brushing";
      
      let belongsToUnit = true;
      if (selectedUnit === "A-Unit") {
        belongsToUnit = !isBrushing;
      } else if (selectedUnit === "C-Unit") {
        belongsToUnit = isBrushing;
      }
      
      if (belongsToUnit) {
        const desg = emp.employmentDetails?.designation || emp.designation;
        if (desg && desg.trim()) {
          set.add(desg.trim());
        }
      }
    });
    return Array.from(set).sort();
  }, [employeeList, selectedUnit]);

  // Reset selected designation if it doesn't belong to the newly selected unit's designations
  useEffect(() => {
    if (selectedDesignation && !designations.includes(selectedDesignation)) {
      setSelectedDesignation("");
    }
  }, [selectedUnit, designations, selectedDesignation]);

  // Filter employees by selected Unit and Designation to calculate counts
  const filteredEmployeesByUnitAndDesg = useMemo(() => {
    return (employeeList || []).filter((emp: any) => {
      const dep = emp.employmentDetails?.department || emp.department || "";
      const isBrushing = dep.trim().toLowerCase() === "brushing";
      
      let matchesUnit = true;
      if (selectedUnit === "A-Unit") {
        matchesUnit = !isBrushing;
      } else if (selectedUnit === "C-Unit") {
        matchesUnit = isBrushing;
      }

      const desg = emp.employmentDetails?.designation || emp.designation || "";
      const matchesDesg = !selectedDesignation || desg.trim() === selectedDesignation.trim();

      return matchesUnit && matchesDesg;
    });
  }, [employeeList, selectedUnit, selectedDesignation]);

  // Calculate PF counts
  const pfCounts = useMemo(() => {
    let pf = 0;
    let nonPf = 0;

    filteredEmployeesByUnitAndDesg.forEach((emp: any) => {
      const isPf = emp.pfApplicable === true || emp.pfApplicable === 1 || String(emp.pfApplicable).toLowerCase() === "true";
      if (isPf) {
        pf++;
      } else {
        nonPf++;
      }
    });

    return {
      all: filteredEmployeesByUnitAndDesg.length,
      pf,
      nonPf,
    };
  }, [filteredEmployeesByUnitAndDesg]);

  const handleAction = (actionType?: "pdf" | "print" | "excel") => {
    if (filterType === "month" && !month) {
      toast.warn("Please select a month first.");
      return;
    }
    if (filterType === "single" && !singleDate && !fromDate) {
      toast.warn("Please select a date first.");
      return;
    }
    if (filterType === "range" && (!fromDate || !toDate)) {
      toast.warn("Please select a date range first.");
      return;
    }

    const effSingle = singleDate || fromDate;
    navigate("/settings/salary-report-list", {
      state: {
        filterType,
        month,
        fromDate: filterType === "single" ? effSingle : fromDate,
        toDate: filterType === "single" ? effSingle : toDate,
        singleDate: effSingle,
        selectedUnit,
        selectedDesignation,
        pfFilter,
        actionType,
      },
    });
  };

  return (
    <div className="p-6 pt-16 mt-5 max-w-4xl mx-auto space-y-6">
      {/* Title block */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="h-6 w-6 text-indigo-600" />
          Salary Report Generator
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Apply filters to customize and generate the salary report payout list.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Step 1: Filter Mode & Dates */}
        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 space-y-4">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-indigo-500" />
            Period Configuration
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Filter Mode
              </label>
              <CommonSearchableSelect
                value={filterType}
                onValueChange={(val) => setFilterType(val as any)}
                placeholder="Select Filter Mode"
                options={[
                  { value: "month", label: "Month View" },
                  { value: "single", label: "Single Date View" },
                  { value: "range", label: "Date Range View" },
                ]}
              />
            </div>

            {filterType === "month" ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Month
                </label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full rounded-md border border-slate-200 py-1.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-sm"
                />
              </div>
            ) : filterType === "single" ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Date
                </label>
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSingleDate(val);
                    setFromDate(val);
                    setToDate(val);
                  }}
                  className="w-full rounded-md border border-slate-200 py-1.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-sm"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFromDate(val);
                      if (!toDate) {
                        setToDate(val);
                      }
                    }}
                    className="w-full rounded-md border border-slate-200 py-1.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full rounded-md border border-slate-200 py-1.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white shadow-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Employee Group filters */}
        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-indigo-500" />
              Employee Filters
            </span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full shadow-xs">
              Matching Employees: {pfFilter === "all" ? pfCounts.all : pfFilter === "pf" ? pfCounts.pf : pfCounts.nonPf}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Unit
              </label>
              <CommonSearchableSelect
                value={selectedUnit}
                onValueChange={(val) => setSelectedUnit(val as any)}
                placeholder="Select Unit"
                className="bg-white"
              >
                <option value="">All Units</option>
                <option value="A-Unit">A-Unit</option>
                <option value="C-Unit">C-Unit</option>
              </CommonSearchableSelect>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Designation
              </label>
              <CommonSearchableSelect
                value={selectedDesignation}
                onValueChange={setSelectedDesignation}
                placeholder="All Designations"
                className="bg-white"
              >
                <option value="">All Designations</option>
                {designations.map((desg) => (
                  <option key={desg} value={desg}>
                    {desg}
                  </option>
                ))}
              </CommonSearchableSelect>
            </div>

            {selectedUnit && (
              <div className="flex flex-col gap-1.5 md:col-span-2 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Departments in {selectedUnit}:
                </span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {unitDepartments.length > 0 ? (
                    unitDepartments.map((dept) => (
                      <span
                        key={dept}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-150 shadow-sm"
                      >
                        {dept}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No departments loaded yet.</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* PF Status Radio Button Selection */}
          <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-200/60">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-indigo-500" />
              PF Status
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                onClick={() => setPfFilter("all")}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  pfFilter === "all"
                    ? "bg-indigo-50/80 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/20 shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="pfFilter"
                    value="all"
                    checked={pfFilter === "all"}
                    onChange={() => setPfFilter("all")}
                    className="h-4 w-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-sm font-semibold">All Employees</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  pfFilter === "all" ? "bg-indigo-200/80 text-indigo-800" : "bg-slate-100 text-slate-600"
                }`}>
                  {pfCounts.all}
                </span>
              </label>

              <label
                onClick={() => setPfFilter("pf")}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  pfFilter === "pf"
                    ? "bg-emerald-50/80 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="pfFilter"
                    value="pf"
                    checked={pfFilter === "pf"}
                    onChange={() => setPfFilter("pf")}
                    className="h-4 w-4 text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-sm font-semibold">PF Employees</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  pfFilter === "pf" ? "bg-emerald-200/80 text-emerald-800" : "bg-slate-100 text-slate-600"
                }`}>
                  {pfCounts.pf}
                </span>
              </label>

              <label
                onClick={() => setPfFilter("non-pf")}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  pfFilter === "non-pf"
                    ? "bg-amber-50/80 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="pfFilter"
                    value="non-pf"
                    checked={pfFilter === "non-pf"}
                    onChange={() => setPfFilter("non-pf")}
                    className="h-4 w-4 text-amber-600 border-slate-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-sm font-semibold">Non-PF Employees</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  pfFilter === "non-pf" ? "bg-amber-200/80 text-amber-800" : "bg-slate-100 text-slate-600"
                }`}>
                  {pfCounts.nonPf}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            onClick={() => handleAction("print")}
            variant="outline"
            className="border-slate-200 text-slate-750 flex items-center gap-1.5 hover:bg-slate-50 shadow-sm"
          >
            <Printer className="h-4 w-4 text-indigo-650" />
            Print
          </Button>
          <Button
            onClick={() => handleAction("pdf")}
            variant="outline"
            className="border-indigo-100 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-1.5 shadow-sm"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
          <Button
            onClick={() => handleAction("excel")}
            variant="outline"
            className="border-emerald-100 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5 shadow-sm"
          >
            <FileText className="h-4 w-4" />
            Export Excel
          </Button>
          <Button
            onClick={() => handleAction()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center px-6 shadow-sm"
          >
            View Report
          </Button>
        </div>
      </div>
    </div>
  );
}

