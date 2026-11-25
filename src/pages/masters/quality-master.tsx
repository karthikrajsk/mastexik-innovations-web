// import { useEffect, useMemo, useRef, useState } from "react"
// import { Trash } from "lucide-react"
// import { Modal } from "@/components/ui/Modal"
// import { DataTable } from "@/components/data/DataTable"
// import { useForm } from "react-hook-form"
// import { useDispatch, useSelector } from "react-redux"
// import type { AppDispatch, RootState } from "@/state/store"
// import {
//   createFabricMaster,
//   deleteFabricMaster,
//   getAllFabricMasterDetails,
//   getAllFabricMasters,
//   updateFabricMaster,
// } from "@/state/fabricMasterSlice"
// import { getAllGstMaster } from "@/state/gstMasterSlice"
// import { getAllProductCategory } from "@/state/productCategorySlice"
// import { getAllFabricTypes } from "@/state/fabricTypeSlice"
// import {getAllSubCategories } from "@/state/subCategorySlice"
// import { getAllYarnMasters } from "@/state/yarnSlice"
// import React from "react"
// import { getAllFabricCategory } from "@/state/fabricCategorySlice"
// import { Value } from "@radix-ui/react-select"

// interface testingRequirementDetail {
//   id: number
//   testingParameter: string
//   stdValue: string
// }

// interface fabricFormData {
//   id?: number | null
//   wovenFabricId: string | null
//   fabricCategoryId: string
//   fabricType: string
//   fabricCode: string
//   fabricName: string
//   content: string
//   contentName: string
//   weave: string
//   fabricQuality: string
//   fabricWidth: string // New field
//   cutWidth: string // New field
//   reedspace: string // New field
//   onTableEpi: string // Replaces epi
//   onLoomEpi: string // New field
//   ppi: string
//   greigeCode: string
//   selvedgeName: string // New field
//   selvedgeDents: string // New field
//   selvedgeEndsPerDent: string // New field
//   selvedgeEnds: string // New field (calculated)
//   totalEnds: string
//   gsm: string
//   glm: string
//   igst: string
//   cgst: string
//   sgst: string
//   status: string
//   imageUrl: string
//   stdValue: string
//   taxId: string
//   testingDetails: testingRequirementDetail[]
// }

// interface QualityMasterProps {
//   embedded?: boolean
// }

// export default function QualityMaster({ embedded = false }: QualityMasterProps) {
//   const { uomList } = useSelector((state: RootState) => state.uom)
//   const { productCategoryList } = useSelector((state: RootState) => state.productCategory)
//   const { fabricTypeList } = useSelector((state: RootState) => state.fabricType)
//   const { fabricCategoryList } = useSelector((state: RootState) => state.fabricCategoty)
//   const { fabricMasterDetailList } = useSelector((state: RootState) => state.fabricMaster)
//   const { subCategoryList: subCategories } = useSelector((state: RootState) => state.subCategory)

//   const { yarnList } = useSelector((state: RootState) => state.yarn)
//   const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster)
//   const { gstList } = useSelector((state: RootState) => state.gst)
//   const [testingRequirementDetails, setTestingRequirementDetails] = useState<testingRequirementDetail[]>([])
//   const [fabricImage, setFabricImage]: any = useState(null)
//   const [isModalOpen, setIsModalOpen] = useState(false)
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false)
//   const [currentfabric, setCurrentfabric] = useState<any>(null)
//   const [modalMode, setModalMode] = useState<"add" | "edit">("add")
//   const [fabric, setFabric] = useState<any[]>(Array.isArray(fabricMasterList) ? fabricMasterList : [])
//   const dispatch = useDispatch<AppDispatch>()
//   const [isEditing, setIsEditing] = React.useState(false)
//   const { subCategoryByCategoryList } = useSelector((state: RootState) => state.subCategory)
//   const { subCategoryBySelvedgeList } = useSelector((state: RootState) => state.subCategory);

//   // States for handling fabric type specific logic
//   const [originalFabricType, setOriginalFabricType] = useState<string>("")
//   const [selectedFabricType, setSelectedFabricType] = useState<string>("1")
//   const [selectedGreige, setSelectedGreige] = useState<string>("")
//   const [selectedFinished, setSelectedFinished] = useState<string>("")
//   const [selectedGstDropdownId, setSelectedGstDropdownId] = useState<string>("")

//   // Suggestion states for Fabric Name
//   const [showNameSuggestions, setShowNameSuggestions] = useState(false)
//   const [nameSuggestions, setNameSuggestions] = useState<any[]>([])
//   const [activeNameIndex, setActiveNameIndex] = useState(-1)

//   // Suggestion states for Sort No
//   const [showCodeSuggestions, setShowCodeSuggestions] = useState(false)
//   const [codeSuggestions, setCodeSuggestions] = useState<any[]>([])
//   const [activeCodeIndex, setActiveCodeIndex] = useState(-1)

//   const parseRateValue = (value: any) => {
//     const num = Number(value)
//     return Number.isFinite(num) ? num : 0
//   }

//   const normalizedGstList = useMemo(() => {
//     const rawList = Array.isArray(gstList)
//       ? gstList
//       : Array.isArray((gstList as any)?.data)
//         ? (gstList as any).data
//         : []
//     return rawList.map((gst: any) => {
//       const cgstRate = parseRateValue(gst.cgstRate ?? gst.cgst ?? 0)
//       const sgstRate = parseRateValue(gst.sgstRate ?? gst.sgst ?? 0)
//       const igstRate = parseRateValue(gst.igstRate ?? gst.igst ?? 0)
//       const totalRate = igstRate || (cgstRate + sgstRate)
//       const breakdown: string[] = []
//       if (cgstRate) breakdown.push(`CGST ${cgstRate}%`)
//       if (sgstRate) breakdown.push(`SGST ${sgstRate}%`)
//       if (igstRate) breakdown.push(`IGST ${igstRate}%`)
//       const label = `${totalRate}%`
//       return { ...gst, cgstRate, sgstRate, igstRate, totalRate, label }
//     })
//   }, [gstList])

//   const gstIdToPercent = useMemo(() => {
//     const mapping: Record<string, number> = {}
//     normalizedGstList.forEach((gst: any) => {
//       mapping[String(gst.id)] = gst.totalRate
//     })
//     return mapping
//   }, [normalizedGstList])

//   const gstIdToRates = useMemo(() => {
//     const mapping: Record<string, { cgst: number; sgst: number; igst: number; total: number }> = {}
//     normalizedGstList.forEach((gst: any) => {
//       mapping[String(gst.id)] = {
//         cgst: gst.cgstRate,
//         sgst: gst.sgstRate,
//         igst: gst.igstRate,
//         total: gst.totalRate,
//       }
//     })
//     return mapping
//   }, [normalizedGstList])

//   useEffect(() => {
//     dispatch(getAllProductCategory({}))
//     dispatch(getAllFabricTypes({}))
//     dispatch(getAllYarnMasters({}))
//     dispatch(getAllSubCategories({ fetchAll: true }))
//     dispatch(getAllFabricMasters({}))
//     dispatch(getAllFabricCategory({}))
//     dispatch(getAllGstMaster({ fetchAll: true }))
//   }, [dispatch])

//   useEffect(() => {
//     setFabric(fabricMasterList)
//   }, [fabricMasterList])

//   const {
//     register,
//     handleSubmit,
//     reset,
//     setValue,
//     watch,
//     formState: { errors },
//   } = useForm<fabricFormData>()

//   const watchFabricType = watch("fabricType")

//   const shouldShowGreigeCode = modalMode === "edit" ? originalFabricType !== "1" : watch("fabricType") !== "1"

//   const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0]
//     if (file) {
//       const reader = new FileReader()
//       reader.onloadend = () => {
//         setFabricImage(reader.result as string)
//       }
//       reader.readAsDataURL(file)
//     }
//   }

//     const processedCityList = useMemo(() => {
//         if (!Array.isArray(fabric)) return [];
//         return fabric.map((city: any, index: number) => ({
//           ...city,
//           serialNo: index + 1
//         }));
//       }, [fabric]);

//   useEffect(() => {
//     if (selectedFabricType !== "2" || !selectedGreige) return
//     const g = fabricMasterList.find((f: any) => String(f.id) === String(selectedGreige))
//     if (!g) return
//     setValue("fabricCategoryId", g.fabricCategoryId ? String(g.fabricCategoryId) : "")
//     setValue("weave", g.weave ? String(g.weave) : "")
//     setValue("fabricQuality", g.fabricQuality || "")
//     setValue("fabricWidth", g.fabricWidth?.toString() || "")
//     setValue("cutWidth", g.cutWidth?.toString() || "")
//     setValue("reedspace", g.reedspace?.toString() || "")
//     setValue("onTableEpi", g.onTableEpi?.toString() || "")
//     setValue("onLoomEpi", g.onLoomEpi?.toString() || "")
//     setValue("ppi", g.ppi?.toString() || "")
//     setValue("selvedgeName", resolveSelvedgeValue(g.selvedgeName))
//     setValue("selvedgeDents", g.selvedgeDents?.toString() || "")
//     setValue("selvedgeEndsPerDent", g.selvedgeEndsPerDent?.toString() || "")
//     setValue("selvedgeEnds", g.selvedgeEnds?.toString() || "")
//     setValue("totalEnds", g.totalEnds?.toString() || "")
//     setValue("gsm", g.gsm?.toString() || "")
//     setValue("glm", g.glm?.toString() || "")
//     setValue("greigeCode", g.fabricCode || g.greigeCode || "")
//     setTestingRequirementDetails(Array.isArray(g.testingDetails) ? g.testingDetails : [])
//     setFabricImage(g.fabricImageUrl || null)
//   }, [selectedFabricType, selectedGreige, fabricMasterList, setValue])

//   const columns = useMemo(
//     () => [
//       {
//         Header: "S.No",
//         accessor: 'serialNo', // ✅ Use pre-calculated serial number
//     width: 50,

//       },
//       {
//         Header: "Fabric Name",
//         accessor: "fabricName",
//       },
//       {
//         Header: "Sort No",
//         accessor: "fabricCode",
//       },
//       {
//         Header: "Quality",
//         accessor: "fabricQuality",
//       },
//       {
//         Header: "Total Ends",
//         accessor: "totalEnds",
//       },
//     ],
//     [],
//   )

//   const isPrefillingTaxRef = useRef(false)
//   const nextPrefillGstIdRef = useRef<string | null>(null)

//   const watchFabricWidth = watch("fabricWidth")
//   const watchOnTableEpi = watch("onTableEpi")
//   const watchReadspace = watch("reedspace")
//   const watchSelvedgeDents = watch("selvedgeDents")
//   const watchSelvedgeEndsPerDent = watch("selvedgeEndsPerDent")
//   const watchSelvedgeEnds = watch("selvedgeEnds")
//   const watchPpi = watch("ppi")
//   const watchTotalEnds = watch("totalEnds")

//   const getSubCategoriesByCategory = (categoryName: string) => {
//     return subCategories?.filter((sc: any) => 
//         sc.categoryName === categoryName && sc.activeFlag === true
//     ) || [];
//   };

//   const selvedgeOptions = useMemo(() => {
//     if (Array.isArray(subCategoryBySelvedgeList) && subCategoryBySelvedgeList.length > 0) {
//       return subCategoryBySelvedgeList
//     }
//     return getSubCategoriesByCategory("Selvedge")
//   }, [subCategoryBySelvedgeList, subCategories])

//   const resolveSelvedgeValue = (value: any) => {
//     if (value === undefined || value === null || value === "") {
//       return ""
//     }
//     const options = selvedgeOptions
//     const valueStr = String(value)
//     const matchById = options.find((option: any) => String(option.id) === valueStr)
//     if (matchById) {
//       return String(matchById.id)
//     }
//     const matchByName = options.find(
//       (option: any) => option.subCategoryName?.toLowerCase() === valueStr.toLowerCase(),
//     )
//     if (matchByName) {
//       return String(matchByName.id)
//     }
//     return valueStr
//   }

//   // Auto-set reedspace based on fabricWidth
//   useEffect(() => {
//     if (watchFabricWidth) {
//       const widthNum = parseFloat(watchFabricWidth);
//       if (!isNaN(widthNum)) {
//         setValue("reedspace", (widthNum + 3).toFixed(2));
//       }
//     }
//   }, [watchFabricWidth, setValue]);

//   useEffect(() => {
//     const dents = Number.parseFloat(watchSelvedgeDents) || 0
//     const endsPerDent = Number.parseFloat(watchSelvedgeEndsPerDent) || 0
//     const selvedgeEnds = dents * endsPerDent
//     setValue("selvedgeEnds", selvedgeEnds.toString())
//   }, [watchSelvedgeDents, watchSelvedgeEndsPerDent, setValue])

//   useEffect(() => {
//     const reedspace = Number.parseFloat(watchReadspace) || 0
//     const onTableEpi = Number.parseFloat(watchOnTableEpi) || 0
//     const selvedgeEnds = Number.parseFloat(watchSelvedgeEnds) || 0
//     const totalEnds = (reedspace * onTableEpi) + selvedgeEnds
//     setValue("totalEnds", totalEnds.toString())
//   }, [watchReadspace, watchOnTableEpi, watchSelvedgeEnds, setValue])

//   useEffect(() => {
//     if (modalMode === "add" || !watch("onLoomEpi")) {
//       setValue("onLoomEpi", watchOnTableEpi || "")
//     }
//   }, [watchOnTableEpi, modalMode, setValue])

//   const handleAddTestingRequirement = () => {
//     setTestingRequirementDetails([
//       ...testingRequirementDetails,
//       { id: testingRequirementDetails.length + 1, testingParameter: "", stdValue: "" },
//     ])
//   }

//   const handleDeleteTestingRequirement = (id: number) => {
//     setTestingRequirementDetails((prev) => prev.filter((item) => item.id !== id))
//   }

//   // Destructure register for fabricName
//   const { onChange: nameOnChange, onBlur: nameOnBlur, ref: nameRef, name: nameName } = register("fabricName")

//   const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     nameOnChange(e)
//     const value = e.target.value
//     const filtered = fabricMasterList.filter((f: any) =>
//       f.fabricName.toLowerCase().includes(value.toLowerCase())
//     )
//     setNameSuggestions(filtered)
//     setShowNameSuggestions(!!(value && filtered.length > 0))
//     if (filtered.length > 0) {
//       setActiveNameIndex(0)
//     }
//   }

//   const handleNameFocus = (e: React.FocusEvent<HTMLInputElement>) => {
//     const value = e.target.value
//     if (value) {
//       const filtered = fabricMasterList.filter((f: any) =>
//         f.fabricName.toLowerCase().includes(value.toLowerCase())
//       )
//       setNameSuggestions(filtered)
//       setShowNameSuggestions(true)
//       if (filtered.length > 0) {
//         setActiveNameIndex(0)
//       }
//     }
//   }

//   const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (!showNameSuggestions) return
//     if (e.key === 'ArrowDown') {
//       e.preventDefault()
//       setActiveNameIndex((prev) => (prev + 1) % nameSuggestions.length)
//     } else if (e.key === 'ArrowUp') {
//       e.preventDefault()
//       setActiveNameIndex((prev) => (prev - 1 + nameSuggestions.length) % nameSuggestions.length)
//     } else if (e.key === 'Enter') {
//       e.preventDefault()
//       if (activeNameIndex >= 0 && activeNameIndex < nameSuggestions.length) {
//         selectNameSuggestion(nameSuggestions[activeNameIndex])
//       }
//     } else if (e.key === 'Escape') {
//       setShowNameSuggestions(false)
//     }
//   }

//   const selectNameSuggestion = (item: any) => {
//     // Use setValue with shouldValidate and shouldDirty options
//     setValue('fabricName', item.fabricName, { shouldValidate: true, shouldDirty: true })
//     setValue('fabricCode', item.fabricCode, { shouldValidate: true, shouldDirty: true })

//     // Also update any other fields you want to pre-fill
//     if (item.weave) setValue('weave', String(item.weave), { shouldValidate: true, shouldDirty: true })
//     if (item.fabricQuality) setValue('fabricQuality', item.fabricQuality, { shouldValidate: true, shouldDirty: true })
//     if (item.gsm) setValue('gsm', item.gsm.toString(), { shouldValidate: true, shouldDirty: true })
//     if (item.glm) setValue('glm', item.glm.toString(), { shouldValidate: true, shouldDirty: true })

//     setShowNameSuggestions(false)
//     setActiveNameIndex(-1)
//   }

//   const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
//     nameOnBlur(e)
//     setTimeout(() => {
//       setShowNameSuggestions(false)
//     }, 200)

//     // Optional: Auto-select exact match on blur
//     const value = watch('fabricName')
//     if (value) {
//       const exact = fabricMasterList.find((f: any) =>
//         f.fabricName.toLowerCase() === value.toLowerCase()
//       )
//       if (exact) {
//         selectNameSuggestion(exact)
//       }
//     }
//   }

//   // Destructure register for fabricCode
//   const { onChange: codeOnChange, onBlur: codeOnBlur, ref: codeRef, name: codeName } = register("fabricCode")

//   // Suggestion handlers for Sort No
//   const handleCodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     codeOnChange(e)
//     const value = e.target.value
//     const filtered = fabricMasterList.filter((f: any) =>
//       f.fabricCode.toLowerCase().includes(value.toLowerCase())
//     )
//     setCodeSuggestions(filtered)
//     setShowCodeSuggestions(!!(value && filtered.length > 0))
//     if (filtered.length > 0) {
//       setActiveCodeIndex(0)
//     }
//   }

//   const handleCodeFocus = (e: React.FocusEvent<HTMLInputElement>) => {
//     const value = e.target.value
//     if (value) {
//       const filtered = fabricMasterList.filter((f: any) =>
//         f.fabricCode.toLowerCase().includes(value.toLowerCase())
//       )
//       setCodeSuggestions(filtered)
//       setShowCodeSuggestions(true)
//       if (filtered.length > 0) {
//         setActiveCodeIndex(0)
//       }
//     }
//   }

//   const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (!showCodeSuggestions) return
//     if (e.key === 'ArrowDown') {
//       e.preventDefault()
//       setActiveCodeIndex((prev) => (prev + 1) % codeSuggestions.length)
//     } else if (e.key === 'ArrowUp') {
//       e.preventDefault()
//       setActiveCodeIndex((prev) => (prev - 1 + codeSuggestions.length) % codeSuggestions.length)
//     } else if (e.key === 'Enter') {
//       e.preventDefault()
//       if (activeCodeIndex >= 0 && activeCodeIndex < codeSuggestions.length) {
//         selectCodeSuggestion(codeSuggestions[activeCodeIndex])
//       }
//     } else if (e.key === 'Escape') {
//       setShowCodeSuggestions(false)
//     }
//   }

//   const selectCodeSuggestion = (item: any) => {
//     // Use setValue with shouldValidate and shouldDirty options
//     setValue('fabricCode', item.fabricCode, { shouldValidate: true, shouldDirty: true })
//     setValue('fabricName', item.fabricName, { shouldValidate: true, shouldDirty: true })

//     // Also update any other fields you want to pre-fill
//     if (item.weave) setValue('weave', String(item.weave), { shouldValidate: true, shouldDirty: true })
//     if (item.fabricQuality) setValue('fabricQuality', item.fabricQuality, { shouldValidate: true, shouldDirty: true })
//     if (item.gsm) setValue('gsm', item.gsm.toString(), { shouldValidate: true, shouldDirty: true })
//     if (item.glm) setValue('glm', item.glm.toString(), { shouldValidate: true, shouldDirty: true })

//     setShowCodeSuggestions(false)
//     setActiveCodeIndex(-1)
//   }

//   const handleCodeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
//     codeOnBlur(e)
//     setTimeout(() => {
//       setShowCodeSuggestions(false)
//     }, 200)

//     // Optional: Auto-select exact match on blur
//     const value = watch('fabricCode')
//     if (value) {
//       const exact = fabricMasterList.find((f: any) =>
//         f.fabricCode.toLowerCase() === value.toLowerCase()
//       )
//       if (exact) {
//         selectCodeSuggestion(exact)
//       }
//     }
//   }

//   const handleAdd = () => {
//     setModalMode("add")
//     setCurrentfabric(null)
//     setOriginalFabricType("")
//     setSelectedFabricType("1") // Default to Greige
//     setSelectedGreige("")
//     setSelectedFinished("")
//     setSelectedGstDropdownId("")
//     nextPrefillGstIdRef.current = null
//     isPrefillingTaxRef.current = false
//     setFabricImage(null)
//     setTestingRequirementDetails([])
//     // Clear suggestion states
//     setShowNameSuggestions(false)
//     setNameSuggestions([])
//     setActiveNameIndex(-1)
//     setShowCodeSuggestions(false)
//     setCodeSuggestions([])
//     setActiveCodeIndex(-1)
//     reset({
//       fabricType: "1", // Default to Greige
//       fabricCode: "",
//       fabricName: "",
//       content: "",
//       wovenFabricId: null,
//       fabricCategoryId: "",
//       weave: "",
//       fabricQuality: "",
//       fabricWidth: "",
//       cutWidth: "",
//       reedspace: "",
//       onTableEpi: "",
//       onLoomEpi: "",
//       ppi: "",
//       greigeCode: "",
//       selvedgeName: "",
//       selvedgeDents: "",
//       selvedgeEndsPerDent: "",
//       selvedgeEnds: "",
//       totalEnds: "",
//       gsm: "",
//       glm: "",
//       igst: "",
//       cgst: "",
//       sgst: "",
//       status: "Active",
//       imageUrl: "",
//       testingDetails: [],
//       taxId: "1", // Default to GST
//     })
//     setIsModalOpen(true)
//   }

//   const handleEdit = (fabric: any) => {
//     console.log("fabricdetails", fabric)
//     setModalMode("edit")
//     setCurrentfabric(fabric)
//     setOriginalFabricType(fabric.fabricType ? String(fabric.fabricType) : "")

//     setFabricImage(fabric.imageUrl)

//     if (fabric.testingRequirementDetails && Array.isArray(fabric.testingRequirementDetails)) {
//       setTestingRequirementDetails([...fabric.testingRequirementDetails])
//     } else {
//       setTestingRequirementDetails([])
//     }

//     const taxIdFromData = fabric.taxType ? String(fabric.taxType) : "1" // Default to GST if not provided

//     reset({
//       id: fabric.id,
//       fabricType: fabric.fabricType ? String(fabric.fabricType) : "",
//       wovenFabricId: fabric.wovenFabricId ? String(fabric.wovenFabricId) : "",
//       fabricCategoryId: fabric.fabricCategoryId ? String(fabric.fabricCategoryId) : "",
//       fabricCode: fabric.fabricCode,
//       fabricName: fabric.fabricName,
//       content: fabric.content,
//       weave: fabric.weave ? String(fabric.weave) : "",
//       fabricQuality: fabric.fabricQuality,
//       fabricWidth: fabric.fabricWidth?.toString() || "",
//       cutWidth: fabric.cutWidth?.toString() || "",
//       reedspace: fabric.reedspace?.toString() || "",
//       onTableEpi: fabric.onTableEpi?.toString() || "",
//       onLoomEpi: fabric.onLoomEpi?.toString() || "",
//       ppi: fabric.ppi?.toString() || "",
//       greigeCode: fabric.fabricType === 1 ? "" : fabric.greigeCode || "",
//       selvedgeName: resolveSelvedgeValue(fabric.selvedgeName),
//       selvedgeDents: fabric.selvedgeDents?.toString() || "",
//       selvedgeEndsPerDent: fabric.selvedgeEndsPerDent?.toString() || "",
//       selvedgeEnds: fabric.selvedgeEnds?.toString() || "",
//       totalEnds: fabric.totalEnds?.toString() || "",
//       gsm: fabric.gsm?.toString() || "",
//       glm: fabric.glm?.toString() || "",
//       igst: fabric.igst?.toString() || "",
//       cgst: fabric.cgst?.toString() || "",
//       sgst: fabric.sgst?.toString() || "",
//       status: fabric.status || "Active",
//       imageUrl: fabric.imageUrl,
//       testingDetails: fabric.testingRequirementDetails || [],
//       taxId: taxIdFromData,
//     })

//     const existingGstPercent = (() => {
//       const fromPercent = Number(fabric.gstPercent)
//       if (Number.isFinite(fromPercent) && fromPercent > 0) {
//         return fromPercent
//       }
//       const igstValue = Number(fabric.igst)
//       if (Number.isFinite(igstValue) && igstValue > 0) {
//         return igstValue
//       }
//       const cgstValue = Number(fabric.cgst)
//       const sgstValue = Number(fabric.sgst)
//       const combined = (Number.isFinite(cgstValue) ? cgstValue : 0) + (Number.isFinite(sgstValue) ? sgstValue : 0)
//       if (combined > 0) {
//         return combined
//       }
//       return 0
//     })()
//     const taxType = fabric.taxType ?? 1

//     let matchingId = ""
//     const matchingEntry = Object.entries(gstIdToPercent).find(([id, p]) => p === existingGstPercent)
//     if (matchingEntry) {
//       matchingId = matchingEntry[0]
//     }

//     setSelectedGstDropdownId(matchingId)
//     nextPrefillGstIdRef.current = matchingId || null
//     isPrefillingTaxRef.current = true
//     setValue("taxId", String(taxType))

//     // Set selected fabric type and corresponding wovenFabricId
//     const fabricTypeNum = fabric.fabricType
//     if (fabricTypeNum) {
//       setSelectedFabricType(String(fabricTypeNum))
//       if (fabricTypeNum === 2) {
//         setSelectedGreige(fabric.wovenFabricId ? String(fabric.wovenFabricId) : "")
//       } else if (fabricTypeNum === 3) {
//         setSelectedFinished(fabric.wovenFabricId ? String(fabric.wovenFabricId) : "")
//       }
//     } else {
//       setSelectedFabricType("1") // Default to Greige if fabricType is missing
//     }

//     // Clear suggestion states
//     setShowNameSuggestions(false)
//     setNameSuggestions([])
//     setActiveNameIndex(-1)
//     setShowCodeSuggestions(false)
//     setCodeSuggestions([])
//     setActiveCodeIndex(-1)

//     setIsModalOpen(true)
//   }

//   const handleDelete = (fabric: any) => {
//     setCurrentfabric(fabric)
//     setIsDeleteModalOpen(true)
//   }

//   const handleView = (fabric: any) => {
//     setCurrentfabric(fabric)
//     setIsViewModalOpen(true)
//   }

//   const onSubmit = async (data: fabricFormData) => {
//     try {
//       console.log("Form data submitted:", data)

//       let igst = 0
//       let cgst = 0
//       let sgst = 0
//       let gstPercent = null
//       const numericTaxId = data.taxId ? Number.parseInt(data.taxId) : 1 // Default to 1 (GST)

//       if (selectedGstDropdownId) {
//         const rates = gstIdToRates[selectedGstDropdownId]
//         if (rates) {
//           gstPercent = rates.total
//           if (numericTaxId === 2) {
//             igst = rates.igst || rates.total
//           } else if (numericTaxId === 1) {
//             const cgstRate = rates.cgst || (rates.total ? rates.total / 2 : 0)
//             const sgstRate = rates.sgst || (rates.total ? rates.total / 2 : 0)
//             cgst = cgstRate
//             sgst = sgstRate
//           }
//         }
//       } else {
//         // If no GST dropdown selected, use manually entered values if available
//         igst = Number.parseFloat(data.igst) || 0
//         cgst = Number.parseFloat(data.cgst) || 0
//         sgst = Number.parseFloat(data.sgst) || 0

//         if (numericTaxId === 2) {
//           gstPercent = igst
//         } else if (numericTaxId === 1) {
//           gstPercent = cgst + sgst
//         }
//       }

//       const formData = {
//         id: data.id !== undefined ? data.id : null,
//         fabricType: data.fabricType ? Number.parseInt(data.fabricType) : null,
//         wovenFabricId: data.wovenFabricId ? Number.parseInt(data.wovenFabricId) : null,
//         fabricCategoryId: data.fabricCategoryId ? Number.parseInt(data.fabricCategoryId) : null,
//         fabricCode: data.fabricCode,
//         fabricName: data.fabricName,
//         content: data.content,
//         weave: data.weave ? Number.parseInt(data.weave) : null,
//         fabricQuality: data.fabricQuality,

//         // NEW FIELDS - Convert to appropriate types
//         fabricWidth: data.fabricWidth ? Number.parseFloat(data.fabricWidth) : null,
//         cutWidth: data.cutWidth ? Number.parseFloat(data.cutWidth) : null,
//         reedspace: data.reedspace ? Number.parseFloat(data.reedspace) : null,
//         onTableEpi: data.onTableEpi ? Number.parseInt(data.onTableEpi) : null,
//         onLoomEpi: data.onLoomEpi ? Number.parseInt(data.onLoomEpi) : null,
//         selvedgeName: data.selvedgeName,
//         selvedgeDents: data.selvedgeDents ? Number.parseInt(data.selvedgeDents) : null,
//         selvedgeEndsPerDent: data.selvedgeEndsPerDent ? Number.parseInt(data.selvedgeEndsPerDent) : null,
//         selvedgeEnds: data.selvedgeEnds ? Number.parseInt(data.selvedgeEnds) : null,

//         ppi: data.ppi ? Number.parseInt(data.ppi) : null,
//         greigeCode: data.fabricType === "1" ? "" : data.greigeCode,
//         totalEnds: data.totalEnds ? Number.parseInt(data.totalEnds) : null,
//         gsm: data.gsm ? Number.parseFloat(data.gsm) : null,
//         glm: data.glm ? Number.parseFloat(data.glm) : null,

//         // GST fields
//         igst: igst,
//         cgst: cgst,
//         sgst: sgst,
//         taxType: numericTaxId,
//         gstPercent: gstPercent,

//         stdValue: data.stdValue ? Number.parseFloat(data.stdValue) : null,
//         fabricImageUrl: fabricImage,
//         status: data.status || "Active", // Ensure status is sent

//         // Details - Empty arrays for Quality Master (no warp/weft details)
//         warpDetails: [],
//         weftDetails: [],
//         testingDetails: testingRequirementDetails,
//       }

//       console.log("Final form data being sent:", formData)

//       if (modalMode === "edit") {
//         await dispatch(updateFabricMaster(formData))
//       } else {
//         const { id, ...newFabricMasterData } = formData
//         await dispatch(createFabricMaster(newFabricMasterData))
//       }

//       await dispatch(getAllFabricMasters({}))
//       setIsModalOpen(false)
//       reset()
//       setTestingRequirementDetails([])
//       setFabricImage(null)
//       setModalMode("add")
//     } catch (error) {
//       console.error("Error submitting form:", error)
//     }
//   }

//   const confirmDelete = async () => {
//     if (!currentfabric) return

//     try {
//       await dispatch(deleteFabricMaster(currentfabric.id)).unwrap()
//       await dispatch(getAllFabricMasters({}))
//     } catch (error) {
//       console.error("Error deleting Fabric:", error)
//     }

//     setIsDeleteModalOpen(false)
//   }

//   function closePopup(): void {
//     throw new Error("Function not implemented.")
//   }

//   const handleFilterChange = (filter: number | string) => {
//     let filteredData = fabricMasterList
//     if (filter !== "all") {
//       filteredData = fabricMasterList.filter((fabric: any) => {
//         return fabric.fabricType === Number(filter)
//       })
//     }
//     setFabric(filteredData)
//   }

//   const [selectedFilter, setSelectedFilter] = useState("all")

//   const filterOptions = [
//     { label: "All", value: "all" },
//     { label: "Greige", value: 1 },
//     { label: "Finished", value: 2 },
//     { label: "Finished Shade", value: 3 },
//   ]

//   const handleClick = (value: any) => {
//     setSelectedFilter(value)
//     handleFilterChange(value)
//   }

//   const handleFabricTypeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const value = e.target.value
//     setSelectedFabricType(value)
//     setValue("fabricType", value)
//     setSelectedGreige("")
//     setSelectedFinished("")

//     const numericValue = Number.parseInt(value, 10)

//     if (!isNaN(numericValue) && (numericValue === 1 || numericValue === 2 || numericValue === 3)) {
//       const sourceId = numericValue === 2 ? 1 : numericValue === 3 ? 2 : numericValue
//       await dispatch(getAllFabricMasterDetails({ id: sourceId }))
//     } else if (value === "") {
//       setValue("wovenFabricId", "")
//     }
//   }

//   // Use the selectedTaxId from form state or default to '1' (GST)
//   const selectedTaxId = watch("taxId") || "1"

//   useEffect(() => {
//     // This effect is for initial load or when modalMode changes to 'add'
//     // It ensures igst is cleared when taxId might be '1' (GST)
//     // It's placed here to run after reset() is called in handleAdd
//     if (modalMode === "add") {
//       setValue("igst", "")
//     }
//   }, [modalMode, setValue])

//   useEffect(() => {
//     // This effect handles pre-filling CGST/SGST or IGST based on selected GST dropdown and tax type
//     if (!isPrefillingTaxRef.current) {
//       return
//     }

//     const prefillId = nextPrefillGstIdRef.current
//     if (!prefillId) {
//       isPrefillingTaxRef.current = false
//       return
//     }

//     setSelectedGstDropdownId(prefillId)
//     const rates = gstIdToRates[prefillId]

//     if (selectedTaxId === "1") {
//       const cgstRate = rates?.cgst ?? (rates?.total ? rates.total / 2 : 0)
//       const sgstRate = rates?.sgst ?? (rates?.total ? rates.total / 2 : 0)
//       setValue("cgst", cgstRate ? String(cgstRate) : "")
//       setValue("sgst", sgstRate ? String(sgstRate) : "")
//       setValue("igst", "")
//     } else if (selectedTaxId === "2") {
//       const igstRate = rates?.igst ?? rates?.total ?? 0
//       setValue("igst", igstRate ? String(igstRate) : "")
//       setValue("cgst", "")
//       setValue("sgst", "")
//     } else {
//       setValue("igst", "")
//       setValue("cgst", "")
//       setValue("sgst", "")
//     }

//     isPrefillingTaxRef.current = false
//   }, [selectedTaxId, setValue, gstIdToRates])

//   // Function to safely convert any value to a number, returning 0 if NaN
//   const toNumber = (v: any) => {
//     const n = Number.parseFloat(String(v))
//     return isNaN(n) ? 0 : n
//   }


//   return (
//    <div className={embedded ? "" : "p-6 pt-16"}>
//       <div className="mb-4">
//         <label className="block text-sm font-medium text-gray-700 mb-2">Filter Fabric Type</label>
//         <div className="flex space-x-2 flex-wrap">
//           {filterOptions.map((option) => (
//             <button
//               key={option.value}
//               onClick={() => handleClick(option.value)}
//               className={`px-4 py-2 rounded-lg border text-sm font-medium transition
//               ${selectedFilter === option.value
//                   ? "bg-blue-600 text-white border-blue-600 shadow"
//                   : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
//                 }`}
//             >
//               {option.label}
//             </button>
//           ))}
//         </div>
//       </div>
//       <DataTable
//         columns={columns}
//         data={processedCityList}
//         title="Quality Master"
//         onAdd={handleAdd}
//         onEdit={handleEdit}
//         // onDelete={handleDelete}
//         onView={handleView}
//         showActions={true}
//         showColumnFilters={true}
//         filterPlaceholder="Search fabric..."
//       />
//       {isModalOpen && (
//         <div className="fixed inset-0 flex items-center flex justify-end z-50 bg-gray-800 bg-opacity-50">
//           <div className="bg-white p-8 shadow-lg w-3/4 h-full  max-h-full overflow-y-auto ">
//             <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between ">
//               {modalMode === "add" ? "Add Quality" : "Update Quality"}
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 width="30"
//                 height="30"
//                 fill="currentColor"
//                 onClick={() => setIsModalOpen(false)}
//                 className="bi bi-x cursor-pointer"
//                 viewBox="0 0 16 16"
//               >
//                 <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
//               </svg>
//             </h2>
//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//               <div className="p-6 bg-white shadow rounded-lg">
//                 <div className="grid grid-cols-3 gap-4">
//                                    <div>
//                     <label className="block">Fabric Type</label>
//                     <select
//                       {...register("fabricType")}
//                       className="input mt-1"
//                       value={selectedFabricType} // Bind to state
//                       onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
//                         handleFabricTypeChange(e)
//                       }}
//                     >
//                       <option value="">Select a Fabric Type</option>
//                       {fabricTypeList?.map((fabricType: any) => (
//                         <option key={fabricType.id} value={fabricType.id}>
//                           {fabricType.fabricTypeName}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   {selectedFabricType === "2" && (
//                     <div>
//                       <label className="block">Select Greige</label>
//                       <select
//                         {...register("wovenFabricId")}
//                         value={selectedGreige}
//                         onChange={(e) => { setSelectedGreige(e.target.value); setValue("wovenFabricId", e.target.value) }}
//                         className="input mt-1"
//                       >
//                         <option value="">Select Greige</option>
//                         {fabricMasterDetailList?.map((item: any) => (
//                           <option key={item.id} value={item.id}>
//                             {item.fabric_name} ({item.fabric_code})
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   )}

//                   {selectedFabricType === "3" && (
//                     <div>
//                       <label className="block">Select Finished</label>
//                       <select
//                         {...register("wovenFabricId")}
//                         value={selectedFinished}
//                         onChange={(e) => { setSelectedFinished(e.target.value); setValue("wovenFabricId", e.target.value) }}
//                         className="input mt-1"
//                       >
//                         <option value="">Select Finished</option>
//                         {fabricMasterDetailList
//                           ?.filter((item: any) => item.fabricType === 2)
//                           .map(
//                             (
//                               item: any, // Filter for Finished
//                             ) => (
//                               <option key={item.id} value={item.id}>
//                                 {" "}
//                                 {item.fabric_name} ({item.fabric_code})
//                               </option>
//                             ),
//                           )}
//                       </select>
//                     </div>
//                   )}

//                     <div>
//                     <label className="block">Fabric Category</label>
//                     <select {...register("fabricCategoryId")} className="input mt-1">
//                       <option value="">Select a Fabric Category</option>
//                       {fabricCategoryList?.map((fabricCategory: any) => (
//                         <option key={fabricCategory.id} value={fabricCategory.id}>
//                           {fabricCategory.fabricCategoryName}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                   <div className="relative">
//                     <label className="block">Sort No</label>
//                     <input
//                       {...register("fabricCode")}
//                       placeholder="Enter Sort No"
//                       className="input mt-1"
//                       onChange={handleCodeInputChange}
//                       onFocus={handleCodeFocus}
//                       onBlur={handleCodeBlur}
//                       onKeyDown={handleCodeKeyDown}
//                       autoComplete="off"
//                     />
//                     {showCodeSuggestions && (
//                       <div className="absolute z-10 bg-white border rounded shadow-lg w-full mt-1 max-h-40 overflow-y-auto">
//                         <ul>
//                           {codeSuggestions.map((item: any, idx: number) => (
//                             <li
//                               key={item.id}
//                               onMouseEnter={() => setActiveCodeIndex(idx)}
//                               className={`p-2 hover:bg-gray-100 cursor-pointer ${idx === activeCodeIndex ? 'bg-gray-200' : ''}`}
//                                 onClick={(e) => {
//                                 e.preventDefault();
//                                 e.stopPropagation();
//                                 selectCodeSuggestion(item);
//                               }}
//                               onMouseDown={(e) => e.preventDefault()}
//                             >
//                               {item.fabricCode} - {item.fabricName}
//                             </li>
//                           ))}
//                         </ul>
//                       </div>
//                     )}
//                   </div>

//                   <div className="relative">
//                     <label className="block">Fabric Name</label>
//                     <input
//                       {...register("fabricName")}
//                       placeholder="Enter Fabric Name"
//                       className="input mt-1"
//                       onChange={handleNameInputChange}
//                       onFocus={handleNameFocus}
//                       onBlur={handleNameBlur}
//                       onKeyDown={handleNameKeyDown}
//                       autoComplete="off"
//                     />
//                     {showNameSuggestions && (
//                       <div className="absolute z-10 bg-white border rounded shadow-lg w-full mt-1 max-h-40 overflow-y-auto">
//                         <ul>
//                           {nameSuggestions.map((item: any, idx: number) => (
//                             <li
//                               key={item.id}
//                               onMouseEnter={() => setActiveNameIndex(idx)}
//                               className={`p-2 hover:bg-gray-100 cursor-pointer ${idx === activeNameIndex ? 'bg-gray-200' : ''}`}
//                               onClick={(e) => {
//                                 e.preventDefault();
//                                 e.stopPropagation();
//                                 selectNameSuggestion(item);
//                               }}
//                               onMouseDown={(e) => e.preventDefault()} // Prevent input blur before click
//                             >
//                               {item.fabricName} - {item.fabricCode}
//                             </li>
//                           ))}
//                         </ul>
//                       </div>
//                     )}
//                   </div>
//                   <div>
//                     <label className="block">Content</label>
//                     <input {...register("content")} placeholder="Enter Content" className="input mt-1" />
//                   </div>
//                   <div>
//                       <label className="block">Weave</label>
//                     <select {...register("weave")} className="input mt-1">
//                       <option value="">Select a Weave</option>
//                       {getSubCategoriesByCategory("Weave").map((weaveType: any) => (
//                         <option key={weaveType.id} value={weaveType.id}>
//                           {weaveType.subCategoryName}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block">Construction</label>
//                     <input
//                       {...register("fabricQuality")}
//                       placeholder="Enter Construction"
//                       className="input mt-1"
//                     />
//                   </div>

//                   <div>
//                     <label className="block">Fabric Width</label>
//                     <input
//                       {...register("fabricWidth")}
//                       type="number"
//                       step="0.01"
//                       placeholder="Enter Fabric Width"
//                       className="input mt-1"
//                     />
//                   </div>

//                   <div>
//                     <label className="block">Cut Width</label>
//                     <input
//                       {...register("cutWidth")}
//                       type="number"
//                       step="0.01"
//                       placeholder="Enter Cut Width"
//                       className="input mt-1"
//                     />
//                   </div>

//                   <div>
//                     <label className="block">Reedspace</label>
//                     <input
//                       {...register("reedspace")}
//                       type="number"
//                       step="0.01"
//                       placeholder="Enter Readspace"
//                       className="input mt-1"
//                     />
//                   </div>

//                   <div>
//                     <label className="block">On Table EPI</label>
//                     <input
//                       {...register("onTableEpi")}
//                       type="number"
//                       placeholder="Enter On Table EPI"
//                       className="input mt-1"
//                     />
//                   </div>

//                   <div>
//                      <label className="block">On Loom EPI</label>
//                     <input
//                       {...register("onLoomEpi")}
//                       type="number"
//                       placeholder="Enter On Loom EPI"
//                       className="input mt-1"
//                     />
//                   </div>

//                   <div>
//                     <label className="block">PPI</label>
//                     <input
//                       {...register("ppi")}
//                       type="number"
//                       placeholder="Enter PPI"
//                       className="input mt-1"
//                     />
//                   </div>

//                   <div>
//                     <label className="block">Selvedge Name</label>
//                     <select {...register("selvedgeName")} className="input mt-1">
//                       <option value="">Select Selvedge Name</option>
//                       {selvedgeOptions.map((selvedgeType: any) => (
//                         <option key={selvedgeType.id} value={selvedgeType.id}>
//                           {selvedgeType.subCategoryName}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block">Selvedge Dents</label>
//                     <input
//                       {...register("selvedgeDents")}
//                       type="number"
//                       placeholder="Enter Selvedge Dents"
//                       className="input mt-1"
//                     />
//                   </div>

//                   <div>
//                     <label className="block">Selvedge Ends/Dent</label>
//                     <input
//                       {...register("selvedgeEndsPerDent")}
//                       type="number"
//                       placeholder="Enter Selvedge Ends/Dent"
//                       className="input mt-1"
//                     />
//                   </div>

//                   <div>
//                     <label className="block">Selvedge Ends</label>
//                     <input
//                       {...register("selvedgeEnds")}
//                       type="number"
//                       placeholder="Calculated automatically"
//                       className="input mt-1 bg-gray-100"
//                       readOnly
//                     />
//                   </div>

//                   <div>
//                     <label className="block">Total Ends</label>
//                     <input
//                       {...register("totalEnds")}
//                       type="number"
//                       placeholder="Enter Total Ends"
//                       className="input mt-1"
//                     />
//                   </div>

//                   <div>
//                     <label className="block">GSM</label>
//                     <input
//                       {...register("gsm")}
//                       type="number"
//                       step="0.01"
//                       placeholder="Calculated automatically"
//                       className="input mt-1"

//                     />
//                   </div>
//                   <div>
//                     <label className="block">GLM</label>
//                     <input
//                       {...register("glm")}
//                       type="number"
//                       step="0.01"
//                       placeholder="Enter Glm"
//                       className="input mt-1"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-secondary-700">IGST %</label>
//                     <select
//                       value={selectedGstDropdownId}
//                       onChange={(e) => {
//                         const id = e.target.value
//                         setSelectedGstDropdownId(id)
//                         nextPrefillGstIdRef.current = null
//                         isPrefillingTaxRef.current = false

//                         const rates = gstIdToRates[id]
//                         const totalPercent = rates?.total ?? 0

//                         if (selectedTaxId === "1") {
//                           const cgstRate = rates?.cgst ?? (totalPercent ? totalPercent / 2 : 0)
//                           const sgstRate = rates?.sgst ?? (totalPercent ? totalPercent / 2 : 0)
//                           setValue("cgst", cgstRate ? String(cgstRate) : "")
//                           setValue("sgst", sgstRate ? String(sgstRate) : "")
//                           setValue("igst", "")
//                         } else if (selectedTaxId === "2") {
//                           const igstRate = rates?.igst ?? totalPercent
//                           setValue("igst", igstRate ? String(igstRate) : "")
//                           setValue("cgst", "")
//                           setValue("sgst", "")
//                         }
//                       }}
//                       className="input mt-1"
//                     >
//                       <option value="">Select a IGST %</option>
//                       {normalizedGstList.map((gstOption: any) => (
//                         <option key={gstOption.id} value={String(gstOption.id)}>
//                           {gstOption.label}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   {selectedTaxId === "1" && ( // Show CGST & SGST only if Tax Type is GST
//                     <>
//                       <div>
//                         <label className="block text-sm font-medium text-secondary-700">CGST %</label>
//                         <input {...register("cgst")} placeholder="CGST %" className="input mt-1 bg-gray-100" readOnly />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-secondary-700">SGST %</label>
//                         <input {...register("sgst")} placeholder="SGST %" className="input mt-1 bg-gray-100" readOnly />
//                       </div>
//                     </>
//                   )}
//                   {selectedTaxId === "2" && ( // Show IGST only if Tax Type is IGST
//                     <div>
//                       <label className="block text-sm font-medium text-secondary-700">IGST %</label>
//                       <input {...register("igst")} placeholder="IGST %" className="input mt-1 bg-gray-100" readOnly />
//                     </div>
//                   )}
//                 </div>

//                 {/* Testing Requirements */}
//                 {/* <div className="mt-10">
//                   <h3 className="font-semibold">
//                     Testing Requirements
//                     <button
//                       type="button"
//                       onClick={handleAddTestingRequirement}
//                       className="ml-2 bg-primary text-white px-2 py-1 rounded"
//                     >
//                       + Add Testing Requirement
//                     </button>
//                   </h3>
//                   <table className="w-full border mt-4">
//                     <thead>
//                       <tr className="bg-gray-200">
//                         <th>SL.NO</th>
//                         <th>Testing Parameter</th>
//                         <th>STD Value</th>
//                         <th>Action</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {testingRequirementDetails.map((item, index) => (
//                         <tr key={item.id} className="border">
//                           <td className="p-2">{index + 1}</td>
//                           <td className="p-2">
//                             <input
//                               type="text"
//                               value={item.testingParameter}
//                               onChange={(e) => {
//                                 const updated = [...testingRequirementDetails]
//                                 updated[index].testingParameter = e.target.value
//                                 setTestingRequirementDetails(updated)
//                               }}
//                               className="border p-1 w-full"
//                             />
//                           </td>
//                           <td className="p-2">
//                             <input
//                               type="text"
//                               value={item.stdValue}
//                               onChange={(e) => {
//                                 const updated = [...testingRequirementDetails]
//                                 updated[index].stdValue = e.target.value
//                                 setTestingRequirementDetails(updated)
//                               }}
//                               className="border p-1 w-full"
//                             />
//                           </td>
//                           <td className="p-2">
//                             <Trash
//                               className="text-red-500 cursor-pointer"
//                               onClick={() => handleDeleteTestingRequirement(item.id)}
//                             />
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div> */}
//               </div>
//               <div className="flex justify-end space-x-3 pt-4">
//                 <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
//                   Cancel
//                 </button>
//                 <button type="submit" className="btn btn-primary">
//                   {modalMode === "add" ? "Add Quality" : "Update Quality"}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//       {/* View Modal */}
//       <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Quality Details">
//         {currentfabric && (
//           <div className="space-y-4">
//             <div className="flex gap-6 items-center">
//               {currentfabric.imageUrl && (
//                 <img
//                   src={currentfabric.imageUrl || "/placeholder.svg"}
//                   alt={currentfabric.name}
//                   className="w-32 h-32 object-cover rounded-lg shadow"
//                 />
//               )}

//               <div className="space-y-2">
//                 <div>
//                   <p className="text-sm text-secondary-500 font-medium">
//                     Fabric Type: <span className="text-md font-bold text-gray-900">{currentfabric.fabricType}</span>
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-secondary-500 font-medium">
//                     Sort No: <span className="text-md font-bold text-gray-900">{currentfabric.fabricCode}</span>
//                   </p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-secondary-500 font-medium">
//                     Fabric Name: <span className="text-md font-bold text-gray-900">{currentfabric.fabricName}</span>
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div className="grid grid-cols-3 gap-4 pt-4">
//               <div>
//                 <p className="text-sm text-secondary-500">Weave</p>
//                 <p className="font-medium">{currentfabric.weave}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">Construction</p>
//                 <p className="font-medium">{currentfabric.fabricQuality}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">Fabric Width</p>
//                 <p className="font-medium">{currentfabric.fabricWidth}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">Cut Width</p>
//                 <p className="font-medium">{currentfabric.cutWidth}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">Readspace</p>
//                 <p className="font-medium">{currentfabric.reedspace}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">On Table EPI</p>
//                 <p className="font-medium">{currentfabric.onTableEpi}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">On Loom EPI</p>
//                 <p className="font-medium">{currentfabric.onLoomEpi}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">PPI</p>
//                 <p className="font-medium">{currentfabric.ppi}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">Total Ends</p>
//                 <p className="font-medium">{currentfabric.totalEnds}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">GSM</p>
//                 <p className="font-medium">{currentfabric.gsm}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">GLM</p>
//                 <p className="font-medium">{currentfabric.glm}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">IGST</p>
//                 <p className="font-medium">{currentfabric.igst}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">CGST</p>
//                 <p className="font-medium">{currentfabric.cgst}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-secondary-500">SGST</p>
//                 <p className="font-medium">{currentfabric.sgst}</p>
//               </div>
//             </div>
//             <div className="flex justify-end pt-4">
//               <button onClick={() => setIsViewModalOpen(false)} className="btn btn-secondary">
//                 Close
//               </button>
//             </div>
//           </div>
//         )}
//       </Modal>

//       {/* Delete Confirmation Modal */}
//       <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
//         <div className="space-y-4">
//           <p>Are you sure you want to delete Quality?</p>

//           <div className="flex justify-end space-x-3 pt-4">
//             <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">
//               Cancel
//             </button>
//             <button onClick={confirmDelete} className="btn btn-danger">
//               Delete
//             </button>
//           </div>
//         </div>
//       </Modal>
//     </div>
//   )
// }

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Trash } from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import { DataTable } from "@/components/data/DataTable"
import { useForm } from "react-hook-form"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/state/store"
import {
  createFabricMaster,
  deleteFabricMaster,
  getAllFabricMasterDetails,
  getAllFabricMasters,
  getAllFabricMastersForDropdown,
  getFabricMasterById,
  updateFabricMaster,
} from "@/state/fabricMasterSlice"
import { getAllGstMaster } from "@/state/gstMasterSlice"
import { getAllProductCategory } from "@/state/productCategorySlice"
import { getAllFabricTypes } from "@/state/fabricTypeSlice"
import { getAllSubCategories } from "@/state/subCategorySlice"
import { getAllYarnMasters } from "@/state/yarnSlice"
import React from "react"
import { getAllFabricCategory } from "@/state/fabricCategorySlice"
import { Value } from "@radix-ui/react-select"
import { Pagination, usePagination } from "@/components/common/Pagination"
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect"
import { useThemeStore } from "@/store/themeStore"

interface testingRequirementDetail {
  id: number
  testingParameter: string
  stdValue: string
}

interface fabricFormData {
  id?: number | null
  wovenFabricId: string | null
  fabricCategoryId: string
  fabricType: string
  fabricCode: string
  fabricName: string
  content: string
  contentName: string
  weave: string
  fabricQuality: string
  fabricWidth: string // New field
  cutWidth: string // New field
  reedspace: string // New field
  onTableEpi: string // Replaces epi
  onLoomEpi: string // New field
  ppi: string
  greigeCode: string
  selvedgeName: string // New field
  selvedgeDents: string // New field
  selvedgeEndsPerDent: string // New field
  selvedgeEnds: string // New field (calculated)
  totalEnds: string
  gsm: string
  glm: string
  igst: string
  cgst: string
  sgst: string
  status: string
  imageUrl: string
  stdValue: string
  taxId: string
  testingDetails: testingRequirementDetail[]
}

interface QualityMasterProps {
  embedded?: boolean
}

export default function QualityMaster({ embedded = false }: QualityMasterProps) {
  const { uomList } = useSelector((state: RootState) => state.uom)
  const { productCategoryList } = useSelector((state: RootState) => state.productCategory)
  const { fabricTypeList } = useSelector((state: RootState) => state.fabricType)
  const { fabricCategoryList } = useSelector((state: RootState) => state.fabricCategoty)
  const { fabricMasterDetailList } = useSelector((state: RootState) => state.fabricMaster)
  const { subCategoryList: subCategories } = useSelector((state: RootState) => state.subCategory)

  const { yarnList } = useSelector((state: RootState) => state.yarn)
  const { fabricMasterList, fabricMasterFullList, pagination } = useSelector((state: RootState) => state.fabricMaster)
  const { gstList } = useSelector((state: RootState) => state.gst)
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

  // States for handling fabric type specific logic
  const [originalFabricType, setOriginalFabricType] = useState<string>("")
  const [selectedFabricType, setSelectedFabricType] = useState<string>("1")
  const [selectedGreige, setSelectedGreige] = useState<string>("")
  const [selectedFinished, setSelectedFinished] = useState<string>("")
  const [selectedGstDropdownId, setSelectedGstDropdownId] = useState<string>("")

  // Suggestion states for Fabric Name
  const [showNameSuggestions, setShowNameSuggestions] = useState(false)
  const [nameSuggestions, setNameSuggestions] = useState<any[]>([])
  const [activeNameIndex, setActiveNameIndex] = useState(-1)

  // Suggestion states for Sort No
  const [showCodeSuggestions, setShowCodeSuggestions] = useState(false)
  const [codeSuggestions, setCodeSuggestions] = useState<any[]>([])
  const [activeCodeIndex, setActiveCodeIndex] = useState(-1)
  const { theme } = useThemeStore();
  const selectedClass = theme === 'default'
    ? "bg-blue-600 text-white border-blue-600 shadow"
    : "bg-gray-700 text-white border-gray-800 shadow";
  const {
    currentPage,
    itemsPerPage,
    setItemsPerPage,
    handlePageChange,
    resetPage,
    getOffset
  } = usePagination({ itemsPerPage: 10 })

  const parseRateValue = (value: any) => {
    const num = Number(value)
    return Number.isFinite(num) ? num : 0
  }

  const normalizedGstList = useMemo(() => {
    const rawList = Array.isArray(gstList)
      ? gstList
      : Array.isArray((gstList as any)?.data)
        ? (gstList as any).data
        : []
    return rawList.map((gst: any) => {
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
  }, [gstList])

  const gstIdToPercent = useMemo(() => {
    const mapping: Record<string, number> = {}
    normalizedGstList.forEach((gst: any) => {
      mapping[String(gst.id)] = gst.totalRate
    })
    return mapping
  }, [normalizedGstList])

  const gstIdToRates = useMemo(() => {
    const mapping: Record<string, { cgst: number; sgst: number; igst: number; total: number }> = {}
    normalizedGstList.forEach((gst: any) => {
      mapping[String(gst.id)] = {
        cgst: gst.cgstRate,
        sgst: gst.sgstRate,
        igst: gst.igstRate,
        total: gst.totalRate,
      }
    })
    return mapping
  }, [normalizedGstList])



  useEffect(() => {
    dispatch(getAllProductCategory({}))
    dispatch(getAllFabricTypes({ fetchAll: true }))
    dispatch(getAllYarnMasters({ fetchAll: true }))
    dispatch(getAllSubCategories({ fetchAll: true }))
    dispatch(getAllFabricMastersForDropdown())
    dispatch(getAllFabricMasters({
      fetchAll: true,
    }))
    dispatch(getAllFabricCategory({}))
    dispatch(getAllGstMaster({ fetchAll: true }))
  }, [dispatch, currentPage, itemsPerPage])

  useEffect(() => {
    setFabric(fabricMasterList)
  }, [fabricMasterList])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<fabricFormData>()

  const {
    onChange: fabricTypeRegisterOnChange,
    onBlur: fabricTypeRegisterOnBlur,
    ref: fabricTypeRegisterRef,
    name: fabricTypeRegisterName,
  } = register("fabricType", { required: "Fabric Type is required" })

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
    if (!Array.isArray(fabric)) return [];
    return fabric.map((city: any, index: number) => ({
      ...city,
      serialNo: (pagination.offset || 0) + index + 1
      // serialNo: index + 1
    }));
  }, [fabric]);

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

  const dropdownOptions = watchFabricTypeValue === "3" ? finishedOptions : greigeOptions
  const greigeSelectionRequired = watchFabricTypeValue === "2" || watchFabricTypeValue === "3"
  const wovenFabricRegister = register("wovenFabricId", {
    required: greigeSelectionRequired
      ? "Greige selection is required for Finished/Finished Shade"
      : false,
  })
  const wovenFabricValue = watch("wovenFabricId") || ""

  const handleGreigeSelection = useCallback((selectedId: string, overrideFabricType?: string) => {
    const fabricTypeValue = overrideFabricType ?? watchFabricTypeValue
    const isFinishedShade = fabricTypeValue === "3"

    if (isFinishedShade) {
      setSelectedFinished(selectedId)
    } else {
      setSelectedGreige(selectedId)
    }

    setValue("wovenFabricId", selectedId)

    const sourceOptions = fabricTypeValue === "3" ? finishedOptions : greigeOptions
    const selectedFabric = sourceOptions.find((fabric: any) => String(fabric.id) === String(selectedId))

    if (selectedFabric) {
      setValue("greigeCode", selectedFabric.fabricCode || selectedId)
    } else if (!selectedId) {
      setValue("greigeCode", "")
    } else {
      setValue("greigeCode", selectedId)
    }
  }, [watchFabricTypeValue, finishedOptions, greigeOptions, setValue])

  useEffect(() => {
    if (modalMode === "add") return
    if (selectedFabricType !== "2" || !selectedGreige) return
    const g = dropdownFabricSource.find((f: any) => String(f.id) === String(selectedGreige))
    if (!g) return
    setValue("fabricCategoryId", g.fabricCategoryId ? String(g.fabricCategoryId) : "")
    setValue("weave", g.weave ? String(g.weave) : "")
    setValue("fabricQuality", g.fabricQuality || "")
    setValue("fabricWidth", g.fabricWidth?.toString() || "")
    setValue("cutWidth", g.cutWidth?.toString() || "")
    setValue("reedspace", g.reedspace?.toString() || "")
    setValue("onTableEpi", g.onTableEpi?.toString() || "")
    setValue("onLoomEpi", g.onLoomEpi?.toString() || "")
    setValue("ppi", g.ppi?.toString() || "")
    setValue("selvedgeName", resolveSelvedgeValue(g.selvedgeName))
    setValue("selvedgeDents", g.selvedgeDents?.toString() || "")
    setValue("selvedgeEndsPerDent", g.selvedgeEndsPerDent?.toString() || "")
    setValue("selvedgeEnds", g.selvedgeEnds?.toString() || "")
    setValue("totalEnds", g.totalEnds?.toString() || "")
    setValue("gsm", g.gsm?.toString() || "")
    setValue("glm", g.glm?.toString() || "")
    setValue("greigeCode", g.fabricCode || g.greigeCode || "")
    setTestingRequirementDetails(Array.isArray(g.testingDetails) ? g.testingDetails : [])
    setFabricImage(g.fabricImageUrl || null)
  }, [modalMode, selectedFabricType, selectedGreige, dropdownFabricSource, setValue])

  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: 'serialNo', // ✅ Use pre-calculated serial number
        width: 50,

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
    ],
    [],
  )

  const isPrefillingTaxRef = useRef(false)
  const nextPrefillGstIdRef = useRef<string | null>(null)

  const watchFabricWidth = watch("fabricWidth")
  const watchOnTableEpi = watch("onTableEpi")
  const watchReadspace = watch("reedspace")
  const watchSelvedgeDents = watch("selvedgeDents")
  const watchSelvedgeEndsPerDent = watch("selvedgeEndsPerDent")
  const watchSelvedgeEnds = watch("selvedgeEnds")
  const watchPpi = watch("ppi")
  const watchTotalEnds = watch("totalEnds")

  const getSubCategoriesByCategory = (categoryName: string) => {
    return subCategories?.filter((sc: any) =>
      sc.categoryName === categoryName && sc.activeFlag === true
    ) || [];
  };

  const selvedgeOptions = useMemo(() => {
    if (Array.isArray(subCategoryBySelvedgeList) && subCategoryBySelvedgeList.length > 0) {
      return subCategoryBySelvedgeList
    }
    return getSubCategoriesByCategory("Selvedge")
  }, [subCategoryBySelvedgeList, subCategories])

  const resolveSelvedgeValue = (value: any) => {
    if (value === undefined || value === null || value === "") {
      return ""
    }
    const options = selvedgeOptions
    const valueStr = String(value)
    const matchById = options.find((option: any) => String(option.id) === valueStr)
    if (matchById) {
      return String(matchById.id)
    }
    const matchByName = options.find(
      (option: any) => option.subCategoryName?.toLowerCase() === valueStr.toLowerCase(),
    )
    if (matchByName) {
      return String(matchByName.id)
    }
    return valueStr
  }

  // Auto-set reedspace based on fabricWidth
  useEffect(() => {
    if (watchFabricWidth) {
      const widthNum = parseFloat(watchFabricWidth);
      if (!isNaN(widthNum)) {
        setValue("reedspace", (widthNum + 3).toFixed(2));
      }
    }
  }, [watchFabricWidth, setValue]);

  useEffect(() => {
    const dents = Number.parseFloat(watchSelvedgeDents) || 0
    const endsPerDent = Number.parseFloat(watchSelvedgeEndsPerDent) || 0
    const selvedgeEnds = dents * endsPerDent
    setValue("selvedgeEnds", selvedgeEnds.toString())
  }, [watchSelvedgeDents, watchSelvedgeEndsPerDent, setValue])

  useEffect(() => {
    const reedspace = Number.parseFloat(watchReadspace) || 0
    const onTableEpi = Number.parseFloat(watchOnTableEpi) || 0
    const selvedgeEnds = Number.parseFloat(watchSelvedgeEnds) || 0
    const totalEnds = (reedspace * onTableEpi) + selvedgeEnds
    setValue("totalEnds", totalEnds.toString())
  }, [watchReadspace, watchOnTableEpi, watchSelvedgeEnds, setValue])

  useEffect(() => {
    if (modalMode === "add" || !watch("onLoomEpi")) {
      setValue("onLoomEpi", watchOnTableEpi || "")
    }
  }, [watchOnTableEpi, modalMode, setValue])

  const handleAddTestingRequirement = () => {
    setTestingRequirementDetails([
      ...testingRequirementDetails,
      { id: testingRequirementDetails.length + 1, testingParameter: "", stdValue: "" },
    ])
  }

  const handleDeleteTestingRequirement = (id: number) => {
    setTestingRequirementDetails((prev) => prev.filter((item) => item.id !== id))
  }

  const shouldShowGreigeCode = modalMode === "edit" ? originalFabricType !== "1" : watch("fabricType") !== "1"

  // Destructure register for fabricName
  const { onChange: nameOnChange, onBlur: nameOnBlur, ref: nameRef, name: nameName } = register("fabricName")

  const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    nameOnChange(e)
    const value = e.target.value
    const filtered = fabricMasterList.filter((f: any) =>
      f.fabricName.toLowerCase().includes(value.toLowerCase())
    )
    setNameSuggestions(filtered)
    setShowNameSuggestions(!!(value && filtered.length > 0))
    if (filtered.length > 0) {
      setActiveNameIndex(0)
    }
  }

  const handleNameFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value) {
      const filtered = fabricMasterList.filter((f: any) =>
        f.fabricName.toLowerCase().includes(value.toLowerCase())
      )
      setNameSuggestions(filtered)
      setShowNameSuggestions(true)
      if (filtered.length > 0) {
        setActiveNameIndex(0)
      }
    }
  }

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showNameSuggestions) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveNameIndex((prev) => (prev + 1) % nameSuggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveNameIndex((prev) => (prev - 1 + nameSuggestions.length) % nameSuggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeNameIndex >= 0 && activeNameIndex < nameSuggestions.length) {
        selectNameSuggestion(nameSuggestions[activeNameIndex])
      }
    } else if (e.key === 'Escape') {
      setShowNameSuggestions(false)
    }
  }

  const selectNameSuggestion = (item: any) => {
    // Use setValue with shouldValidate and shouldDirty options
    setValue('fabricName', item.fabricName, { shouldValidate: true, shouldDirty: true })
    setValue('fabricCode', item.fabricCode, { shouldValidate: true, shouldDirty: true })

    // Also update any other fields you want to pre-fill
    if (item.weave) setValue('weave', String(item.weave), { shouldValidate: true, shouldDirty: true })
    if (item.fabricQuality) setValue('fabricQuality', item.fabricQuality, { shouldValidate: true, shouldDirty: true })
    if (item.gsm) setValue('gsm', item.gsm.toString(), { shouldValidate: true, shouldDirty: true })
    if (item.glm) setValue('glm', item.glm.toString(), { shouldValidate: true, shouldDirty: true })

    setShowNameSuggestions(false)
    setActiveNameIndex(-1)
  }

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    nameOnBlur(e)
    setTimeout(() => {
      setShowNameSuggestions(false)
    }, 200)

    // Optional: Auto-select exact match on blur
    const value = watch('fabricName')
    if (value) {
      const exact = fabricMasterList.find((f: any) =>
        f.fabricName.toLowerCase() === value.toLowerCase()
      )
      if (exact) {
        selectNameSuggestion(exact)
      }
    }
  }

  // Destructure register for fabricCode
  const { onChange: codeOnChange, onBlur: codeOnBlur, ref: codeRef, name: codeName } = register("fabricCode", {
    required: "Sort No is required",
    validate: (value) => {
      if (!value) return true;
      const isDuplicate = (fabricMasterList || []).some(
        (f: any) =>
          f.fabricCode?.trim().toLowerCase() === value.trim().toLowerCase() &&
          (modalMode === "add" || String(f.id) !== String(currentfabric?.id))
      );
      return isDuplicate ? "Fabric code already exist" : true;
    }
  })

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
    setValue('fabricName', item.fabricName, { shouldValidate: true, shouldDirty: true })

    // Also update any other fields you want to pre-fill
    if (item.weave) setValue('weave', String(item.weave), { shouldValidate: true, shouldDirty: true })
    if (item.fabricQuality) setValue('fabricQuality', item.fabricQuality, { shouldValidate: true, shouldDirty: true })
    if (item.gsm) setValue('gsm', item.gsm.toString(), { shouldValidate: true, shouldDirty: true })
    if (item.glm) setValue('glm', item.glm.toString(), { shouldValidate: true, shouldDirty: true })

    setShowCodeSuggestions(false)
    setActiveCodeIndex(-1)
  }

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
    setTestingRequirementDetails([])
    // Clear suggestion states
    setShowNameSuggestions(false)
    setNameSuggestions([])
    setActiveNameIndex(-1)
    setShowCodeSuggestions(false)
    setCodeSuggestions([])
    setActiveCodeIndex(-1)
    reset({
      fabricType: "1", // Default to Greige
      fabricCode: "",
      fabricName: "",
      content: "",
      wovenFabricId: null,
      fabricCategoryId: "",
      weave: "",
      fabricQuality: "",
      fabricWidth: "",
      cutWidth: "",
      reedspace: "",
      onTableEpi: "",
      onLoomEpi: "",
      ppi: "",
      greigeCode: "",
      selvedgeName: "",
      selvedgeDents: "",
      selvedgeEndsPerDent: "",
      selvedgeEnds: "",
      totalEnds: "",
      gsm: "",
      glm: "",
      igst: "",
      cgst: "",
      sgst: "",
      status: "Active",
      imageUrl: "",
      testingDetails: [],
      taxId: "1", // Default to GST
    })
    setIsModalOpen(true)
  }

  const handleEdit = (fabric: any) => {
    console.log("fabricdetails", fabric)
    setModalMode("edit")
    setCurrentfabric(fabric)
    setOriginalFabricType(fabric.fabricType ? String(fabric.fabricType) : "")

    setFabricImage(fabric.imageUrl)

    if (fabric.testingRequirementDetails && Array.isArray(fabric.testingRequirementDetails)) {
      setTestingRequirementDetails([...fabric.testingRequirementDetails])
    } else {
      setTestingRequirementDetails([])
    }

    const taxIdFromData = fabric.taxType ? String(fabric.taxType) : "1" // Default to GST if not provided

    reset({
      id: fabric.id,
      fabricType: fabric.fabricType ? String(fabric.fabricType) : "",
      wovenFabricId: fabric.wovenFabricId ? String(fabric.wovenFabricId) : "",
      fabricCategoryId: fabric.fabricCategoryId ? String(fabric.fabricCategoryId) : "",
      fabricCode: fabric.fabricCode,
      fabricName: fabric.fabricName,
      content: fabric.content,
      weave: fabric.weave ? String(fabric.weave) : "",
      fabricQuality: fabric.fabricQuality,
      fabricWidth: fabric.fabricWidth?.toString() || "",
      cutWidth: fabric.cutWidth?.toString() || "",
      reedspace: fabric.reedspace?.toString() || "",
      onTableEpi: fabric.onTableEpi?.toString() || "",
      onLoomEpi: fabric.onLoomEpi?.toString() || "",
      ppi: fabric.ppi?.toString() || "",
      greigeCode: fabric.fabricType === 1 ? "" : fabric.greigeCode || "",
      selvedgeName: resolveSelvedgeValue(fabric.selvedgeName),
      selvedgeDents: fabric.selvedgeDents?.toString() || "",
      selvedgeEndsPerDent: fabric.selvedgeEndsPerDent?.toString() || "",
      selvedgeEnds: fabric.selvedgeEnds?.toString() || "",
      totalEnds: fabric.totalEnds?.toString() || "",
      gsm: fabric.gsm?.toString() || "",
      glm: fabric.glm?.toString() || "",
      igst: fabric.igst?.toString() || "",
      cgst: fabric.cgst?.toString() || "",
      sgst: fabric.sgst?.toString() || "",
      status: fabric.status || "Active",
      imageUrl: fabric.imageUrl,
      testingDetails: fabric.testingRequirementDetails || [],
      taxId: taxIdFromData,
    })

    const existingGstPercent = (() => {
      const fromPercent = Number(fabric.gstPercent)
      if (Number.isFinite(fromPercent) && fromPercent > 0) {
        return fromPercent
      }
      const igstValue = Number(fabric.igst)
      if (Number.isFinite(igstValue) && igstValue > 0) {
        return igstValue
      }
      const cgstValue = Number(fabric.cgst)
      const sgstValue = Number(fabric.sgst)
      const combined = (Number.isFinite(cgstValue) ? cgstValue : 0) + (Number.isFinite(sgstValue) ? sgstValue : 0)
      if (combined > 0) {
        return combined
      }
      return 0
    })()
    const taxType = fabric.taxType ?? 1

    let matchingId = ""
    const matchingEntry = Object.entries(gstIdToPercent).find(([id, p]) => p === existingGstPercent)
    if (matchingEntry) {
      matchingId = matchingEntry[0]
    }

    setSelectedGstDropdownId(matchingId)
    nextPrefillGstIdRef.current = matchingId || null
    isPrefillingTaxRef.current = true
    setValue("taxId", String(taxType))

    // Set selected fabric type and corresponding wovenFabricId
    const fabricTypeNum = fabric.fabricType
    if (fabricTypeNum) {
      setSelectedFabricType(String(fabricTypeNum))
      if (fabricTypeNum === 2) {
        setSelectedGreige(fabric.wovenFabricId ? String(fabric.wovenFabricId) : "")
      } else if (fabricTypeNum === 3) {
        setSelectedFinished(fabric.wovenFabricId ? String(fabric.wovenFabricId) : "")
      }
    } else {
      setSelectedFabricType("1") // Default to Greige if fabricType is missing
    }

    const selectedWovenFabricId = fabric.wovenFabricId ? String(fabric.wovenFabricId) : ""
    if ((fabric.fabricType === 2 || fabric.fabricType === 3) && selectedWovenFabricId) {
      handleGreigeSelection(selectedWovenFabricId, String(fabric.fabricType ?? ""))
    }

    // Clear suggestion states
    setShowNameSuggestions(false)
    setNameSuggestions([])
    setActiveNameIndex(-1)
    setShowCodeSuggestions(false)
    setCodeSuggestions([])
    setActiveCodeIndex(-1)

    setIsModalOpen(true)
  }

  const handleDelete = (fabric: any) => {
    setCurrentfabric(fabric)
    setIsDeleteModalOpen(true)
  }

  const handleView = (fabric: any) => {
    setCurrentfabric(fabric)
    setIsViewModalOpen(true)
  }

  const onSubmit = async (data: fabricFormData) => {
    try {
      console.log("Form data submitted:", data)

      let igst = 0
      let cgst = 0
      let sgst = 0
      let gstPercent = null
      const numericTaxId = data.taxId ? Number.parseInt(data.taxId) : 1 // Default to 1 (GST)

      if (selectedGstDropdownId) {
        const rates = gstIdToRates[selectedGstDropdownId]
        if (rates) {
          gstPercent = rates.total
          if (numericTaxId === 2) {
            igst = rates.igst || rates.total
          } else if (numericTaxId === 1) {
            const cgstRate = rates.cgst || (rates.total ? rates.total / 2 : 0)
            const sgstRate = rates.sgst || (rates.total ? rates.total / 2 : 0)
            cgst = cgstRate
            sgst = sgstRate
          }
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

      let existingFabricData: any = currentfabric

      if (modalMode === "edit" && data.id) {
        try {
          const detailResponse = await dispatch(getFabricMasterById(Number(data.id))).unwrap()
          existingFabricData = detailResponse?.data ?? detailResponse ?? currentfabric
        } catch (error) {
          console.error("Failed to fetch existing fabric master details before update", error)
        }
      }

      const preservedWarpDetails = Array.isArray(existingFabricData?.warpDetails) ? existingFabricData.warpDetails : []
      const preservedWeftDetails = Array.isArray(existingFabricData?.weftDetails) ? existingFabricData.weftDetails : []

      const formData = {
        id: data.id !== undefined ? data.id : null,
        fabricType: data.fabricType ? Number.parseInt(data.fabricType) : null,
        wovenFabricId: data.wovenFabricId ? Number.parseInt(data.wovenFabricId) : null,
        fabricCategoryId: data.fabricCategoryId ? Number.parseInt(data.fabricCategoryId) : null,
        fabricCode: data.fabricCode,
        fabricName: data.fabricName,
        content: data.content,
        weave: data.weave ? Number.parseInt(data.weave) : null,
        fabricQuality: data.fabricQuality,

        // NEW FIELDS - Convert to appropriate types
        fabricWidth: data.fabricWidth ? Number.parseFloat(data.fabricWidth) : null,
        cutWidth: data.cutWidth ? Number.parseFloat(data.cutWidth) : null,
        reedspace: data.reedspace ? Number.parseFloat(data.reedspace) : null,
        onTableEpi: data.onTableEpi ? Number.parseInt(data.onTableEpi) : null,
        onLoomEpi: data.onLoomEpi ? Number.parseInt(data.onLoomEpi) : null,
        selvedgeName: data.selvedgeName,
        selvedgeDents: data.selvedgeDents ? Number.parseInt(data.selvedgeDents) : null,
        selvedgeEndsPerDent: data.selvedgeEndsPerDent ? Number.parseInt(data.selvedgeEndsPerDent) : null,
        selvedgeEnds: data.selvedgeEnds ? Number.parseInt(data.selvedgeEnds) : null,

        ppi: data.ppi ? Number.parseInt(data.ppi) : null,
        greigeCode: data.fabricType === "1" ? "" : data.greigeCode,
        totalEnds: data.totalEnds ? Number.parseInt(data.totalEnds) : null,
        gsm: data.gsm ? Number.parseFloat(data.gsm) : null,
        glm: data.glm ? Number.parseFloat(data.glm) : null,

        // GST fields
        igst: igst,
        cgst: cgst,
        sgst: sgst,
        taxType: numericTaxId,
        gstPercent: gstPercent,

        stdValue: data.stdValue ? Number.parseFloat(data.stdValue) : null,
        fabricImageUrl: fabricImage,
        status: data.status || "Active", // Ensure status is sent

        warpDetails: preservedWarpDetails,
        weftDetails: preservedWeftDetails,
        testingDetails: testingRequirementDetails,
      }

      console.log("Final form data being sent:", formData)

      if (modalMode === "edit") {
        await dispatch(updateFabricMaster(formData))
        // alert(JSON.stringify(formData));
        console.log(formData);
      } else {
        const { id, ...newFabricMasterData } = formData
        await dispatch(createFabricMaster(newFabricMasterData))
      }

      await dispatch(getAllFabricMasters({fetchAll: true}))
      setIsModalOpen(false)
      reset()
      setTestingRequirementDetails([])
      setFabricImage(null)
      setModalMode("add")
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  const confirmDelete = async () => {
    if (!currentfabric) return

    try {
      await dispatch(deleteFabricMaster(currentfabric.id)).unwrap()
      await dispatch(getAllFabricMasters({fetchAll: true}))
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

  const handleFabricTypeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setSelectedFabricType(value)
    setValue("fabricType", value)
    setSelectedGreige("")
    setSelectedFinished("")

    const numericValue = Number.parseInt(value, 10)

    if (!isNaN(numericValue) && (numericValue === 1 || numericValue === 2 || numericValue === 3)) {
      const sourceId = numericValue === 2 ? 1 : numericValue === 3 ? 2 : numericValue
      await dispatch(getAllFabricMasterDetails({ id: sourceId }))
    } else if (value === "") {
      setValue("wovenFabricId", "")
    }
  }

  // Use the selectedTaxId from form state or default to '1' (GST)
  const selectedTaxId = watch("taxId") || "1"

  useEffect(() => {
    // This effect is for initial load or when modalMode changes to 'add'
    // It ensures igst is cleared when taxId might be '1' (GST)
    // It's placed here to run after reset() is called in handleAdd
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
    const rates = gstIdToRates[prefillId]

    if (selectedTaxId === "1") {
      const cgstRate = rates?.cgst ?? (rates?.total ? rates.total / 2 : 0)
      const sgstRate = rates?.sgst ?? (rates?.total ? rates.total / 2 : 0)
      setValue("cgst", cgstRate ? String(cgstRate) : "")
      setValue("sgst", sgstRate ? String(sgstRate) : "")
      setValue("igst", "")
    } else if (selectedTaxId === "2") {
      const igstRate = rates?.igst ?? rates?.total ?? 0
      setValue("igst", igstRate ? String(igstRate) : "")
      setValue("cgst", "")
      setValue("sgst", "")
    } else {
      setValue("igst", "")
      setValue("cgst", "")
      setValue("sgst", "")
    }

    isPrefillingTaxRef.current = false
  }, [selectedTaxId, setValue, gstIdToRates])

  // Function to safely convert any value to a number, returning 0 if NaN
  const toNumber = (v: any) => {
    const n = Number.parseFloat(String(v))
    return isNaN(n) ? 0 : n
  }


  return (
    <div className={embedded ? "" : "p-6 pt-16"}>
      <div className="mb-4">
       
        <div className="flex space-x-2 flex-wrap">
          {/* {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleClick(option.value)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition
              ${selectedFilter === option.value
                  ? "bg-blue-600 text-white border-blue-600 shadow"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
            >
              {option.label}
            </button>
          ))} */}
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleClick(option.value)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition 
    ${selectedFilter === option.value
                  ? selectedClass
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <DataTable
        columns={columns}
        data={processedCityList}
        title="Quality Master"
        onAdd={handleAdd}
        onEdit={handleEdit}
        // onDelete={handleDelete}
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
              {modalMode === "add" ? "Add Quality" : "Update Quality"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                fill="currentColor"
                onClick={() => setIsModalOpen(false)}
                className="bi bi-x cursor-pointer"
                viewBox="0 0 16 16"
              >
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
              </svg>
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="p-6 bg-white shadow rounded-lg">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fabric Type <span className="text-red-600">*</span>
                    </label>

                    <CommonSearchableSelect
                      options={(fabricTypeList || []).map((fabricType: any) => ({
                        value: String(fabricType.id),
                        label: fabricType.fabricTypeName
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

                  {/* {(selectedFabricType === "2" || selectedFabricType === "3") && (
                    <div>
                      <label className="block">
                        {selectedFabricType === "3" ? "Select Finished" : "Select Greige"}
                      </label>
                      <select
                        {...register("wovenFabricId")}
                        value={selectedFabricType === "3" ? selectedFinished : selectedGreige}
                        onChange={(e) => handleGreigeSelection(e.target.value)}
                        className="input mt-1"
                      >
                        <option value="">
                          {selectedFabricType === "3" ? "Select Finished" : "Select Greige"}
                        </option>
                        {dropdownOptions.map((item: any) => (
                          <option key={item.id} value={String(item.id)}>
                            {item.fabricCode} - {item.fabricQuality || "N/A"}
                            {item.fabricName ? ` (${item.fabricName})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )} */}

                  {(selectedFabricType === "2" || selectedFabricType === "3") && (
                    <div>
                      <label className="block">
                        {selectedFabricType === "3" ? "Select Finished" : "Select Greige"}
                      </label>

                      <CommonSearchableSelect
                        options={dropdownOptions.map((item: any) => ({
                          value: String(item.id),
                          label: `${item.fabricCode} - ${item.fabricQuality || "N/A"}${item.fabricName ? ` (${item.fabricName})` : ""
                            }`
                        }))}
                        placeholder={selectedFabricType === "3" ? "Select Finished" : "Select Greige"}
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
                  )}
                  {/* <div>
                    <label className="block">
                      Fabric Category
                    </label>

                    <CommonSearchableSelect
                      options={(fabricCategoryList || []).map((fabricCategory: any) => ({
                        value: String(fabricCategory.id),
                        label: fabricCategory.fabricCategoryName
                      }))}
                      placeholder="Select a Fabric Category"
                      {...register("fabricCategoryId")}
                    />
                  </div> */}
                  <div className="relative">
                    <label className="block">Sort No <span className="text-red-500">*</span></label>
                    <input
                      {...register("fabricCode", {
                        required: "Sort No is required",
                        validate: (value) => {
                          if (!value) return true;
                          const isDuplicate = (fabricMasterList || []).some(
                            (f: any) =>
                              f.fabricCode?.trim().toLowerCase() === value.trim().toLowerCase() &&
                              (modalMode === "add" || String(f.id) !== String(currentfabric?.id))
                          );
                          return isDuplicate ? "Fabric code already exist" : true;
                        }
                      })}
                      placeholder="Enter Sort No"
                      className="input mt-1"
                      onChange={handleCodeInputChange}
                      onFocus={handleCodeFocus}
                      onBlur={handleCodeBlur}
                      onKeyDown={handleCodeKeyDown}
                      autoComplete="off"
                    />
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
                              {item.fabricCode} - {item.fabricQuality}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* <div className="relative">
                    <label className="block">Fabric Name</label>
                    <input
                      {...register("fabricName")}
                      placeholder="Enter Fabric Name"
                      className="input mt-1"
                      onChange={handleNameInputChange}
                      onFocus={handleNameFocus}
                      onBlur={handleNameBlur}
                      onKeyDown={handleNameKeyDown}
                      autoComplete="off"
                    />
                    {showNameSuggestions && (
                      <div className="absolute z-10 bg-white border rounded shadow-lg w-full mt-1 max-h-40 overflow-y-auto">
                        <ul>
                          {nameSuggestions.map((item: any, idx: number) => (
                            <li
                              key={item.id}
                              onMouseEnter={() => setActiveNameIndex(idx)}
                              className={`p-2 hover:bg-gray-100 cursor-pointer ${idx === activeNameIndex ? 'bg-gray-200' : ''}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                selectNameSuggestion(item);
                              }}
                              onMouseDown={(e) => e.preventDefault()} // Prevent input blur before click
                            >
                              {item.fabricName} - {item.fabricCode}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div> */}
                  <div>
                    <label className="block">Content</label>
                    <input {...register("content")} placeholder="Enter Content" className="input mt-1" />
                  </div>
                  <div>
                    <label className="block">
                      Weave
                    </label>

                    <CommonSearchableSelect
                      options={(getSubCategoriesByCategory("Weave") || []).map((weaveType: any) => ({
                        value: String(weaveType.id),
                        label: weaveType.subCategoryName
                      }))}
                      placeholder="Select a Weave"
                      {...register("weave")}
                    />
                  </div>
                  <div>
                    <label className="block">Construction</label>
                    <input
                      {...register("fabricQuality")}
                      placeholder="Enter Construction"
                      className="input mt-1"
                    />
                  </div>

                  <div>
                    <label className="block">Fabric Width</label>
                    <input
                      {...register("fabricWidth")}
                      type="number"
                      step="0.01"
                      placeholder="Enter Fabric Width"
                      className="input mt-1"
                    />
                  </div>

                  <div>
                    <label className="block">Cut Width</label>
                    <input
                      {...register("cutWidth")}
                      type="number"
                      step="0.01"
                      placeholder="Enter Cut Width"
                      className="input mt-1"
                    />
                  </div>

                  <div>
                    <label className="block">Reedspace</label>
                    <input
                      {...register("reedspace")}
                      type="number"
                      step="0.01"
                      placeholder="Enter Readspace"
                      className="input mt-1"
                    />
                  </div>

                  <div>
                    <label className="block">On Table EPI</label>
                    <input
                      {...register("onTableEpi")}
                      type="number"
                      placeholder="Enter On Table EPI"
                      className="input mt-1"
                    />
                  </div>

                  <div>
                    <label className="block">On Loom EPI</label>
                    <input
                      {...register("onLoomEpi")}
                      type="number"
                      placeholder="Enter On Loom EPI"
                      className="input mt-1"
                    />
                  </div>

                  <div>
                    <label className="block">PPI</label>
                    <input
                      {...register("ppi")}
                      type="number"
                      placeholder="Enter PPI"
                      className="input mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Selvedge Name
                    </label>

                    <CommonSearchableSelect
                      options={(selvedgeOptions || []).map((selvedgeType: any) => ({
                        value: String(selvedgeType.id),
                        label: selvedgeType.subCategoryName
                      }))}
                      placeholder="Select Selvedge Name"
                      {...register("selvedgeName")}
                      error={errors.selvedgeName?.message as string}
                    />
                  </div>

                  <div>
                    <label className="block">Selvedge Dents</label>
                    <input
                      {...register("selvedgeDents")}
                      type="number"
                      placeholder="Enter Selvedge Dents"
                      className="input mt-1"
                    />
                  </div>

                  <div>
                    <label className="block">Selvedge Ends/Dent</label>
                    <input
                      {...register("selvedgeEndsPerDent")}
                      type="number"
                      placeholder="Enter Selvedge Ends/Dent"
                      className="input mt-1"
                    />
                  </div>

                  <div>
                    <label className="block">Selvedge Ends</label>
                    <input
                      {...register("selvedgeEnds")}
                      type="number"
                      placeholder="Calculated automatically"
                      className="input mt-1 bg-gray-100"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block">Total Ends</label>
                    <input
                      {...register("totalEnds")}
                      type="number"
                      placeholder="Enter Total Ends"
                      className="input mt-1"
                    />
                  </div>

                  <div>
                    <label className="block">GSM</label>
                    <input
                      {...register("gsm")}
                      type="number"
                      step="0.0001"
                      placeholder="Calculated automatically"
                      className="input mt-1"

                    />
                  </div>
                  <div>
                    <label className="block">GLM</label>
                    <input
                      {...register("glm")}
                      type="number"
                      step="0.0001"
                      placeholder="Enter Glm"
                      className="input mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-700">
                      IGST %
                    </label>

                    <CommonSearchableSelect
                      options={(normalizedGstList || []).map((gstOption: any) => ({
                        value: String(gstOption.id),
                        label: gstOption.label
                      }))}
                      placeholder="Select IGST %"
                      value={selectedGstDropdownId}
                      onChange={(id: string) => {
                        setSelectedGstDropdownId(id)

                        nextPrefillGstIdRef.current = null
                        isPrefillingTaxRef.current = false

                        const rates = gstIdToRates[id]
                        const totalPercent = rates?.total ?? 0

                        if (selectedTaxId === "1") {
                          const cgstRate = rates?.cgst ?? (totalPercent ? totalPercent / 2 : 0)
                          const sgstRate = rates?.sgst ?? (totalPercent ? totalPercent / 2 : 0)

                          setValue("cgst", cgstRate ? String(cgstRate) : "")
                          setValue("sgst", sgstRate ? String(sgstRate) : "")
                          setValue("igst", "")
                        } else if (selectedTaxId === "2") {
                          const igstRate = rates?.igst ?? totalPercent

                          setValue("igst", igstRate ? String(igstRate) : "")
                          setValue("cgst", "")
                          setValue("sgst", "")
                        }
                      }}
                    />
                  </div>

                  {selectedTaxId === "1" && ( // Show CGST & SGST only if Tax Type is GST
                    <>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">CGST %</label>
                        <input {...register("cgst")} placeholder="CGST %" className="input mt-1 bg-gray-100" readOnly />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">SGST %</label>
                        <input {...register("sgst")} placeholder="SGST %" className="input mt-1 bg-gray-100" readOnly />
                      </div>
                    </>
                  )}
                  {selectedTaxId === "2" && ( // Show IGST only if Tax Type is IGST
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">IGST %</label>
                      <input {...register("igst")} placeholder="IGST %" className="input mt-1 bg-gray-100" readOnly />
                    </div>
                  )}
                </div>

                {/* Testing Requirements */}
                {/* <div className="mt-10">
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
                </div> */}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalMode === "add" ? "Add Quality" : "Update Quality"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* View Modal */}
      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Quality Details">
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
          <p>Are you sure you want to delete Quality?</p>

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