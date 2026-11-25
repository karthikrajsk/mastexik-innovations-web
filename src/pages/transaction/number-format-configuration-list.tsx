import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { AppDispatch, RootState } from "@/state/store";
import { getAllMenuMasters } from "@/state/menuMasterSlice";
import {
  getAllNumberFormatConfigurations,
  deleteNumberFormatConfiguration,
  NumberFormatConfiguration
} from "@/state/numberFormatConfigurationSlice";

const resolveSelectedCompanyId = () => {
  if (typeof window === "undefined") return null;
  try {
    const direct = window.localStorage.getItem("selectedCompanyId");
    if (direct) {
      const numeric = Number(direct);
      if (!Number.isNaN(numeric)) return numeric;
      const parsed = JSON.parse(direct);
      const parsedId = Number(parsed?.id ?? parsed?.companyId);
      if (!Number.isNaN(parsedId)) return parsedId;
    }
    const fallback = window.localStorage.getItem("selectedCompany");
    if (fallback) {
      const numeric = Number(fallback);
      if (!Number.isNaN(numeric)) return numeric;
      const parsed = JSON.parse(fallback);
      const parsedId = Number(parsed?.id ?? parsed?.companyId);
      if (!Number.isNaN(parsedId)) return parsedId;
    }
  } catch {
    return null;
  }
  return null;
};

export default function NumberFormatConfigurationList() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { list: menuMasterList } = useSelector((state: RootState) => state.menuMaster);
  const { list: configurations, paginationInfo, loading } = useSelector((state: RootState) => state.numberFormatConfiguration);

  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    getOffset,
    setItemsPerPage
  } = usePagination({ itemsPerPage: 10 });

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentConfiguration, setCurrentConfiguration] = useState<NumberFormatConfiguration | null>(null);

  useEffect(() => {
    dispatch(getAllMenuMasters());
    const companyId = resolveSelectedCompanyId();
    const params: { fetchAll?: boolean; companyId?: number } = {
      // offset: getOffset(),
      // limit: itemsPerPage,
      fetchAll: true
    };
    if (companyId != null) {
      params.companyId = companyId;
    }
    dispatch(getAllNumberFormatConfigurations(params));
  }, [dispatch, currentPage, getOffset, itemsPerPage]);

  const columns = useMemo(
    () => [
      {
        Header: "Sl. No",
        accessor: "index",
        width: 80,
        disableFilters: true,
        Cell: ({ row }: { row: any }) => {
          const indexValue = row?.index;
          return indexValue != null ? indexValue + 1 : "-";
        }
      },
      {
        Header: "Screen Name",
        accessor: "screenName"
      },
      {
        Header: "Tab Name",
        accessor: "tabName",
        Cell: ({ row, value }: { row: any; value: string }) => {
          if (row.original.screenName === "Sales Order Management" && value && value.includes("-")) {
            return value.split("-")[0];
          }
          return value || "-";
        }
      },
      {
        Header: "Department",
        accessor: "department",
        Cell: ({ row }: { row: any }) => {
          const val = row.original.tabName;
          if (row.original.screenName === "Sales Order Management" && val && val.includes("-")) {
            const dept = val.split("-")[1];
            return dept.charAt(0).toUpperCase() + dept.slice(1);
          }
          return "-";
        }
      },
      {
        Header: "Number Format",
        accessor: "formatPreview"
      }
    ],
    []
  );

  const handleAdd = () => {
    navigate("/settings/number-format-configuration");
  };

  const handleEdit = (row: NumberFormatConfiguration) => {
    const parentId = row.id;
    const queryParams = new URLSearchParams();
    queryParams.set('parentId', String(parentId));
    
    navigate(`/settings/number-format-configuration?${queryParams.toString()}`, {
      state: { configuration: row, mode: 'edit' }
    });
  };

  const handleView = (row: NumberFormatConfiguration) => {
    setCurrentConfiguration(row);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (row: NumberFormatConfiguration) => {
    if (row.id && window.confirm("Are you sure you want to delete this configuration?")) {
      const companyId = resolveSelectedCompanyId();
      const deletePayload = companyId != null ? { id: row.id, companyId } : row.id;
      await dispatch(deleteNumberFormatConfiguration(deletePayload));
      resetPage();
      const params: { fetchAll?: boolean; companyId?: number } = { fetchAll: true };
      if (companyId != null) {
        params.companyId = companyId;
      }
      await dispatch(getAllNumberFormatConfigurations(params));
    }
  };

  const filteredConfigurations = useMemo(() => {
    return (configurations || []).filter((config: any) => config.activeFlag !== false);
  }, [configurations]);

  const companyId = resolveSelectedCompanyId();
  const searchApiEndpoint = companyId != null
    ? `/number-format-configurations/company/${companyId}`
    : `/number-format-configurations`;

  const totalPages = paginationInfo ? Math.ceil(paginationInfo.total / itemsPerPage) : 0;

  useEffect(() => {
    console.log('[NumberFormatConfiguration List] Pagination:', {
      paginationInfo,
      itemsPerPage,
      totalPages,
      currentPage
    });
  }, [paginationInfo, itemsPerPage, totalPages, currentPage]);

  return (
    <div className="p-6 pt-16">
      {/* <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Number Format Configuration</h1>
        <span className="text-sm text-gray-600">
          Showing {(paginationInfo?.offset || 0) + 1} - {Math.min((paginationInfo?.offset || 0) + itemsPerPage, paginationInfo?.total || 0)} of {paginationInfo?.total || 0}
        </span>
      </div> */}

      <DataTable
        columns={columns}
        data={filteredConfigurations}
        title="Number Format Configuration List"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        filterPlaceholder="Search configurations..."
        showColumnFilters={true}
        searchApiEndpoint={searchApiEndpoint}
        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        //   totalCount={paginationInfo?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
        disableFullDataFetch={true}
      />

      {/* <Pagination
        currentPage={currentPage}
        totalItems={paginationInfo?.total || 0}
        itemsPerPage={itemsPerPage}
        offset={paginationInfo?.offset || 0}
        hasNext={!!paginationInfo?.next}
        hasPrev={!!paginationInfo?.prev}
        onPageChange={handlePageChange}
      /> */}

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Number Format Configuration Details"
        className="max-w-2xl"
      >
        {currentConfiguration && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Screen Name</p>
                <p className="font-medium">{currentConfiguration.screenName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tab Name</p>
                <p className="font-medium">
                  {currentConfiguration.screenName === "Sales Order Management" && currentConfiguration.tabName && currentConfiguration.tabName.includes("-")
                    ? currentConfiguration.tabName.split("-")[0]
                    : currentConfiguration.tabName || "-"}
                </p>
              </div>
              {currentConfiguration.screenName === "Sales Order Management" && currentConfiguration.tabName && currentConfiguration.tabName.includes("-") && (
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">
                    {(() => {
                      const dept = currentConfiguration.tabName.split("-")[1];
                      return dept.charAt(0).toUpperCase() + dept.slice(1);
                    })()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Prefix</p>
                <p className="font-medium">{currentConfiguration.prefix}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Financial Year</p>
                <p className="font-medium">{currentConfiguration.financialYear}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sequence Number</p>
                <p className="font-medium">{currentConfiguration.sequenceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Separator</p>
                <p className="font-medium">{currentConfiguration.separator}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Format Preview</p>
                <p className="font-medium text-lg bg-gray-100 p-2 rounded">{currentConfiguration.formatPreview}</p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}