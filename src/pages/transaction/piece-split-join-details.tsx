import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { deletePieceOperation, getPieceJoinsByCompany, getPieceSplitsByCompany } from "@/state/pieceSplitJoinSlice";
import { getAllLooms } from "@/state/loomMasterSlice";
import { getAllFlanges, getFlangeById } from "@/state/flangeSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { useResolvedCompanyId } from "@/hooks/useCompanyContext";

export default function PieceSplitJoinDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { splitList, joinList, splitPagination, joinPagination } = useSelector((s: RootState) => s.pieceSplitJoin as any);
  const { loomList } = useSelector((s: RootState) => s.loomMaster as any);
  const { flangeList } = useSelector((s: RootState) => s.flange as any);
  const { fabricMasterList } = useSelector((s: RootState) => s.fabricMaster as any);

  const [activeTab, setActiveTab] = useState<"SPLIT" | "JOIN">("SPLIT");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any | null>(null);
  const [sourceTab, setSourceTab] = useState<"INHOUSE" | "OUTSOURCING">("INHOUSE");
  const companyId = useResolvedCompanyId();

  const {
    currentPage: splitPage,
    itemsPerPage: splitItemsPerPage,
    handlePageChange: handleSplitPageChange,
    resetPage: resetSplitPage,
    getOffset: getSplitOffset,
    
  } = usePagination({ itemsPerPage: 10 });

  const {
    currentPage: joinPage,
    itemsPerPage: joinItemsPerPage,
    handlePageChange: handleJoinPageChange,
    resetPage: resetJoinPage,
    getOffset: getJoinOffset,
  } = usePagination({ itemsPerPage: 10 });

  useEffect(() => {
    const st: any = location.state as any;
    if (st?.tab === "SPLIT" || st?.tab === "JOIN") setActiveTab(st.tab);
  }, [location.state]);



  useEffect(() => {
    const params = companyId != null ? { companyId } : {};
    dispatch(getAllLooms(params));
    dispatch(getAllFabricMasters({fetchAll: true} as any));
  }, [dispatch, companyId]);

  useEffect(() => {
    if (companyId == null) return;
    dispatch(getAllFlanges({ companyId, fetchAll: true }));
  }, [dispatch, companyId]);

  useEffect(() => {
    if (activeTab === "SPLIT") {
      resetSplitPage();
    } else {
      resetJoinPage();
    }
  }, [activeTab, resetSplitPage, resetJoinPage]);

  useEffect(() => {
    if (companyId == null) return;
    const payload = {
      companyId,
      fetchAll: true
    };
    if (activeTab === "SPLIT") {
      dispatch(getPieceSplitsByCompany(payload as any));
    } else {
      dispatch(getPieceJoinsByCompany(payload as any));
    }
  }, [dispatch, companyId, activeTab, getSplitOffset, splitItemsPerPage, getJoinOffset, joinItemsPerPage, splitPage, joinPage]);

  const loomNameById = useMemo(() => {
    const raw: any = loomList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const m = new Map<string, string>();
    arr.forEach((l: any) => m.set(String(l.id), String(l.loomNo || l.loomName || l.name || l.id)));
    return m;
  }, [loomList]);

  const flangeNoById = useMemo(() => {
    const raw: any = flangeList as any;
    const arr: any[] = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
    const m = new Map<string, string>();
    arr.forEach((f: any) => {
      const label = String(f.flangeNo || f.flange_no || f.no || "");
      const keyCandidates = Array.from(new Set([f?.id, f?.flangeId, f?.flange_id]));
      keyCandidates.forEach((key) => {
        if (key != null && key !== "") {
          m.set(String(key), label);
        }
      });
    });
    return m;
  }, [flangeList]);

  const fabricLabelById = useMemo(() => {
    const arr: any[] = Array.isArray(fabricMasterList) ? fabricMasterList : Array.isArray((fabricMasterList as any)?.data) ? (fabricMasterList as any).data : [];
    const m = new Map<string, string>();
    arr.forEach((f: any) => {
      const code = String(f.fabricCode || f.fabric_code || f.code || "").trim();
      const qual = String(f.fabricQuality || f.quality || f.fabric_quality || "").trim();
      const label = [code, qual].filter(Boolean).join(" - ");
      m.set(String(f.id), label);
    });
    return m;
  }, [fabricMasterList]);

  const getFlangeLabel = useCallback(
    (row: any) => {
      const directId = row?.flangeId ?? row?.flange_id ?? row?.flange?.id;
      if (directId != null) {
        const cached = flangeNoById.get(String(directId));
        if (cached) return cached;
      }
      return row?.flangeNo || row?.flange?.flangeNo || "-";
    },
    [flangeNoById],
  );

  const sourceList = activeTab === "SPLIT" ? splitList : joinList;

  const processedList = useMemo(() => {
    const modeId = activeTab === "SPLIT" ? 1 : 2;
    const src = Array.isArray(sourceList) ? sourceList : [];
    const filtered = src.filter((x: any) => Number(x?.modeId ?? x?.mode_id ?? modeId) === modeId);
    const baseSerial = (activeTab === "SPLIT" ? splitPagination?.offset : joinPagination?.offset) || 0;
    return filtered.map((x: any, idx: number) => ({ ...x, mode: activeTab, serialNo: baseSerial + idx + 1 }));
  }, [sourceList, activeTab, splitPagination?.offset, joinPagination?.offset]);

  useEffect(() => {
    const missingIds = Array.from(
      new Set(
        processedList
          .map((row: any) => row?.flangeId ?? row?.flange_id)
          .filter((id: any) => id != null && !flangeNoById.has(String(id)))
          .map(String)
      )
    );
    missingIds.forEach((id) => dispatch(getFlangeById({ id: Number(id) })));
  }, [dispatch, processedList, flangeNoById]);

  const isSplitTab = activeTab === "SPLIT";
  const currentPaginationState = isSplitTab ? splitPagination : joinPagination;
  const currentPageIndex = isSplitTab ? splitPage : joinPage;
  const currentItemsPerPage = isSplitTab ? splitItemsPerPage : joinItemsPerPage;
  const handlePageChangeFn = isSplitTab ? handleSplitPageChange : handleJoinPageChange;

  const columns = useMemo(
    () => [
      { Header: 'S.No', accessor: 'serialNo', width: 60, disableFilters: true },
      { Header: 'Date', accessor: (row: any) => (row?.operationDate ? new Date(row.operationDate).toLocaleDateString('en-GB') : '-'), width: 100 },
            { Header: `Piece ${activeTab === "SPLIT" ? "Split" : "Join"} No`,  accessor: (row: any) => (activeTab === "SPLIT" ? row?.pieceSplitNo || '-' : row?.pieceJoinNo || '-'), width: 60, disableFilters: true },
      { Header: 'Piece No', accessor: (row: any) => (activeTab === "SPLIT" ? row?.pieceNo || row?.parentPieceNo : row?.joinedPieceNo || '-'), },
      { Header: 'Loom No', accessor: (row: any) => loomNameById.get(String(row?.loomId || row?.loom_id || '')) || row?.loomNo || '-' },
      { Header: 'Beam No', accessor: (row: any) => row?.beamNo || row?.beam_no || '-' },
      { Header: 'Empty Beam No', accessor: (row: any) => getFlangeLabel(row) },
      {
        Header: 'Sort No - Construction',
        accessor: (row: any) => {
          const directId = row?.fabricMasterId || row?.fabric_master_id;
          if (directId) return fabricLabelById.get(String(directId)) || row?.fabricLabel || '-';
          const details: any[] = Array.isArray(row?.joinPiecesDetails) ? row.joinPiecesDetails : Array.isArray(row?.splitPiecesDetails) ? row.splitPiecesDetails : [];
          const detailFabricId = details.reduce<string | undefined>((found, d: any) => found ?? (d?.fabricMasterId || d?.fabric_master_id || undefined), undefined);
          return fabricLabelById.get(String(detailFabricId || '')) || row?.fabricLabel || '-';
        },
      },
      { Header: 'Piece Meter', accessor: (row: any) => (activeTab === "JOIN" ? row?.joinedPieceMeter || '' : row?.pieceMeter || row?.parentPieceMeter || ''), },
    ],
    [loomNameById, getFlangeLabel, fabricLabelById, activeTab],
  );

  const handleAdd = () => navigate("/transaction/piece-split-join", { state: { tab: activeTab } });
  const handleEdit = (row: any) => navigate("/transaction/piece-split-join", { state: { ...row, id: row.id, operationId: activeTab === "SPLIT" ? 1 : 0, tab: activeTab } });
  const handleView = (row: any) => { setCurrentItem(row); setIsViewModalOpen(true); };
  const handleDelete = (row: any) => { setCurrentItem(row); setIsDeleteModalOpen(true); };
  const confirmDelete = async () => {
    if (!currentItem || companyId == null) return;
    const operationId = activeTab === "SPLIT" ? 1 : 0;
    try {
      await dispatch(deletePieceOperation({ id: currentItem.id, companyId, operationId })).unwrap();

      const paginationState = activeTab === "SPLIT" ? splitPagination : joinPagination;
      const itemsPerPage = activeTab === "SPLIT" ? splitItemsPerPage : joinItemsPerPage;
      const currentPageIndex = activeTab === "SPLIT" ? splitPage : joinPage;
      const handlePageChangeFn = activeTab === "SPLIT" ? handleSplitPageChange : handleJoinPageChange;
      const offsetGetter = activeTab === "SPLIT" ? getSplitOffset : getJoinOffset;

      const currentTotal = paginationState?.total || 0;
      const updatedTotal = Math.max(0, currentTotal - 1);
      const maxPage = Math.max(0, Math.ceil(updatedTotal / itemsPerPage) - 1);

      if (currentPageIndex > maxPage) {
        handlePageChangeFn(maxPage);
      } else {
        const payload = { companyId, 
          // offset: offsetGetter(), limit: itemsPerPage 
          fetchAll: true
        } as any;
        if (activeTab === "SPLIT") {
          await dispatch(getPieceSplitsByCompany(payload));
        } else {
          await dispatch(getPieceJoinsByCompany(payload));
        }
      }
    } catch (error) {
      console.error("Error deleting piece operation:", error);
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="p-6 pt-16">
      <div className="flex gap-4 border-b mb-6">
        <button
          className={`pb-2 px-4 ${activeTab === "SPLIT" ? "border-b-2 border-blue-500 text-blue-500 font-semibold" : "text-gray-600"}`}
          onClick={() => setActiveTab("SPLIT")}
        >
          Split
        </button>
        <button
          className={`pb-2 px-4 ${activeTab === "JOIN" ? "border-b-2 border-blue-500 text-blue-500 font-semibold" : "text-gray-600"}`}
          onClick={() => setActiveTab("JOIN")}
        >
          Join
        </button>
      </div>

      <DataTable
        columns={columns}
        data={processedList}
        title={`${activeTab === 'SPLIT' ? 'Split' : 'Join'} List`}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        filterPlaceholder={`Search ${activeTab.toLowerCase()}...`}
        showColumnFilters={true}
        //         initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        // totalCount={currentPaginationState?.total || 0}
        // currentPage={currentPageIndex}
        // onPageChange={activeTab === 'SPLIT' ? handleSplitPageChange : handleJoinPageChange}
          disableFullDataFetch={true}
        
        headerContent={
          <div className="flex gap-4">
            <button
              className={`pb-2 px-4 ${sourceTab === "INHOUSE" ? "border-b-2 border-blue-500 text-blue-500 font-semibold" : "text-gray-600"}`}
              onClick={() => setSourceTab("INHOUSE")}
            >
              InHouse
            </button>
            <button
              className={`pb-2 px-4 ${sourceTab === "OUTSOURCING" ? "border-b-2 border-blue-500 text-blue-500 font-semibold" : "text-gray-600"}`}
              onClick={() => setSourceTab("OUTSOURCING")}
            >
              Outsourcing
            </button>
          </div>
        }
      />
{/* 
      <Pagination
        currentPage={currentPageIndex}
        totalItems={currentPaginationState?.total || 0}
        itemsPerPage={currentItemsPerPage}
        offset={currentPaginationState?.offset || 0}
        hasNext={!!currentPaginationState?.next}
        hasPrev={!!currentPaginationState?.prev}
        onPageChange={handlePageChangeFn}
      /> */}

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Piece Split/Join">
        {currentItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-secondary-500">Mode</p>
                <p className="font-medium">{activeTab}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Date</p>
                <p className="font-medium">{currentItem.operationDate ? new Date(currentItem.operationDate).toLocaleDateString('en-GB') : '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Piece No</p>
                <p className="font-medium">{currentItem.pieceNo || currentItem.parentPieceNo}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Loom No</p>
                <p className="font-medium">{loomNameById.get(String(currentItem?.loomId || currentItem?.loom_id || '')) || currentItem.loomNo || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Beam No</p>
                <p className="font-medium">{currentItem.beamNo || currentItem.beam_no || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Empty Beam No</p>
                <p className="font-medium">{flangeNoById.get(String(currentItem?.flangeId || currentItem?.flange_id || '')) || currentItem.flangeNo || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Sort No - Construction</p>
                <p className="font-medium">{fabricLabelById.get(String(currentItem?.fabricMasterId || currentItem?.fabric_master_id || '')) || currentItem.fabricLabel || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Piece Meter</p>
                <p className="font-medium">{activeTab === "JOIN" ? (currentItem.joinedPieceMeter || '') : (currentItem.pieceMeter || currentItem.parentPieceMeter)}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Avg Wt</p>
                <p className="font-medium">{currentItem.avgWt}</p>
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
