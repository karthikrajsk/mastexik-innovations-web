import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { formatDate } from "@/lib/utils";
import { getAllBeamCuts, deleteBeamCut } from "@/state/beamCutSlice";
import { getAllLooms } from "@/state/loomMasterSlice";
import { getAllFlanges, getFlangeById } from "@/state/flangeSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { AppDispatch, RootState } from "@/state/store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useSelector as reduxUseSelector } from "react-redux";

export default function BeamCutDetails() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { list, pagination } = useSelector((state: RootState) => (state as any).beamCut);
  const { loomList } = useSelector((state: RootState) => state.loomMaster as any);
  const { flangeList } = useSelector((state: RootState) => state.flange as any);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster as any);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [companyInitialized, setCompanyInitialized] = useState(false);
  const { currentPage, itemsPerPage, handlePageChange, getOffset } = usePagination({ itemsPerPage: 10 });

  useEffect(() => {
    const stored = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const parsedCompanyId = stored ? Number(stored) : null;
    setCompanyId(parsedCompanyId);
    setCompanyInitialized(true);

    // Fetch looms
    dispatch(getAllLooms({ fetchAll: true } as any));

    // Fetch flanges - fetch all without company restriction
    dispatch(getAllFlanges({ fetchAll: true } as any));

    // Fetch fabric masters
    dispatch(getAllFabricMasters({ fetchAll: true } as any));
  }, [dispatch]);

  useEffect(() => {
    if (!companyInitialized) return;
    const payload = { offset: getOffset(), limit: itemsPerPage } as any;
    if (companyId != null) {
      dispatch(getAllBeamCuts({ companyId, fetchAll: true }));
    } else {
      dispatch(getAllBeamCuts(payload));
    }
  }, [dispatch, companyInitialized, companyId, currentPage, getOffset, itemsPerPage]);

  const processedList = useMemo(() => {
    const arr: any[] = Array.isArray(list) ? list : Array.isArray((list as any)?.data) ? (list as any).data : [];
    const baseSerial = pagination?.offset || 0;
    return arr.map((x: any, idx: number) => ({ ...x, serialNo: baseSerial + idx + 1 }));
  }, [list, pagination?.offset]);

  const loomNameMap = useMemo(() => {
    const raw: any = loomList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, string>();
    arr.forEach((l: any) => { if (l?.id != null) map.set(String(l.id), String(l.loomNo || l.loomName || l.name || '')); });
    return map;
  }, [loomList]);

  const flangeNameMap = useMemo(() => {
    const raw: any = flangeList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, string>();
    arr.forEach((f: any) => {
      const id = f?.id ?? f?.flangeId ?? f?.flange_id;
      if (id != null) {
        map.set(String(id), String(f.flangeNo || f.flange_no || f.flangeNumber || f.name || f.number || ''));
      }
    });
    return map;
  }, [flangeList]);

  const requestedFlangeIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const rows = Array.isArray(processedList) ? processedList : [];
    const idsToFetch = new Set<number>();
    rows.forEach((row: any) => {
      const details = Array.isArray(row?.beamDetails) ? row.beamDetails : [];
      if (details.length > 0) {
        details.forEach((detail: any) => {
          const flangeId = detail?.flangeId ?? detail?.flange_id ?? detail?.flange?.id ?? detail?.flange?.flangeId;
          if (flangeId == null) return;
          const key = String(flangeId);
          if (!key || flangeNameMap.has(key) || requestedFlangeIdsRef.current.has(key)) {
            return;
          }
          const parsedId = Number(flangeId);
          if (!Number.isNaN(parsedId)) {
            idsToFetch.add(parsedId);
          } else {
            requestedFlangeIdsRef.current.add(key);
          }
        });
      } else {
        const rowFlangeId = row?.flangeId ?? row?.flange_id ?? row?.flange?.id ?? row?.flange?.flangeId;
        if (rowFlangeId != null) {
          const key = String(rowFlangeId);
          if (key && !flangeNameMap.has(key) && !requestedFlangeIdsRef.current.has(key)) {
            const parsedId = Number(rowFlangeId);
            if (!Number.isNaN(parsedId)) {
              idsToFetch.add(parsedId);
            } else {
              requestedFlangeIdsRef.current.add(key);
            }
          }
        }
      }
    });
    idsToFetch.forEach((id) => {
      const key = String(id);
      requestedFlangeIdsRef.current.add(key);
      dispatch(getFlangeById({ id }));
    });
  }, [dispatch, flangeNameMap, processedList]);

  const fabricDetailsById = useMemo(() => {
    const raw: any = fabricMasterList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const map = new Map<string, { code: string; quality: string }>();
    arr.forEach((f: any) => {
      const code = String(f?.fabricCode || f?.code || f?.fabric_code || '').trim();
      const quality = String(f?.quality || f?.fabricQuality || f?.fabric_quality || '').trim();
      if (f?.id != null) map.set(String(f.id), { code, quality });
    });
    return map;
  }, [fabricMasterList]);

  const formatFabricLabel = useCallback((code?: string, quality?: string) => {
    const trimmedCode = String(code || '').trim();
    const trimmedQuality = String(quality || '').trim();
    if (trimmedCode && trimmedQuality) return `${trimmedCode} – ${trimmedQuality}`;
    if (trimmedCode) return trimmedCode;
    if (trimmedQuality) return trimmedQuality;
    return '-';
  }, []);

  const formatFabricLabelFromDetail = useCallback((detail?: any) => {
    if (!detail) return '-';
    if (detail.fabricMasterId != null) {
      const stored = fabricDetailsById.get(String(detail.fabricMasterId));
      if (stored?.code || stored?.quality) {
        return formatFabricLabel(stored.code, stored.quality);
      }
    }
    const fallbackCode = String(detail.fabricCode || detail.fabricCodeQuality || detail.fabric?.fabricCode || detail.fabric_code || '').trim();
    const fallbackQuality = String(detail.fabricQuality || detail.quality || detail.fabric?.fabricQuality || detail.fabric_quality || '').trim();
    if (fallbackCode || fallbackQuality) return formatFabricLabel(fallbackCode, fallbackQuality);
    return '-';
  }, [fabricDetailsById, formatFabricLabel]);

  const getCommaSeparatedList = useCallback((values: Array<string | number | null | undefined>) => {
    const normalized = values
      .map((value) => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') {
          return Number.isFinite(value) ? String(value) : '';
        }
        return String(value).trim();
      })
      .filter((value) => value !== '');
    return normalized.length ? normalized.join(', ') : '-';
  }, []);

  const getBeamDetailsArray = useCallback((row: any) => {
    const details: any[] = Array.isArray(row?.beamDetails) ? row.beamDetails : [];
    return details;
  }, []);

  const getBeamNumbersDisplay = useCallback((row: any) => {
    const details = getBeamDetailsArray(row);
    if (details.length) {
      const detailBeamNos = details.map((detail) => detail?.beamNo || detail?.beam?.beamNo || detail?.sizedBeamNo);
      return getCommaSeparatedList(detailBeamNos);
    }
    return getCommaSeparatedList([row?.beamNo]);
  }, [getBeamDetailsArray, getCommaSeparatedList]);

  const getFlangeNamesDisplay = useCallback((row: any) => {
    const details = getBeamDetailsArray(row);
    if (details.length) {
      const detailFlangeNames = details.map((detail) => {
        const flangeId = detail?.flangeId ?? detail?.flange_id ?? detail?.flange?.id ?? detail?.flange?.flangeId;
        if (flangeId != null && flangeNameMap.has(String(flangeId))) {
          return flangeNameMap.get(String(flangeId));
        }
        return detail?.flangeNo || detail?.flange?.flangeNo || detail?.flange_no || detail?.flange?.flange_no || detail?.sizedFlangeNo || detail?.flangeNumber;
      });
      return getCommaSeparatedList(detailFlangeNames);
    }
    const rowFlangeId = row?.flangeId ?? row?.flange_id ?? row?.flange?.id ?? row?.flange?.flangeId;
    if (rowFlangeId != null && flangeNameMap.has(String(rowFlangeId))) {
      return flangeNameMap.get(String(rowFlangeId));
    }
    return row?.flangeNo || row?.flange_no || row?.flange?.flangeNo || row?.flange?.flange_no || row?.sizedFlangeNo || row?.flangeNumber || '-';
  }, [flangeNameMap, getBeamDetailsArray, getCommaSeparatedList]);

  const getRemainingMetersDisplay = useCallback((row: any) => {
    const detailValues = getBeamDetailsArray(row)
      .map((detail) => detail?.remainingMeters ?? detail?.remainingMeter)
      .filter((value) => value != null);
    if (detailValues.length) return getCommaSeparatedList(detailValues);
    const fallback = row?.remainingMeters ?? row?.remainingMeter;
    return fallback != null ? String(fallback) : '-';
  }, [getBeamDetailsArray, getCommaSeparatedList]);

  const getUsedMetersDisplay = useCallback((row: any) => {
    const detailValues = getBeamDetailsArray(row)
      .map((detail) => detail?.usedMeters ?? detail?.usedMeter)
      .filter((value) => value != null);
    if (detailValues.length) return getCommaSeparatedList(detailValues);
    const fallback = row?.usedMeters ?? row?.usedMeter;
    return fallback != null ? String(fallback) : '-';
  }, [getBeamDetailsArray, getCommaSeparatedList]);

  const getFabricLabelsDisplay = useCallback((row: any) => {
    const detailLabels = getBeamDetailsArray(row)
      .map((detail) => formatFabricLabelFromDetail(detail))
      .filter((label) => label && label !== '-');
    const joined = getCommaSeparatedList(detailLabels);
    if (joined !== '-') return joined;
    if (row?.fabricMasterId != null) {
      const stored = fabricDetailsById.get(String(row.fabricMasterId));
      return stored ? formatFabricLabel(stored.code, stored.quality) : '-';
    }
    const fallbackCode = String(row?.fabricCode || row?.fabricCodeQuality || '').trim();
    const fallbackQuality = String(row?.fabricQuality || row?.quality || '').trim();
    if (fallbackCode || fallbackQuality) return formatFabricLabel(fallbackCode, fallbackQuality);
    return '-';
  }, [fabricDetailsById, formatFabricLabel, formatFabricLabelFromDetail, getBeamDetailsArray, getCommaSeparatedList]);

  const columns = useMemo(() => [
    { Header: 'S.No', accessor: 'serialNo', width: 50, disableFilters: true },
    {
      Header: 'Beam Cut Date', accessor: (row: any) => row?.beamCutDate || row?.createdAt || '', Cell: ({ value }: { value: string }) => formatDate(value),
      Filter: ({ column: { filterValue, setFilter } }: any) => {
        const value = filterValue && typeof filterValue === 'object' ? filterValue : {};
        return (
          <div className="flex space-x-2">
            <p className="text-sm font-normal">From</p>
            <input type="date" value={value.from || ''} onChange={(e) => setFilter({ ...value, from: e.target.value })} className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500" />
            <p className="text-sm font-normal">To</p>
            <input type="date" value={value.to || ''} onChange={(e) => setFilter({ ...value, to: e.target.value })} className="w-full px-2 py-1 text-xs border border-secondary-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500" />
          </div>
        );
      },
      filter: (rows: any[], columnIds: string[], fv: { from?: string; to?: string }) => {
        const id = columnIds[0];
        return rows.filter((row: any) => {
          const raw = row.values[id];
          if (!raw) return false;
          const d = new Date(raw);
          if (isNaN(d.getTime())) return false;
          d.setHours(0, 0, 0, 0);
          if (fv?.from) { const from = new Date(fv.from); from.setHours(0, 0, 0, 0); if (d < from) return false; }
          if (fv?.to) { const to = new Date(fv.to); to.setHours(23, 59, 59, 999); if (d > to) return false; }
          return true;
        });
      }
    },
    { Header: 'Beam Cut No', accessor: (row: any) => row?.beamCutNo || '-' },

    { Header: 'Loom No', accessor: (row: any) => loomNameMap.get(String(row?.loomId)) || row?.loomNo || '-' },
    { Header: 'Beam No', accessor: (row: any) => getBeamNumbersDisplay(row) },
    { Header: 'Empty Beam No', accessor: (row: any) => getFlangeNamesDisplay(row) },
    { Header: 'Sort No – Construction', accessor: (row: any) => getFabricLabelsDisplay(row) },
    { Header: 'Remaining Meter', accessor: (row: any) => getRemainingMetersDisplay(row) },
    { Header: 'Remarks', accessor: (row: any) => row?.remarks || '-' },
  ], [loomNameMap, getBeamNumbersDisplay, getFlangeNamesDisplay, getFabricLabelsDisplay, getRemainingMetersDisplay]);

  const handleAdd = () => navigate("/transaction/beam-cut");
  const handleEdit = (row: any) => navigate("/transaction/beam-cut", { state: { ...row } });
  const handleView = (row: any) => { setCurrentItem(row); setIsViewModalOpen(true); };
  const handleDelete = (row: any) => { setCurrentItem(row); setIsDeleteModalOpen(true); };
  const confirmDelete = async () => {
    if (!currentItem) return;
    try {
      await dispatch(deleteBeamCut({ id: currentItem.id as number, companyId: companyId ?? undefined }) as any).unwrap();

      const currentTotal = pagination?.total || 0;
      const updatedTotal = Math.max(0, currentTotal - 1);
      const maxPage = Math.max(0, Math.ceil(updatedTotal / itemsPerPage) - 1);

      if (currentPage > maxPage) {
        handlePageChange(maxPage);
      } else {
        const payload = { offset: getOffset(), limit: itemsPerPage } as any;
        if (companyId != null) {
          await dispatch(getAllBeamCuts({ companyId, ...payload }));
        } else {
          await dispatch(getAllBeamCuts(payload));
        }
      }
    } catch (error) {
      console.error("Error deleting beam cut:", error);
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="p-6 pt-16">
      {/* <h1 className="text-2xl font-semibold mb-4">Beam Cut</h1> */}
      <DataTable
        columns={columns}
        data={processedList}
        title="Beam Cut List"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        filterPlaceholder="Search beam cut..."
        showColumnFilters={true}
        disableFullDataFetch={true}
      />

      {/* <Pagination
        currentPage={currentPage}
        totalItems={pagination?.total || 0}
        itemsPerPage={itemsPerPage}
        offset={pagination?.offset || 0}
        hasNext={!!pagination?.next}
        hasPrev={!!pagination?.prev}
        onPageChange={handlePageChange}
      /> */}

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Beam Cut">
        {currentItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500">Beam Cut Date</p>
                <p className="font-medium">{formatDate(currentItem.beamCutDate)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Loom No</p>
                <p className="font-medium">{loomNameMap.get(String(currentItem.loomId)) || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Beam No</p>
                <p className="font-medium">{getBeamNumbersDisplay(currentItem)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Empty Beam No</p>
                <p className="font-medium">{getFlangeNamesDisplay(currentItem)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Sort No – Construction</p>
                <p className="font-medium">{getFabricLabelsDisplay(currentItem)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Used Meters</p>
                <p className="font-medium">{getUsedMetersDisplay(currentItem)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Remaining Meters</p>
                <p className="font-medium">{getRemainingMetersDisplay(currentItem)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Remarks</p>
                <p className="font-medium">{currentItem.remarks || '-'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete this item?</p>
          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
