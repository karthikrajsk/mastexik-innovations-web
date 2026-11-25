import React, { useEffect, useMemo, useRef, useState } from "react"
import { Trash } from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import { DataTable } from "@/components/data/DataTable"
import { Pagination, usePagination } from "@/components/common/Pagination" // ✅ Import pagination
import { useForm, useWatch } from "react-hook-form"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/state/store"
import { useThemeStore } from '../../store/themeStore';
import { ApplicationUser } from "@/state/application-user-slice"
import { useAuth } from "@/contexts/AuthContext"

import {
  createFabricMaster,
  deleteFabricMaster,
  getAllFabricMasterDetails,
  getAllFabricMasters,
  getAllFabricMastersForDropdown,
  getFabricMasterById,
  updateFabricMaster,
} from "@/state/fabricMasterSlice"
import { getAllProductCategory } from "@/state/productCategorySlice"
import { getAllFabricTypes } from "@/state/fabricTypeSlice"
import { getAllSubCategories } from "@/state/subCategorySlice"
import { getAllYarnMasters } from "@/state/yarnSlice"
import { getAllGstMaster } from "@/state/gstMasterSlice"
import { Value } from "@radix-ui/react-select"
import FileUploadField, { FileUploadFieldRef } from "@/components/ui/file-upload-field"
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect"

interface testingRequirementDetail {
  id: number
  testingParameter: string
  stdValue: string
}

interface fabricFormData {
  id?: number | null
  wovenFabricId: string | null
  fabricType: string
  fabricCode: string
  content: string
  contentName: string
  weave: string
  fabricQuality: string
  fabricWidth: string
  cutWidth: string
  reedspace: string
  onTableEpi: string
  onLoomEpi: string
  epi: string
  ppi: string
  greigeCode: string
  selvedgeName: string
  selvedgeDents: string
  selvedgeEndsPerDent: string
  selvedgeEnds: string
  totalEnds: string
  gsm: string
  glm: string
  tc: string
  warpCount: string
  warpConversionCount: string
  weftCount: string
  weftConversionCount: string
  noOfInsertion: string
  igst: string
  cgst: string
  sgst: string
  status: string
  imageUrl: string
  fabricImage: number | null
  designPaperImage: number | null
  stdValue: string
  taxId: string
  warpDetails: WarpDetail[]
  weftDetails: WeftDetail[]
  testingDetails: testingRequirementDetail[]
  createdOn: string
  createdBy: string
  tcMix: string
  lastModified: string
  lastModifiedBy: string
  singleBeamDbf: string
  twinBeamDbf: string
  paperTuberTareWeight: string
  hdpeWeight: string
  remarks: string
  // New crimp and GLM fields
  crimp: string
  approvedCrimp: string
  warpGlmCalculated: string
  warpGlmApproved: string
  weftGlmCalculated: string
  weftGlmApproved: string
  actualCrimp: string
  warpGlmActual: string
  weftGlmActual: string
  twinBeamTotalEnds: string
  wastagePercentage: string
  reedCount?: string
  drawingOrder?: string
  setPlan?: string
  endsPerDent?: string
}

interface WarpDetail {
  id: number
  yarnId: string
  pattern: string
  epi: string // This is specific to WarpDetail
  shrinkagePercent: string
  warpWastePercentage: string
  gramsPerMeter: string
}

interface WeftDetail {
  id: number
  yarnId: string
  pattern: string
  ppi: string // This is specific to WeftDetail  
  shrinkagePercent: string
  wastePercentage: string
  gramsPerMeter: string
}

export default function WovenFabricMaster() {
  const { uomList } = useSelector((state: RootState) => state.uom)
  const { productCategoryList } = useSelector((state: RootState) => state.productCategory)
  const { fabricTypeList } = useSelector((state: RootState) => state.fabricType)
  const { fabricMasterDetailList } = useSelector((state: RootState) => state.fabricMaster)
  const { subCategoryList: subCategories } = useSelector((state: RootState) => state.subCategory)

  const { yarnList } = useSelector((state: RootState) => state.yarn)
  const { gstList } = useSelector((state: RootState) => state.gst)
  const { applicationUserList } = useSelector((state: RootState) => state.applicationUser)
  const fabricMasterReduxState = useSelector((state: RootState) => state.fabricMaster)
  const { fabricMasterList, fabricMasterFullList, pagination } = fabricMasterReduxState
  const { theme } = useThemeStore();
  const { user } = useAuth(); // Get current logged-in user from auth context
  const selectedClass = theme === 'default'
    ? "bg-blue-600 text-white border-blue-600 shadow"
    : "bg-gray-700 text-white border-gray-800 shadow";

  console.log('[fabric-master.tsx] Redux fabricMasterReduxState:', fabricMasterReduxState)
  console.log('[fabric-master.tsx] Extracted fabricMasterList:', fabricMasterList)
  console.log('[fabric-master.tsx] Extracted pagination:', pagination)

  const {
    currentPage,
    itemsPerPage,
    setItemsPerPage,
    handlePageChange,
    resetPage,
    getOffset
  } = usePagination({ itemsPerPage: 10 })

  const [warpDetails, setWarpDetails] = useState<WarpDetail[]>([])
  const [weftDetails, setWeftDetails] = useState<WeftDetail[]>([])
  const [testingRequirementDetails, setTestingRequirementDetails] = useState<testingRequirementDetail[]>([])
  const [fabricImage, setFabricImage]: any = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [currentfabric, setCurrentfabric] = useState<any>(null)
  const [modalMode, setModalMode] = useState<"add" | "edit">("add")
  const [fabric, setFabric] = useState<any[]>(Array.isArray(fabricMasterList) ? fabricMasterList : [])
  const dispatch = useDispatch<AppDispatch>()
  const [isEditing, setIsEditing] = React.useState(false)
  const { subCategoryByCategoryList } = useSelector((state: RootState) => state.subCategory)
  const { subCategoryBySelvedgeList } = useSelector((state: RootState) => state.subCategory);

  const [selectedWarpCountYarnId, setSelectedWarpCountYarnId] = useState<string>("")
  const [selectedWeftCountYarnId, setSelectedWeftCountYarnId] = useState<string>("")

  // States for handling fabric type specific logic
  const [originalFabricType, setOriginalFabricType] = useState<string>("")
  const [selectedFabricType, setSelectedFabricType] = useState<string>("1")
  const [serverErrors, setServerErrors] = useState<{ [key: string]: string }>({})
  const [selectedGreige, setSelectedGreige] = useState<string>("")
  const [selectedFinished, setSelectedFinished] = useState<string>("")
  const [selectedGstDropdownId, setSelectedGstDropdownId] = useState<string>("")

  // Suggestion states for Sort No
  const [showCodeSuggestions, setShowCodeSuggestions] = useState(false)
  const [codeSuggestions, setCodeSuggestions] = useState<any[]>([])
  const [activeCodeIndex, setActiveCodeIndex] = useState(-1)

  const fabricImageRef = useRef<FileUploadFieldRef>(null)
  const designPaperImageRef = useRef<FileUploadFieldRef>(null)

  const [fabricImageMediaSno, setFabricImageMediaSno] = useState<number | null>(null)
  const [fabricImageFileName, setFabricImageFileName] = useState<string>("")
  const [designPaperImageMediaSno, setDesignPaperImageMediaSno] = useState<number | null>(null)
  const [designPaperImageFileName, setDesignPaperImageFileName] = useState<string>("")

  // Enhanced file download handler with error handling
  const handleFileDownload = (mediaUrl: string | undefined, fileName: string | undefined) => {
    if (!mediaUrl || !fileName) {
      console.error('Invalid file download parameters');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  // Memoized counts for yarn count lookup

  // Function to get count value from selected yarn (as requested: return countSno)
  // const getYarnCount = (yarnId: string): number => {
  //   const yarn = yarnList.find((y: any) => String(y.id) === String(yarnId));
  //   if (!yarn) return 0;

  //   // Directly return the count from the selected yarn
  //   if (yarn.countSno !== undefined && yarn.countSno !== null) {
  //     const num = Number(yarn.countSno);
  //     // alert(num);
  //     if (!Number.isNaN(num)) return num;
  //   }

  //   return 0;
  // };

  const counts = useMemo(
    () => subCategories?.filter((sc: any) => sc.categoryName === "Counts") || [],
    [subCategories]
  );




  const getYarnCount = (yarnId: string): number => {
    const yarn = yarnList.find((y: any) => String(y.id) === String(yarnId));
    if (!yarn) return 0;

    // Prefer conversion field from yarn (handles both number and string from API)
    const convNum = Number(yarn.conversion);
    if (!isNaN(convNum) && convNum > 0) {
      return convNum;
    }

    // Fallback: direct values present on yarn (handles string or number)
    const directValue =
      (yarn.count != null ? Number(yarn.count) : undefined) ??
      (yarn.countValue != null ? Number(yarn.countValue) : undefined) ??
      (yarn.countName != null ? parseFloat(String(yarn.countName)) : undefined);

    if (typeof directValue === "number" && !isNaN(directValue) && directValue > 0) return directValue;

    // Try parsing yarn name/code for format like "40/2" or "40/1"
    const yarnNameStr = yarn.yarnName || yarn.yarnCode || yarn.countName || "";
    if (typeof yarnNameStr === "string" && yarnNameStr.includes("/")) {
      const match = yarnNameStr.match(/(\d+)\/(\d+)/);
      if (match) {
        const baseCount = parseFloat(match[1]);
        const ply = parseFloat(match[2]);
        if (!isNaN(baseCount) && !isNaN(ply)) {
          return baseCount / ply;
        }
      }
    }

    // Fallback to subcategory lookup by countSno
    if (yarn.countSno) {
      const countItem = counts.find((c: any) => String(c.id) === String(yarn.countSno));
      const val = parseFloat(countItem?.subCategoryName || "0");
      if (!isNaN(val)) return val;
    }

    return 0;
  };

  const formatDateTime = (dateStr: string): string => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const yyyy = date.getFullYear();
      const MM = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const hh = String(date.getHours()).padStart(2, "0");
      const mm = String(date.getMinutes()).padStart(2, "0");
      const ss = String(date.getSeconds()).padStart(2, "0");
      return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    dispatch(getAllProductCategory({}))
    dispatch(getAllFabricTypes({}))
    dispatch(getAllYarnMasters({}))
    dispatch(getAllSubCategories({ fetchAll: true })) // Add fetchAll: true
  }, [dispatch])

  useEffect(() => {
    console.log('[fabric-master.tsx] useEffect triggered - updating fabric state with fabricMasterList:', fabricMasterList)
    setFabric(fabricMasterList)
  }, [fabricMasterList])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    setError,
    clearErrors,
    formState: { errors, dirtyFields },
  } = useForm<fabricFormData>()

  const {
    onChange: fabricTypeRegisterOnChange,
    onBlur: fabricTypeRegisterOnBlur,
    ref: fabricTypeRegisterRef,
    name: fabricTypeRegisterName,
  } = register("fabricType", { required: "Fabric Type is required" })

  const fabricCodeValue = watch("fabricCode")
  const formIdValue = watch("id")
  const warpTotalPattern = warpDetails.reduce((sum, w) => sum + (Number.parseFloat(w.pattern) || 0), 0)
  const weftTotalPattern = weftDetails.reduce((sum, w) => sum + (Number.parseFloat(w.pattern) || 0), 0)

  const warpRemainingPattern = 100 - warpTotalPattern
  const weftRemainingPattern = 100 - weftTotalPattern

  const canAddWarp = warpTotalPattern < 100
  const canAddWeft = weftTotalPattern < 100

  // Auto-calculate GLM and GSM: GSM = (GLM * 39.37) / fabricWidth
  const fabricWidthValue = watch("fabricWidth")

  useEffect(() => {
    const warpSum = warpDetails.reduce((sum, w) => sum + (parseFloat(w.gramsPerMeter) || 0), 0)
    const weftSum = weftDetails.reduce((sum, w) => sum + (parseFloat(w.gramsPerMeter) || 0), 0)
    const glm = warpSum + weftSum
    setValue("glm", glm.toFixed(4))

    const fabricWidthNum = Number.parseFloat(fabricWidthValue) || 0
    if (fabricWidthNum > 0) {
      const gsmCalc = (glm * 39.37) / fabricWidthNum
      setValue("gsm", gsmCalc.toFixed(4))
    } else {
      setValue("gsm", "")
    }
  }, [warpDetails, weftDetails, fabricWidthValue, setValue])

  useEffect(() => {
    const warpGlm = warpDetails.reduce((sum, w) => sum + (parseFloat(w.gramsPerMeter) || 0), 0)
    const weftGlm = weftDetails.reduce((sum, w) => sum + (parseFloat(w.gramsPerMeter) || 0), 0)
    const warpGlmStr = warpGlm.toFixed(4)
    const weftGlmStr = weftGlm.toFixed(4)
    setValue("warpGlmCalculated", warpGlmStr)
    setValue("warpGlmApproved", warpGlmStr)
    setValue("weftGlmCalculated", weftGlmStr)
    setValue("weftGlmApproved", weftGlmStr)
  }, [warpDetails, weftDetails, setValue])

  useEffect(() => {
    if (!errors.fabricCode) return
    const normalized = (fabricCodeValue || "").trim().toLowerCase()
    if (!normalized) return
    const duplicateExists = Array.isArray(fabricMasterList) && fabricMasterList.some((fabricItem: any) => {
      if (!fabricItem?.fabricCode) return false
      if (modalMode === "edit" && String(fabricItem.id) === String(formIdValue ?? "")) return false
      return fabricItem.fabricCode.trim().toLowerCase() === normalized
    })
    if (!duplicateExists) {
      clearErrors("fabricCode")
    }
  }, [fabricCodeValue, formIdValue, modalMode, fabricMasterList, errors.fabricCode, clearErrors])

  const handleAddWarp = () => {
    if (warpTotalPattern >= 100) {
      alert("Cannot add more warp patterns. Total pattern percentage has reached 100%.")
      return
    }
    const crimpValue = watch("crimp") || ""
    const totalEndsNum = Number.parseFloat(watch("totalEnds")) || 0;
    const initialEpiNum = totalEndsNum > 0 ? Math.round((totalEndsNum * 100) / 100) : 0;
    const initialEpi = initialEpiNum > 0 ? String(initialEpiNum) : "";
    const newItem: WarpDetail = { id: warpDetails.length + 1, yarnId: selectedWarpCountYarnId || "", pattern: "100", epi: initialEpi, shrinkagePercent: crimpValue, warpWastePercentage: "", gramsPerMeter: "" };
    if (newItem.yarnId) {
      newItem.gramsPerMeter = calculateGramsForItem(newItem, "warp", newItem.epi);
    }
    setWarpDetails([...warpDetails, newItem])
  }

  const handleAddWeft = () => {
    if (weftTotalPattern >= 100) {
      alert("Cannot add more weft patterns. Total pattern percentage has reached 100%.")
      return
    }
    const crimpValue = watch("crimp") || ""
    const totalPpiNum = Number.parseFloat(watch("ppi")) || 0;
    const initialPpiNum = totalPpiNum > 0 ? Math.round((totalPpiNum * 100) / 100) : 0;
    const initialPpi = initialPpiNum > 0 ? String(initialPpiNum) : "";
    const newItem: WeftDetail = { id: weftDetails.length + 1, yarnId: selectedWeftCountYarnId || "", pattern: "100", ppi: initialPpi, shrinkagePercent: crimpValue, wastePercentage: "", gramsPerMeter: "" };
    if (newItem.yarnId) {
      newItem.gramsPerMeter = calculateGramsForItem(newItem, "weft", newItem.ppi);
    }
    setWeftDetails([...weftDetails, newItem])
  }

  const handleAddTestingRequirement = () => {
    setTestingRequirementDetails([
      ...testingRequirementDetails,
      { id: testingRequirementDetails.length + 1, testingParameter: "", stdValue: "" },
    ])
  }

  const handleDeleteWarp = (id: any) => {
    setWarpDetails(warpDetails.filter((item: any) => item.id !== id))
  }

  const handleDeleteWeft = (id: any) => {
    setWeftDetails(weftDetails.filter((item: any) => item.id !== id))
  }

  const handleDeleteTestingRequirement = (id: number) => {
    setTestingRequirementDetails((prev) => prev.filter((item) => item.id !== id))
  }

  const dropdownFabricSource = useMemo(() => {
    if (Array.isArray(fabricMasterDetailList) && fabricMasterDetailList.length > 0) {
      return fabricMasterDetailList
    }
    if (Array.isArray(fabricMasterFullList) && fabricMasterFullList.length > 0) {
      return fabricMasterFullList
    }
    return Array.isArray(fabricMasterList) ? fabricMasterList : []
  }, [fabricMasterDetailList, fabricMasterFullList, fabricMasterList])

  const greigeOptions = useMemo(() => {
    return dropdownFabricSource.filter((fabric: any) => Number(fabric.fabricType) === 1)
  }, [dropdownFabricSource])

  const finishedOptions = useMemo(() => {
    return dropdownFabricSource.filter((fabric: any) => Number(fabric.fabricType) === 2)
  }, [dropdownFabricSource])

  const watchFabricType = watch("fabricType")
  const watchFabricTypeValue = String(watchFabricType || "")

  const shouldShowGreigeCode = modalMode === "edit" ? originalFabricType !== "1" : watch("fabricType") !== "1"

  const dropdownOptions = watchFabricTypeValue === "3" ? finishedOptions : greigeOptions
  const greigeSelectionRequired = watchFabricTypeValue === "2" || watchFabricTypeValue === "3"
  const wovenFabricRegister = register("wovenFabricId", {
    required: greigeSelectionRequired
      ? "Greige selection is required for Finished/Finished Shade"
      : false,
  })
  const wovenFabricValue = watch("wovenFabricId") || ""

  const handleGreigeSelection = (selectedId: string) => {
    const isFinishedShade = watchFabricTypeValue === "3"

    if (isFinishedShade) {
      setSelectedFinished(selectedId)
    } else {
      setSelectedGreige(selectedId)
    }

    setValue("wovenFabricId", selectedId)

    const sourceOptions = isFinishedShade ? finishedOptions : greigeOptions
    const selectedFabric = sourceOptions.find((fabric: any) => String(fabric.id) === String(selectedId))

    if (selectedFabric) {
      setValue("greigeCode", selectedFabric.fabricCode || selectedId)
    } else if (!selectedId) {
      setValue("greigeCode", "")
    } else {
      setValue("greigeCode", selectedId)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFabricImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const processedCityList = useMemo(() => {
    console.log('[fabric-master.tsx] processedCityList useMemo - fabric state:', fabric)
    if (!Array.isArray(fabric)) {
      console.log('[fabric-master.tsx] fabric is not an array, returning empty')
      return []
    }
    const processed = fabric.map((city: any, index: number) => ({
      ...city,
      serialNo: (pagination.offset || 0) + index + 1
      // serialNo: index + 1
    }));
    console.log('[fabric-master.tsx] processedCityList:', processed)
    return processed
  }, [fabric]);


  const parseRateValue = (value: any) => {
    const num = Number(value)
    return Number.isFinite(num) ? num : 0
  }

  const activeGstList = useMemo(() => {
    const rawList = Array.isArray(gstList)
      ? gstList
      : Array.isArray((gstList as any)?.data)
        ? (gstList as any).data
        : []
    return rawList.filter((gst: any) => gst.activeFlag !== false)
  }, [gstList])

  const normalizedGstList = useMemo(() => {
    return activeGstList.map((gst: any) => {
      const cgstRate = parseRateValue(gst.cgstRate ?? gst.cgst ?? 0)
      const sgstRate = parseRateValue(gst.sgstRate ?? gst.sgst ?? 0)
      const igstRate = parseRateValue(gst.igstRate ?? gst.igst ?? 0)
      const totalRate = igstRate || (cgstRate + sgstRate)
      const breakdown: string[] = []
      if (cgstRate) breakdown.push(`CGST ${cgstRate}%`)
      if (sgstRate) breakdown.push(`SGST ${sgstRate}%`)
      if (igstRate) breakdown.push(`IGST ${igstRate}%`)
      const label = `${totalRate}%`
      return { ...gst, cgstRate, sgstRate, igstRate, totalRate, label }
    })
  }, [activeGstList])

  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: 'serialNo', // ✅ Use pre-calculated serial number
        width: 50,
disableFilters: true,
      },
      // {
      //   Header: "Fabric Name",
      //   accessor: "fabricName",
      // },
      {
        Header: "Sort No",
        accessor: "fabricCode",
      },
      {
        Header: "Construction",
        accessor: "fabricQuality",
      },
      {
        Header: "Total Ends",
        accessor: "totalEnds",
      },
      {
        Header: "Warp GLM Approved",
        accessor: "warpGlmApproved",
      },
      {
        Header: "Weft GLM Approved",
        accessor: "weftGlmApproved",
      },
      {
        Header: 'Fabric Image',
        accessor: (row: any) => row.fabricImageDetail,
        id: 'fabricImageDetail',
        Cell: ({ value }: any) => {
          const detail = value;
          const hasFile = detail && detail.mediaUrl && detail.originalFileName;
          if (hasFile) {
            return (
              <button
                onClick={() => handleFileDownload(detail.mediaUrl, detail.originalFileName)}
                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-sm font-medium transition-colors"
                type="button"
                title={`Download ${detail.originalFileName}`}
              >
                📄 {detail.originalFileName}
              </button>
            );
          }
          return <span className="text-gray-400 text-sm cursor-not-allowed">No file</span>;
        },
        disableFilters: true,
      },
      {
        Header: 'Design Paper Image',
        accessor: (row: any) => row.designPaperImageDetail,
        id: 'designPaperImageDetail',
        Cell: ({ value }: any) => {
          const detail = value;
          const hasFile = detail && detail.mediaUrl && detail.originalFileName;
          if (hasFile) {
            return (
              <button
                onClick={() => handleFileDownload(detail.mediaUrl, detail.originalFileName)}
                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-sm font-medium transition-colors"
                type="button"
                title={`Download ${detail.originalFileName}`}
              >
                📄 {detail.originalFileName}
              </button>
            );
          }
          return <span className="text-gray-400 text-sm cursor-not-allowed">No file</span>;
        },
        disableFilters: true,
      },
    ],
    [],
  )

  const isPrefillingTaxRef = useRef(false)
  const nextPrefillGstIdRef = useRef<string | null>(null)
  const skipWeftGramsRecalcRef = useRef(false)

  const watchFabricWidth = watch("fabricWidth")
  const watchOnTableEpi = watch("onTableEpi")
  const watchReadspace = watch("reedspace")
  const watchSelvedgeDents = watch("selvedgeDents")
  const watchSelvedgeEndsPerDent = watch("selvedgeEndsPerDent")
  const watchSelvedgeEnds = watch("selvedgeEnds")
  const watchNoOfInsertion = watch("noOfInsertion")
  const watchWeave = watch("weave")
  const watchPpi = watch("ppi")
  const watchTotalEnds = watch("totalEnds")
  const [calcReedspaceRaw, calcPpiRaw, calcNoOfInsertionRaw, calcFabricWidthRaw, calcOnTableEpiRaw, calcTotalEndsRaw] = useWatch({
    control,
    name: ["reedspace", "ppi", "noOfInsertion", "fabricWidth", "onTableEpi", "totalEnds"],
  })
  const gramsCalcInputs = useMemo(() => {
    const reedspace = parseFloat(calcReedspaceRaw || "0") || 0
    const ppi = parseFloat(calcPpiRaw || "0") || 0
    const noOfInsertionNum = Math.max(1, Number(calcNoOfInsertionRaw) || 1)
    const fabricWidth = parseFloat(calcFabricWidthRaw || "0") || 0
    const onTableEpi = parseFloat(calcOnTableEpiRaw || "0") || 0

    return {
      weft: { reedspace, ppi, noOfInsertionNum },
      warp: { fabricWidth, onTableEpi },
    }
  }, [calcReedspaceRaw, calcPpiRaw, calcNoOfInsertionRaw, calcFabricWidthRaw, calcOnTableEpiRaw])

  // Auto-populate EPI, On Loom Reed, and Finished PPI when quality matches existing fabric
  useEffect(() => {
    const fabricQualityValue = watch("fabricQuality");
    if (!fabricQualityValue || fabricQualityValue.trim() === "") {
      return;
    }

    const matchingFabric = fabricMasterList.find((f: any) =>
      f.fabricQuality && f.fabricQuality.toLowerCase() === fabricQualityValue.toLowerCase()
    );

    if (matchingFabric) {
      // Only auto-populate if fields are empty or if we're in add mode
      if (modalMode === "add" || (modalMode === "edit" && !dirtyFields.onTableEpi)) {
        const epiVal = matchingFabric.onTableEpi != null ? matchingFabric.onTableEpi : matchingFabric.epi;
        if (epiVal != null) {
          setValue("onTableEpi", epiVal.toString(), { shouldValidate: false });
          setValue("epi", epiVal.toString(), { shouldValidate: false });
        }
      }

      if (modalMode === "add" || (modalMode === "edit" && !dirtyFields.onLoomEpi)) {
        if (matchingFabric.onLoomEpi || matchingFabric.onLoomEpi === 0) {
          setValue("onLoomEpi", matchingFabric.onLoomEpi.toString(), { shouldValidate: false });
        }
      }

      if (modalMode === "add" || (modalMode === "edit" && !dirtyFields.ppi)) {
        if (matchingFabric.ppi || matchingFabric.ppi === 0) {
          setValue("ppi", matchingFabric.ppi.toString(), { shouldValidate: false });
        }
      }
    }
  }, [watch("fabricQuality"), fabricMasterList, modalMode, setValue, dirtyFields]);


  // Helper function to get short yarn name (first word only)
  const getShortYarnName = (fullName: string): string => {
    if (!fullName) return "";
    return fullName.split(/\s+/)[0];
  };

  // Helper function to get yarn name by ID (short - first word only)
  const getYarnName = (yarnId: string): string => {
    const yarn = yarnList.find((y: any) => String(y.id) === String(yarnId));
    return getShortYarnName(yarn?.yarnName || "");
  };

  // Helper function to get full yarn name by ID
  const getFullYarnName = (yarnId: string): string => {
    const yarn = yarnList.find((y: any) => String(y.id) === String(yarnId));
    return yarn?.yarnName || "";
  };

  // Auto-set reedspace based on fabricWidth
  useEffect(() => {
    if (modalMode !== "add") return
    if (watchFabricWidth) {
      const widthNum = parseFloat(watchFabricWidth);
      if (!isNaN(widthNum)) {
        setValue("reedspace", (widthNum + 3).toFixed(2));
      }
    }
  }, [watchFabricWidth, setValue, modalMode]);

  useEffect(() => {
    const dents = Number.parseFloat(watchSelvedgeDents) || 0
    const endsPerDent = Number.parseFloat(watchSelvedgeEndsPerDent) || 0
    const selvedgeEnds = dents * endsPerDent
    setValue("selvedgeEnds", selvedgeEnds.toString())
  }, [watchSelvedgeDents, watchSelvedgeEndsPerDent, setValue])

  useEffect(() => {
    if (modalMode !== "add") return
    const fabricWidth = Number.parseFloat(watchFabricWidth) || 0
    const onTableEpi = Number.parseFloat(watchOnTableEpi) || 0
    const selvedgeEnds = Number.parseFloat(watchSelvedgeEnds) || 0
    const totalEnds = (fabricWidth * onTableEpi) + selvedgeEnds
    setValue("totalEnds", totalEnds.toString())
  }, [watchFabricWidth, watchOnTableEpi, watchSelvedgeEnds, setValue, modalMode])

  useEffect(() => {
    if (modalMode === "add" || !watch("onLoomEpi")) {
      setValue("onLoomEpi", watchOnTableEpi || "")
    }
  }, [watchOnTableEpi, modalMode, setValue])

  // Recalculate weft grams when reedspace changes
  // useEffect(() => {
  //   if (!weftDetails || weftDetails.length === 0) return;
  //   for (let i = 0; i < weftDetails.length; i++) {
  //     const currentPpi = weftDetails[i].ppi || "";
  //     calculateGramsForRow(i, "weft", currentPpi);
  //   }
  // }, [watchReadspace]);

  //   useEffect(() => {
  //   const totalEndsNum = Number.parseFloat(watchTotalEnds) || 0;
  //   if (totalEndsNum <= 0 || !warpDetails || warpDetails.length === 0) return;
  //   const updated = warpDetails.map((w) => {
  //     const patternNum = Number.parseFloat(w.pattern) || 0;
  //     const newEpiNum = Math.round((totalEndsNum * patternNum) / 100);
  //     const newEpi = newEpiNum > 0 ? String(newEpiNum) : "";
  //     const count = getYarnCount(w.yarnId);
  //     const shrinkageNum = (Number.parseFloat(w.shrinkagePercent) || 0) / 100;
  //     let gramsStr = w.gramsPerMeter;
  //     if (newEpiNum > 0 && count > 0) {
  //       const grams = (newEpiNum / 1693.33 / count) + shrinkageNum;
  //       gramsStr = grams.toFixed(2);
  //     }
  //     return { ...w, epi: newEpi, gramsPerMeter: gramsStr };
  //   });
  //   setWarpDetails(updated);
  // }, [watchTotalEnds, yarnList, counts]);

  // When totalEnds changes, update each warp row's EPI from pattern and recalc grams
  // Auto-generate Fabric Quality from warp/weft details, EPI, PPI, width, noOfInsertion, weave
  useEffect(() => {
    if (dirtyFields.fabricQuality) return;
    if (!warpDetails.length || !weftDetails.length) return;

    const warpHasYarnId = warpDetails.some(w => w.yarnId && w.yarnId !== "");
    const weftHasYarnId = weftDetails.some(w => w.yarnId && w.yarnId !== "");
    const onTableEpi = Number(watchOnTableEpi) || 0;
    const ppi = Number(watchPpi) || 0;
    const fabricWidth = Number(watchFabricWidth) || 0;
    const noOfInsertion = Number(watchNoOfInsertion) || 0;

    if (!warpHasYarnId || !weftHasYarnId || !onTableEpi || !ppi || fabricWidth <= 0) {
      return;
    }

    const warpParts = [...new Set(warpDetails
      .map((w) => w.yarnId ? getFullYarnName(w.yarnId) : "")
      .filter(Boolean))].join("+");

    const weftParts = [...new Set(weftDetails
      .map((w) => w.yarnId ? getFullYarnName(w.yarnId) : "")
      .filter(Boolean))].join("+");

    if (!warpParts || !weftParts) return;

    const weaveItem = subCategories?.find((sc: any) =>
      String(sc.id) === String(watchWeave) && sc.categoryName === "Weave"
    );
    const weaveName = weaveItem?.subCategoryName || "";

    const ppiPart = noOfInsertion > 0 ? `(${ppi} x ${noOfInsertion})` : `${ppi}`;
    const quality = `${warpParts} x ${weftParts} / ${onTableEpi} x ${ppiPart} / ${fabricWidth}"${weaveName ? ` ${weaveName}` : ""}`.trim();

    setValue("fabricQuality", quality);
  }, [warpDetails, weftDetails, watchOnTableEpi, watchPpi, watchFabricWidth, watchNoOfInsertion, watchWeave, subCategories, setValue]);

  const syncWarpDetailsFromTotalEnds = (totalEndsNum: number) => {
    if (totalEndsNum <= 0 || !warpDetails || warpDetails.length === 0) return;

    const updated = warpDetails.map((w) => {
      const patternNum = Number.parseFloat(w.pattern) || 0;
      const newEpiNum = Math.round((totalEndsNum * patternNum) / 100);
      const newEpi = newEpiNum > 0 ? String(newEpiNum) : "";
      const nextItem = { ...w, epi: newEpi };
      const gramsPerMeter = calculateGramsForItem(nextItem, "warp", newEpi);
      return { ...nextItem, gramsPerMeter };
    });

    setWarpDetails(updated);
  };

  useEffect(() => {
    if (modalMode !== "add" || !warpDetails.length) return;
    const totalEndsNum = Number.parseFloat(calcTotalEndsRaw || "0") || 0;
    if (totalEndsNum <= 0) return;

    setWarpDetails((prev) => {
      const updated = prev.map((w) => {
        const patternNum = Number.parseFloat(w.pattern) || 0;
        const newEpiNum = Math.round((totalEndsNum * patternNum) / 100);
        const newEpi = newEpiNum > 0 ? String(newEpiNum) : "";
        const nextItem = { ...w, epi: newEpi };
        const gramsPerMeter = calculateGramsForItem(nextItem, "warp", newEpi);
        return { ...nextItem, gramsPerMeter };
      });

      const changed = updated.some(
        (item, idx) =>
          item.epi !== prev[idx]?.epi || item.gramsPerMeter !== prev[idx]?.gramsPerMeter,
      );
      return changed ? updated : prev;
    });
  }, [calcTotalEndsRaw, modalMode, warpDetails.length, yarnList, counts, gramsCalcInputs.warp]);

  // Recalculate warp grams when warp formula inputs change
  // (fabricWidth/onTableEpi) without changing any other warp fields.
  useEffect(() => {
    if (!warpDetails.length) return;

    setWarpDetails((prev) => {
      const updated = prev.map((w) => {
        const gramsPerMeter = calculateGramsForItem(w, "warp", w.epi);
        return { ...w, gramsPerMeter };
      });

      const changed = updated.some(
        (item, idx) => item.gramsPerMeter !== prev[idx]?.gramsPerMeter,
      );
      return changed ? updated : prev;
    });
  }, [gramsCalcInputs.warp, warpDetails.length, yarnList, counts]);

  //   useEffect(() => {
  //   const totalPpi = Number.parseFloat(watchPpi) || 0;
  //   if (totalPpi <= 0 || !weftDetails || weftDetails.length === 0) return;
  //   const readspaceNum = Number.parseFloat(watchReadspace) || 0;
  //   const updated = weftDetails.map((w) => {
  //     const patternNum = Number.parseFloat(w.pattern) || 0;
  //     const newPpiNum = Math.round((totalPpi * patternNum) / 100);
  //     const newPpi = newPpiNum > 0 ? String(newPpiNum) : "";
  //     const count = getYarnCount(w.yarnId);
  //     const shrinkageNum = (Number.parseFloat(w.shrinkagePercent) || 0) / 100;
  //     let gramsStr = w.gramsPerMeter;
  //     if (newPpiNum > 0 && readspaceNum > 0 && count > 0) {
  //       const grams = ((newPpiNum * readspaceNum) / 1693.33 / count) + shrinkageNum;
  //       gramsStr = grams.toFixed(2);
  //     }
  //     return { ...w, ppi: newPpi, gramsPerMeter: gramsStr };
  //   });
  //   setWeftDetails(updated);
  // }, [watchPpi, yarnList, counts]);

  // When fabric-level PPI changes, update each weft row's PPI from pattern and recalc grams
  useEffect(() => {
    if (skipWeftGramsRecalcRef.current || !weftDetails.length) return;
    const totalPpi = Number.parseFloat(calcPpiRaw || "0") || 0;
    if (totalPpi <= 0) return;

    setWeftDetails((prev) => {
      const updated = prev.map((w) => {
        const patternNum = Number.parseFloat(w.pattern) || 0;
        const newPpiNum = Math.round((totalPpi * patternNum) / 100);
        const newPpi = newPpiNum > 0 ? String(newPpiNum) : "";
        const nextItem = { ...w, ppi: newPpi };
        const gramsPerMeter = calculateGramsForItem(nextItem, "weft", newPpi);
        return { ...nextItem, gramsPerMeter };
      });

      const changed = updated.some(
        (item, idx) =>
          item.ppi !== prev[idx]?.ppi || item.gramsPerMeter !== prev[idx]?.gramsPerMeter,
      );
      return changed ? updated : prev;
    });
  }, [calcPpiRaw, weftDetails.length, yarnList, counts, gramsCalcInputs.weft]);

  const validatePatternPercentage = (details: WarpDetail[] | WeftDetail[], type: "warp" | "weft") => {
    const total = details.reduce((sum, item) => sum + (Number.parseFloat(item.pattern) || 0), 0)

    // if (total < 99.5 || total > 100) {
    if (total < 99.5 || total > 100.05) {
      alert(`Total ${type} pattern percentage must be between 99.5% and 100%. Current total: ${total.toFixed(2)}%`)
      return false
    }
    return true
  }

  // Updated warp pattern change handler
  const handleWarpPatternChange = (index: number, value: string) => {
    const numValue = Number.parseFloat(value) || 0;
    const currentPattern = Number.parseFloat(warpDetails[index].pattern) || 0;
    const otherPatternsTotal = warpTotalPattern - currentPattern;

    if (otherPatternsTotal + numValue > 100) {
      alert(
        `Pattern value cannot exceed ${(100 - otherPatternsTotal).toFixed(2)}%. Remaining available: ${warpRemainingPattern.toFixed(2)}%`,
      );
      return;
    }

    // Calculate epi based on new pattern (rounded to integer)
    const totalEnds = Number.parseFloat(watch("totalEnds")) || 0;
    let newEpi = "";
    if (totalEnds > 0) {
      const newEpiNum = Math.round((totalEnds * numValue) / 100);
      newEpi = newEpiNum > 0 ? newEpiNum.toString() : "";
    }

    // Create updated item
    const updatedItem = {
      ...warpDetails[index],
      pattern: value,
      epi: newEpi
    };

    // Calculate grams
    const gramsStr = calculateGramsForItem(updatedItem, "warp", newEpi);
    const finalItem = { ...updatedItem, gramsPerMeter: gramsStr };

    const updated = warpDetails.map((item, idx) =>
      idx === index ? finalItem : item
    );
    setWarpDetails(updated);
  };

  // Updated weft pattern change handler (ppi rounded to integer)
  const handleWeftPatternChange = (index: number, value: string) => {
    const numValue = Number.parseFloat(value) || 0;
    const currentPattern = Number.parseFloat(weftDetails[index].pattern) || 0;
    const otherPatternsTotal = weftTotalPattern - currentPattern;

    if (otherPatternsTotal + numValue > 100) {
      alert(
        `Pattern value cannot exceed ${(100 - otherPatternsTotal).toFixed(2)}%. Remaining available: ${weftRemainingPattern.toFixed(2)}%`,
      );
      return;
    }

    // Calculate ppi based on new pattern (rounded)
    const totalPpi = Number.parseFloat(watch("ppi")) || 0;
    let newPpi = "";
    if (totalPpi > 0) {
      const newPpiNum = Math.round((totalPpi * numValue) / 100);
      newPpi = newPpiNum > 0 ? String(newPpiNum) : "";
    }

    // Create updated item
    const updatedItem = {
      ...weftDetails[index],
      pattern: value,
      ppi: newPpi
    };

    // Calculate grams
    const gramsStr = calculateGramsForItem(updatedItem, "weft", newPpi);
    const finalItem = { ...updatedItem, gramsPerMeter: gramsStr };

    const updated = weftDetails.map((item, idx) =>
      idx === index ? finalItem : item
    );
    setWeftDetails(updated);
  };


  const handleWarpEpiChange = (index: number, value: string) => {
    const rawNum = Number.parseFloat(value);
    const numValue = isNaN(rawNum) ? 0 : Math.round(rawNum);
    const newValue = numValue > 0 ? String(numValue) : "";

    // Calculate pattern based on new epi (keep pattern with 2 decimals)
    const totalEnds = Number.parseFloat(watch("totalEnds")) || 0;
    let newPattern = warpDetails[index].pattern;

    // if (totalEnds > 0 && numValue > 0) {
    //   newPattern = ((numValue / totalEnds) * 100).toFixed(2);
    // }
    if (totalEnds > 0 && numValue > 0) {
      const calculatedPattern = (numValue / totalEnds) * 100;
      const currentItemPattern = Number.parseFloat(warpDetails[index].pattern) || 0;
      const otherPatternsTotal = warpTotalPattern - currentItemPattern;

      if (otherPatternsTotal + calculatedPattern > 100.05) {
        alert(`Warning: This EPI value results in a total pattern of ${(otherPatternsTotal + calculatedPattern).toFixed(2)}%, which exceeds 100%.`);
      }
      newPattern = calculatedPattern.toFixed(2);
    }

    // Create updated item with all changes
    const updatedItem = {
      ...warpDetails[index],
      epi: newValue,
      pattern: newPattern
    };

    // Calculate grams for the updated item
    const gramsStr = calculateGramsForItem(updatedItem, "warp", newValue);
    const finalItem = { ...updatedItem, gramsPerMeter: gramsStr };

    // Update the state with the fully calculated item
    const updated = warpDetails.map((item, idx) =>
      idx === index ? finalItem : item
    );

    setWarpDetails(updated);
  };

  // Enhanced weft PPI change handler
  const handleWeftPpiChange = (index: number, value: string) => {
    const rawNum = Number.parseFloat(value);
    const numValue = isNaN(rawNum) ? 0 : Math.round(rawNum);
    const newValue = numValue > 0 ? String(numValue) : "";

    // Calculate pattern based on new ppi (keep pattern with 2 decimals)
    const totalPpi = Number.parseFloat(watch("ppi")) || 0;
    let newPattern = weftDetails[index].pattern;

    // if (totalPpi > 0 && numValue > 0) {
    //   newPattern = ((numValue / totalPpi) * 100).toFixed(2);
    // }
    if (totalPpi > 0 && numValue > 0) {
      const calculatedPattern = (numValue / totalPpi) * 100;
      const currentItemPattern = Number.parseFloat(weftDetails[index].pattern) || 0;
      const otherPatternsTotal = weftTotalPattern - currentItemPattern;

      if (otherPatternsTotal + calculatedPattern > 100.05) {
        alert(`Warning: This PPI value results in a total pattern of ${(otherPatternsTotal + calculatedPattern).toFixed(2)}%, which exceeds 100%.`);
      }
      newPattern = calculatedPattern.toFixed(2);
    }
    // Create updated item with all changes
    const updatedItem = {
      ...weftDetails[index],
      ppi: newValue,
      pattern: newPattern
    };

    // Calculate grams for the updated item
    const gramsStr = calculateGramsForItem(updatedItem, "weft", newValue);
    const finalItem = { ...updatedItem, gramsPerMeter: gramsStr };

    // Update the state with the fully calculated item
    const updated = weftDetails.map((item, idx) =>
      idx === index ? finalItem : item
    );

    setWeftDetails(updated);
  };

  const calculateGramsForItem = (
    item: WarpDetail | WeftDetail,
    type: "warp" | "weft",
    endsValue: string
  ): string => {
    const yarnCount = getYarnCount(item.yarnId);
    const shrinkagePercent = parseFloat(item.shrinkagePercent) || 0;

    let baseGrams = 0;

    if (type === "weft") {
      const { reedspace, noOfInsertionNum } = gramsCalcInputs.weft;
      const rowPpi = parseFloat(endsValue) || parseFloat((item as WeftDetail).ppi) || 0;
      const wastePercentage = parseFloat((item as WeftDetail).wastePercentage) || 0;

      if (reedspace > 0 && rowPpi > 0 && yarnCount > 0) {
        baseGrams = ((reedspace * rowPpi) * 0.000591) / yarnCount;
      }
      if (baseGrams > 0) {
        const gramsWithShrinkage = (baseGrams + (baseGrams * (shrinkagePercent / 100))) * noOfInsertionNum;
        const gramsWithWaste = gramsWithShrinkage + (gramsWithShrinkage * (wastePercentage / 100));
        return gramsWithWaste.toFixed(4);
      }

      return "0.0000";
    } 
    else if (type === "warp") {
      const rowEpi = parseFloat(endsValue) || parseFloat((item as WarpDetail).epi) || 0;
      const warpWastePercentage = parseFloat((item as WarpDetail).warpWastePercentage) || 0;

      if (rowEpi > 0 && yarnCount > 0) {
        baseGrams = (rowEpi * 0.000591) / yarnCount;
      }

      if (baseGrams > 0) {
        const gramsWithShrinkage = baseGrams + (baseGrams * (shrinkagePercent / 100));
        const gramsWithWaste = gramsWithShrinkage + (gramsWithShrinkage * (warpWastePercentage / 100));
        return gramsWithWaste.toFixed(4);
      }

      return "0.0000";
    }

    if (baseGrams > 0) {
      const gramsWithShrinkage = baseGrams + (baseGrams * (shrinkagePercent / 100));
      return gramsWithShrinkage.toFixed(4);
    }

    return "0.0000";
  };

  const calculateGramsForRow = (
    index: number,
    type: "warp" | "weft",
    endsValue: string,
    yarnIdOverride?: string,
    shrinkageOverride?: string
  ) => {
    if (type === "weft") {
      const item = weftDetails[index];
      const itemWithOverrides = { ...item };
      if (yarnIdOverride) itemWithOverrides.yarnId = yarnIdOverride;
      if (shrinkageOverride) itemWithOverrides.shrinkagePercent = shrinkageOverride;

      const gramsStr = calculateGramsForItem(itemWithOverrides, type, endsValue);

      const updated = weftDetails.map((item, idx) =>
        idx === index ? { ...itemWithOverrides, gramsPerMeter: gramsStr } : item
      );
      setWeftDetails(updated);
    } else {
      const item = warpDetails[index];
      const itemWithOverrides = { ...item };
      if (yarnIdOverride) itemWithOverrides.yarnId = yarnIdOverride;
      if (shrinkageOverride) itemWithOverrides.shrinkagePercent = shrinkageOverride;

      const gramsStr = calculateGramsForItem(itemWithOverrides, type, endsValue);

      const updated = warpDetails.map((item, idx) =>
        idx === index ? { ...itemWithOverrides, gramsPerMeter: gramsStr } : item
      );
      setWarpDetails(updated);
    }
  };

  const handleShrinkageChange = (index: number, type: "warp" | "weft", value: string) => {
    if (type === "warp") {
      const updatedItem = { ...warpDetails[index], shrinkagePercent: value };
      const gramsStr = calculateGramsForItem(updatedItem, "warp", updatedItem.epi);
      const finalItem = { ...updatedItem, gramsPerMeter: gramsStr };

      const updated = warpDetails.map((item, idx) =>
        idx === index ? finalItem : item
      );
      setWarpDetails(updated);
    } else {
      const updatedItem = { ...weftDetails[index], shrinkagePercent: value };
      const gramsStr = calculateGramsForItem(updatedItem, "weft", updatedItem.ppi);
      const finalItem = { ...updatedItem, gramsPerMeter: gramsStr };

      const updated = weftDetails.map((item, idx) =>
        idx === index ? finalItem : item
      );
      setWeftDetails(updated);
    }
  };

  const handleWarpWasteChange = (index: number, value: string) => {
    const updatedItem = { ...warpDetails[index], warpWastePercentage: value };
    const gramsStr = calculateGramsForItem(updatedItem, "warp", updatedItem.epi);
    const finalItem = { ...updatedItem, gramsPerMeter: gramsStr };

    const updated = warpDetails.map((item, idx) =>
      idx === index ? finalItem : item
    );
    setWarpDetails(updated);
  };

  const handleWeftWasteChange = (index: number, value: string) => {
    const updatedItem = { ...weftDetails[index], wastePercentage: value };
    const gramsStr = calculateGramsForItem(updatedItem, "weft", updatedItem.ppi);
    const finalItem = { ...updatedItem, gramsPerMeter: gramsStr };

    const updated = weftDetails.map((item, idx) =>
      idx === index ? finalItem : item
    );
    setWeftDetails(updated);
  };

  const syncShrinkageFromCrimp = (crimpValue: string) => {
    setWarpDetails((prev) =>
      prev.map((item) => {
        const updatedItem = { ...item, shrinkagePercent: crimpValue };
        const gramsStr = calculateGramsForItem(updatedItem, "warp", updatedItem.epi);
        return { ...updatedItem, gramsPerMeter: gramsStr };
      })
    );

    setWeftDetails((prev) =>
      prev.map((item) => {
        const updatedItem = { ...item, shrinkagePercent: crimpValue };
        const gramsStr = calculateGramsForItem(updatedItem, "weft", updatedItem.ppi);
        return { ...updatedItem, gramsPerMeter: gramsStr };
      })
    );
  };

  // Updated yarn change handler (recalculate using new yarn immediately via override)
  // const handleYarnChange = (index: number, type: "warp" | "weft", value: string) => {
  //   if (type === "warp") {
  //     const updatedItem = { ...warpDetails[index], yarnId: value };
  //     const gramsStr = calculateGramsForItem(updatedItem, "warp", updatedItem.epi);
  //     const finalItem = { ...updatedItem, gramsPerMeter: gramsStr };

  //     const updated = warpDetails.map((item, idx) =>
  //       idx === index ? finalItem : item
  //     );
  //     setWarpDetails(updated);
  //   } else {
  //     const updatedItem = { ...weftDetails[index], yarnId: value };
  //     const gramsStr = calculateGramsForItem(updatedItem, "weft", updatedItem.ppi);
  //     const finalItem = { ...updatedItem, gramsPerMeter: gramsStr };

  //     const updated = weftDetails.map((item, idx) =>
  //       idx === index ? finalItem : item
  //     );
  //     setWeftDetails(updated);
  //   }
  // };
  const handleYarnChange = (index: number, type: "warp" | "weft", value: string) => {
    if (type === "warp") {
      const isDuplicate = warpDetails.some((item, idx) => idx !== index && String(item.yarnId) === String(value));
      if (isDuplicate && value !== "") {
        alert("This yarn is already selected in Warp details.");
        return;
      }
      const updatedItem = { ...warpDetails[index], yarnId: value };
      const gramsStr = calculateGramsForItem(updatedItem, "warp", updatedItem.epi);
      const finalItem = { ...updatedItem, gramsPerMeter: gramsStr };

      const updated = warpDetails.map((item, idx) =>
        idx === index ? finalItem : item
      );
      setWarpDetails(updated);
    } else {
      const isDuplicate = weftDetails.some((item, idx) => idx !== index && String(item.yarnId) === String(value));
      if (isDuplicate && value !== "") {
        alert("This yarn is already selected in Weft details.");
        return;
      }
      const updatedItem = { ...weftDetails[index], yarnId: value };
      const gramsStr = calculateGramsForItem(updatedItem, "weft", updatedItem.ppi);
      const finalItem = { ...updatedItem, gramsPerMeter: gramsStr };

      const updated = weftDetails.map((item, idx) =>
        idx === index ? finalItem : item
      );
      setWeftDetails(updated);
    }
  };
  const getSubCategoriesByCategory = (categoryName: string) => {
    return subCategories?.filter((sc: any) =>
      sc.categoryName === categoryName && sc.activeFlag === true
    ) || [];
  };

  const { onChange: codeOnChange, onBlur: codeOnBlur, ref: codeRef, name: codeName } = register("fabricCode", { required: "Sort No is required" })

  // Suggestion handlers for Sort No
  const handleCodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    codeOnChange(e)
    const value = e.target.value
    const filtered = fabricMasterList.filter((f: any) =>
      f.fabricCode.toLowerCase().includes(value.toLowerCase())
    )
    setCodeSuggestions(filtered)
    setShowCodeSuggestions(!!(value && filtered.length > 0))
    if (filtered.length > 0) {
      setActiveCodeIndex(0)
    }
  }

  const handleCodeFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value) {
      const filtered = fabricMasterList.filter((f: any) =>
        f.fabricCode.toLowerCase().includes(value.toLowerCase())
      )
      setCodeSuggestions(filtered)
      setShowCodeSuggestions(true)
      if (filtered.length > 0) {
        setActiveCodeIndex(0)
      }
    }
  }

  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showCodeSuggestions) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveCodeIndex((prev) => (prev + 1) % codeSuggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveCodeIndex((prev) => (prev - 1 + codeSuggestions.length) % codeSuggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeCodeIndex >= 0 && activeCodeIndex < codeSuggestions.length) {
        selectCodeSuggestion(codeSuggestions[activeCodeIndex])
      }
    } else if (e.key === 'Escape') {
      setShowCodeSuggestions(false)
    }
  }

  const selectCodeSuggestion = (item: any) => {
    // Use setValue with shouldValidate and shouldDirty options
    setValue('fabricCode', item.fabricCode, { shouldValidate: true, shouldDirty: true })

    // Also update any other fields you want to pre-fill
    if (item.weave) setValue('weave', String(item.weave), { shouldValidate: true, shouldDirty: true })
    if (item.fabricQuality) setValue('fabricQuality', item.fabricQuality, { shouldValidate: true, shouldDirty: true })
    if (item.gsm) setValue('gsm', item.gsm.toString(), { shouldValidate: true, shouldDirty: true })
    if (item.glm) setValue('glm', item.glm.toString(), { shouldValidate: true, shouldDirty: true })

    setShowCodeSuggestions(false)
    setActiveCodeIndex(-1)
  }


  // const handleCodeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  //   codeOnBlur(e)
  //   setTimeout(() => {
  //     setShowCodeSuggestions(false)
  //   }, 200)
  //   const value = watch('fabricCode')
  //   if (value) {
  //     const exact = fabricMasterList.find((f: any) => f.fabricCode === value)
  //     if (exact) {
  //       selectCodeSuggestion(exact)
  //     }
  //   }
  // }

  const handleCodeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    codeOnBlur(e)
    setTimeout(() => {
      setShowCodeSuggestions(false)
    }, 200)

    // Optional: Auto-select exact match on blur
    const value = watch('fabricCode')
    if (value) {
      const exact = fabricMasterList.find((f: any) =>
        f.fabricCode.toLowerCase() === value.toLowerCase()
      )
      if (exact) {
        selectCodeSuggestion(exact)
      }
    }
  }

  const handleAdd = () => {
    setModalMode("add")
    setCurrentfabric(null)
    setOriginalFabricType("")
    setSelectedFabricType("1") // Default to Greige
    setSelectedGreige("")
    setSelectedFinished("")
    setSelectedGstDropdownId("")
    nextPrefillGstIdRef.current = null
    isPrefillingTaxRef.current = false
    setFabricImage(null)
    setFabricImageMediaSno(null)
    setFabricImageFileName("")
    setDesignPaperImageMediaSno(null)
    setDesignPaperImageFileName("")
    setWarpDetails([])
    setWeftDetails([])
    setTestingRequirementDetails([])
    setSelectedWarpCountYarnId("")
    setSelectedWeftCountYarnId("")
    // Clear code suggestion state
    setShowCodeSuggestions(false)
    setCodeSuggestions([])
    setActiveCodeIndex(-1)
    reset({
      fabricType: "1",
      fabricCode: "",
      content: "",
      wovenFabricId: null,
      weave: "",
      fabricQuality: "",
      fabricWidth: "",
      cutWidth: "",
      reedspace: "",
      onTableEpi: "",
      onLoomEpi: "",
      epi: "",
      ppi: "",
      greigeCode: "",
      selvedgeName: "",
      selvedgeDents: "",
      selvedgeEndsPerDent: "",
      selvedgeEnds: "",
      totalEnds: "",
      gsm: "",
      glm: "",
      tc: "",
      warpCount: "",
      warpConversionCount: "",
      weftCount: "",
      weftConversionCount: "",
      noOfInsertion: "1",
      igst: "",
      cgst: "",
      sgst: "",
      status: "Active",
      imageUrl: "",
      warpDetails: [],
      weftDetails: [],
      testingDetails: [],
      taxId: "1",
      createdOn: "",
      createdBy: "",
      tcMix: "",
      lastModified: "",
      lastModifiedBy: "",
      singleBeamDbf: "",
      twinBeamDbf: "",
      paperTuberTareWeight: "",
      hdpeWeight: "",
      remarks: "",
      crimp: "",
      approvedCrimp: "",
      warpGlmCalculated: "",
      warpGlmApproved: "",
      weftGlmCalculated: "",
      weftGlmApproved: "",
      actualCrimp: "",
      warpGlmActual: "",
      weftGlmActual: "",
      twinBeamTotalEnds: "",
      wastagePercentage: "",
      reedCount: "",
      drawingOrder: "",
      setPlan: "",
      endsPerDent: "",
    })
    setIsModalOpen(true)
  }

  const populateFormFromFabric = (fabric: any, options?: { fetchDropdownData?: boolean }) => {
    if (!fabric) return

    const fetchDropdownData = options?.fetchDropdownData ?? true
    setCurrentfabric(fabric)

    const fabricTypeNum = Number(fabric.fabricType) || 1
    const fabricTypeStr = String(fabricTypeNum)
    setOriginalFabricType(fabricTypeStr)
    setSelectedFabricType(fabricTypeStr)

    const wovenId = fabric.wovenFabricId ? String(fabric.wovenFabricId) : ""
    if (fabricTypeNum === 2) {
      setSelectedGreige(wovenId)
      setSelectedFinished("")
    } else if (fabricTypeNum === 3) {
      setSelectedFinished(wovenId)
      setSelectedGreige("")
    } else {
      setSelectedGreige("")
      setSelectedFinished("")
    }

    setSelectedWarpCountYarnId(fabric.warpCount ? String(fabric.warpCount) : "")
    setSelectedWeftCountYarnId(fabric.weftCount ? String(fabric.weftCount) : "")
    setFabricImage(fabric.imageUrl || null)
    setFabricImageMediaSno(fabric.fabricImage ?? null)
    setFabricImageFileName(fabric.fabricImageDetail?.originalFileName || "")
    setDesignPaperImageMediaSno(fabric.designPaperImage ?? null)
    setDesignPaperImageFileName(fabric.designPaperImageDetail?.originalFileName || "")

    setWarpDetails(
      Array.isArray(fabric.warpDetails)
        ? fabric.warpDetails.map((item: any) => ({
            ...item,
            warpWastePercentage: item.warpWastePercentage != null ? String(item.warpWastePercentage) : "",
          }))
        : []
    )
    setWeftDetails(
      Array.isArray(fabric.weftDetails)
        ? fabric.weftDetails.map((item: any) => ({
            ...item,
            wastePercentage: item.wastePercentage != null ? String(item.wastePercentage) : "",
          }))
        : []
    )

    const testingDetailsArray = Array.isArray(fabric.testingRequirementDetails)
      ? fabric.testingRequirementDetails
      : Array.isArray(fabric.testingDetails)
        ? fabric.testingDetails
        : []

    setTestingRequirementDetails([...testingDetailsArray])

    const taxIdFromData = fabric.taxType ? String(fabric.taxType) : "1"

    reset({
      id: fabric.id,
      fabricType: fabricTypeStr,
      wovenFabricId: wovenId,
      fabricCode: fabric.fabricCode || "",
      content: fabric.content || "",
      weave: fabric.weave ? String(fabric.weave) : "",
      fabricQuality: fabric.fabricQuality || "",
      fabricWidth: fabric.fabricWidth?.toString() || "",
      cutWidth: fabric.cutWidth?.toString() || "",
      reedspace: fabric.reedspace?.toString() || "",
      onTableEpi: fabric.onTableEpi?.toString() || fabric.epi?.toString() || "",
      onLoomEpi: fabric.onLoomEpi?.toString() || "",
      epi: fabric.epi?.toString() || fabric.onTableEpi?.toString() || "",
      ppi: fabric.ppi?.toString() || "",
      greigeCode: fabricTypeNum === 1 ? "" : fabric.greigeCode || fabric.fabricCode || "",
      selvedgeName: fabric.selvedgeName || "",
      selvedgeDents: fabric.selvedgeDents?.toString() || "",
      selvedgeEndsPerDent: fabric.selvedgeEndsPerDent?.toString() || "",
      selvedgeEnds: fabric.selvedgeEnds?.toString() || "",
      totalEnds: fabric.totalEnds?.toString() || "",
      gsm: fabric.gsm?.toString() || "",
      glm: fabric.glm?.toString() || "",
      tc: fabric.tc || "",
      warpCount: fabric.warpCount ? String(fabric.warpCount) : "",
      warpConversionCount: fabric.warpConversionCount || "",
      weftCount: fabric.weftCount ? String(fabric.weftCount) : "",
      weftConversionCount: fabric.weftConversionCount || "",
      noOfInsertion: fabric.noOfInsertion ? String(fabric.noOfInsertion) : "",
      igst: fabric.igst?.toString() || "",
      cgst: fabric.cgst?.toString() || "",
      sgst: fabric.sgst?.toString() || "",
      status: fabric.status || "Active",
      imageUrl: fabric.imageUrl,
      warpDetails: Array.isArray(fabric.warpDetails) ? fabric.warpDetails : [],
      weftDetails: Array.isArray(fabric.weftDetails) ? fabric.weftDetails : [],
      testingDetails: testingDetailsArray,
      taxId: taxIdFromData,
      stdValue: fabric.stdValue?.toString() || "",
      createdOn: fabric.createdOn || "",
      createdBy: fabric.createdBy || "",
      tcMix: fabric.tcMix || "",
      lastModified: fabric.lastModified || "",
      lastModifiedBy: fabric.lastModifiedBy || "",
      singleBeamDbf: fabric.singleBeamDbf || "",
      twinBeamDbf: fabric.twinBeamDbf || "",
      paperTuberTareWeight: fabric.paperTuberTareWeight?.toString() || "",
      hdpeWeight: fabric.hdpeWeight?.toString() || "",
      remarks: fabric.remarks || "",
      crimp: fabric.crimp || "",
      approvedCrimp: fabric.approvedCrimp || "",
      warpGlmCalculated: fabric.warpGlmCalculated?.toString() || "",
      warpGlmApproved: fabric.warpGlmApproved?.toString() || "",
      weftGlmCalculated: fabric.weftGlmCalculated?.toString() || "",
      weftGlmApproved: fabric.weftGlmApproved?.toString() || "",
      actualCrimp: fabric.actualCrimp?.toString() || "",
      warpGlmActual: fabric.warpGlmActual?.toString() || "",
      weftGlmActual: fabric.weftGlmActual?.toString() || "",
      twinBeamTotalEnds: fabric.twinBeamTotalEnds?.toString() || "",
      wastagePercentage: fabric.wastagePercentage?.toString() || "",
      reedCount: fabric.reedCount?.toString() || "",
      drawingOrder: fabric.drawingOrder || "",
      setPlan: fabric.setPlan || "",
      endsPerDent: fabric.endsPerDent?.toString() || "",
    })

    const taxType = fabric.taxType ?? 1
    let matchingId = ""
    const gstPercentFromData = fabric.gstPercent ?? 0
    const matchingEntry = Object.entries(gstIdToPercent).find(([id, percent]) => percent === gstPercentFromData)
    if (matchingEntry) {
      matchingId = matchingEntry[0]
    }

    setSelectedGstDropdownId(matchingId)
    nextPrefillGstIdRef.current = matchingId || null
    isPrefillingTaxRef.current = true
    setValue("taxId", String(taxType))

    setShowCodeSuggestions(false)
    setCodeSuggestions([])
    setActiveCodeIndex(-1)

    if (fetchDropdownData) {
      if (fabricTypeNum === 2) {
        dispatch(getAllFabricMasterDetails({ id: 1 }))
      } else if (fabricTypeNum === 3) {
        dispatch(getAllFabricMasterDetails({ id: 2 }))
      }
    }
  }

  const handleEdit = async (fabric: any) => {
    console.log("fabricdetails", fabric)
    setModalMode("edit")
    populateFormFromFabric(fabric, { fetchDropdownData: true })
    setIsModalOpen(true)

    if (!fabric.id) return

    try {
      const detailResponse = await dispatch(getFabricMasterById(fabric.id)).unwrap()
      const detailData = detailResponse?.data ?? detailResponse
      if (detailData) {
        populateFormFromFabric(detailData, { fetchDropdownData: false })
      }
    } catch (error) {
      console.error("Failed to fetch fabric master details", error)
    }
  }

  const handleDelete = (fabric: any) => {
    setCurrentfabric(fabric)
    setIsDeleteModalOpen(true)
  }

  const handleView = (fabric: any) => {
    setCurrentfabric(fabric)
    setIsViewModalOpen(true)
  }

  const getCurrentUserName = (): string => {
    // Get the current logged-in user from auth context
    if (user && user.userName) {
      return user.userName;
    }
    return "SYSTEM";
  };

  const onSubmit = async (data: fabricFormData) => {
    try {
      console.log("Form data submitted:", data)

      const normalizedCode = (data.fabricCode || "").trim().toLowerCase()
      if (normalizedCode) {
        const duplicate = Array.isArray(fabricMasterList) && fabricMasterList.some((fabricItem: any) => {
          if (!fabricItem?.fabricCode) return false
          if (modalMode === "edit" && String(fabricItem.id) === String(data.id ?? "")) return false
          return fabricItem.fabricCode.trim().toLowerCase() === normalizedCode
        })
        if (duplicate) {
          setError("fabricCode", { type: "manual", message: "Fabric code already exists" }, { shouldFocus: true })
          return
        }
      }
      clearErrors("fabricCode")


      // Validate warp details mandatory fields
      if (warpDetails.length > 0) {
        for (let i = 0; i < warpDetails.length; i++) {
          const warp = warpDetails[i]
          if (!warp.yarnId || warp.yarnId === "") {
            alert(`Warp Detail Row ${i + 1}: Yarn is mandatory`)
            return
          }
          if (!warp.pattern || warp.pattern === "") {
            alert(`Warp Detail Row ${i + 1}: Pattern is mandatory`)
            return
          }
          if (!warp.epi || warp.epi === "") {
            alert(`Warp Detail Row ${i + 1}: EPI is mandatory`)
            return
          }
        }
      }

      // Validate weft details mandatory fields
      if (weftDetails.length > 0) {
        for (let i = 0; i < weftDetails.length; i++) {
          const weft = weftDetails[i]
          if (!weft.yarnId || weft.yarnId === "") {
            alert(`Weft Detail Row ${i + 1}: Yarn is mandatory`)
            return
          }
          if (!weft.pattern || weft.pattern === "") {
            alert(`Weft Detail Row ${i + 1}: Pattern is mandatory`)
            return
          }
          if (!weft.ppi || weft.ppi === "") {
            alert(`Weft Detail Row ${i + 1}: PPI is mandatory`)
            return
          }
        }
      }
      // Final check on pattern totals before submission
      if (warpTotalPattern < 99.5 || warpTotalPattern > 100.05) {
        alert(`Cannot save: Warp total pattern is ${warpTotalPattern.toFixed(2)}%, but it must be between 99.5% and 100%.`)
        return
      }

      if (weftTotalPattern < 99.5 || weftTotalPattern > 100.05) {
        alert(`Cannot save: Weft total pattern is ${weftTotalPattern.toFixed(2)}%, but it must be between 99.5% and 100%.`)
        return
      }

      if (!validatePatternPercentage(warpDetails, "warp")) {
        return
      }

      if (!validatePatternPercentage(weftDetails, "weft")) {
        return
      }

      const fabricTotalEnds = Number.parseFloat(data.totalEnds) || 0
      const warpTotalEnds = warpDetails.reduce((sum, warp) => sum + (Number.parseFloat(warp.epi) || 0), 0)
      const endsTolerance = fabricTotalEnds * 0.005

      if (Math.abs(warpTotalEnds - fabricTotalEnds) > (endsTolerance > 0.01 ? endsTolerance : 0.01)) {
        alert(`Warp details total ends (${warpTotalEnds.toFixed(2)}) must match fabric total ends (${fabricTotalEnds}) within 0.5% tolerance`)
        return
      }

      const fabricPpi = Number.parseFloat(data.ppi) || 0
      const weftTotalPpi = weftDetails.reduce((sum, weft) => sum + (Number.parseFloat(weft.ppi) || 0), 0)
      const ppiTolerance = fabricPpi * 0.005

      if (Math.abs(weftTotalPpi - fabricPpi) > (ppiTolerance > 0.01 ? ppiTolerance : 0.01)) {
        alert(`Weft details total PPI (${weftTotalPpi.toFixed(2)}) must match fabric PPI (${fabricPpi}) within 0.5% tolerance`)
        return
      }

      // const fabricTotalEnds = Number.parseFloat(data.totalEnds) || 0

      // const warpTotalEnds = warpDetails.reduce((sum, warp) => sum + (Number.parseFloat(warp.epi) || 0), 0)
      // if (Math.abs(warpTotalEnds - fabricTotalEnds) > 0.01) {
      //   alert(`Warp details total ends (${warpTotalEnds.toFixed(2)}) must match fabric total ends (${fabricTotalEnds})`)
      //   return
      // }

      // const fabricPpi = Number.parseFloat(data.ppi) || 0
      // const weftTotalPpi = weftDetails.reduce((sum, weft) => sum + (Number.parseFloat(weft.ppi) || 0), 0)
      // if (Math.abs(weftTotalPpi - fabricPpi) > 0.01) {
      //   alert(`Weft details total PPI (${weftTotalPpi.toFixed(2)}) must match fabric PPI (${fabricPpi})`)
      //   return
      // }

      // Handle media uploads on submit
      let currentFabricImageSno = fabricImageMediaSno;
      let currentDesignPaperImageSno = designPaperImageMediaSno;

      if (fabricImageRef.current?.hasFile()) {
        const uploadedSno = await fabricImageRef.current.uploadFile();
        if (uploadedSno) {
          currentFabricImageSno = uploadedSno;
          setFabricImageMediaSno(uploadedSno);
        }
      }

      if (designPaperImageRef.current?.hasFile()) {
        const uploadedSno = await designPaperImageRef.current.uploadFile();
        if (uploadedSno) {
          currentDesignPaperImageSno = uploadedSno;
          setDesignPaperImageMediaSno(uploadedSno);
        }
      }

      let igst = 0
      let cgst = 0
      let sgst = 0
      let gstPercent = null
      const numericTaxId = data.taxId ? Number.parseInt(data.taxId) : 1 // Default to 1 (GST)

      if (selectedGstDropdownId) {
        gstPercent = gstIdToPercent[selectedGstDropdownId]
        if (numericTaxId === 2) {
          // IGST
          igst = gstPercent
        } else if (numericTaxId === 1) {
          // GST (CGST + SGST)
          const halfPercent = gstPercent / 2
          cgst = halfPercent
          sgst = halfPercent
        }
      } else {
        // If no GST dropdown selected, use manually entered values if available
        igst = Number.parseFloat(data.igst) || 0
        cgst = Number.parseFloat(data.cgst) || 0
        sgst = Number.parseFloat(data.sgst) || 0

        if (numericTaxId === 2) {
          gstPercent = igst
        } else if (numericTaxId === 1) {
          gstPercent = cgst + sgst
        }
      }

      const fabricTypeNum = data.fabricType ? Number.parseInt(data.fabricType) : null;

      const formData = {
        id: data.id !== undefined ? data.id : null,
        fabricType: fabricTypeNum,
        wovenFabricId: data.wovenFabricId ? Number.parseInt(data.wovenFabricId) : null,
        fabricCode: data.fabricCode,
        content: data.content,
        weave: data.weave ? Number.parseInt(data.weave) : null,
        fabricQuality: data.fabricQuality,

        // NEW FIELDS - Convert to appropriate types
        fabricWidth: data.fabricWidth ? Number.parseFloat(data.fabricWidth) : null,
        cutWidth: data.cutWidth ? Number.parseFloat(data.cutWidth) : null,
        reedspace: data.reedspace ? Number.parseFloat(data.reedspace) : null,
        onTableEpi: data.onTableEpi ? Number.parseInt(data.onTableEpi) : (data.epi ? Number.parseInt(data.epi) : null),
        onLoomEpi: data.onLoomEpi ? Number.parseInt(data.onLoomEpi) : null,
        epi: data.onTableEpi ? Number.parseInt(data.onTableEpi) : (data.epi ? Number.parseInt(data.epi) : null),
        selvedgeName: data.selvedgeName,
        selvedgeDents: data.selvedgeDents ? Number.parseInt(data.selvedgeDents) : null,
        selvedgeEndsPerDent: data.selvedgeEndsPerDent ? Number.parseInt(data.selvedgeEndsPerDent) : null,
        selvedgeEnds: data.selvedgeEnds ? Number.parseInt(data.selvedgeEnds) : null,

        ppi: data.ppi ? Number.parseInt(data.ppi) : null,
        // greigeCode: fabricTypeNum === 1 ? "" : (data.greigeCode ? Number.parseInt(data.greigeCode) : null),
        greigeCode: fabricTypeNum === 1 ? null : (data.wovenFabricId || data.greigeCode || null),
        totalEnds: data.totalEnds ? Number.parseInt(data.totalEnds) : null,
        gsm: data.gsm ? Number.parseFloat(data.gsm) : null,
        glm: data.glm ? Number.parseFloat(data.glm) : null,
        tc: data.tc || null,
        warpCount: data.warpCount ? Number.parseInt(data.warpCount) : null,
        warpConversionCount: data.warpConversionCount || null,
        weftCount: data.weftCount ? Number.parseInt(data.weftCount) : null,
        weftConversionCount: data.weftConversionCount || null,
        noOfInsertion: data.noOfInsertion ? Number.parseInt(data.noOfInsertion) : null,

        // GST fields
        igst: igst,
        cgst: cgst,
        sgst: sgst,
        taxType: numericTaxId,
        gstPercent: gstPercent,

        stdValue: data.stdValue ? Number.parseFloat(data.stdValue) : null,
        fabricImageUrl: fabricImage,
        fabricImage: currentFabricImageSno,
        designPaperImage: currentDesignPaperImageSno,
        status: data.status || "Active", // Ensure status is sent

        // New fields
        createdOn: modalMode === "add" ? new Date().toISOString() : data.createdOn,
        createdBy: modalMode === "add" ? getCurrentUserName() : data.createdBy,
        tcMix: data.tcMix || null,
        lastModified: new Date().toISOString(),
        lastModifiedBy: getCurrentUserName(),
        singleBeamDbf: data.singleBeamDbf || null,
        twinBeamDbf: data.twinBeamDbf || null,
        paperTuberTareWeight: data.paperTuberTareWeight ? Number.parseFloat(data.paperTuberTareWeight) : null,
        hdpeWeight: data.hdpeWeight ? Number.parseFloat(data.hdpeWeight) : null,
        remarks: data.remarks || null,

        // New crimp and GLM fields
        crimp: data.crimp || null,
        approvedCrimp: data.approvedCrimp || null,
        warpGlmCalculated: data.warpGlmCalculated ? Number.parseFloat(data.warpGlmCalculated) : null,
        warpGlmApproved: data.warpGlmApproved ? Number.parseFloat(data.warpGlmApproved) : null,
        weftGlmCalculated: data.weftGlmCalculated ? Number.parseFloat(data.weftGlmCalculated) : null,
        weftGlmApproved: data.weftGlmApproved ? Number.parseFloat(data.weftGlmApproved) : null,
        actualCrimp: data.actualCrimp ? Number.parseFloat(data.actualCrimp) : null,
        warpGlmActual: data.warpGlmActual ? Number.parseFloat(data.warpGlmActual) : null,
        weftGlmActual: data.weftGlmActual ? Number.parseFloat(data.weftGlmActual) : null,
        twinBeamTotalEnds: data.twinBeamTotalEnds ? Number.parseInt(data.twinBeamTotalEnds) : null,
        wastagePercentage: data.wastagePercentage ? Number.parseFloat(data.wastagePercentage) : null,
        reedCount: data.reedCount ? Number.parseFloat(data.reedCount) : null,
        drawingOrder: data.drawingOrder || null,
        setPlan: data.setPlan || null,
        endsPerDent: data.endsPerDent ? Number.parseInt(data.endsPerDent) : null,

        // Details
        warpDetails: warpDetails,
        weftDetails: weftDetails,
        testingDetails: testingRequirementDetails,
      }

      console.log("Final form data being sent:", formData)

      try {
        setServerErrors({})

        if (modalMode === "edit") {
          await dispatch(updateFabricMaster(formData)).unwrap()
        } else {
          const { id, ...newFabricMasterData } = formData
          await dispatch(createFabricMaster(newFabricMasterData)).unwrap()
        }

        await dispatch(getAllFabricMasters({ fetchAll: true }))
        setIsModalOpen(false)
        reset()
        setWarpDetails([])
        setWeftDetails([])
        setTestingRequirementDetails([])
        setFabricImage(null)
        setSelectedWarpCountYarnId("")
        setSelectedWeftCountYarnId("")
        setModalMode("add")
      } catch (error: any) {
        console.error("Error submitting form:", error)

        const serverMessage =
          typeof error?.payload === "string"
            ? error.payload
            : error?.payload?.message || error?.message || "An unexpected error occurred"

        if (serverMessage.toLowerCase().includes('fabric code') || serverMessage.toLowerCase().includes('fabric_code')) {
          setServerErrors({ fabricCode: serverMessage })
          setError("fabricCode", { type: "manual", message: serverMessage }, { shouldFocus: true })
        } else {
          setServerErrors({ general: serverMessage })
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  useEffect(() => {
    dispatch(getAllFabricMasters({
    fetchAll: true,
    }))
  }, [currentPage, dispatch, itemsPerPage])

  // Initial calculations when form loads with data (warp only - weft preserves saved gramsPerMeter)
  useEffect(() => {
    if (modalMode === "edit" && currentfabric) {
      warpDetails.forEach((warp, index) => {
        if (warp.epi) {
          calculateGramsForRow(index, "warp", warp.epi, warp.yarnId, warp.shrinkagePercent);
        }
      });
    }
  }, [currentfabric, modalMode]);

  const confirmDelete = async () => {
    if (!currentfabric) return

    try {
      await dispatch(deleteFabricMaster(currentfabric.id)).unwrap()
      await dispatch(getAllFabricMasters({ fetchAll: true }))
    } catch (error) {
      console.error("Error deleting Fabric:", error)
    }

    setIsDeleteModalOpen(false)
  }

  function closePopup(): void {
    throw new Error("Function not implemented.")
  }

  const handleFilterChange = (filter: number | string) => {
    let filteredData = fabricMasterList
    if (filter !== "all") {
      filteredData = fabricMasterList.filter((fabric: any) => {
        return fabric.fabricType === Number(filter)
      })
    }
    setFabric(filteredData)
  }

  const [selectedFilter, setSelectedFilter] = useState("all")

  const filterOptions = [
    { label: "All", value: "all" },
    { label: "Greige", value: 1 },
    { label: "Finished", value: 2 },
    { label: "Finished Shade", value: 3 },
  ]

  const handleClick = (value: any) => {
    setSelectedFilter(value)
    handleFilterChange(value)
  }

  const gstOptionList = useMemo(() => {
    if (!Array.isArray(gstList)) return [];
    return gstList.map((gst: any) => ({
      id: gst.id,
      name: parseFloat(gst.gstName || '0')
    }));
  }, [gstList]);

  const gstIdToPercent = useMemo(() => {
    const map: Record<string, number> = {};
    if (Array.isArray(gstList)) {
      gstList.forEach((gst: any) => {
        map[String(gst.id)] = parseFloat(gst.gstName || '0');
      });
    }
    return map;
  }, [gstList]);

  const gstIdToRates = useMemo(() => {
    const map: Record<string, { cgst: number; sgst: number; igst: number; total: number }> = {}
    normalizedGstList.forEach((gst: any) => {
      map[String(gst.id)] = {
        cgst: gst.cgstRate,
        sgst: gst.sgstRate,
        igst: gst.igstRate,
        total: gst.totalRate,
      }
    })
    return map
  }, [normalizedGstList])

  useEffect(() => {
    // Initial data fetches
    dispatch(getAllProductCategory({}));
    dispatch(getAllFabricTypes({ fetchAll: true }));
    dispatch(getAllYarnMasters({ fetchAll: true }));
    dispatch(getAllSubCategories({ fetchAll: true }));
    dispatch(getAllGstMaster({ fetchAll: true }));
    dispatch(getAllFabricMastersForDropdown());

    // Fetch paginated fabric masters for the table
    dispatch(getAllFabricMasters({
        fetchAll: true,
    }));

  }, [dispatch]);

  const handleFabricTypeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedFabricType(value);
    setValue("fabricType", value);

    // Clear greige selections when changing fabric type
    setSelectedGreige("");
    setSelectedFinished("");
    setValue("wovenFabricId", "");
    setValue("greigeCode", "");

    // Reset form fields when switching to greige (type 1)
    if (value === "1") {
      // Clear any prefilled data from greige selection
      setValue("weave", "");
      setValue("fabricQuality", "");
      setValue("fabricWidth", "");
      setValue("cutWidth", "");
      setValue("reedspace", "");
      setValue("onTableEpi", "");
      setValue("onLoomEpi", "");
      setValue("ppi", "");
      setWarpDetails([]);
      setWeftDetails([]);
      setTestingRequirementDetails([]);
    }

    // For finished/finished shade, we need to fetch greige/finished fabrics
    if (value === "2" || value === "3") {
      const sourceId = value === "2" ? 1 : 2;
      await dispatch(getAllFabricMasterDetails({ id: sourceId }));
    }
  };


  // Use the selectedTaxId from form state or default to '1' (GST)
  const selectedTaxId = watch("taxId") || "1"

  useEffect(() => {

    if (modalMode === "add") {
      setValue("igst", "")
    }
  }, [modalMode, setValue])

  useEffect(() => {
    // This effect handles pre-filling CGST/SGST or IGST based on selected GST dropdown and tax type
    if (!isPrefillingTaxRef.current) {
      return
    }

    const prefillId = nextPrefillGstIdRef.current
    if (!prefillId) {
      isPrefillingTaxRef.current = false
      return
    }

    setSelectedGstDropdownId(prefillId)
    const percent = gstIdToPercent[prefillId] ?? 0

    if (selectedTaxId === "1") {
      // GST
      const halfPercent = percent / 2
      setValue("cgst", String(halfPercent))
      setValue("sgst", String(halfPercent))
      setValue("igst", "") // Clear IGST
    } else if (selectedTaxId === "2") {
      // IGST
      setValue("igst", String(percent))
      setValue("cgst", "") // Clear CGST
      setValue("sgst", "") // Clear SGST
    } else {
      // Handle other tax types if needed, or clear all
      setValue("igst", "")
      setValue("cgst", "")
      setValue("sgst", "")
    }

    isPrefillingTaxRef.current = false // Reset the flag after pre-filling
  }, [selectedTaxId, setValue, gstIdToPercent]) // Added gstIdToPercent as dependency

  useEffect(() => {
    if (!isModalOpen || modalMode !== "add") return
    if (normalizedGstList.length === 0) return
    if (selectedGstDropdownId) return
    const gst5 = normalizedGstList.find((gst: any) => gst.totalRate === 5)
    if (gst5) {
      const gstId = String(gst5.id)
      setSelectedGstDropdownId(gstId)
      setValue("cgst", gst5.cgstRate ? String(gst5.cgstRate) : "")
      setValue("sgst", gst5.sgstRate ? String(gst5.sgstRate) : "")
      setValue("igst", gst5.igstRate ? String(gst5.igstRate) : "")
    }
  }, [isModalOpen, modalMode, normalizedGstList])

  const toNumber = (v: any) => {
    const n = Number.parseFloat(String(v))
    return isNaN(n) ? 0 : n
  }

  return (
    <div>
      <DataTable
        columns={columns}
        data={processedCityList}
        title=""
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search fabric..."
        disableFullDataFetch={true}
        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        // totalCount={pagination?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
        // offset={pagination?.offset || 0}
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
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center flex justify-end z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-8 shadow-lg w-3/4 h-full  max-h-full overflow-y-auto ">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between ">
              {modalMode === "add" ? "Add Sort " : "Edit Sort "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                fill="currentColor"
                onClick={() => {
                  setIsModalOpen(false)
                  setServerErrors({})
                }}
                className="bi bi-x cursor-pointer"
                viewBox="0 0 16 16"
              >
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
              </svg>
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="p-6 bg-white shadow rounded-lg">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div className="hidden">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">
                      Fabric Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex-1">
                      <CommonSearchableSelect
                        options={(fabricTypeList || []).map((fabricType: any) => ({
                          value: String(fabricType.id),
                          label: fabricType.fabricTypeName || `Fabric ${fabricType.id}`,
                        }))}
                        placeholder="Select a Fabric Type"
                        name={fabricTypeRegisterName}
                        ref={fabricTypeRegisterRef}
                        onBlur={fabricTypeRegisterOnBlur}
                        value={selectedFabricType}
                        onChange={(e) => {
                          fabricTypeRegisterOnChange(e)
                          handleFabricTypeChange(e)
                        }}
                        error={errors.fabricType?.message as string}
                      />
                    </div>
                  </div>

                  {(watchFabricTypeValue === "2" || watchFabricTypeValue === "3") && (
                    <div className="flex items-center gap-3">
                      <label className="w-36 text-sm font-medium text-gray-700 shrink-0">
                        {watchFabricTypeValue === "3" ? "Select Finished" : "Select Greige"}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="flex-1">
                        <CommonSearchableSelect
                          options={dropdownOptions.map((item: any) => ({
                            value: String(item.id),
                            label: `${item.fabricCode} - ${item.fabricQuality || "N/A"}${item.fabricName ? ` (${item.fabricName})` : ""
                              }`
                          }))}
                          placeholder={
                            watchFabricTypeValue === "3"
                              ? "Select Finished Fabric"
                              : "Select Greige Fabric"
                          }
                          name={wovenFabricRegister.name}
                          ref={wovenFabricRegister.ref}
                          onBlur={wovenFabricRegister.onBlur}
                          value={wovenFabricValue}
                          onChange={(payload: any) => {
                            const selectedValue =
                              typeof payload === "string"
                                ? payload
                                : payload?.target?.value ?? payload?.value ?? ""
                            wovenFabricRegister.onChange?.(payload)
                            handleGreigeSelection(selectedValue)
                          }}
                          error={errors.wovenFabricId?.message as string}
                        />
                      </div>
                    </div>
                  )}

                  {modalMode === "edit" && (
                    <div className="flex items-center gap-3">
                      <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Created On</label>
                      <div className="flex-1">
                        <input
                          {...register("createdOn")}
                          value={formatDateTime(watch("createdOn"))}
                          placeholder="Auto-populated"
                          className="input w-full bg-gray-100"
                          readOnly
                        />
                      </div>
                    </div>
                  )}

                  {modalMode === "edit" && (
                    <div className="flex items-center gap-3">
                      <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Created By</label>
                      <div className="flex-1">
                        <input
                          {...register("createdBy")}
                          placeholder="Auto-populated"
                          className="input w-full bg-gray-100"
                          readOnly
                        />
                      </div>
                    </div>
                  )}

                  {modalMode === "edit" && (
                    <div className="flex items-center gap-3">
                      <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Last Modified On</label>
                      <div className="flex-1">
                        <input {...register("lastModified")} value={formatDateTime(watch("lastModified"))} placeholder="Auto-populated" className="input w-full bg-gray-100" readOnly />
                      </div>
                    </div>
                  )}

                  {modalMode === "edit" && (
                    <div className="flex items-center gap-3">
                      <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Last Modified By</label>
                      <div className="flex-1">
                        <input {...register("lastModifiedBy")} placeholder="Auto-populated" className="input w-full bg-gray-100" readOnly />
                      </div>
                    </div>
                  )}
                  <div className="col-span-2 flex items-center gap-3 relative w-[50%]">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Sort No <span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input
                        {...register("fabricCode", { required: "Sort No is required" })}
                        placeholder="Enter Sort No"
                        className="input w-full"
                        onChange={(e) => {
                          handleCodeInputChange(e)
                          if (serverErrors.fabricCode) {
                            setServerErrors({ ...serverErrors, fabricCode: '' })
                          }
                        }}
                        onFocus={handleCodeFocus}
                        onBlur={handleCodeBlur}
                        onKeyDown={handleCodeKeyDown}
                        autoComplete="off"
                      />
                      {serverErrors.fabricCode && !errors.fabricCode && (
                        <p className="text-red-500 text-sm">{serverErrors.fabricCode}</p>
                      )}
                      {errors.fabricCode && <p className="text-red-500 text-sm">{errors.fabricCode.message}</p>}
                      {showCodeSuggestions && (
                        <div className="absolute z-10 bg-white border rounded shadow-lg w-full mt-1 max-h-40 overflow-y-auto">
                          <ul>
                            {codeSuggestions.map((item: any, idx: number) => (
                              <li
                                key={item.id}
                                onMouseEnter={() => setActiveCodeIndex(idx)}
                                className={`p-2 hover:bg-gray-100 cursor-pointer ${idx === activeCodeIndex ? 'bg-gray-200' : ''}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  selectCodeSuggestion(item);
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                {item.fabricCode} - {item.fabricQuality || "N/A"}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Warp Count <span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <CommonSearchableSelect
                        options={(yarnList || []).map((yarn: any) => ({
                          value: String(yarn.id),
                          label: yarn.yarnName || `Yarn ${yarn.id}`,
                        }))}
                        placeholder="Select Warp Count"
                        value={selectedWarpCountYarnId}
                        onChange={(value: string) => {
                          setSelectedWarpCountYarnId(value)
                          setValue("warpCount", value)
                          const yarn = yarnList.find((y: any) => String(y.id) === String(value))
                          if (yarn) {
                            const conv = yarn.conversion !== undefined && yarn.conversion !== null
                              ? String(yarn.conversion)
                              : ""
                            setValue("warpConversionCount", conv)
                          } else {
                            setValue("warpConversionCount", "")
                          }
                          if (value && warpDetails.length > 0) {
                            setWarpDetails(prev => prev.map(w => {
                              const updatedItem = { ...w, yarnId: value }
                              return { ...updatedItem, gramsPerMeter: calculateGramsForItem(updatedItem, "warp", updatedItem.epi) }
                            }))
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Weft Count<span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <CommonSearchableSelect
                        options={(yarnList || []).map((yarn: any) => ({
                          value: String(yarn.id),
                          label: yarn.yarnName || `Yarn ${yarn.id}`,
                        }))}
                        placeholder="Select Weft Count"
                        value={selectedWeftCountYarnId}
                        onChange={(value: string) => {
                          setSelectedWeftCountYarnId(value)
                          setValue("weftCount", value)
                          const yarn = yarnList.find((y: any) => String(y.id) === String(value))
                          if (yarn) {
                            const conv = yarn.conversion !== undefined && yarn.conversion !== null
                              ? String(yarn.conversion)
                              : ""
                            setValue("weftConversionCount", conv)
                          } else {
                            setValue("weftConversionCount", "")
                          }
                          if (value && weftDetails.length > 0) {
                            setWeftDetails(prev => prev.map(w => {
                              const updatedItem = { ...w, yarnId: value }
                              return { ...updatedItem, gramsPerMeter: calculateGramsForItem(updatedItem, "weft", updatedItem.ppi) }
                            }))
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Warp Resultant Count</label>
                    <div className="flex-1">
                      <input
                        {...register("warpConversionCount")}
                        placeholder="Enter Warp Conversion Count"
                        className="input w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Weft Resultant Count</label>
                    <div className="flex-1">
                      <input
                        {...register("weftConversionCount")}
                        placeholder="Enter Weft Conversion Count"
                        className="input w-full"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">EPI <span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input
                        {...register("onTableEpi", { required: "On Table EPI is required" })}
                        type="number"
                        placeholder="Enter On Table EPI"
                        className="input w-full"
                      />
                      {errors.onTableEpi && <p className="text-red-500 text-sm">{errors.onTableEpi.message}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">PPI <span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input
                        {...register("ppi", { required: "PPI is required" })}
                        type="number"
                        placeholder="Enter PPI"
                        className="input w-full"
                      />
                      {errors.ppi && <p className="text-red-500 text-sm">{errors.ppi.message}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">No. of Insertion<span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input
                        {...register("noOfInsertion")}
                        type="number"
                        placeholder="Enter No. of Insertion"
                        className="input w-full"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Width <span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input
                        {...register("fabricWidth", { required: "Fabric Width is required" })}
                        type="number"
                        step="0.01"
                        placeholder="Enter Fabric Width"
                        className="input w-full"
                      />
                      {errors.fabricWidth && <p className="text-red-500 text-sm">{errors.fabricWidth.message}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">
                      Weave <span className="text-red-500">*</span>
                    </label>
                    <div className="flex-1">
                      <CommonSearchableSelect
                        options={getSubCategoriesByCategory("Weave").map((weaveType: any) => ({
                          value: String(weaveType.id),
                          label: weaveType.subCategoryName || `Weave ${weaveType.id}`,
                        }))}
                        placeholder="Select a Weave"
                        {...register("weave", { required: "Weave is required" })}
                        error={errors.weave?.message as string}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">TC / Mix  <span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input
                        {...register("tc", { required: "TC / Mix is required" })}
                        type="number"
                        step="0.01"
                        placeholder="Enter TC"
                        className="input w-full"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center gap-3 relative w-[50%]">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Construction <span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input
                        {...register("fabricQuality", { required: "Construction is required" })}
                        placeholder="Enter Construction (auto-calculated if empty)"
                        className="input w-full"
                      />
                      {errors.fabricQuality && <p className="text-red-500 text-sm">{errors.fabricQuality.message}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Single Beam Total Ends <span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input
                        {...register("totalEnds", {
                          required: "Total Ends is required",
                          onChange: (e) => {
                            const totalEndsNum = Number.parseFloat(e.target.value) || 0;
                            syncWarpDetailsFromTotalEnds(totalEndsNum);
                          },
                        })}
                        type="number"
                        placeholder="Enter Total Ends"
                        className="input w-full"
                      />
                      {errors.totalEnds && <p className="text-red-500 text-sm">{errors.totalEnds.message}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Twin Beam Total Ends <span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input
                        {...register("twinBeamTotalEnds")}
                        type="number"
                        value={Math.ceil(parseFloat(watch("totalEnds") || "0") * 0.5)}
                        placeholder="Calculated automatically"
                        className="input w-full bg-gray-100"
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Single Beam DBF<span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input {...register("singleBeamDbf")} placeholder="Enter Single Beam DBF" className="input w-full" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Twin Beam DBF<span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input {...register("twinBeamDbf")} placeholder="Enter Twin Beam DBF" className="input w-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Paper Tuber Tare Weight<span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input {...register("paperTuberTareWeight")} type="number" step="0.0001" placeholder="Enter Paper Tuber Tare Weight" className="input w-full" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">HDPE Weight</label>
                    <div className="flex-1">
                      <input {...register("hdpeWeight")} type="number" step="0.0001" placeholder="Enter HDPE Weight" className="input w-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Crimp %<span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input
                        {...register("crimp", {
                          onChange: (e) => {
                            const value = e?.target?.value ?? "";
                            syncShrinkageFromCrimp(value);
                          },
                        })}
                        placeholder="Enter Crimp %"
                        className="input w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Approved  Crimp %</label>
                    <div className="flex-1">
                      <input {...register("approvedCrimp")} placeholder="Enter Approved Crimp" className="input w-full" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Wastage %</label>
                    <div className="flex-1">
                      <input {...register("wastagePercentage")} type="number" step="0.01" placeholder="Enter Wastage %" className="input w-full" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Warp GLM Calculated<span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input {...register("warpGlmCalculated")} type="number" step="0.0001" placeholder="Auto-calculated" className="input w-full bg-gray-100" readOnly />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Warp GLM Approved<span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input {...register("warpGlmApproved")} type="number" step="0.0001" placeholder="Enter Warp GLM Approved" className="input w-full" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Weft GLM Calculated<span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input {...register("weftGlmCalculated")} type="number" step="0.0001" placeholder="Auto-calculated" className="input w-full bg-gray-100" readOnly />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Weft GLM Approved<span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input {...register("weftGlmApproved")} type="number" step="0.0001" placeholder="Enter Weft GLM Approved" className="input w-full" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Actual Crimp (%)</label>
                    <div className="flex-1">
                      <input {...register("actualCrimp")} type="number" step="0.0001" placeholder="Enter Actual Crimp %" className="input w-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Warp GLM Actual</label>
                    <div className="flex-1">
                      <input {...register("warpGlmActual")} type="number" step="0.0001" placeholder="Enter Warp GLM Actual" className="input w-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Weft GLM Actual</label>
                    <div className="flex-1">
                      <input {...register("weftGlmActual")} type="number" step="0.0001" placeholder="Enter Weft GLM Actual" className="input w-full" />
                    </div>
                  </div>





                  <div className="flex items-start gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0 pt-1">Remarks</label>
                    <div className="flex-1">
                      <textarea {...register("remarks")} placeholder="Enter Remarks" className="input" rows={2} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Reedspace<span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input
                        {...register("reedspace", { required: "Reedspace is required" })}
                        type="number"
                        step="0.01"
                        placeholder="Enter Readspace"
                        className="input w-full"
                      />
                      {errors.reedspace && <p className="text-red-500 text-sm">{errors.reedspace.message}</p>}
                    </div>
                  </div>

                  {/* 
<div className="col-span-2 flex items-center gap-3 relative w-[50%]">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Sort No <span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input
                        {...register("fabricCode", { required: "Sort No is required" })}
                        placeholder="Enter Sort No"
                        className="input w-full"
                        onChange={(e) => {
                          handleCodeInputChange(e)
                          if (serverErrors.fabricCode) {
                            setServerErrors({ ...serverErrors, fabricCode: '' })
                          }
                        }}
                        onFocus={handleCodeFocus}
                        onBlur={handleCodeBlur}
                        onKeyDown={handleCodeKeyDown}
                        autoComplete="off"
                      />
                      {serverErrors.fabricCode && !errors.fabricCode && (
                        <p className="text-red-500 text-sm">{serverErrors.fabricCode}</p>
                      )}
                      {errors.fabricCode && <p className="text-red-500 text-sm">{errors.fabricCode.message}</p>}
                      {showCodeSuggestions && (
                        <div className="absolute z-10 bg-white border rounded shadow-lg w-full mt-1 max-h-40 overflow-y-auto">
                          <ul>
                            {codeSuggestions.map((item: any, idx: number) => (
                              <li
                                key={item.id}
                                onMouseEnter={() => setActiveCodeIndex(idx)}
                                className={`p-2 hover:bg-gray-100 cursor-pointer ${idx === activeCodeIndex ? 'bg-gray-200' : ''}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  selectCodeSuggestion(item);
                                }}
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                {item.fabricCode} - {item.fabricQuality || "N/A"}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div> */}

                  {/* <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Content</label>
                    <div className="flex-1">
                      <input {...register("content")} placeholder="Enter Content" className="input w-full" />
                    </div>
                  </div> */}

                  {/* <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Cut Width</label>
                    <div className="flex-1">
                      <input
                        {...register("cutWidth", {
                          validate: (value) => {
                            const fabricWidth = watch("fabricWidth")
                            if (value && fabricWidth) {
                              const cutWidthNum = parseFloat(value)
                              const fabricWidthNum = parseFloat(fabricWidth)
                              if (!isNaN(cutWidthNum) && !isNaN(fabricWidthNum) && cutWidthNum > fabricWidthNum) {
                                return "Cut Width cannot exceed Fabric Width"
                              }
                            }
                            return true
                          }
                        })}
                        type="number"
                        step="0.01"
                        placeholder="Enter Cut Width"
                        className="input w-full"
                      />
                      {errors.cutWidth && <p className="text-red-500 text-sm">{errors.cutWidth.message}</p>}
                    </div>
                  </div>

                


                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">On Loom EPI <span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input
                        {...register("onLoomEpi", { required: "On Loom EPI is required" })}
                        type="number"
                        placeholder="Enter On Loom EPI"
                        className="input w-full"
                      />
                      {errors.onLoomEpi && <p className="text-red-500 text-sm">{errors.onLoomEpi.message}</p>}
                    </div>
                  </div> */}

                  {/* <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FileUploadField
                      ref={fabricImageRef}
                      label="Fabric Image"
                      containerName="FabricImage"
                      mediaSno={fabricImageMediaSno}
                      fileName={fabricImageFileName}
                      onUploadSuccess={(mediaSno, fileName) => {
                        setFabricImageMediaSno(mediaSno);
                        setFabricImageFileName(fileName);
                      }}
                      onClear={() => {
                        setFabricImageMediaSno(null);
                        setFabricImageFileName("");
                      }}
                    />

                    <FileUploadField
                      ref={designPaperImageRef}
                      label="Design Paper Image"
                      containerName="DesignPaperImage"
                      mediaSno={designPaperImageMediaSno}
                      fileName={designPaperImageFileName}
                      onUploadSuccess={(mediaSno, fileName) => {
                        setDesignPaperImageMediaSno(mediaSno);
                        setDesignPaperImageFileName(fileName);
                      }}
                      onClear={() => {
                        setDesignPaperImageMediaSno(null);
                        setDesignPaperImageFileName("");
                      }}
                    />
                  </div> */}
                </div>
                <h2 className="text-xl font-semibold mb-6 mt-10 text-gray-800 flex justify-between w-[220%]">Additional Information</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Selvedge Name</label>
                    <div className="flex-1">
                      <CommonSearchableSelect
                        options={getSubCategoriesByCategory("Selvedge").map((selvedgeType: any) => ({
                          value: String(selvedgeType.id),
                          label: selvedgeType.subCategoryName || `Selvedge ${selvedgeType.id}`,
                        }))}
                        placeholder="Select Selvedge Name"
                        {...register("selvedgeName")}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Selvedge Dents</label>
                    <div className="flex-1">
                      <input
                        {...register("selvedgeDents")}
                        type="number"
                        placeholder="Enter Selvedge Dents"
                        className="input w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Selvedge Ends/Dent</label>
                    <div className="flex-1">
                      <input
                        {...register("selvedgeEndsPerDent")}
                        type="number"
                        placeholder="Enter Selvedge Ends/Dent"
                        className="input w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Selvedge Ends</label>
                    <div className="flex-1">
                      <input
                        {...register("selvedgeEnds")}
                        type="number"
                        placeholder="Calculated automatically"
                        className="input w-full bg-gray-100"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Reed Count</label>
                    <div className="flex-1">
                      <input {...register("reedCount")} type="number" step="0.01" placeholder="Enter Reed Count" className="input w-full" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Drawing Order</label>
                    <div className="flex-1">
                      <input {...register("drawingOrder")} placeholder="Enter Drawing Order" className="input w-full" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Peg Plan</label>
                    <div className="flex-1">
                      <input {...register("setPlan")} placeholder="Enter Peg Plan" className="input w-full" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">Ends/Dents</label>
                    <div className="flex-1">
                      <input {...register("endsPerDent")} type="number" placeholder="Enter Ends/Dents" className="input w-full" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">GSM <span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input
                        {...register("gsm", { required: "GSM is required" })}
                        type="number"
                        step="0.0001"
                        placeholder="Calculated automatically"
                        className="input w-full"
                      />
                      {errors.gsm && <p className="text-red-500 text-sm">{errors.gsm.message}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">GLM <span className="text-red-500">*</span></label>
                    <div className="flex-1">
                      <input
                        {...register("glm", { required: "GLM is required" })}
                        type="number"
                        step="0.0001"
                        placeholder="Enter Glm"
                        className="input w-full"
                      />
                      {errors.glm && <p className="text-red-500 text-sm">{errors.glm.message}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="w-36 text-sm font-medium text-gray-700 shrink-0">IGST %</label>
                    <div className="flex-1">
                      <CommonSearchableSelect
                        options={(normalizedGstList || []).map((gstOption: any) => ({
                          value: String(gstOption.id),
                          label: gstOption.label,
                        }))}
                        placeholder="Select IGST %"
                        value={selectedGstDropdownId || ""}
                        onChange={(id: string) => {
                          setSelectedGstDropdownId(id);
                          const rates = gstIdToRates[id];
                          const totalPercent = rates?.total ?? 0;
                          const cgstRate = rates?.cgst ?? (totalPercent ? totalPercent / 2 : 0);
                          const sgstRate = rates?.sgst ?? (totalPercent ? totalPercent / 2 : 0);
                          const igstRate = rates?.igst ?? totalPercent;
                          setValue('cgst', cgstRate ? String(cgstRate) : '');
                          setValue('sgst', sgstRate ? String(sgstRate) : '');
                          setValue('igst', igstRate ? String(igstRate) : '');
                        }}
                      />
                    </div>
                  </div>

                  {selectedTaxId === "1" && (
                    <>
                      <div className="flex items-center gap-3">
                        <label className="w-36 text-sm font-medium text-gray-700 shrink-0">CGST %</label>
                        <div className="flex-1">
                          <input {...register("cgst")} placeholder="CGST %" className="input w-full bg-gray-100" readOnly />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="w-36 text-sm font-medium text-gray-700 shrink-0">SGST %</label>
                        <div className="flex-1">
                          <input {...register("sgst")} placeholder="SGST %" className="input w-full bg-gray-100" readOnly />
                        </div>
                      </div>
                    </>
                  )}
                  {selectedTaxId === "2" && (
                    <div className="flex items-center gap-3">
                      <label className="w-36 text-sm font-medium text-gray-700 shrink-0">IGST %</label>
                      <div className="flex-1">
                        <input {...register("igst")} placeholder="IGST %" className="input w-full bg-gray-100" readOnly />
                      </div>
                    </div>
                  )}

                </div>
                <div className="mt-10">
                  <h3 className="font-semibold">
                    Warp Details
                    <button
                      type="button"
                      onClick={handleAddWarp}
                      disabled={!canAddWarp}
                      className={`ml-2 px-2 py-1 rounded ${canAddWarp
                        ? "bg-primary text-white hover:bg-blue-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                      + Add Warp
                    </button>
                    <span
                      className={`ml-4 text-sm ${warpRemainingPattern < 0 ? "text-red-600 font-bold" : "text-gray-600"}`}
                    >
                      Remaining: {warpRemainingPattern.toFixed(2)}%
                    </span>
                  </h3>
                  <table className="w-full border mt-4">
                    <thead>
                      <tr className="bg-gray-200">
                        <th>SL.NO</th>
                        <th>Yarn</th>
                        <th>Pattern (%)</th>
                        <th>Total Ends</th>
                        <th>Shrinkage %</th>
                        <th>Waste %</th>
                        <th>Grams/Mtr</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warpDetails.map((item, index) => (
                        <tr key={item.id} className="border">
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2 w-56">
                            <CommonSearchableSelect
                              options={(yarnList || [])
                                .filter((yarn: any) =>
                                  selectedWarpCountYarnId
                                    ? String(yarn.id) === String(selectedWarpCountYarnId)
                                    : true
                                )
                                .map((yarn: any) => ({
                                  value: String(yarn.id),
                                  label: yarn.yarnName || `Yarn ${yarn.id}`,
                                }))}
                              placeholder="Select a Yarn"
                              value={item.yarnId ? String(item.yarnId) : ""}
                              onChange={(value: string) => handleYarnChange(index, "warp", value)}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={item.pattern}
                              onChange={(e) => handleWarpPatternChange(index, e.target.value)}
                              placeholder="Enter Pattern %"
                              className="border p-1 w-full"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.epi}
                              onChange={(e) => handleWarpEpiChange(index, e.target.value)}
                              className="border p-1 w-full"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.shrinkagePercent}
                              onChange={(e) => handleShrinkageChange(index, "warp", e.target.value)}
                              className="border p-1 w-full"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.warpWastePercentage || ""}
                              onChange={(e) => handleWarpWasteChange(index, e.target.value)}
                              placeholder="Enter Waste %"
                              className="border p-1 w-full"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={isNaN(Number(item.gramsPerMeter)) || item.gramsPerMeter === "" ? "0" : item.gramsPerMeter}
                              className="border p-1 w-full bg-gray-100"
                              readOnly
                            />
                          </td>
                          <td className="p-2">
                            <Trash className="text-red-500 cursor-pointer" onClick={() => handleDeleteWarp(item.id)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p
                    className={`text-sm mt-2 font-medium ${warpTotalPattern >= 99.5 && warpTotalPattern <= 100
                      ? "text-green-600"
                      : warpTotalPattern > 100
                        ? "text-red-600"
                        : "text-orange-600"
                      }`}
                  >
                    Total Pattern: {warpTotalPattern.toFixed(2)}%
                    {warpTotalPattern >= 99.5 && warpTotalPattern <= 100
                      ? " ✓ (Valid)"
                      : warpTotalPattern > 100
                        ? " ✗ (Exceeds 100%)"
                        : " ⚠ (Must be between 99.5% and 100%)"}
                  </p>
                </div>

                <div className="mt-10">
                  <h3 className="font-semibold">
                    Weft Details
                    <button
                      type="button"
                      onClick={handleAddWeft}
                      disabled={!canAddWeft}
                      className={`ml-2 px-2 py-1 rounded ${canAddWeft
                        ? "bg-primary text-white hover:bg-blue-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                      + Add Weft
                    </button>
                    <span
                      className={`ml-4 text-sm ${weftRemainingPattern < 0 ? "text-red-600 font-bold" : "text-gray-600"}`}
                    >
                      Remaining: {weftRemainingPattern.toFixed(2)}%
                    </span>
                  </h3>
                  <table className="w-full border mt-4">
                    <thead>
                      <tr className="bg-gray-200">
                        <th>SL.NO</th>
                        <th>Yarn</th>
                        <th>Pattern (%)</th>
                        <th>PPI</th>
                        <th>Shrinkage %</th>
                        <th>Waste %</th>
                        <th>Grams/Mtr</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {weftDetails.map((item, index) => (
                        <tr key={item.id} className="border">
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2 w-56">
                            <CommonSearchableSelect
                              options={(yarnList || [])
                                .filter((yarn: any) =>
                                  selectedWeftCountYarnId
                                    ? String(yarn.id) === String(selectedWeftCountYarnId)
                                    : true
                                )
                                .map((yarn: any) => ({
                                  value: String(yarn.id),
                                  label: yarn.yarnName || `Yarn ${yarn.id}`,
                                }))}
                              placeholder="Select a Yarn"
                              value={item.yarnId ? String(item.yarnId) : ""}
                              onChange={(value: string) => handleYarnChange(index, "weft", value)}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={item.pattern}
                              onChange={(e) => handleWeftPatternChange(index, e.target.value)}
                              placeholder="Enter Pattern %"
                              className="border p-1 w-full"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.ppi}
                              onChange={(e) => handleWeftPpiChange(index, e.target.value)}
                              className="border p-1 w-full"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.shrinkagePercent}
                              onChange={(e) => handleShrinkageChange(index, "weft", e.target.value)}
                              className="border p-1 w-full"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.wastePercentage || ""}
                              onChange={(e) => handleWeftWasteChange(index, e.target.value)}
                              placeholder="Enter Waste %"
                              className="border p-1 w-full"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={isNaN(Number(item.gramsPerMeter)) || item.gramsPerMeter === "" ? "0" : item.gramsPerMeter}
                              className="border p-1 w-full bg-gray-100"
                              readOnly
                            />
                          </td>
                          <td className="p-2">
                            <Trash className="text-red-500 cursor-pointer" onClick={() => handleDeleteWeft(item.id)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p
                    className={`text-sm mt-2 font-medium ${weftTotalPattern >= 99.5 && weftTotalPattern <= 100
                      ? "text-green-600"
                      : weftTotalPattern > 100
                        ? "text-red-600"
                        : "text-orange-600"
                      }`}
                  >
                    Total Pattern: {weftTotalPattern.toFixed(2)}%
                    {weftTotalPattern >= 99.5 && weftTotalPattern <= 100
                      ? " ✓ (Valid)"
                      : weftTotalPattern > 100
                        ? " ✗ (Exceeds 100%)"
                        : " ⚠ (Must be between 99.5% and 100%)"}
                  </p>
                </div>

                {/* Testing Requirements */}
                <div className="mt-10">
                  <h3 className="font-semibold">
                    Testing Requirements
                    <button
                      type="button"
                      onClick={handleAddTestingRequirement}
                      className="ml-2 bg-primary text-white px-2 py-1 rounded"
                    >
                      + Add Testing Requirement
                    </button>
                  </h3>
                  <table className="w-full border mt-4">
                    <thead>
                      <tr className="bg-gray-200">
                        <th>SL.NO</th>
                        <th>Testing Parameter</th>
                        <th>STD Value</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testingRequirementDetails.map((item, index) => (
                        <tr key={item.id} className="border">
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.testingParameter}
                              onChange={(e) => {
                                const updated = [...testingRequirementDetails]
                                updated[index].testingParameter = e.target.value
                                setTestingRequirementDetails(updated)
                              }}
                              className="border p-1 w-full"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.stdValue}
                              onChange={(e) => {
                                const updated = [...testingRequirementDetails]
                                updated[index].stdValue = e.target.value
                                setTestingRequirementDetails(updated)
                              }}
                              className="border p-1 w-full"
                            />
                          </td>
                          <td className="p-2">
                            <Trash
                              className="text-red-500 cursor-pointer"
                              onClick={() => handleDeleteTestingRequirement(item.id)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => {
                  setIsModalOpen(false)
                  setServerErrors({})
                }} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${((warpDetails.length > 0 && (warpTotalPattern < 99.5 || warpTotalPattern > 100.05)) || (weftDetails.length > 0 && (weftTotalPattern < 99.5 || weftTotalPattern > 100.05))) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={(warpDetails.length > 0 && (warpTotalPattern < 99.5 || warpTotalPattern > 100.05)) || (weftDetails.length > 0 && (weftTotalPattern < 99.5 || weftTotalPattern > 100.05))}
                >
                  {modalMode === "add" ? "Add Woven Fabric" : "Update Woven Fabric"}
                </button>

                {/* <button type="submit" className="btn btn-primary">
                  {modalMode === "add" ? "Add Woven Fabric" : "Update Woven Fabric"}
                </button> */}
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Fabric Details">
        {currentfabric && (
          <div className="space-y-4">
            <div className="flex gap-6 items-center">
              {currentfabric.imageUrl && (
                <img
                  src={currentfabric.imageUrl || "/placeholder.svg"}
                  alt={currentfabric.name}
                  className="w-32 h-32 object-cover rounded-lg shadow"
                />
              )}

              <div className="space-y-2">
                <div>
                  <p className="text-sm text-secondary-500 font-medium">
                    Fabric Type: <span className="text-md font-bold text-gray-900">{currentfabric.fabricType}</span>
                  </p>
                </div>

                <div>
                  <p className="text-sm text-secondary-500 font-medium">
                    Sort No: <span className="text-md font-bold text-gray-900">{currentfabric.fabricCode}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary-500 font-medium">
                    Fabric Name: <span className="text-md font-bold text-gray-900">{currentfabric.fabricName}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div>
                <p className="text-sm text-secondary-500">Weave</p>
                <p className="font-medium">{currentfabric.weave}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Construction</p>
                <p className="font-medium">{currentfabric.fabricQuality}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Fabric Width</p>
                <p className="font-medium">{currentfabric.fabricWidth}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Cut Width</p>
                <p className="font-medium">{currentfabric.cutWidth}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Readspace</p>
                <p className="font-medium">{currentfabric.reedspace}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">On Table EPI</p>
                <p className="font-medium">{currentfabric.onTableEpi}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">On Loom EPI</p>
                <p className="font-medium">{currentfabric.onLoomEpi}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">PPI</p>
                <p className="font-medium">{currentfabric.ppi}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Total Ends</p>
                <p className="font-medium">{currentfabric.totalEnds}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">GSM</p>
                <p className="font-medium">{currentfabric.gsm}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">GLM</p>
                <p className="font-medium">{currentfabric.glm}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">IGST</p>
                <p className="font-medium">{currentfabric.igst}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">CGST</p>
                <p className="font-medium">{currentfabric.cgst}</p>
              </div>
              <div>
                <p className="text-sm text-secondary-500">SGST</p>
                <p className="font-medium">{currentfabric.sgst}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setIsViewModalOpen(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
        <div className="space-y-4">
          <p>Are you sure you want to delete Fabric?</p>

          <div className="flex justify-end space-x-3 pt-4">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={confirmDelete} className="btn btn-danger">
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}