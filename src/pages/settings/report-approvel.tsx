import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/data/DataTable";
import apiService from "@/services/ApiService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";

// File-load trace to verify bundling and route mounting
console.log('[ReportApprovelList] file loaded');

interface LlmResultItem {
  id: number;
  queryText: string;
  responseJson: string; // JSON string array
  isApproved: boolean;
  createdAt: string;
}

interface RowData {
  id: number;
  reportName: string; // derive from queryText first line or default
  columnCount?: number;
  createdAt?: string;
  serialNo?: number;
  // Pass-through LLM payload for downstream form usage
  queryText?: string;
  responseJson?: string;
}

const ReportApprovelList: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<LlmResultItem[]>([]);
  const [approvalStates, setApprovalStates] = useState<Record<number, boolean>>({});
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [pendingId, setPendingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('[ReportApprovelList] fetching llm/results ...');
        const res = await apiService.get('/llm/results');
        // Normalize shape from ApiService.get (returns response.data)
        // Supports both { items: [...] } and { data: { items: [...] } } and raw arrays
        const list: LlmResultItem[] = Array.isArray((res as any)?.items)
          ? (res as any).items
          : Array.isArray((res as any)?.data?.items)
          ? (res as any).data.items
          : Array.isArray(res)
          ? (res as any)
          : [];
        console.log('[ReportApprovelList] results normalized:', list);
        setItems(list);
        // seed approval states from backend flag
        const seed: Record<number, boolean> = {};
        list.forEach(it => { seed[it.id] = !!it.isApproved; });
        setApprovalStates(seed);
      } catch (e: any) {
        console.error('Failed to fetch llm/results', e);
        setError(e?.message || 'Failed to fetch results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const processedReportList = useMemo<RowData[]>(() => {
    return (items || []).map((it, index) => {
      // Derive a readable name from the queryText (first SELECT line or fallback)
      const firstLine = it.queryText?.split('\n')?.[0]?.trim() || '';
      const name = firstLine || `Result #${it.id}`;
      let columns: any[] = [];
      try {
        const parsed = JSON.parse(it.responseJson);
        if (Array.isArray(parsed) && parsed.length) {
          columns = Object.keys(parsed[0] || {});
        }
      } catch {}
      return {
        id: it.id,
        reportName: name,
        columnCount: Array.isArray(columns) ? columns.length : 0,
        createdAt: it.createdAt,
        serialNo: index + 1,
        queryText: it.queryText,
        responseJson: it.responseJson,
      };
    });
  }, [items]);

  const openConfirm = (id: number) => {
    setPendingId(id);
    setConfirmOpen(true);
  };

  const approveReport = async () => {
    if (pendingId == null) return;
    try {
      setLoading(true);
      setError(null);
      // Call approve API
      await apiService.post(`/llm/results/${pendingId}/approve`, {});
      // Reflect in UI
      setApprovalStates(prev => ({ ...prev, [pendingId!]: true }));
      // Also update items array isApproved for consistency
      setItems(prev => prev.map(it => it.id === pendingId ? { ...it, isApproved: true } : it));
    } catch (e: any) {
      console.error('Approve call failed', e);
      setError(e?.message || 'Approve failed');
    } finally {
      setLoading(false);
      setConfirmOpen(false);
      setPendingId(null);
    }
  };

  const cancelApprove = () => {
    // Close and ensure checkbox remains unticked
    if (pendingId != null) {
      setApprovalStates(prev => ({ ...prev, [pendingId]: false }));
    }
    setConfirmOpen(false);
    setPendingId(null);
  };

  const handleEdit = (row: RowData) => {
    // Navigate to report-configuration-form with the LLM result context to open template view
    // Pass queryText to prefill SQL editor and parse responseJson for preview in the form
    navigate('/settings/report-configuration-form', {
      state: {
        report: {
          id: row.id,
          reportName: row.reportName,
          columns: [], // template can be built from responseJson later
        },
        openTemplate: true,
        llmResultId: row.id,
        queryText: row.queryText,
        responseJson: row.responseJson,
      },
    });
  };

  const columns = useMemo(
    () => [
      { Header: 'S.No', accessor: 'serialNo', width: 60, disableFilters: true },
      { Header: 'Report Name', accessor: 'reportName' },
      {
        Header: 'Approved',
        accessor: 'id',
        Cell: ({ value }: { value: number }) => (
          <input
            type="checkbox"
            checked={!!approvalStates[value]}
            onChange={(e) => {
              const checked = e.target.checked;
              const currentlyApproved = !!approvalStates[value];
              if (currentlyApproved && !checked) {
                // Prevent un-approving via UI
                setApprovalStates(prev => ({ ...prev, [value]: true }));
                return;
              }
              if (!currentlyApproved && checked) {
                // Keep it unticked until confirmed
                setApprovalStates(prev => ({ ...prev, [value]: false }));
                openConfirm(value);
                return;
              }
              setApprovalStates(prev => ({ ...prev, [value]: checked }));
            }}
          />
        ),
        disableFilters: true,
        width: 120,
      },
    ],
    [approvalStates]
  );

  return (
    <div className="p-6 pt-16">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Report Approvel</h1>
      </div>

      {/* Visible status banner */}
      <div className="mb-4 text-xs text-gray-600">
        <span className="inline-block mr-2">[ReportApprovelList]</span>
        <span className="inline-block mr-2">status: {loading ? 'loading' : 'idle'}</span>
        {error && <span className="inline-block text-red-600">error: {String(error)}</span>}
      </div>

      {Array.isArray(processedReportList) && processedReportList.length > 0 ? (
        <DataTable
          columns={columns}
          data={processedReportList as RowData[]}
          title="Report Approvel"
          onEdit={handleEdit}
          showActions={true}
          filterPlaceholder="Search results..."
        />
      ) : (
        <div className="text-center text-sm text-gray-500 border rounded p-6">
          {loading ? 'Loading results...' : 'No results found from LLM. Run a query first.'}
        </div>
      )}

      {/* Approve confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={(open) => { if (!open) cancelApprove(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Report</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-700">
            Are you sure you want to approve this report?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelApprove} disabled={loading}>No</Button>
            <Button variant="default" onClick={approveReport} disabled={loading}>Yes, Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReportApprovelList;