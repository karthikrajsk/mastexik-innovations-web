// ReportConfigurationList.tsx (Updated with Manage Screens button)
import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { deleteReport, getAllReports } from "@/state/reportConfigSlice";
import { AppDispatch, RootState } from "@/state/store";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";

interface ReportData {
  id: number;
  reportName: string;
  columnCount: number;
  createdAt: string;
  serialNo: number;
}

export function ReportConfigurationList() {
  const { reportList, fetched, loading, lastFetchedCompanyId } = useSelector((state: RootState) => state.reportConfig);
  console.log('[ReportConfigurationList] reportList from store:', reportList);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { selectedCompany } = useAuth();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<ReportData | null>(null);
 

  const companyId = useResolvedCompanyId();
  const searchApiEndpoint = companyId != null
    ? `/report-configurations/company/${companyId}` 
        : "/report-configurations";

  useEffect(() => {
    const shouldFetch = !fetched || (selectedCompany !== null && selectedCompany !== lastFetchedCompanyId);
    if (shouldFetch && !loading) {
      dispatch(getAllReports({ companyId: selectedCompany ,fetchAll:true}));
    }
  }, [dispatch, fetched, loading, selectedCompany, lastFetchedCompanyId]);

  const processedReportList = useMemo(() => {
    const list = Array.isArray(reportList) ? reportList : [];
    return list.map((report: any, index: number) => ({
      ...report,
      serialNo: index + 1,
      columnCount: report.columns?.length || 0,
    }));
  }, [reportList]);

  const columns = useMemo(() => [
    {
      Header: "S.No",
      accessor: "serialNo",
      width: 50,
      disableFilters: true,
    },
    {
      Header: "Report Name",
      accessor: "reportName",
    },
    {
      Header: "Columns",
      accessor: "columnCount",
      Cell: ({ value }: { value: number }) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
          {value} column{value !== 1 ? "s" : ""}
        </span>
      ),
    },
    {
      Header: "Created Date",
      accessor: "createdAt",
      Cell: ({ value }: { value: string }) => (
        <span>{value ? new Date(value).toLocaleDateString() : "-"}</span>
      ),
    },
  ], []);

  const handleDelete = (report: ReportData) => {
    setCurrentReport(report);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!currentReport) return;
    await dispatch(deleteReport(currentReport.id));
    setIsDeleteModalOpen(false);
  };

  const handleEdit = (report: any) => {
    navigate("/settings/report-configuration-form", { state: { report } });
  };

  const handleAdd = () => {
    navigate("/settings/report-configuration-form");
  };

  const handleClone = (report: any) => {
    navigate("/settings/report-configuration-form", { state: { report, clone: true } });
  };

  const handleManageScreens = () => {
    navigate("/settings/screen-configuration");
  };

  return (
    <div className="p-6 pt-16">

      <DataTable
        columns={columns}
        data={processedReportList}
        title="Report Configurations"
        onAdd={handleAdd}
        onEdit={handleEdit}
        // onDelete={handleDelete}
        onClone={handleClone}
        showActions={true}
        filterPlaceholder="Search reports..."
        searchApiEndpoint={searchApiEndpoint}
        disableFullDataFetch={true}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete report "{currentReport?.reportName}"?
          </p>
          <p className="text-red-600 text-sm">This action cannot be undone.</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button onClick={confirmDelete} className="btn btn-danger">
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ReportConfigurationList;