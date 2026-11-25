import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getAllBeamGaitings, deleteBeamGaiting } from "@/state/beamGaitingSlice";
import { getAllLooms } from "@/state/loomMasterSlice";
import { getAllFlanges, getFlangeById } from "@/state/flangeSlice";
import { AppDispatch, RootState } from "@/state/store";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function BeamGaitingDetails() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { list } = useSelector((state: RootState) => state.beamGaiting as any);
  const { loomList } = useSelector((state: RootState) => state.loomMaster as any);
  const { flangeList } = useSelector((state: RootState) => state.flange as any);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [companyInitialized, setCompanyInitialized] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
    const parsedCompanyId = stored ? Number(stored) : null;
    setCompanyId(parsedCompanyId);
    setCompanyInitialized(true);
    dispatch(getAllFlanges({} as any));
    const loomPayload = parsedCompanyId != null ? { companyId: parsedCompanyId } : ({} as any);
    dispatch(getAllLooms(loomPayload));
  }, [dispatch]);

  useEffect(() => {
    if (!companyInitialized) return;
    const payload = companyId != null ? { companyId, fetchAll: true } : { fetchAll: true };
    dispatch(getAllBeamGaitings(payload));
  }, [dispatch, companyInitialized, companyId]);

  const processedList = useMemo(() => {
    const arr: any[] = Array.isArray(list) ? list : Array.isArray((list as any)?.data) ? (list as any).data : [];
    return arr.map((x: any, idx: number) => ({ ...x, serialNo: idx + 1 }));
  }, [list]);

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
      const key = String(f?.id ?? f?.flangeId ?? '');
      if (!key) return;
      const label = String(f?.flangeNo ?? f?.flangeNumber ?? f?.name ?? '');
      if (!label) return;
      map.set(key, label);
    });
    return map;
  }, [flangeList]);

  const requestedFlangeIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const rows = Array.isArray(processedList) ? processedList : [];
    const idsToFetch = new Set<number>();
    rows.forEach((row: any) => {
      const details = row?.beamGatingDetails || row?.details || row?.beamDetails || [];
      const detailArray = Array.isArray(details) ? details : [];
      detailArray.forEach((detail) => {
        const flangeId = detail?.flangeId;
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
    });
    idsToFetch.forEach((id) => {
      const key = String(id);
      requestedFlangeIdsRef.current.add(key);
      dispatch(getFlangeById({ id }));
    });
  }, [dispatch, flangeNameMap, processedList]);

  const columns = useMemo(() => [
    { Header: 'S.No', accessor: 'serialNo', width: 50, disableFilters: true },
    { Header: 'Gaiting/Knotting Date', accessor: (row: any) => row?.gaitingDate || row?.createdAt || '', Cell: ({ value }: { value: string }) => formatDate(value),
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
          d.setHours(0,0,0,0);
          if (fv?.from) {
            const from = new Date(fv.from); from.setHours(0,0,0,0); if (d < from) return false;
          }
          if (fv?.to) {
            const to = new Date(fv.to); to.setHours(23,59,59,999); if (d > to) return false;
          }
          return true;
        });
      }
    },
    { Header: 'Loom No', accessor: (row: any) => loomNameMap.get(String(row?.loomId)) || row?.loomNo || '-' },
    { Header: 'Beam No', accessor: (row: any) => {
    const details = row?.beamGatingDetails || row?.details || row?.beamDetails || [];
    const arr = Array.isArray(details) ? details : [];
    const beams = arr.map((d: any) => d.beamNo || d.sizedBeamNo).filter(Boolean);
    return beams.length ? beams.join(', ') : '-';
  }
},
{ Header: 'Empty Beam No', accessor: (row: any) => {
    const details = row?.beamGatingDetails || row?.details || row?.beamDetails || [];
    const arr = Array.isArray(details) ? details : [];
    const flanges = arr.map((d: any) => flangeNameMap.get(String(d.flangeId)) || d.flangeNo).filter(Boolean);
    return flanges.length ? flanges.join(', ') : '-';
  }
},
{ Header: 'Sort No / Construction', accessor: (row: any) => {
    const details = row?.beamGatingDetails || row?.details || row?.beamDetails || [];
    const arr = Array.isArray(details) ? details : [];
    const codes = arr.map((d: any) => (d.changedFabricMasterId != null || d.changedFabricCodeQuality != null) ? (d.changedFabricCodeQuality || d.fabricCodeQuality) : d.fabricCodeQuality).filter(Boolean);
    return codes.length ? codes.join(', ') : (row?.fabricCodeQuality || '-');
  }
},

    { Header: 'Gaiting / Knotting', accessor: (row: any) => row?.gaitingType || row?.gatingType || '-' },
    { Header: 'Shed', accessor: (row: any) => row?.shed || '-' },
    { Header: 'Effect From', accessor: (row: any) => row?.effectFrom || '-' },
  ], [loomNameMap, flangeNameMap]);

  const handleAdd = () => navigate("/transaction/beam-gaiting");
  const handleEdit = (row: any) => navigate("/transaction/beam-gaiting", { state: { ...row } });
  const handleView = (row: any) => { setCurrentItem(row); setIsViewModalOpen(true); };
  const handleDelete = (row: any) => { setCurrentItem(row); setIsDeleteModalOpen(true); };
  const confirmDelete = async () => {
    if (!currentItem) return;
    try {
      await dispatch(deleteBeamGaiting({ id: currentItem.id as number, companyId: companyId ?? undefined }) as any).unwrap();
      const payload = companyId != null ? { companyId, fetchAll: true } : { fetchAll: true };
      await dispatch(getAllBeamGaitings(payload));
    } catch (error) {
      console.error("Error deleting beam gaiting:", error);
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="p-6 pt-16">
      <DataTable
        columns={columns}
        data={processedList}
        title="Beam Gaiting List"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        filterPlaceholder="Search gating..."
        showColumnFilters={true}
        disableFullDataFetch={true}
        virtualScroll={true}
        isShowPagination={false}
      />

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Beam Gaiting">
        {currentItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500">Gaiting Date</p>
                <p className="font-medium">{formatDate(currentItem.gaitingDate)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Loom No</p>
                <p className="font-medium">{loomNameMap.get(String(currentItem.loomId)) || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Gaiting / Knotting</p>
                <p className="font-medium">{currentItem.gaitingType}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Fabric Panel</p>
                <p className="font-medium">{currentItem.fabricPanel}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Shed</p>
                <p className="font-medium">{currentItem.shed || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Effect From</p>
                <p className="font-medium">{currentItem.effectFrom || '-'}</p>
              </div>
              {currentItem.effectFrom === 'Time' && currentItem.effectiveDate && (
                <div>
                  <p className="text-sm text-secondary-500">Effective Date & Time</p>
                  <p className="font-medium">{formatDateTime(currentItem.effectiveDate)}</p>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium text-lg mb-3">Beam Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2">Beam No</th>
                      <th className="border p-2">Empty Beam No</th>
                      <th className="border p-2">Sort No / Construction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(currentItem.beamGatingDetails || currentItem.details || currentItem.beamDetails || []).map((d: any, i: number) => (
                      <tr key={i}>
                        <td className="border p-2">{d.beamNo || d.sizedBeamNo}</td>
                        <td className="border p-2">{flangeNameMap.get(String(d.flangeId)) || d.flangeNo}</td>
                        <td className="border p-2">{d.fabricCodeQuality}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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