import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useDispatch } from "react-redux"
import type { AppDispatch } from "@/state/store"
import {
  createAgentMaster,
  updateAgentMaster,
} from "@/state/agentMasterSlice"
import { useNavigate, useLocation } from "react-router-dom"
import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, User, FileText, CreditCard, MapPin } from "lucide-react"
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect"

export interface AgentFormData {
  id?: number | null
  agentCode?: string
  agentName: string
  agentType?: string
  agentPercentage: string | number
  commissionType?: string
  sacCode?: string
  panNo?: string
  gstin?: string
  contactNo: string
  alternateContactNo?: string
  email?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  bankName?: string
  accountNo?: string
  ifscCode?: string
  branchName?: string
  activeFlag: boolean
}

export default function AgentForm() {
  const [isEditMode, setIsEditMode] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AgentFormData>({
    defaultValues: {
      activeFlag: true,
      commissionType: "PERCENTAGE",
      sacCode: "996111",
      agentType: "General Indentor",
      state: "Tamil Nadu"
    }
  })

  useEffect(() => {
    const agentData = location.state?.agent
    if (agentData) {
      setIsEditMode(true)
      reset({
        id: agentData.id,
        agentCode: agentData.agentCode || "",
        agentName: agentData.agentName || "",
        agentType: agentData.agentType || "General Indentor",
        agentPercentage: agentData.agentPercentage !== undefined ? String(agentData.agentPercentage) : "",
        commissionType: agentData.commissionType || "PERCENTAGE",
        sacCode: agentData.sacCode || "996111",
        panNo: agentData.panNo || "",
        gstin: agentData.gstin || "",
        contactNo: agentData.contactNo || "",
        alternateContactNo: agentData.alternateContactNo || "",
        email: agentData.email || "",
        address: agentData.address || "",
        city: agentData.city || "",
        state: agentData.state || "Tamil Nadu",
        pincode: agentData.pincode || "",
        bankName: agentData.bankName || "",
        accountNo: agentData.accountNo || "",
        ifscCode: agentData.ifscCode || "",
        branchName: agentData.branchName || "",
        activeFlag: agentData.activeFlag ?? true,
      })
    }
  }, [location.state, reset])

  const onSubmit = async (data: AgentFormData) => {
    const payload = {
      ...data,
      agentPercentage: parseFloat(String(data.agentPercentage)) || 0,
      panNo: data.panNo ? data.panNo.toUpperCase().trim() : undefined,
      gstin: data.gstin ? data.gstin.toUpperCase().trim() : undefined,
      ifscCode: data.ifscCode ? data.ifscCode.toUpperCase().trim() : undefined,
      id: isEditMode ? location.state?.agent?.id : undefined,
    }

    try {
      if (isEditMode) {
        await dispatch(updateAgentMaster(payload)).unwrap()
      } else {
        await dispatch(createAgentMaster(payload)).unwrap()
      }

      navigate("/masters/agent-master")
    } catch (error) {
      console.error("Failed to save agent:", error)
    }
  }

  const handleCancel = () => {
    navigate("/masters/agent-master")
  }

  return (
    <div className="p-6 pt-16">
      <div className="p-6 bg-white shadow-md rounded-lg">
        {/* Top Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div className="flex items-center space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="mr-auto"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-semibold">
              {isEditMode ? "Edit Agent Master" : "Agent Master Entry"}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Card 1: Agent Identification & Commercial Terms */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                Agent Identification & Commercials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Agent Code</label>
                  <input
                    type="text"
                    {...register("agentCode")}
                    placeholder="Auto-generated (e.g. AGT-001)"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Agent / Firm Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("agentName", {
                      required: "Agent Name is required",
                      pattern: {
                        value: /^[A-Za-z0-9\s.,&'-]+$/,
                        message: "Valid Agent Name required"
                      }
                    })}
                    placeholder="Enter agent / firm name"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {errors.agentName && (
                    <p className="mt-1 text-xs text-red-600">{errors.agentName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Agent Type</label>
                  <CommonSearchableSelect
                    placeholder="Select Agent Type"
                    value={watch("agentType") || "General Indentor"}
                    options={[
                      { value: "General Indentor", label: "General Indentor" },
                      { value: "Yarn Broker", label: "Yarn Broker" },
                      { value: "Grey Fabric Broker", label: "Grey Fabric Broker" },
                      { value: "Finished Fabric Broker", label: "Finished Fabric Broker" },
                      { value: "Sizing Agent", label: "Sizing Agent" },
                    ]}
                    onValueChange={(val) => setValue("agentType", val, { shouldValidate: true })}
                    onChange={(val: any) => setValue("agentType", typeof val === "string" ? val : val?.target?.value, { shouldValidate: true })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Commission (%) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("agentPercentage", {
                      required: "Commission % is required",
                      pattern: {
                        value: /^[0-9]+(\.[0-9]{1,3})?$/,
                        message: "Valid percentage (e.g., 1.0, 0.5, 2.0)"
                      },
                      validate: (value) => {
                        const num = parseFloat(String(value))
                        return (num >= 0 && num <= 100) || "Percentage must be between 0 and 100"
                      }
                    })}
                    placeholder="e.g. 1.00"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono font-bold"
                  />
                  {errors.agentPercentage && (
                    <p className="mt-1 text-xs text-red-600">{errors.agentPercentage.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Commission Mode</label>
                  <CommonSearchableSelect
                    placeholder="Select Commission Mode"
                    value={watch("commissionType") || "PERCENTAGE"}
                    options={[
                      { value: "PERCENTAGE", label: "Percentage (% on Basic)" },
                      { value: "PER_METER", label: "Metric (₹ per Meter / Kg)" },
                      { value: "FIXED", label: "Fixed Lump Sum" },
                    ]}
                    onValueChange={(val) => setValue("commissionType", val, { shouldValidate: true })}
                    onChange={(val: any) => setValue("commissionType", typeof val === "string" ? val : val?.target?.value, { shouldValidate: true })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">SAC Code (GST)</label>
                  <input
                    type="text"
                    {...register("sacCode")}
                    placeholder="996111"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Tax & Statutory Identifiers */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} />
                Tax & Statutory Identifiers (TDS 194H & GST)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    PAN Number <span className="text-xs text-gray-500 font-normal">(for 5% TDS 194H)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    {...register("panNo", {
                      pattern: {
                        value: /^$|^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/,
                        message: "Invalid PAN format (e.g. AAACH1290P)"
                      }
                    })}
                    placeholder="e.g. AAACH1290P"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary uppercase font-mono font-semibold"
                  />
                  {errors.panNo && (
                    <p className="mt-1 text-xs text-red-600">{errors.panNo.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    GSTIN <span className="text-xs text-gray-500 font-normal">(for 18% GST Brokerage)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    {...register("gstin", {
                      pattern: {
                        value: /^$|^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}[1-9A-Za-z]{1}Z[0-9A-Za-z]{1}$/,
                        message: "Invalid GSTIN format (15 characters)"
                      }
                    })}
                    placeholder="e.g. 33AAACH1290P1Z2"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary uppercase font-mono"
                  />
                  {errors.gstin && (
                    <p className="mt-1 text-xs text-red-600">{errors.gstin.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Contact & Address */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin size={20} />
                Contact & Address Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Contact No <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    {...register("contactNo", {
                      required: "Contact No is required",
                      pattern: {
                        value: /^[0-9]{10,15}$/,
                        message: "Contact No must be 10-15 digits"
                      }
                    })}
                    placeholder="Enter primary contact number"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                  {errors.contactNo && (
                    <p className="mt-1 text-xs text-red-600">{errors.contactNo.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Alternate Contact No</label>
                  <input
                    type="text"
                    {...register("alternateContactNo")}
                    placeholder="e.g. 0421-224455"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    {...register("email", {
                      pattern: {
                        value: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Invalid email format"
                      }
                    })}
                    placeholder="agent@example.com"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">City / Town</label>
                  <input
                    type="text"
                    {...register("city")}
                    placeholder="e.g. Tirupur, Palladam"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Premises / Street Address</label>
                  <input
                    type="text"
                    {...register("address")}
                    placeholder="Enter street / premises address"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    type="text"
                    {...register("state")}
                    placeholder="Tamil Nadu"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    {...register("pincode")}
                    placeholder="e.g. 641604"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Bank Details for Remittance */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard size={20} />
                Bank Remittance Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Bank Name</label>
                  <input
                    type="text"
                    {...register("bankName")}
                    placeholder="e.g. State Bank of India"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Account Number</label>
                  <input
                    type="text"
                    {...register("accountNo")}
                    placeholder="Enter bank account number"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">IFSC Code</label>
                  <input
                    type="text"
                    maxLength={11}
                    {...register("ifscCode")}
                    placeholder="e.g. SBIN0001200"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Branch Name</label>
                  <input
                    type="text"
                    {...register("branchName")}
                    placeholder="e.g. Tirupur Main Branch"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center pt-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("activeFlag")}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Active Agent</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white px-6 font-semibold"
            >
              {isEditMode ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
