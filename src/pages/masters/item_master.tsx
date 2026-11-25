import { useEffect, useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/state/store"
import {
  createItemMaster,
  updateItemMaster,
  getAllItemMasters,
} from "@/state/itemSlice"
import { getAllUomMaster } from "@/state/uomMasterSlice"
import { getSubCategoryByCategory } from "@/state/subCategorySlice"
import { useNavigate, useLocation } from "react-router-dom"
import React from "react"
import { ArrowLeft, Upload, X, Image as ImageIcon, Eye, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect"

interface ItemFormData {
  id?: number | null
  itemName: string
  itemCode?: string
  department: string
  itemCategory?: string
  hsnCode?: string
  uomId: string
  activeFlag: boolean
  igst?: string
  cgst?: string
  sgst?: string
  imageUrl?: string
}

const gstOptionList = [
  { id: 1, name: 0 },
  { id: 2, name: 5 },
  { id: 3, name: 12 },
  { id: 4, name: 18 },
  { id: 5, name: 28 }
];

const gstIdToPercent: Record<string, number> = { '1': 0, '2': 5, '3': 12, '4': 18, '5': 28 };

export default function ItemMasterForm() {
  const [isEditMode, setIsEditMode] = useState(false)
  const [serverErrors, setServerErrors] = useState<{ [key: string]: string }>({})
  const [selectedGstDropdownId, setSelectedGstDropdownId] = useState<string>('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const location = useLocation()

  const { uomList } = useSelector((state: RootState) => state.uom)
  const { itemList } = useSelector((state: RootState) => state.itemMaster)
  const { subCategoryByCategoryList } = useSelector((state: RootState) => state.subCategory)

  const departmentOptions = useMemo(() => {
    const list = Array.isArray(subCategoryByCategoryList) ? subCategoryByCategoryList : [];
    return list.map((item: any) => ({
      value: String(item.subCategoryName || item.name || ''),
      label: String(item.subCategoryName || item.name || ''),
      activeFlag: item.activeFlag ?? true,
    }));
  }, [subCategoryByCategoryList]);

  // Suggestion states for Item Name
  const [showNameSuggestions, setShowNameSuggestions] = useState(false)
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([])
  const [activeNameIndex, setActiveNameIndex] = useState(-1)

  // Suggestion states for Department
  const [showDeptSuggestions, setShowDeptSuggestions] = useState(false)
  const [deptSuggestions, setDeptSuggestions] = useState<string[]>([])
  const [activeDeptIndex, setActiveDeptIndex] = useState(-1)

  // Suggestion states for Item Category
  const [showCatSuggestions, setShowCatSuggestions] = useState(false)
  const [catSuggestions, setCatSuggestions] = useState<string[]>([])
  const [activeCatIndex, setActiveCatIndex] = useState(-1)

  // Suggestion states for Item Code
  const [showCodeSuggestions, setShowCodeSuggestions] = useState(false)
  const [codeSuggestions, setCodeSuggestions] = useState<string[]>([])
  const [activeCodeIndex, setActiveCodeIndex] = useState(-1)

  const uniqueItemNames = useMemo((): string[] => {
    const names = itemList?.map((item: any) => item.itemName).filter(Boolean) || []
    return [...new Set(names)] as string[]
  }, [itemList])

  const uniqueDepartments = useMemo((): string[] => {
    const deps = itemList?.map((item: any) => item.department).filter(Boolean) || []
    return [...new Set(deps)] as string[]
  }, [itemList])

  const uniqueCategories = useMemo((): string[] => {
    const cats = itemList?.map((item: any) => item.itemCategory).filter(Boolean) || []
    return [...new Set(cats)] as string[]
  }, [itemList])

  const uniqueItemCodes = useMemo((): string[] => {
    const codes = itemList?.map((item: any) => item.itemCode).filter(Boolean) || []
    return [...new Set(codes)] as string[]
  }, [itemList])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<ItemFormData>({
    mode: "onChange",
    defaultValues: {
      activeFlag: true
    }
  })

  // Universal handler generator for suggestions
  const createSuggestionHandlers = (
    fieldName: keyof ItemFormData,
    uniqueList: string[],
    setShow: (val: boolean) => void,
    setSuggestions: (list: string[]) => void,
    setActiveIndex: (idx: number) => void,
    activeIndex: number,
    suggestions: string[],
    showSuggestions: boolean
  ) => {
    return {
      onInput: (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const filtered = uniqueList.filter(item =>
          item.toLowerCase().includes(value.toLowerCase())
        )
        setSuggestions(filtered)
        setShow(!!(value && filtered.length > 0))
        if (filtered.length > 0) setActiveIndex(0)
      },
      onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (value) {
          const filtered = uniqueList.filter(item =>
            item.toLowerCase().includes(value.toLowerCase())
          )
          setSuggestions(filtered)
          setShow(filtered.length > 0)
          if (filtered.length > 0) setActiveIndex(0)
        }
      },
      onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
        setTimeout(() => setShow(false), 200)
      },
      onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions) return
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setActiveIndex((activeIndex + 1) % suggestions.length)
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setActiveIndex((activeIndex - 1 + suggestions.length) % suggestions.length)
        } else if (e.key === 'Enter') {
          if (activeIndex >= 0 && activeIndex < suggestions.length) {
            e.preventDefault()
            setValue(fieldName, suggestions[activeIndex], { shouldValidate: true, shouldDirty: true })
            setShow(false)
          }
        } else if (e.key === 'Escape') {
          setShow(false)
        }
      },
      selectSuggestion: (val: string) => {
        setValue(fieldName, val, { shouldValidate: true, shouldDirty: true })
        setShow(false)
        setActiveIndex(-1)
      }
    }
  }

  const nameHandlers = createSuggestionHandlers(
    'itemName',
    uniqueItemNames,
    setShowNameSuggestions,
    setNameSuggestions,
    setActiveNameIndex,
    activeNameIndex,
    nameSuggestions,
    showNameSuggestions
  )

  const deptHandlers = createSuggestionHandlers(
    'department',
    uniqueDepartments,
    setShowDeptSuggestions,
    setDeptSuggestions,
    setActiveDeptIndex,
    activeDeptIndex,
    deptSuggestions,
    showDeptSuggestions
  )

  const catHandlers = createSuggestionHandlers(
    'itemCategory',
    uniqueCategories,
    setShowCatSuggestions,
    setCatSuggestions,
    setActiveCatIndex,
    activeCatIndex,
    catSuggestions,
    showCatSuggestions
  )

  const codeHandlers = createSuggestionHandlers(
    'itemCode',
    uniqueItemCodes,
    setShowCodeSuggestions,
    setCodeSuggestions,
    setActiveCodeIndex,
    activeCodeIndex,
    codeSuggestions,
    showCodeSuggestions
  )

  useEffect(() => {
    if (selectedGstDropdownId) {
      const igstVal = gstIdToPercent[selectedGstDropdownId] ?? 0;
      const halved = (igstVal / 2).toString();
      setValue("igst", igstVal.toString(), { shouldValidate: true, shouldDirty: true });
      setValue("cgst", halved);
      setValue("sgst", halved);
    } else {
      setValue("igst", "");
      setValue("cgst", "");
      setValue("sgst", "");
    }
  }, [selectedGstDropdownId, setValue]);

  useEffect(() => {
    dispatch(getAllUomMaster({ fetchAll: true }))
    dispatch(getAllItemMasters({ fetchAll: true }))
    dispatch(getSubCategoryByCategory({ categoryName: 'Department', fetchAll: true }))
  }, [dispatch])

  useEffect(() => {
    const itemData = location.state?.item
    if (itemData) {
      setIsEditMode(true)

      let uomId = itemData.uomId ? String(itemData.uomId) : ""

      // If uomId is missing but uomName is present, find the ID from uomList
      if (!uomId && itemData.uomName && uomList) {
        const uom = uomList.find((u: any) => u.uomName === itemData.uomName)
        if (uom) {
          uomId = String(uom.id)
        }
      }

      // Find matching GST ID for the dropdown
      const igstFromData = itemData.igst ?? null;
      if (igstFromData !== null && igstFromData !== undefined) {
        const matchingEntry = Object.entries(gstIdToPercent).find(([_, p]) => p === igstFromData);
        if (matchingEntry) {
          setSelectedGstDropdownId(matchingEntry[0]);
        }
      }

      const existingImg = itemData.imageUrl || itemData.image || itemData.itemImage || "";
      if (existingImg) {
        setImagePreview(existingImg);
      }

      reset({
        itemName: itemData.itemName || "",
        itemCode: itemData.itemCode || "",
        department: itemData.department || "",
        itemCategory: itemData.itemCategory || "",
        hsnCode: itemData.hsnCode || "",
        uomId: uomId,
        activeFlag: itemData.activeFlag ?? true,
        igst: itemData.igst !== null && itemData.igst !== undefined ? String(itemData.igst) : "",
        cgst: itemData.cgst !== null && itemData.cgst !== undefined ? String(itemData.cgst) : "",
        sgst: itemData.sgst !== null && itemData.sgst !== undefined ? String(itemData.sgst) : "",
        imageUrl: existingImg,
      })
    }
  }, [location.state, reset, uomList])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setValue("imageUrl", base64String, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setValue("imageUrl", "", { shouldDirty: true });
  };

  const onSubmit = async (data: ItemFormData) => {
    const selectedUom = uomList?.find((uom: any) => String(uom.id) === String(data.uomId))
    const payload = {
      ...data,
      itemCode: data.itemCode?.trim() || "",
      itemCategory: data.itemCategory?.trim() || "",
      hsnCode: data.hsnCode?.trim() || "",
      uomId: Number(data.uomId),
      uomName: selectedUom?.uomName || "",
      igst: data.igst !== "" && data.igst !== undefined && data.igst !== null ? Number(data.igst) : null,
      cgst: data.cgst !== "" && data.cgst !== undefined && data.cgst !== null ? Number(data.cgst) : null,
      sgst: data.sgst !== "" && data.sgst !== undefined && data.sgst !== null ? Number(data.sgst) : null,
      imageUrl: data.imageUrl || imagePreview || "",
      id: isEditMode ? location.state?.item?.id : undefined,
    }

    try {
      setServerErrors({})

      if (isEditMode) {
        await dispatch(updateItemMaster(payload)).unwrap()
      } else {
        await dispatch(createItemMaster(payload)).unwrap()
      }

      navigate("/masters/item-master-detail")
    } catch (error: any) {
      console.error("Failed to save item:", error)

      const serverMessage =
        typeof error?.payload === "string"
          ? error.payload
          : error?.payload?.message || error?.message || "An unexpected error occurred"

      if (serverMessage.toLowerCase().includes('item name')) {
        setServerErrors({ itemName: serverMessage })
        setError("itemName", { type: "manual", message: serverMessage }, { shouldFocus: true })
      } else if (serverMessage.toLowerCase().includes('item code')) {
        setServerErrors({ itemCode: serverMessage })
        setError("itemCode", { type: "manual", message: serverMessage }, { shouldFocus: true })
      } else {
        setServerErrors({ general: serverMessage })
      }
    }
  }

  const handleCancel = () => {
    navigate("/masters/item-master-detail")
  }

  return (
    <div className="p-6 pt-16">
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Button onClick={handleCancel} variant="outline" className="mr-auto">
                <ArrowLeft size={18} className="mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-semibold text-gray-800">
                {isEditMode ? "Edit Item" : "Add Item"}
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("itemName", {
                    required: "Item Name is required",
                    validate: (value) => {
                      const trimmedValue = value?.trim();
                      if (isEditMode && trimmedValue?.toLowerCase() === location.state?.item?.itemName?.toLowerCase()) return true;
                      const duplicate = itemList?.some((item: any) => item.itemName?.toLowerCase() === trimmedValue?.toLowerCase());
                      return duplicate ? "Item Name already exists" : true;
                    },
                    onChange: (e) => {
                      if (serverErrors.itemName) {
                        setServerErrors({ ...serverErrors, itemName: '' });
                      }
                      nameHandlers.onInput(e);
                    },
                    onBlur: nameHandlers.onBlur,
                  })}
                  onFocus={nameHandlers.onFocus}
                  onKeyDown={nameHandlers.onKeyDown}
                  autoComplete="off"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter item name"
                />
                {serverErrors.itemName && !errors.itemName && (
                  <p className="text-red-500 text-sm mt-1">{serverErrors.itemName}</p>
                )}
                {showNameSuggestions && (
                  <div className="absolute z-10 bg-white border rounded shadow-lg w-full mt-1 max-h-40 overflow-y-auto">
                    <ul>
                      {nameSuggestions.map((name: string, idx: number) => (
                        <li
                          key={name}
                          onMouseEnter={() => setActiveNameIndex(idx)}
                          className={`p-2 hover:bg-gray-100 cursor-pointer ${idx === activeNameIndex ? 'bg-gray-200' : ''}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            nameHandlers.selectSuggestion(name);
                          }}
                        >
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {errors.itemName && (
                  <p className="text-red-500 text-sm mt-1">{errors.itemName.message}</p>
                )}
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assert No/Item Code
                </label>
                <input
                  {...register("itemCode", {
                    validate: (value) => {
                      const trimmedValue = value?.trim();
                      if (!trimmedValue) return true;
                      if (isEditMode && trimmedValue?.toLowerCase() === location.state?.item?.itemCode?.toLowerCase()) return true;
                      const duplicate = itemList?.some((item: any) => item.itemCode?.toLowerCase() === trimmedValue?.toLowerCase());
                      return duplicate ? "Assert No/Item Code already exists" : true;
                    },
                    onChange: (e) => {
                      if (serverErrors.itemCode) {
                        setServerErrors({ ...serverErrors, itemCode: '' });
                      }
                      codeHandlers.onInput(e);
                    },
                    onBlur: codeHandlers.onBlur,
                  })}
                  onFocus={codeHandlers.onFocus}
                  onKeyDown={codeHandlers.onKeyDown}
                  autoComplete="off"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter Assert No/Item Code"
                />
                {serverErrors.itemCode && !errors.itemCode && (
                  <p className="text-red-500 text-sm mt-1">{serverErrors.itemCode}</p>
                )}
                {showCodeSuggestions && (
                  <div className="absolute z-10 bg-white border rounded shadow-lg w-full mt-1 max-h-40 overflow-y-auto">
                    <ul>
                      {codeSuggestions.map((code: string, idx: number) => (
                        <li
                          key={code}
                          onMouseEnter={() => setActiveCodeIndex(idx)}
                          className={`p-2 hover:bg-gray-100 cursor-pointer ${idx === activeCodeIndex ? 'bg-gray-200' : ''}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            codeHandlers.selectSuggestion(code);
                          }}
                        >
                          {code}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {errors.itemCode && (
                  <p className="text-red-500 text-sm mt-1">{errors.itemCode.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <CommonSearchableSelect
                  className="w-full mt-1"
                  placeholder="Select Department"
                  options={departmentOptions}
                  filterActive
                  value={watch("department") || ""}
                  onValueChange={(val) => setValue("department", val, { shouldValidate: true, shouldDirty: true })}
                  error={errors.department?.message as string}
                />
                <input type="hidden" {...register("department", { required: "Department is required" })} />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Category
                </label>
                <input
                  {...register("itemCategory", {
                    pattern: {
                      value: /^[A-Za-z\s]*$/,
                      message: "Item Category must be alphabetical"
                    },
                    onChange: catHandlers.onInput,
                    onBlur: catHandlers.onBlur,
                  })}
                  onFocus={catHandlers.onFocus}
                  onKeyDown={catHandlers.onKeyDown}
                  autoComplete="off"
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter item category"
                />
                {showCatSuggestions && (
                  <div className="absolute z-10 bg-white border rounded shadow-lg w-full mt-1 max-h-40 overflow-y-auto">
                    <ul>
                      {catSuggestions.map((cat: string, idx: number) => (
                        <li
                          key={cat}
                          onMouseEnter={() => setActiveCatIndex(idx)}
                          className={`p-2 hover:bg-gray-100 cursor-pointer ${idx === activeCatIndex ? 'bg-gray-200' : ''}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            catHandlers.selectSuggestion(cat);
                          }}
                        >
                          {cat}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {errors.itemCategory && (
                  <p className="text-red-500 text-sm mt-1">{errors.itemCategory.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HSN Code
                </label>
                <input
                  {...register("hsnCode")}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter HSN code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UOM <span className="text-red-500">*</span>
                </label>

                <CommonSearchableSelect
                  className="w-full mt-1"
                  placeholder="Select UOM"
                  options={(uomList || []).map((uom: any) => ({
                    value: String(uom.id),
                    label: uom.uomName
                  }))}
                  {...register("uomId", {
                    required: "UOM is required",
                  })}
                  error={errors.uomId?.message as string}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IGST %
                </label>
                <CommonSearchableSelect
                  className="w-full mt-1"
                  placeholder="Select IGST %"
                  options={gstOptionList.map((opt) => ({
                    value: String(opt.id),
                    label: String(opt.name)
                  }))}
                  value={selectedGstDropdownId}
                  onValueChange={(val) => setSelectedGstDropdownId(val)}
                  error={errors.igst?.message as string}
                />
                {/* Hidden input for register to capture igst value */}
                <input type="hidden" {...register("igst")} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CGST %
                </label>
                <input
                  {...register("cgst")}
                  type="text"
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none"
                  placeholder="CGST %"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SGST %
                </label>
                <input
                  {...register("sgst")}
                  type="text"
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none"
                  placeholder="SGST %"
                />
              </div>

              {/* Item Image Upload & Preview Field */}
              <div className="md:col-span-2 border border-dashed border-gray-300 p-4 rounded-md bg-gray-50/50">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Image Upload & Preview
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {imagePreview ? (
                    <div
                      onClick={() => setIsPreviewModalOpen(true)}
                      className="relative w-32 h-32 border border-gray-300 rounded-md overflow-hidden bg-white shadow-xs group cursor-pointer"
                      title="Click to view full preview"
                    >
                      <img
                        src={imagePreview}
                        alt="Item Preview"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white font-semibold text-xs gap-1">
                        <Maximize2 className="w-4 h-4" />
                        <span>Preview</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage();
                        }}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors z-10"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center bg-white text-gray-400">
                      <ImageIcon className="w-8 h-8 mb-1 text-gray-400" />
                      <span className="text-2xs text-gray-400">No Image</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      id="item-image-input"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="item-image-input"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer shadow-xs"
                      >
                        <Upload className="w-4 h-4 text-blue-600" />
                        <span>{imagePreview ? "Change Image" : "Upload Item Image"}</span>
                      </label>
                      {imagePreview && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsPreviewModalOpen(true)}
                          className="gap-1.5 text-xs text-slate-700 h-9"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Preview Image</span>
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Supported formats: PNG, JPG, JPEG, WEBP. Max size: 5MB. Click thumbnail to enlarge.
                    </p>
                  </div>
                </div>
                <input type="hidden" {...register("imageUrl")} />
              </div>

              <div className="flex items-center">
                <label className="flex items-center cursor-pointer mt-6">
                  <input
                    {...register("activeFlag")}
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
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
                className="px-6 bg-primary text-white"
              >
                {isEditMode ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Full-size Image Preview Modal Popup */}
      {isPreviewModalOpen && imagePreview && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsPreviewModalOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-lg p-4 shadow-2xl overflow-hidden flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <span>Item Image Preview ({watch("itemName") || "Item"})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-gray-500 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] w-full overflow-auto flex items-center justify-center p-2 bg-slate-900/5 rounded border border-gray-200">
              <img
                src={imagePreview}
                alt="Full Size Item Preview"
                className="max-h-[65vh] max-w-full object-contain rounded shadow-md"
              />
            </div>

            <div className="w-full flex items-center justify-between pt-3 border-t border-gray-200 mt-3">
              <span className="text-xs text-gray-500 font-mono">
                {watch("itemCode") ? `Item Code: ${watch("itemCode")}` : "Item Master Image"}
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-xs px-4"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
