import { useEffect, useMemo, useState } from "react"
import { Modal } from "@/components/ui/Modal"
import { DataTable } from "@/components/data/DataTable"
import { Pagination, usePagination } from "@/components/common/Pagination"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/state/store"
import { BooleanFilter } from "@/components/filters"
import {
  deleteAgentMaster,
  getAllAgentMasters,
} from "@/state/agentMasterSlice"
import { useNavigate } from "react-router-dom"
import React from "react"
import { User, FileText, CreditCard, MapPin, Building2, BadgePercent, CheckCircle2 } from "lucide-react"

export default function AgentMaster() {
  const { agentMasterList, pagination } = useSelector((state: RootState) => state.agentMaster)
  const [agents, setAgents] = useState<any[]>(Array.isArray(agentMasterList) ? agentMasterList : [])
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [currentAgent, setCurrentAgent] = useState<any>(null)
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    getOffset,
    setItemsPerPage
  } = usePagination({ itemsPerPage: 10 })

  useEffect(() => {
    dispatch(getAllAgentMasters({
      fetchAll: true,
    }))
  }, [currentPage, dispatch, getOffset, itemsPerPage])

  useEffect(() => {
    setAgents(agentMasterList)
  }, [agentMasterList])

  const processedAgentList = useMemo(() => {
    if (!Array.isArray(agents)) return [];
    return agents.map((agent: any, index: number) => ({
      ...agent,
      serialNo: (pagination?.offset || 0) + index + 1,
      status: agent.activeFlag ? "Active" : "Inactive"
    }));
  }, [agents, pagination?.offset]);

  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: "serialNo",
        width: 50,
        disableFilters: true,
        Cell: ({ row }: any) => <span className="font-mono text-xs text-gray-500">{row.index + 1}</span>,
      },
      {
        Header: "Agent Code",
        accessor: "agentCode",
        width: 100,
        Cell: ({ value }: { value: string }) => (
          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
            {value || "AGT-001"}
          </span>
        )
      },
      {
        Header: "Agent / Firm Name",
        accessor: "agentName",
        Cell: ({ value, row }: any) => {
          const item = row.original;
          return (
            <div>
              <span className="font-bold text-gray-900 text-xs block">{value}</span>
              {item.agentType && (
                <span className="text-[10px] text-gray-500 font-medium">{item.agentType}</span>
              )}
            </div>
          );
        }
      },
      {
        Header: "Commission %",
        accessor: "agentPercentage",
        width: 110,
        Cell: ({ value, row }: any) => {
          const item = row.original;
          return (
            <span className="font-mono font-bold text-emerald-700 text-xs">
              {value !== undefined ? `${value}%` : "-"}
              {item.commissionType === "PER_METER" && <span className="text-[10px] text-gray-500 font-normal"> /mtr</span>}
            </span>
          );
        }
      },
      {
        Header: "PAN No (TDS 194H)",
        accessor: "panNo",
        width: 120,
        Cell: ({ value }: { value: string }) => (
          value ? (
            <span className="font-mono text-xs font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              {value}
            </span>
          ) : (
            <span className="text-gray-400 text-xs italic">Not Provided</span>
          )
        )
      },
      {
        Header: "GSTIN",
        accessor: "gstin",
        width: 140,
        Cell: ({ value }: { value: string }) => (
          value ? (
            <span className="font-mono text-xs text-gray-800">{value}</span>
          ) : (
            <span className="text-gray-400 text-xs italic">-</span>
          )
        )
      },
      {
        Header: "Contact No",
        accessor: "contactNo",
        Cell: ({ value, row }: any) => {
          const item = row.original;
          return (
            <div>
              <span className="font-mono text-xs text-gray-900 font-medium block">{value}</span>
              {item.email && <span className="text-[10px] text-gray-500">{item.email}</span>}
            </div>
          );
        }
      },
      {
        Header: "City / State",
        accessor: "city",
        Cell: ({ value, row }: any) => {
          const item = row.original;
          return (
            <span className="text-xs text-gray-700">
              {value || item.state || "-"}
            </span>
          );
        }
      },
      {
        Header: "Status",
        accessor: "status",
        width: 90,
        Filter: BooleanFilter,
        Cell: ({ value }: { value: string }) => (
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
              value === "Active"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {value}
          </span>
        )
      },
    ],
    [pagination?.offset],
  )

  const handleAdd = () => {
    navigate("/masters/agent-form")
  }

  const handleEdit = (agent: any) => {
    navigate("/masters/agent-form", { state: { agent } })
  }

  const handleDelete = (agent: any) => {
    setCurrentAgent(agent)
    setIsDeleteModalOpen(true)
  }

  const handleView = (agent: any) => {
    setCurrentAgent(agent)
    setIsViewModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!currentAgent?.id) return

    try {
      await dispatch(deleteAgentMaster(currentAgent.id)).unwrap()
      resetPage()
      await dispatch(getAllAgentMasters({ fetchAll: true }))
    } catch (error) {
      console.error(error)
    }

    setIsDeleteModalOpen(false)
    setCurrentAgent(null)
  }

  return (
    <div className="p-6 pt-16 space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            Agent & Indenting Agency Master
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage textile agents, brokerage percentage terms, PAN for TDS u/s 194H, GSTIN and bank remittance profiles.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={processedAgentList}
        title="Agent Master"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search agents by name, PAN, GSTIN, city..."
        disableFullDataFetch={true}
      />

      {/* Comprehensive View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Agent & Commission Profile"
        size="lg"
      >
        {currentAgent && (
          <div className="space-y-6 py-2">
            {/* Top Identity Badge */}
            <div className="flex items-start justify-between bg-blue-50/70 p-4 rounded-xl border border-blue-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                  {currentAgent.agentCode || "AGT-001"}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">{currentAgent.agentName}</h3>
                <p className="text-xs text-gray-600">{currentAgent.agentType || "General Indentor"}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 block">Default Commission:</span>
                <span className="text-xl font-bold text-emerald-700 font-mono">
                  {currentAgent.agentPercentage}%
                </span>
                <span className="text-[10px] text-gray-400 block font-mono">SAC: {currentAgent.sacCode || "996111"}</span>
              </div>
            </div>

            {/* Grid 1: Tax & Statutory */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-3 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-600" />
                Tax & Statutory Identifiers (TDS 194H)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-gray-500">PAN Number (TDS 194H):</span>
                  <p className="font-mono font-bold text-purple-900 text-sm mt-0.5">
                    {currentAgent.panNo || "Not Provided"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">GSTIN:</span>
                  <p className="font-mono font-semibold text-gray-900 mt-0.5">
                    {currentAgent.gstin || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Commission Mode:</span>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {currentAgent.commissionType || "Percentage on Basic Value"}
                  </p>
                </div>
              </div>
            </div>

            {/* Grid 2: Contact & Address */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Contact Information & Address
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-gray-500">Primary Phone:</span>
                  <p className="font-mono font-medium text-gray-900 mt-0.5">{currentAgent.contactNo}</p>
                </div>
                <div>
                  <span className="text-gray-500">Alternate Phone:</span>
                  <p className="font-mono text-gray-900 mt-0.5">{currentAgent.alternateContactNo || "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email Address:</span>
                  <p className="text-gray-900 mt-0.5">{currentAgent.email || "-"}</p>
                </div>
                <div className="col-span-2 md:col-span-3">
                  <span className="text-gray-500">Address:</span>
                  <p className="text-gray-900 mt-0.5">
                    {[currentAgent.address, currentAgent.city, currentAgent.state, currentAgent.pincode].filter(Boolean).join(", ") || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Grid 3: Bank Remittance */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-3 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                Bank Remittance Details
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-500">Bank Name:</span>
                  <p className="font-medium text-gray-900 mt-0.5">{currentAgent.bankName || "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Account No:</span>
                  <p className="font-mono font-bold text-gray-900 mt-0.5">{currentAgent.accountNo || "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">IFSC Code:</span>
                  <p className="font-mono text-gray-900 mt-0.5">{currentAgent.ifscCode || "-"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Branch Name:</span>
                  <p className="text-gray-900 mt-0.5">{currentAgent.branchName || "-"}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                currentAgent.activeFlag ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}>
                {currentAgent.activeFlag ? "Active Status" : "Inactive"}
              </span>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Agent"
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete the agent profile for <strong>"{currentAgent?.agentName}"</strong>?
          </p>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
            >
              Delete Agent
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
