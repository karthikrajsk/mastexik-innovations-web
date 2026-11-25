import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/Modal";
import { DataTable } from "@/components/data/DataTable";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import {
    createVendor,
    deleteVendor,
    getAllVendors,
    updateVendor,
    fetchVendorSizingRates,
    fetchVendorSizingRateHistory,
    saveVendorSizingRate,
    deleteVendorSizingRate
} from "@/state/vendorSlice";
import { getAllStates } from "@/state/stateSlice";
import { getAllCountries } from "@/state/countrySlice";
import { getAllCities } from "@/state/citySlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllPaymentTerms } from "@/state/paymentTermsSlice";
import { Trash, ChevronDown, ChevronUp, X, IndianRupee, History, Eye, Edit, Plus, Clock, User, CheckCircle, RefreshCw } from "lucide-react";
import { CodesAPI } from "@/services/codes_api";
import { CodesUtil } from "@/utils/codesUtil";
import mediaService from "@/services/MediaUploadService";
import { CodeDetail, CodeHeader } from "@/types/codes";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";
import { BooleanFilter } from "@/components/filters";
import { toast } from "react-toastify";

interface VendorDocumentReference {
    mediaDetailSno: number;
    mediaUrl: string;
    fileName: string;
}

interface VendorBankDetail {
    id?: number;
    bankName: string;
    accountNo: string;
    ifscCode: string;
}

interface VendorCertificate {
    id?: number;
    certificateNo: string;
    expiryDate: string;
    type: string;
    files: VendorDocumentReference[];
}

interface VendorBankDetailRow extends VendorBankDetail {
    clientId: string;
}

interface VendorCertificateRow extends VendorCertificate {
    clientId: string;
    pendingFiles: File[];
}

interface vendorData {
    id?: number | null;
    vendorName: string;
    vendorTypeId?: number | string | null;
    vendorTypeIds?: number[];
    vendorType?: string;
    paymentTermsId?: number | string | null;
    gstno?: string;
    pancard?: string;
    mobileno?: string;
    email?: string;
    contactPerson?: string;
    contactNumber?: string;
    activeFlag?: boolean;
    photoUrl?: string | null;
    isInternalVendor?: number;
    address: AddressDetail[]; // always array!
    gstDocument?: VendorDocumentReference | null;
    bankDetails?: VendorBankDetail[];
    certificates?: VendorCertificate[];
}

interface vendorFormData extends vendorData { }

interface AddressDetail {
    id?: number;
    line1: string;
    line2: string;
    countryId: string;
    stateId: string;
    cityId: string;
    stateCode: string;
    pinCode: string;
    activeFlag: boolean;
}

const createVendorRowId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const VENDOR_TYPE_GROUP_KEY = "VENDOR_TYPE";
const CODES_STORAGE_KEY = "codes_header";

const normalizeCodeValue = (value?: string | number | null) => String(value ?? "").trim().toUpperCase();

const normalizeDetailsResponse = (raw: any): CodeDetail[] => {
    if (Array.isArray(raw)) return raw;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
    return [];
};

const normalizeHeadersResponse = (raw: any): CodeHeader[] => {
    if (Array.isArray(raw)) return raw;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
    return [];
};

const cacheHeadersToStorage = (headers: CodeHeader[]) => {
    if (!Array.isArray(headers) || !headers.length) return;
    try {
        localStorage.setItem(CODES_STORAGE_KEY, JSON.stringify(headers));
    } catch { }
};

const readHeadersFromStorage = (): CodeHeader[] => {
    try {
        const stored = localStorage.getItem(CODES_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return normalizeHeadersResponse(parsed);
        }
    } catch { }
    return [];
};

const extractVendorTypeDetails = (headers: CodeHeader[]): CodeDetail[] => {
    if (!Array.isArray(headers) || !headers.length) return [];
    const header = headers.find((entry: any) => normalizeCodeValue(entry?.code_group ?? entry?.codeGroup) === VENDOR_TYPE_GROUP_KEY);
    if (!header || !Array.isArray(header.details)) return [];
    return header.details;
};

const getDetailOptionValue = (detail: CodeDetail) => {
    if (detail.id != null) return String(detail.id);
    if (detail.code) return detail.code;
    if (detail.value) return detail.value;
    return "";
};

const getDetailOptionLabel = (detail: CodeDetail) => detail.value || detail.code || `Code ${detail.id ?? ""}`;

const resolveVendorTypeIdFromValue = (value: string | number | null | undefined, details: CodeDetail[]): string => {
    const normalized = normalizeCodeValue(value);
    if (!normalized) return "";
    const match = details.find((detail) => {
        const idMatch = detail.id != null && normalizeCodeValue(detail.id) === normalized;
        const codeMatch = normalizeCodeValue(detail.code) === normalized;
        const valueMatch = normalizeCodeValue(detail.value) === normalized;
        return idMatch || codeMatch || valueMatch;
    });
    return match?.id != null ? String(match.id) : "";
};

const resolveVendorTypeIdFromVendor = (vendor: vendorData | null | undefined, details: CodeDetail[]): string => {
    if (!vendor) return "";
    if (vendor.vendorTypeId !== null && vendor.vendorTypeId !== undefined && vendor.vendorTypeId !== "") {
        return String(vendor.vendorTypeId);
    }
    return resolveVendorTypeIdFromValue(vendor.vendorType, details);
};

// Convert comma-separated string to array of numbers for multi-select support
const parseVendorTypeIds = (vendorTypeIdStr: string | null | undefined): number[] => {
    if (!vendorTypeIdStr || vendorTypeIdStr.trim() === "") {
        return [];
    }
    try {
        return vendorTypeIdStr.split(",")
            .map(s => s.trim())
            .filter(s => s !== "")
            .map(Number)
            .filter(n => !isNaN(n));
    } catch (error) {
        // Handle backward compatibility for single values
        const num = Number(vendorTypeIdStr.trim());
        return isNaN(num) ? [] : [num];
    }
};

// Convert array of numbers to comma-separated string
const formatVendorTypeIds = (vendorTypeIds: number[] | undefined): string => {
    if (!vendorTypeIds || vendorTypeIds.length === 0) {
        return "";
    }
    return vendorTypeIds.join(",");
};

// Multi-select checkbox dropdown component
const MultiSelectCheckboxDropdown: React.FC<{
    options: { value: string; label: string }[];
    selectedValues: number[];
    onChange: (values: number[]) => void;
    placeholder?: string;
    error?: string;
    onBlur?: () => void;
}> = ({ options, selectedValues, onChange, placeholder = "Select vendor types", error, onBlur }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleToggle = () => {
        if (isOpen && onBlur) onBlur();
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (isOpen) {
                    if (onBlur) onBlur();
                    setIsOpen(false);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onBlur]);

    const handleOptionChange = (optionValue: string) => {
        const numValue = Number(optionValue);
        const newSelectedValues = selectedValues.includes(numValue)
            ? selectedValues.filter(v => v !== numValue)
            : [...selectedValues, numValue];
        onChange(newSelectedValues);
    };

    const getSelectedLabels = () => {
        return options
            .filter(option => selectedValues.includes(Number(option.value)))
            .map(option => option.label)
            .join(", ");
    };

    const removeSelection = (valueToRemove: number) => {
        const newValues = selectedValues.filter(v => v !== valueToRemove);
        onChange(newValues);
    };

    return (
        <div className="relative" ref={containerRef}>
            <div className="block text-sm font-medium text-gray-700 mb-1">
                Supplier/Vendor Type <span className="text-red-600">*</span>
            </div>
            <div
                className={`input cursor-pointer flex items-center justify-between ${error ? 'border-red-500' : ''}`}
                onClick={handleToggle}
            >
                <div className="flex-1 flex items-center gap-2 flex-wrap">
                    {selectedValues.length === 0 ? (
                        <span className="text-gray-500">{placeholder}</span>
                    ) : (
                        selectedValues.map(value => {
                            const option = options.find(opt => Number(opt.value) === value);
                            return option ? (
                                <span
                                    key={value}
                                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1"
                                >
                                    {option.label}
                                    <X
                                        size={14}
                                        className="cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeSelection(value);
                                        }}
                                    />
                                </span>
                            ) : null;
                        })
                    )}
                </div>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {options.map(option => (
                        <label
                            key={option.value}
                            className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={selectedValues.includes(Number(option.value))}
                                onChange={() => handleOptionChange(option.value)}
                                className="mr-2 h-4 w-4"
                            />
                            <span className="text-sm">{option.label}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

const getLoggedInUserName = () => {
    try {
        const payloadStr = localStorage.getItem("authPayload");
        if (payloadStr) {
            const payload = JSON.parse(payloadStr);
            if (payload?.userName) return payload.userName;
            if (payload?.username) return payload.username;
            if (payload?.name) return payload.name;
        }
        const userStr = localStorage.getItem("authUser") || localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user?.userName) return user.userName;
            if (user?.username) return user.username;
            if (user?.name) return user.name;
        }
    } catch (e) {
        console.error("Error reading logged-in user:", e);
    }
    return "Admin";
};

export function VendorMaster() {
    const { stateList } = useSelector((state: RootState) => state.state);
    const { countryList } = useSelector((state: RootState) => state.country);
    const { cityList } = useSelector((state: RootState) => state.city);
    const { vendorList, pagination } = useSelector((state: RootState) => state.vendor);
    const { yarnList } = useSelector((state: RootState) => state.yarn);
    const { paymentTermsList } = useSelector((state: RootState) => state.paymentTerms);

    const yarnCountOptions = useMemo(() => {
        const rawList = Array.isArray(yarnList)
            ? yarnList
            : Array.isArray((yarnList as any)?.data)
            ? (yarnList as any).data
            : [];

        const nameSet = new Set<string>();

        rawList.forEach((y: any) => {
            const yarnNameVal = y?.yarnName || y?.yarn_name || y?.name;
            if (yarnNameVal != null && String(yarnNameVal).trim() !== "") {
                nameSet.add(String(yarnNameVal).trim());
            }
        });

        return Array.from(nameSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    }, [yarnList]);

    // Sizing Rate Master Modal states
    const [isSizingRateModalOpen, setIsSizingRateModalOpen] = useState(false);
    const [sizingVendor, setSizingVendor] = useState<any>(null);
    const [activeSizingRates, setActiveSizingRates] = useState<any[]>([]);
    const [sizingRateHistory, setSizingRateHistory] = useState<any[]>([]);
    const [sizingRateTab, setSizingRateTab] = useState<"active" | "history">("active");
    const [historyFilterCount, setHistoryFilterCount] = useState<string>("");
    const [rateLoading, setRateLoading] = useState(false);

    // Rate Form State
    const [rateFormCount, setRateFormCount] = useState("");
    const [rateFormRate, setRateFormRate] = useState("");
    const [rateFormEffectiveDate, setRateFormEffectiveDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [rateFormSubmitting, setRateFormSubmitting] = useState(false);

    const dispatch = useDispatch<AppDispatch>();

    const loadSizingRatesData = async (vendorId: number, yarnCountFilter?: string) => {
        setRateLoading(true);
        try {
            const ratesRes = await dispatch(fetchVendorSizingRates(vendorId)).unwrap();
            setActiveSizingRates(Array.isArray(ratesRes) ? ratesRes : []);

            const historyRes = await dispatch(fetchVendorSizingRateHistory({ vendorId, yarnCount: yarnCountFilter })).unwrap();
            setSizingRateHistory(Array.isArray(historyRes) ? historyRes : []);
        } catch (err) {
            console.error("Error loading sizing rates:", err);
        } finally {
            setRateLoading(false);
        }
    };

    const handleOpenSizingRatesModal = (vendor: any) => {
        setSizingVendor(vendor);
        setIsSizingRateModalOpen(true);
        setSizingRateTab("active");
        setRateFormCount("");
        setRateFormRate("");
        setRateFormEffectiveDate(new Date().toISOString().split("T")[0]);
        setHistoryFilterCount("");
        if (vendor?.id) {
            loadSizingRatesData(vendor.id);
        }
    };

    const handleSaveSizingRate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sizingVendor?.id) return;
        if (!rateFormCount || !rateFormCount.trim()) {
            alert("Please enter Yarn Count (e.g., 40s)");
            return;
        }
        if (!rateFormRate || isNaN(Number(rateFormRate)) || Number(rateFormRate) <= 0) {
            alert("Please enter a valid Sizing Rate (> 0)");
            return;
        }

        setRateFormSubmitting(true);
        try {
            const loggedInUser = getLoggedInUserName();
            await dispatch(saveVendorSizingRate({
                vendorId: sizingVendor.id,
                yarnCount: rateFormCount.trim(),
                sizingRate: Number(rateFormRate),
                effectiveDate: rateFormEffectiveDate,
                createdBy: loggedInUser
            })).unwrap();

            setRateFormCount("");
            setRateFormRate("");
            setRateFormEffectiveDate(new Date().toISOString().split("T")[0]);
            await loadSizingRatesData(sizingVendor.id, historyFilterCount);
        } catch (err) {
            console.error("Error saving sizing rate:", err);
        } finally {
            setRateFormSubmitting(false);
        }
    };

    const handleDeleteSizingRateRecord = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this sizing rate entry?")) return;
        try {
            await dispatch(deleteVendorSizingRate(id)).unwrap();
            if (sizingVendor?.id) {
                await loadSizingRatesData(sizingVendor.id, historyFilterCount);
            }
        } catch (err) {
            console.error("Error deleting sizing rate:", err);
        }
    };

    const handleEditRateForm = (rateItem: any) => {
        setRateFormCount(rateItem.yarnCount || "");
        setRateFormRate(String(rateItem.sizingRate || ""));
        setRateFormEffectiveDate(rateItem.effectiveDate || new Date().toISOString().split("T")[0]);
        setSizingRateTab("active");
    };

    const handleViewCountHistory = (yarnCount: string) => {
        setHistoryFilterCount(yarnCount);
        setSizingRateTab("history");
        if (sizingVendor?.id) {
            dispatch(fetchVendorSizingRateHistory({ vendorId: sizingVendor.id, yarnCount })).then((res: any) => {
                if (res.payload) setSizingRateHistory(Array.isArray(res.payload) ? res.payload : []);
            });
        }
    };

    // Normalize address to array for all rows
    const normalizedVendorList = useMemo(
        () =>
            (Array.isArray(vendorList) ? vendorList : []).map((v: any) => ({
                ...v,
                address: Array.isArray(v.address) ? v.address : v.address ? [v.address] : [],
            })),
        [vendorList]
    );

    const [vendorTypeOptions, setVendorTypeOptions] = useState<CodeDetail[]>([]);
    const [pendingVendorTypeSource, setPendingVendorTypeSource] = useState<string>("");
    const [currentVendor, setCurrentVendor]: any = useState(null);
    // const [currentVendor, setCurrentVendor] = useState<vendorData | null>(null);
    const [addressDetails, setAddressDetails] = useState<AddressDetail[]>([]);
    const [gstDocument, setGstDocument] = useState<VendorDocumentReference | null>(null);
    const [gstDocumentFile, setGstDocumentFile] = useState<File | null>(null);
    const [clearGstDocument, setClearGstDocument] = useState(false);
    const gstDocumentInputRef = useRef<HTMLInputElement | null>(null);
    const [bankDetails, setBankDetails] = useState<VendorBankDetailRow[]>([]);
    const [certificates, setCertificates] = useState<VendorCertificateRow[]>([]);
    const [isVendorSubmitting, setIsVendorSubmitting] = useState(false);
    const [selectedVendorTypeIds, setSelectedVendorTypeIds] = useState<number[]>([]);
    const [vendorTypeTouched, setVendorTypeTouched] = useState(false);

    const vendorTypeLabelById = useMemo(() => {
        const map = new Map<string, string>();
        vendorTypeOptions.forEach((detail) => {
            const key = getDetailOptionValue(detail);
            if (!key) {
                return;
            }
            map.set(key, getDetailOptionLabel(detail));
        });
        return map;
    }, [vendorTypeOptions]);

    const processedVendorList = useMemo(() => {
        const baseSerial = pagination?.offset || 0;
        return normalizedVendorList.map((vendor, index) => {
            // Parse vendor type IDs from comma-separated string
            const vendorTypeIds = parseVendorTypeIds(vendor.vendorTypeId as string);

            // Get labels for all vendor types
            const vendorTypeLabels = vendorTypeIds
                .map(id => {
                    const idStr = String(id);
                    return vendorTypeLabelById.get(idStr) || `Type ${id}`;
                })
                .filter(label => label && label !== `Type ${null}` && label !== `Type undefined`);

            // Create display string for multiple vendor types
            const vendorTypeDisplay = vendorTypeLabels.length > 0
                ? vendorTypeLabels.join(", ")
                : (vendor?.vendorType || vendor?.vendorTypeName || vendor?.vendorTypeDesc || vendor?.vendorTypeValue || "");

            const vendorCategory = vendor?.isInternalVendor === 1 ? "Internal" : "External";
            return {
                ...vendor,
                serialNo: baseSerial + index + 1,
                vendorTypeDisplay: vendorTypeDisplay,
                vendorCategory: vendorCategory,
                // activeFlag: vendor.activeFlag ? "Active" : "Inactive",
            };
        });
    }, [normalizedVendorList, pagination?.offset, vendorTypeOptions, vendorTypeLabelById]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const {
        currentPage,
        itemsPerPage,
        setItemsPerPage,
        handlePageChange,
        resetPage,
        getOffset,
    } = usePagination({ itemsPerPage: 10 });

    // const { register, handleSubmit, reset, formState: { errors } } = useForm<vendorFormData>();
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, touchedFields, isValid }
    } = useForm<vendorFormData>({
        mode: 'onBlur', // Validate on blur
        reValidateMode: 'onBlur' // Re-validate on blur
    });

    useEffect(() => {
        dispatch(getAllCountries({ fetchAll: true }));
        dispatch(getAllStates({ fetchAll: true }));
        dispatch(getAllCities({ fetchAll: true }));
        dispatch(getAllYarnMasters({ fetchAll: true }));
        dispatch(getAllPaymentTerms({ fetchAll: true }));
    }, [dispatch]);

    useEffect(() => {
        let isMounted = true;

        const loadVendorTypes = async () => {
            let headers: CodeHeader[] = readHeadersFromStorage();

            if (!headers.length) {
                const cachedHeaders = normalizeHeadersResponse(CodesUtil.getHeaders?.());
                if (cachedHeaders.length) headers = cachedHeaders;
            }

            if (!headers.length) {
                try {
                    await CodesUtil.loadOnce(async () => normalizeHeadersResponse(await CodesAPI.getCodesHeader()));
                    const loadedHeaders = normalizeHeadersResponse(CodesUtil.getHeaders?.());
                    if (loadedHeaders.length) headers = loadedHeaders;
                } catch (error) {
                    console.error("Failed to preload vendor type headers", error);
                }
            }

            if (!headers.length) {
                try {
                    const apiHeaders = await CodesAPI.getCodesHeader();
                    headers = normalizeHeadersResponse(apiHeaders);
                } catch (error) {
                    console.error("Failed to fetch vendor type headers", error);
                }
            }

            let details = extractVendorTypeDetails(headers);

            if (!details.length) {
                try {
                    const detailResponse = await CodesAPI.getCodeDetailsByHeader(VENDOR_TYPE_GROUP_KEY);
                    details = normalizeDetailsResponse(detailResponse);
                } catch (error) {
                    console.error("Failed to fetch vendor type details", error);
                }
            }

            if (headers.length) {
                cacheHeadersToStorage(headers);
            }

            if (!isMounted) return;
            setVendorTypeOptions(details);
        };

        loadVendorTypes();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!pendingVendorTypeSource) return;
        if (!vendorTypeOptions.length) return;
        const resolved = resolveVendorTypeIdFromValue(pendingVendorTypeSource, vendorTypeOptions);
        if (resolved) {
            setValue("vendorTypeId", resolved, { shouldValidate: true });
            setPendingVendorTypeSource("");
        }
    }, [pendingVendorTypeSource, vendorTypeOptions, setValue]);

    useEffect(() => {
        const storedCompanyId = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
        const params: any = {
            // offset: getOffset(),
            // limit: itemsPerPage,
            fetchAll: true
        };
        if (storedCompanyId) {
            params.companyId = Number(storedCompanyId);
        }
        dispatch(getAllVendors(params));
    }, [dispatch, currentPage, getOffset, itemsPerPage]);

    // Get state code by state ID
    const getStateCode = (stateId: string) => {
        const state = stateList.find((state: any) => state.id.toString() === stateId);
        return state ? state.stateCode : "";
    };

    const statesByCountry = useMemo(() => {
        const map = new Map<string, any[]>();
        (stateList || []).forEach((state: any) => {
            const key = String(state.countryId ?? state.country_id ?? "").trim();
            if (!key) return;
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key)?.push(state);
        });
        return map;
    }, [stateList]);

    const citiesByState = useMemo(() => {
        const map = new Map<string, any[]>();
        (cityList || []).forEach((city: any) => {
            const key = String(city.stateId ?? city.state_id ?? "").trim();
            if (!key) return;
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key)?.push(city);
        });
        return map;
    }, [cityList]);

    const getStatesForCountry = (countryId?: string) => {
        const key = countryId ? String(countryId) : "";
        if (!key) return [];
        return statesByCountry.get(key) ?? [];
    };

    const getCitiesForState = (stateId?: string) => {
        const key = stateId ? String(stateId) : "";
        if (!key) return [];
        return citiesByState.get(key) ?? [];
    };

    const handleCountryChange = (index: number, countryId: string) => {
        setAddressDetails((prev) =>
            prev.map((addr, i) =>
                i === index
                    ? { ...addr, countryId, stateId: "", stateCode: "", cityId: "" }
                    : addr
            )
        );
    };

    // When state changes, auto-populate stateCode for that address row
    const handleStateChange = (index: number, stateId: string) => {
        setAddressDetails((prev) =>
            prev.map((addr, i) =>
                i === index
                    ? { ...addr, stateId, stateCode: getStateCode(stateId), cityId: "" }
                    : addr
            )
        );
    };

    const columns = useMemo(
        () => [
            { Header: "S.No", accessor: "serialNo", disableFilters: true, width: 60 },
            { Header: "Name", accessor: "vendorName" },
            { Header: "Supplier/Vendor Type", accessor: "vendorTypeDisplay" },
            { Header: "Supplier/Vendor Category", accessor: "vendorCategory" },
            { Header: "Mobile", accessor: "mobileno" },
            { Header: "GST NO", accessor: "gstno" },
            { Header: "Pan Card", accessor: "pancard" },
            { Header: "Email", accessor: "email" },
            {
                Header: "Status",
                accessor: "activeFlag",
                Filter: BooleanFilter,
                Cell: ({ value }: { value: boolean }) => (
                    <span
                        className={`px-2 py-1 rounded-full text-xs ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                    >
                        {value ? "Active" : "Inactive"}
                    </span>
                ),
            },
            //  { Header: "Status", accessor: "activeFlag" },
        ],
        []
    );

    // const handleAddAddress = () => {
    //     setAddressDetails([...addressDetails, { id: addressDetails.length + 1, line1: "", line2: "", countryId: "", stateId: "", cityId: "", activeFlag: true }]);
    // };

    const handleAddAddress = () => {
        setAddressDetails([...addressDetails, {
            id: addressDetails.length + 1,
            line1: "",
            line2: "",
            countryId: "",
            stateId: "",
            cityId: "",
            stateCode: "",
            pinCode: "",
            activeFlag: true
        }]);
    };

    const handleDeleteAddress = (id: any) => {
        setAddressDetails(addressDetails.filter((item: any) => item.id !== id));
    };

    const resetVendorDocumentsAndBankDetails = (vendor?: vendorData | null) => {
        setGstDocument(vendor?.gstDocument || null);
        setGstDocumentFile(null);
        if (gstDocumentInputRef.current) {
            gstDocumentInputRef.current.value = "";
        }
        setClearGstDocument(false);
        setBankDetails((Array.isArray(vendor?.bankDetails) ? vendor.bankDetails : []).map((bank) => ({
            ...bank,
            bankName: bank.bankName || "",
            accountNo: bank.accountNo || "",
            ifscCode: bank.ifscCode || "",
            clientId: createVendorRowId(),
        })));
        setCertificates((Array.isArray(vendor?.certificates) ? vendor.certificates : []).map((certificate) => ({
            ...certificate,
            certificateNo: certificate.certificateNo || "",
            expiryDate: certificate.expiryDate || "",
            type: certificate.type || "",
            files: Array.isArray(certificate.files) ? certificate.files : [],
            pendingFiles: [],
            clientId: createVendorRowId(),
        })));
    };

    const handleEdit = (vendor: vendorData) => {
        setIsEditing(true);
        setCurrentVendor(vendor);
        resetVendorDocumentsAndBankDetails(vendor);

        // Ensure address is always an array and normalize pinCode
        const vendorAddresses = (Array.isArray(vendor.address) ? vendor.address : vendor.address ? [vendor.address] : []).map(addr => ({
            ...addr,
            pinCode: addr.pinCode || (addr as any).pincode || ""
        }));
        setAddressDetails(vendorAddresses);

        // Parse vendor type IDs for multi-select
        const parsedVendorTypeIds = parseVendorTypeIds(vendor.vendorTypeId as string);
        setSelectedVendorTypeIds(parsedVendorTypeIds);
        setVendorTypeTouched(false);

        const resolvedTypeId = resolveVendorTypeIdFromVendor(vendor, vendorTypeOptions);
        if (!resolvedTypeId && (vendor.vendorTypeId != null || vendor.vendorType)) {
            setPendingVendorTypeSource(String(vendor.vendorTypeId ?? vendor.vendorType ?? ""));
        } else {
            setPendingVendorTypeSource("");
        }

        reset({
            id: vendor.id,
            vendorName: vendor.vendorName,
            vendorTypeId: resolvedTypeId,
            vendorTypeIds: parsedVendorTypeIds,
            paymentTermsId: vendor.paymentTermsId != null ? String(vendor.paymentTermsId) : "",
            gstno: vendor.gstno,
            pancard: vendor.pancard,
            mobileno: vendor.mobileno,
            email: vendor.email,
            contactPerson: vendor.contactPerson,
            contactNumber: vendor.contactNumber,
            activeFlag: vendor.activeFlag,
            isInternalVendor: Number((vendor as any)?.isInternalVendor) || 0,
            address: vendorAddresses,
        });
        setIsModalOpen(true);
    };

    const handleDelete = (state: any) => {
        setCurrentVendor(state);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!currentVendor) return;

        try {
            await dispatch(deleteVendor(currentVendor.id)).unwrap();
            resetPage();
            const storedCompanyId = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
            const params: any = {
                // offset: 0,
                // limit: itemsPerPage,
                fetchAll: true
            };
            if (storedCompanyId) {
                params.companyId = Number(storedCompanyId);
            }
            await dispatch(getAllVendors(params));
        } catch (error) {
            console.error("Error deleting country:", error);
        }

        setIsDeleteModalOpen(false);
    };

    const handleView = (vendor: vendorData) => {
        // Ensure address is always an array before setting and normalize pinCode
        const normalizedAddress = (Array.isArray(vendor.address) ? vendor.address : vendor.address ? [vendor.address] : []).map(addr => ({
            ...addr,
            pinCode: addr.pinCode || (addr as any).pincode || ""
        }));
        const vendorWithNormalizedAddress = {
            ...vendor,
            address: normalizedAddress
        };
        setCurrentVendor(vendorWithNormalizedAddress);
        setIsViewModalOpen(true);
    };


    const handleOpenModal = (editing = false, vendor: vendorData | null = null) => {
        if (editing && vendor) {
            const vendorAddresses = Array.isArray(vendor.address) ? vendor.address : vendor.address ? [vendor.address] : [];
            const resolvedTypeId = resolveVendorTypeIdFromVendor(vendor, vendorTypeOptions);
            const parsedVendorTypeIds = parseVendorTypeIds(vendor.vendorTypeId as string);
            setSelectedVendorTypeIds(parsedVendorTypeIds);

            if (!resolvedTypeId && (vendor.vendorTypeId != null || vendor.vendorType)) {
                setPendingVendorTypeSource(String(vendor.vendorTypeId ?? vendor.vendorType ?? ""));
            } else {
                setPendingVendorTypeSource("");
            }
            reset({
                ...vendor,
                vendorTypeId: resolvedTypeId,
                vendorTypeIds: parsedVendorTypeIds,
                paymentTermsId: vendor.paymentTermsId != null ? String(vendor.paymentTermsId) : "",
                address: vendorAddresses,
            });
            setCurrentVendor(vendor);
            setAddressDetails(vendorAddresses);
            resetVendorDocumentsAndBankDetails(vendor);
        } else {
            reset({ isInternalVendor: 0, vendorTypeId: "", vendorTypeIds: [], paymentTermsId: "", contactPerson: "", contactNumber: "" });
            setCurrentVendor(null);
            setAddressDetails([]);
            resetVendorDocumentsAndBankDetails(null);
            setPendingVendorTypeSource("");
            setSelectedVendorTypeIds([]);
        }
        setVendorTypeTouched(false);
        setIsEditing(editing);
        setIsModalOpen(true);
    };

    const updateBankDetail = (
        clientId: string,
        field: "bankName" | "accountNo" | "ifscCode",
        value: string
    ) => {
        setBankDetails((current) => current.map((bank) =>
            bank.clientId === clientId ? { ...bank, [field]: value } : bank
        ));
    };

    const updateCertificate = (
        clientId: string,
        field: "certificateNo" | "expiryDate" | "type",
        value: string
    ) => {
        setCertificates((current) => current.map((certificate) =>
            certificate.clientId === clientId ? { ...certificate, [field]: value } : certificate
        ));
    };

    const uploadVendorDocument = async (
        file: File,
        containerName: string,
        description: string
    ): Promise<VendorDocumentReference> => {
        const base64File = await mediaService.fileToBase64(file);
        const uploaded = await mediaService.uploadMedia({
            base64File,
            fileName: file.name,
            contentType: mediaService.getMimeType(file),
            mediaType: mediaService.getMediaType(file),
            containerName,
            mediaDetailDescription: description,
        });

        if (uploaded.mediaDetailSno == null || !uploaded.mediaUrl) {
            throw new Error(`Upload response was incomplete for ${file.name}`);
        }

        return {
            mediaDetailSno: uploaded.mediaDetailSno,
            mediaUrl: uploaded.mediaUrl,
            fileName: uploaded.originalFileName || file.name,
        };
    };

    const onSubmit = async (data: vendorFormData) => {
        setVendorTypeTouched(true);
        try {
            // Validate vendor type selection
            if (selectedVendorTypeIds.length === 0) {
                return;
            }

            // Validate addressDetails
            const first = addressDetails[0];
            const pin = first?.pinCode || "";
            const isPinValid = /^\d{6}$/.test(pin);
            if (!first?.stateCode || !isPinValid) {
                alert('Please provide valid State Code (auto from State) and 6-digit numeric Pin Code.');
                return;
            }

            const missing = addressDetails.some(addr => !addr.stateCode || !addr.pinCode);
            if (missing) {
                alert('Please ensure State Code and Pin Code are provided for all address rows.');
                return;
            }

            setIsVendorSubmitting(true);

            let uploadedGstDocument = gstDocument;
            let submittedCertificates: Array<Omit<VendorCertificate, "expiryDate"> & { expiryDate: string | null }> = [];
            try {
                if (gstDocumentFile) {
                    uploadedGstDocument = await uploadVendorDocument(
                        gstDocumentFile,
                        "vendor-gst-documents",
                        `GST document for ${data.vendorName}`
                    );
                }

                const certificateRows = certificates.filter((certificate) =>
                    certificate.certificateNo.trim()
                    || certificate.expiryDate
                    || certificate.type.trim()
                    || certificate.files.length > 0
                    || certificate.pendingFiles.length > 0
                );

                submittedCertificates = await Promise.all(certificateRows.map(async (certificate) => {
                    const uploadedFiles = await Promise.all(certificate.pendingFiles.map((file) =>
                        uploadVendorDocument(
                            file,
                            "vendor-certificates",
                            `Certificate for ${data.vendorName}`
                        )
                    ));
                    return {
                        id: certificate.id,
                        certificateNo: certificate.certificateNo,
                        expiryDate: certificate.expiryDate || null,
                        type: certificate.type,
                        files: [...certificate.files, ...uploadedFiles],
                    };
                }));
            } catch (error) {
                console.error("Error uploading vendor documents:", error);
                toast.error("Failed to upload vendor documents. Vendor details were not saved.");
                return;
            }

            const submittedBankDetails = bankDetails
                .filter((bank) => bank.bankName.trim() || bank.accountNo.trim() || bank.ifscCode.trim())
                .map((bank) => ({
                    id: bank.id,
                    bankName: bank.bankName,
                    accountNo: bank.accountNo,
                    ifscCode: bank.ifscCode,
                }));

            const payload = {
                ...data,
                vendorTypeIds: selectedVendorTypeIds,
                vendorTypeId: formatVendorTypeIds(selectedVendorTypeIds), // For backward compatibility
                paymentTermsId: data.paymentTermsId ? Number(data.paymentTermsId) : null,
                isInternalVendor: data?.isInternalVendor ? 1 : 0,
                address: addressDetails[0],
                gstDocument: uploadedGstDocument,
                clearGstDocument,
                bankDetails: submittedBankDetails,
                certificates: submittedCertificates,
            };

            if (isEditing) {
                await dispatch(updateVendor(payload)).unwrap();
            } else {
                const { id, ...newVendorData } = payload;
                await dispatch(createVendor(newVendorData)).unwrap();
            }
            resetPage();
            const storedCompanyId = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
            const params: any = {
                fetchAll: true
            };
            if (storedCompanyId) {
                params.companyId = Number(storedCompanyId);
            }
            await dispatch(getAllVendors(params)).unwrap();
            setIsModalOpen(false);
            reset();
            setAddressDetails([]);
            resetVendorDocumentsAndBankDetails(null);
            setSelectedVendorTypeIds([]);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsVendorSubmitting(false);
        }
    };

    const vendorNameValue = watch("vendorName");
    const isInternalVendorValue = watch("isInternalVendor");
    const vendorTypeIdWatch = watch("vendorTypeId");

    const [showSuggestions, setShowSuggestions] = useState(false);

    const existingNames = useMemo(
        () => normalizedVendorList.map((v: any) => (v?.vendorName ?? "")).filter(Boolean),
        [normalizedVendorList]
    );

    const filteredSuggestions = useMemo(() => {
        const q = (vendorNameValue || "").toLowerCase();
        if (!q) return [] as string[];
        return existingNames
            .filter((name: string) => name.toLowerCase().includes(q))
            .slice(0, 8);
    }, [vendorNameValue, existingNames]);

    const vendorTypeSelectOptions = useMemo(() => {
        return vendorTypeOptions
            .map((detail) => ({
                value: getDetailOptionValue(detail),
                label: getDetailOptionLabel(detail),
            }))
            .filter((option) => option.value !== "");
    }, [vendorTypeOptions]);


    return (
        <div className="p-6 pt-16">
                 
               <DataTable
                columns={columns}
                data={processedVendorList}
                title="Vendors"
                onAdd={() => handleOpenModal(false)}
                onEdit={handleEdit}
                // onDelete={handleDelete}
                onView={handleView}
                showActions={true}
                showColumnFilters={true}
                filterPlaceholder="Search Vendor..."
                disableFullDataFetch={true}
                renderActions={(row: any) => {
                    const vendorTypeStr = (row?.vendorTypeDisplay || row?.vendorType || "").toLowerCase();
                    const isSizingVendor = vendorTypeStr.includes("sizing");
                    return (
                        <div className="flex items-center justify-end gap-1.5">
                            {isSizingVendor && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenSizingRatesModal(row);
                                    }}
                                    className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-blue-700 hover:bg-blue-100 flex items-center gap-1 text-xs font-semibold shadow-sm transition-all"
                                    title="Manage Sizing Rates & Revision History"
                                >
                                    <IndianRupee className="h-3.5 w-3.5 text-blue-600" />
                                    <span>Sizing Rates</span>
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleView(row);
                                }}
                                className="rounded-lg border border-blue-100 bg-blue-50/60 p-1.5 text-blue-600 transition hover:border-blue-200"
                                title="View Vendor"
                            >
                                <Eye className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(row);
                                }}
                                className="rounded-lg border border-amber-100 bg-amber-50/60 p-1.5 text-amber-600 transition hover:border-amber-200"
                                title="Edit Vendor"
                            >
                                <Edit className="h-4 w-4" />
                            </button>
                        </div>
                    );
                }}
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

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center flex justify-end z-50 bg-gray-800 bg-opacity-50">
                    <div className="bg-white p-8 shadow-lg w-3/4 h-full  max-h-full overflow-y-auto ">
                        <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between ">
                            {isEditing ? "Update Vendor" : "Add Vendor"}
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" onClick={() => setIsModalOpen(false)} className="bi bi-x cursor-pointer" viewBox="0 0 16 16">
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                            </svg>
                        </h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                {/* Vendor Name - Only mandatory field */}
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700">Supplier/Vendor Name <span className="text-red-600">*</span> </label>
                                    <input {...register("vendorName", {
                                        required: "Supplier/Vendor Name is required", onChange: () => {
                                            setShowSuggestions(true);
                                        },
                                        onBlur: () => {
                                            setTimeout(() => setShowSuggestions(false), 150);
                                        }
                                    })}
                                        placeholder="Enter Supplier/Vendor Name"
                                        className="input mt-1"
                                        onFocus={() => setShowSuggestions(true)}
                                        autoComplete="off" />
                                    {errors.vendorName && <p className="text-red-500 text-sm">{errors.vendorName.message}</p>}
                                    {(showSuggestions && filteredSuggestions.length > 0) && (
                                        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-auto">
                                            {filteredSuggestions.map((s: string) => (
                                                <li
                                                    key={s}
                                                    className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        setValue("vendorName", s, { shouldValidate: true, shouldDirty: true });
                                                        setShowSuggestions(false);
                                                    }}
                                                >
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <MultiSelectCheckboxDropdown
                                    options={vendorTypeSelectOptions.map((option) => ({
                                        value: String(option.value),
                                        label: option.label,
                                    }))}
                                    selectedValues={selectedVendorTypeIds}
                                    onChange={setSelectedVendorTypeIds}
                                    placeholder="Select Vendor Types"
                                    error={vendorTypeTouched && selectedVendorTypeIds.length === 0 ? "Vendor Type is required" : undefined}
                                    onBlur={() => setVendorTypeTouched(true)}
                                />

                                {/* Optional fields */}
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">GST No</label>
                                    <input {...register('gstno')}
                                        placeholder="Enter GST No"
                                        className="input mt-1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">GST Document</label>
                                    <input
                                        ref={gstDocumentInputRef}
                                        type="file"
                                        className="input mt-1"
                                        disabled={isVendorSubmitting}
                                        onChange={(event) => {
                                            setGstDocumentFile(event.target.files?.[0] || null);
                                            setClearGstDocument(false);
                                        }}
                                    />
                                    {gstDocumentFile && (
                                        <div className="mt-1 flex items-center gap-2 text-xs">
                                            <span className="text-gray-600">Selected: {gstDocumentFile.name}</span>
                                            <button
                                                type="button"
                                                className="text-red-600"
                                                disabled={isVendorSubmitting}
                                                onClick={() => {
                                                    setGstDocumentFile(null);
                                                    if (gstDocumentInputRef.current) {
                                                        gstDocumentInputRef.current.value = "";
                                                    }
                                                }}
                                            >
                                                Remove selected file
                                            </button>
                                        </div>
                                    )}
                                    {!gstDocumentFile && gstDocument?.mediaUrl && (
                                        <div className="mt-1 flex items-center gap-2 text-xs">
                                            <a
                                                href={gstDocument.mediaUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 underline"
                                            >
                                                {gstDocument.fileName || "View current GST document"}
                                            </a>
                                            <button
                                                type="button"
                                                className="text-red-600"
                                                disabled={isVendorSubmitting}
                                                onClick={() => {
                                                    setGstDocument(null);
                                                    setGstDocumentFile(null);
                                                    setClearGstDocument(true);
                                                    if (gstDocumentInputRef.current) {
                                                        gstDocumentInputRef.current.value = "";
                                                    }
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Pan Card No</label>
                                    <input {...register("pancard")}
                                        placeholder="Enter PanCard No"
                                        className="input mt-1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Mobile No</label>
                                    <input {...register("mobileno")}
                                        placeholder="Enter Mobile No"
                                        className="input mt-1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Email</label>
                                    <input {...register("email")}
                                        placeholder="Enter Email"
                                        className="input mt-1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Contact Person</label>
                                    <input {...register("contactPerson")}
                                        placeholder="Enter Contact Person"
                                        className="input mt-1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Contact Number</label>
                                    <input {...register("contactNumber")}
                                        placeholder="Enter Contact Number"
                                        className="input mt-1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Payment Terms</label>
                                    <select {...register("paymentTermsId")} className="input mt-1">
                                        <option value="">Select Payment Terms</option>
                                        {(paymentTermsList || []).map((pt: any) => (
                                            <option key={pt.id} value={String(pt.id)}>
                                                {pt.termName || pt.description || `Term ${pt.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700">Status</label>
                                    <select {...register("activeFlag")} className="input mt-1">
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 mt-6">
                                    <input
                                        type="checkbox"
                                        checked={!!isInternalVendorValue}
                                        onChange={(e) => setValue("isInternalVendor", e.target.checked ? 1 : 0, { shouldDirty: true })}
                                        className="h-4 w-4"
                                    />
                                    <label className="block text-sm font-medium text-secondary-700">Internal Vendor</label>
                                </div>
                            </div>

                            <section className="mt-8 border-t pt-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Bank Details (Optional)</h3>
                                {bankDetails.map((bank) => (
                                    <div key={bank.clientId} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end border rounded-md p-4 mb-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                                            <input
                                                value={bank.bankName}
                                                onChange={(event) => updateBankDetail(bank.clientId, "bankName", event.target.value)}
                                                className="input mt-1"
                                                placeholder="Enter bank name"
                                                disabled={isVendorSubmitting}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Account No</label>
                                            <input
                                                value={bank.accountNo}
                                                onChange={(event) => updateBankDetail(bank.clientId, "accountNo", event.target.value)}
                                                className="input mt-1"
                                                placeholder="Enter account number"
                                                disabled={isVendorSubmitting}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                                            <input
                                                value={bank.ifscCode}
                                                onChange={(event) => updateBankDetail(bank.clientId, "ifscCode", event.target.value)}
                                                className="input mt-1"
                                                placeholder="Enter IFSC code"
                                                disabled={isVendorSubmitting}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-danger h-10"
                                            disabled={isVendorSubmitting}
                                            onClick={() => setBankDetails((current) => current.filter((item) => item.clientId !== bank.clientId))}
                                        >
                                            Remove Bank
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    disabled={isVendorSubmitting}
                                    onClick={() => setBankDetails((current) => [
                                        ...current,
                                        { clientId: createVendorRowId(), bankName: "", accountNo: "", ifscCode: "" },
                                    ])}
                                >
                                    + Add Bank
                                </button>
                            </section>

                            <section className="mt-8 border-t pt-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Certificates (Optional)</h3>
                                {certificates.map((certificate, index) => (
                                    <div key={certificate.clientId} className="border rounded-md p-4 mb-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-medium">Certificate {index + 1}</h4>
                                            <button
                                                type="button"
                                                className="btn btn-danger"
                                                disabled={isVendorSubmitting}
                                                onClick={() => setCertificates((current) => current.filter((item) => item.clientId !== certificate.clientId))}
                                            >
                                                Remove Certificate
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Certificate No</label>
                                                <input
                                                    value={certificate.certificateNo}
                                                    onChange={(event) => updateCertificate(certificate.clientId, "certificateNo", event.target.value)}
                                                    className="input mt-1"
                                                    placeholder="Enter certificate number"
                                                    disabled={isVendorSubmitting}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                                                <input
                                                    type="date"
                                                    value={certificate.expiryDate}
                                                    onChange={(event) => updateCertificate(certificate.clientId, "expiryDate", event.target.value)}
                                                    className="input mt-1"
                                                    disabled={isVendorSubmitting}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Type / Certificate Name</label>
                                                <input
                                                    value={certificate.type}
                                                    onChange={(event) => updateCertificate(certificate.clientId, "type", event.target.value)}
                                                    className="input mt-1"
                                                    placeholder="Enter certificate name"
                                                    disabled={isVendorSubmitting}
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700">Certificate Files</label>
                                            <input
                                                type="file"
                                                multiple
                                                className="input mt-1"
                                                disabled={isVendorSubmitting}
                                                onChange={(event) => {
                                                    const selectedFiles = Array.from(event.currentTarget.files || []);
                                                    if (selectedFiles.length) {
                                                        setCertificates((current) => current.map((item) =>
                                                            item.clientId === certificate.clientId
                                                                ? { ...item, pendingFiles: [...item.pendingFiles, ...selectedFiles] }
                                                                : item
                                                        ));
                                                    }
                                                    event.currentTarget.value = "";
                                                }}
                                            />
                                            {(certificate.files.length > 0 || certificate.pendingFiles.length > 0) && (
                                                <ul className="mt-2 space-y-1 text-sm">
                                                    {certificate.files.map((file, fileIndex) => (
                                                        <li key={`${file.mediaDetailSno}-${fileIndex}`} className="flex items-center gap-2">
                                                            {file.mediaUrl ? (
                                                                <a href={file.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                                                    {file.fileName || `File ${fileIndex + 1}`}
                                                                </a>
                                                            ) : (
                                                                <span>{file.fileName || `File ${fileIndex + 1}`}</span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                className="text-red-600"
                                                                disabled={isVendorSubmitting}
                                                                onClick={() => setCertificates((current) => current.map((item) =>
                                                                    item.clientId === certificate.clientId
                                                                        ? { ...item, files: item.files.filter((_, index) => index !== fileIndex) }
                                                                        : item
                                                                ))}
                                                            >
                                                                Remove
                                                            </button>
                                                        </li>
                                                    ))}
                                                    {certificate.pendingFiles.map((file, fileIndex) => (
                                                        <li key={`${file.name}-${fileIndex}`} className="flex items-center gap-2 text-gray-600">
                                                            <span>Selected: {file.name}</span>
                                                            <button
                                                                type="button"
                                                                className="text-red-600"
                                                                disabled={isVendorSubmitting}
                                                                onClick={() => setCertificates((current) => current.map((item) =>
                                                                    item.clientId === certificate.clientId
                                                                        ? { ...item, pendingFiles: item.pendingFiles.filter((_, index) => index !== fileIndex) }
                                                                        : item
                                                                ))}
                                                            >
                                                                Remove
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    disabled={isVendorSubmitting}
                                    onClick={() => setCertificates((current) => [
                                        ...current,
                                        {
                                            clientId: createVendorRowId(),
                                            certificateNo: "",
                                            expiryDate: "",
                                            type: "",
                                            files: [],
                                            pendingFiles: [],
                                        },
                                    ])}
                                >
                                    + Add Certificate
                                </button>
                            </section>

                            {/* Address Details */}
                            <div className="h-10"></div>
                            <div className="mt-10">
                                <h3 className="font-semibold">Address Details
                                    <button type="button"
                                        onClick={handleAddAddress} className="ml-2 bg-primary text-white px-2 py-1 rounded">
                                        + Add Address
                                    </button>
                                </h3>
                                <table className="w-full border mt-4">
                                    <thead>
                                        <tr className="bg-gray-200">
                                            <th>SL.NO</th>
                                            <th>Line 1</th>
                                            <th>Line 2</th>
                                            <th>Country</th>
                                            <th>State</th>
                                            <th>City</th>
                                            <th>State Code</th>
                                            <th>Pin Code</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {addressDetails?.map((item: any, index: any) => {
                                            const countryKey = String(item.countryId ?? "").trim();
                                            const stateKey = String(item.stateId ?? "").trim();
                                            const availableStates = getStatesForCountry(countryKey);
                                            const availableCities = getCitiesForState(stateKey);
                                            return (
                                                <tr key={item.id} className="border">
                                                    <td className="p-2">{index + 1}</td>

                                                    {/* Line 1 */}
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            value={item.line1}
                                                            onChange={e => {
                                                                const updated = addressDetails.map((addr, i) =>
                                                                    i === index ? { ...addr, line1: e.target.value } : addr
                                                                );
                                                                setAddressDetails(updated);
                                                            }}
                                                            className="border p-1 w-full"
                                                        />
                                                    </td>

                                                    {/* Line 2 */}
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            value={item.line2}
                                                            onChange={e => {
                                                                const updated = addressDetails.map((addr, i) =>
                                                                    i === index ? { ...addr, line2: e.target.value } : addr
                                                                );
                                                                setAddressDetails(updated);
                                                            }}
                                                            className="border p-1 w-full"
                                                        />
                                                    </td>

                                                    {/* Country */}
                                                    <td className="p-2 w-56 ">
                                                        <CommonSearchableSelect
                                                            options={(countryList || []).map((country: any) => ({
                                                                value: String(country.id),
                                                                label: country.countryName,
                                                                isActive: country.isActive !== false && country.activeFlag !== false
                                                            }))}
                                                            placeholder="Select Country"
                                                            value={item.countryId ? String(item.countryId) : ""}
                                                            onChange={(value: string) => handleCountryChange(index, value)}
                                                        />
                                                    </td>

                                                    {/* State */}
                                                    <td className="p-2 w-56">
                                                        {item.countryId ? (
                                                            <CommonSearchableSelect
                                                                options={(availableStates || []).map((state: any) => ({
                                                                    value: String(state.id),
                                                                    label: state.stateName || state.name || `State ${state.id}`,
                                                                    isActive: state.isActive !== false && state.activeFlag !== false
                                                                }))}
                                                                placeholder="Select State"
                                                                value={item.stateId ? String(item.stateId) : ""}
                                                                onChange={(value: string) => handleStateChange(index, value)}
                                                            />
                                                        ) : (
                                                            <CommonSearchableSelect
                                                                options={[]}
                                                                placeholder="Select Country first"
                                                                value=""

                                                            />
                                                        )}
                                                    </td>

                                                    {/* City */}
                                                    <td className="p-2 w-56">
                                                        {item.stateId ? (
                                                            <CommonSearchableSelect
                                                                options={(availableCities || []).map((city: any) => ({
                                                                    value: String(city.id),
                                                                    label: city.cityName || city.name || `City ${city.id}`,
                                                                    isActive: city.isActive !== false && city.activeFlag !== false
                                                                }))}
                                                                placeholder="Select City"
                                                                value={item.cityId ? String(item.cityId) : ""}
                                                                onChange={(value: string) => {
                                                                    const updated = [...addressDetails];
                                                                    updated[index].cityId = value;
                                                                    setAddressDetails(updated);
                                                                }}
                                                            />
                                                        ) : (
                                                            <CommonSearchableSelect
                                                                options={[]}
                                                                placeholder="Select State first"
                                                                value=""
                                                            //   isDisabled={true}
                                                            />
                                                        )}
                                                    </td>
                                                    {/* State Code - read-only */}
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            value={item.stateCode}
                                                            readOnly
                                                            className="border p-1 w-full bg-gray-100"
                                                            placeholder="State Code"
                                                        />
                                                    </td>


                                                    {/* Pin Code */}
                                                    <td className="p-2">
                                                        <input
                                                            type="text"
                                                            value={item.pinCode || ""}
                                                            onChange={e => {
                                                                const val = e.target.value.replace(/\D/g, ""); // numeric only
                                                                if (val.length <= 6) {
                                                                    const updated = [...addressDetails];
                                                                    updated[index].pinCode = val;
                                                                    setAddressDetails(updated);
                                                                }
                                                            }}
                                                            className="border p-1 w-full"
                                                            placeholder="6-digit PIN"
                                                        />
                                                    </td>


                                                    <td className="p-2">
                                                        <Trash className="text-red-500 cursor-pointer" onClick={() => handleDeleteAddress(item.id)} />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                {/* <button type="submit" className="btn btn-primary">
                                    {isEditing ? 'Update Vendor' : 'Add Vendor'}
                                </button> */}

                                <button
                                    type="submit"
                                    className={`btn 
                                        ${!isValid || isVendorSubmitting
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover: dark:bg-gray-600 dark:text-gray-400'
                                            : 'btn-primary hover:bg-blue-700'
                                        }
                                        transition-colors duration-200
                                    `}
                                    disabled={!isValid || isVendorSubmitting}
                                    title={!isValid ? "Please fill all required fields" : ""}
                                >
                                    {isVendorSubmitting ? "Saving..." : isEditing ? "Update Vendor" : "Add Vendor"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {/* View Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Vendor Details"
            >
                {currentVendor && (
                    <div className="space-y-4">
                        <div className="flex gap-6 items-center">
                            {currentVendor.photoUrl && (
                                <img
                                    src={currentVendor.photoUrl}
                                    alt={currentVendor.vendorName}
                                    className="w-32 h-32 object-cover rounded-lg shadow"
                                />
                            )}
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm text-secondary-500 font-medium">
                                        Supplier/Vendor Name: <span className="text-md font-bold text-gray-900">{currentVendor.vendorName}</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500 font-medium">
                                        Mobile: <span className="text-md font-bold text-gray-900">{currentVendor.mobileno}</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-secondary-500 font-medium">
                                        Email: <span className="text-md font-bold text-gray-900">{currentVendor.email}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div>
                                <p className="text-sm text-secondary-500">GST NO</p>
                                <p className="font-medium">{currentVendor.gstno}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Status</p>
                                <p>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs ${currentVendor.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                            }`}
                                    >
                                        {currentVendor.activeFlag ? "Active" : "Inactive"}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Pancard No</p>
                                <p className="font-medium">{currentVendor.pancard}</p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">Payment Terms</p>
                                <p className="font-medium">
                                    {(paymentTermsList || []).find((pt: any) => String(pt.id) === String(currentVendor.paymentTermsId))?.termName || '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-secondary-500">GST Document</p>
                                {currentVendor.gstDocument?.mediaUrl ? (
                                    <a
                                        href={currentVendor.gstDocument.mediaUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-blue-600 underline"
                                    >
                                        {currentVendor.gstDocument.fileName || "View GST document"}
                                    </a>
                                ) : <p className="font-medium">-</p>}
                            </div>
                        </div>

                        {(Array.isArray(currentVendor.bankDetails) && currentVendor.bankDetails.length > 0) && (
                            <div className="pt-4 border-t border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Bank Details</h3>
                                {currentVendor.bankDetails.map((bank: VendorBankDetail, index: number) => (
                                    <div key={bank.id ?? index} className="grid grid-cols-3 gap-4 mb-3">
                                        <div>
                                            <p className="text-sm text-secondary-500">Bank Name</p>
                                            <p className="font-medium">{bank.bankName || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-secondary-500">Account No</p>
                                            <p className="font-medium">{bank.accountNo || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-secondary-500">IFSC Code</p>
                                            <p className="font-medium">{bank.ifscCode || "-"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(Array.isArray(currentVendor.certificates) && currentVendor.certificates.length > 0) && (
                            <div className="pt-4 border-t border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Certificates</h3>
                                {currentVendor.certificates.map((certificate: VendorCertificate, index: number) => (
                                    <div key={certificate.id ?? index} className="border rounded-md p-3 mb-3">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-sm text-secondary-500">Certificate No</p>
                                                <p className="font-medium">{certificate.certificateNo || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-secondary-500">Expiry Date</p>
                                                <p className="font-medium">{certificate.expiryDate || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-secondary-500">Type / Certificate Name</p>
                                                <p className="font-medium">{certificate.type || "-"}</p>
                                            </div>
                                        </div>
                                        {certificate.files?.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-sm text-secondary-500">Files</p>
                                                <ul className="list-disc list-inside">
                                                    {certificate.files.map((file, fileIndex) => (
                                                        <li key={`${file.mediaDetailSno}-${fileIndex}`}>
                                                            {file.mediaUrl ? (
                                                                <a href={file.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                                                    {file.fileName || `File ${fileIndex + 1}`}
                                                                </a>
                                                            ) : (file.fileName || `File ${fileIndex + 1}`)}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Address Details Section */}
                        <div className="pt-4 border-t border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 mb-3">Address Details</h3>
                            {/* Safe handling of address - convert to array if needed */}
                            {(Array.isArray(currentVendor.address) ? currentVendor.address : currentVendor.address ? [currentVendor.address] : []).map((addr: AddressDetail, index: number) => (
                                <div key={index} className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-secondary-500">Address Line 1</p>
                                        <p className="font-medium">{addr.line1}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-secondary-500">Address Line 2</p>
                                        <p className="font-medium">{addr.line2 || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-secondary-500">City</p>
                                        <p className="font-medium">
                                            {cityList.find((city: any) => city.id === addr.cityId)?.cityName || `City ID: ${addr.cityId}`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-secondary-500">State</p>
                                        <p className="font-medium">
                                            {stateList.find((state: any) => state.id === addr.stateId)?.stateName || `State ID: ${addr.stateId}`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-secondary-500">Country</p>
                                        <p className="font-medium">
                                            {countryList.find((country: any) => country.id === addr.countryId)?.countryName || `Country ID: ${addr.countryId}`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-secondary-500">Status</p>
                                        <p>
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs ${addr.activeFlag ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                            >
                                                {addr.activeFlag ? "Active" : "Inactive"}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                            {((currentVendor?.vendorTypeDisplay || currentVendor?.vendorType || "").toLowerCase().includes("sizing")) ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsViewModalOpen(false);
                                        handleOpenSizingRatesModal(currentVendor);
                                    }}
                                    className="btn btn-primary hover:bg-blue-700 text-white flex items-center gap-1.5 text-xs py-1.5 px-3 rounded shadow"
                                >
                                    <IndianRupee className="h-4 w-4" />
                                    Sizing Rates & Revision History
                                </button>
                            ) : <div></div>}
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

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete">
                <div className="space-y-4">
                    <p>Are you sure you want to delete Vendor"{currentVendor?.vendorName}"?</p>
                    {/* <p className="text-red-600 text-sm">This action cannot be undone.</p> */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-secondary">Cancel</button>
                        <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
                    </div>
                </div>
            </Modal>

            {/* Sizing Jobwork Rates & Revision History Modal - Flexible & Big size (5xl) with Primary App Color Theme */}
            <Modal
                isOpen={isSizingRateModalOpen}
                onClose={() => setIsSizingRateModalOpen(false)}
                title={`Sizing Rates & Revision History - ${sizingVendor?.vendorName || ''}`}
                size="5xl"
            >
                <div className="space-y-6 p-1">
                    {/* Header info banner matching app primary theme */}
                    <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Vendor Sizing Master</p>
                            <h4 className="text-lg font-bold text-blue-950">{sizingVendor?.vendorName}</h4>
                            <p className="text-xs text-blue-700 mt-0.5">
                                Vendor Type: <span className="font-semibold">{sizingVendor?.vendorTypeDisplay || "Sizing Jobwork"}</span>
                            </p>
                        </div>
                        <div className="flex gap-2.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setSizingRateTab("active");
                                    if (sizingVendor?.id) loadSizingRatesData(sizingVendor.id);
                                }}
                                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
                                    sizingRateTab === "active"
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-100/70"
                                }`}
                            >
                                <IndianRupee className="h-4 w-4" />
                                Active Rates ({activeSizingRates.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSizingRateTab("history");
                                    if (sizingVendor?.id) loadSizingRatesData(sizingVendor.id, historyFilterCount);
                                }}
                                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
                                    sizingRateTab === "history"
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-100/70"
                                }`}
                            >
                                <History className="h-4 w-4" />
                                Revision History ({sizingRateHistory.length})
                            </button>
                        </div>
                    </div>

                    {/* Form Section to Fix / Revise Sizing Rate */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                            <Plus className="h-4 w-4 text-blue-600" />
                            Fix / Revise Sizing Rate against Count
                        </h4>
                        <form onSubmit={handleSaveSizingRate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Yarn Count <span className="text-red-500">*</span>
                                </label>
                                <CommonSearchableSelect
                                    options={yarnCountOptions.map((countStr) => ({
                                        value: countStr,
                                        label: countStr,
                                    }))}
                                    placeholder="Select Yarn Count"
                                    value={rateFormCount}
                                    onChange={(value: string) => setRateFormCount(value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Sizing Rate (₹) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-2 text-slate-400 text-xs">₹</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={rateFormRate}
                                        onChange={(e) => setRateFormRate(e.target.value)}
                                        className="w-full pl-6 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Effective Date
                                </label>
                                <input
                                    type="date"
                                    value={rateFormEffectiveDate}
                                    onChange={(e) => setRateFormEffectiveDate(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    disabled={rateFormSubmitting}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow transition-all flex items-center justify-center gap-1.5 disabled:bg-slate-400 cursor-pointer"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    {rateFormSubmitting ? "Saving..." : "Save / Revise Rate"}
                                </button>
                            </div>
                        </form>
                        <p className="text-[11px] text-slate-500 mt-2 italic">
                            * Note: If a sizing rate is already fixed for this Yarn Count, submitting a new rate will automatically preserve the previous rate in historical history with audit tracking.
                        </p>
                    </div>

                    {/* Tab 1: Current Active Rates */}
                    {sizingRateTab === "active" && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                <IndianRupee className="h-4 w-4 text-blue-600" />
                                Current Active Sizing Rates
                            </h4>

                            {rateLoading ? (
                                <div className="text-center py-6 text-slate-500 text-xs">Loading rates...</div>
                            ) : activeSizingRates.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-500 text-xs">
                                    No active sizing rates fixed for this vendor yet. Use the form above to add a sizing rate.
                                </div>
                            ) : (
                                <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
                                    <table className="w-full text-xs text-left text-slate-700">
                                        <thead className="bg-primary text-white font-bold uppercase tracking-wider text-[11px] border-b">
                                            <tr>
                                                <th className="px-3 py-2.5">S.No</th>
                                                <th className="px-3 py-2.5">Yarn Count</th>
                                                <th className="px-3 py-2.5 text-right">Sizing Rate (₹)</th>
                                                <th className="px-3 py-2.5">Effective Date</th>
                                                <th className="px-3 py-2.5">Created / Revised By</th>
                                                <th className="px-3 py-2.5">Last Updated</th>
                                                <th className="px-3 py-2.5 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 bg-white">
                                            {activeSizingRates.map((item, idx) => (
                                                <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                                                    <td className="px-3 py-2 font-medium text-slate-500">{idx + 1}</td>
                                                    <td className="px-3 py-2 font-bold text-blue-950">{item.yarnCount}</td>
                                                    <td className="px-3 py-2 text-right font-extrabold text-emerald-700 text-sm">
                                                        ₹{Number(item.sizingRate).toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2 font-medium">{item.effectiveDate || "-"}</td>
                                                    <td className="px-3 py-2">
                                                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                                                            <User className="h-3 w-3 text-slate-500" />
                                                            {item.updatedBy || item.createdBy || "Admin"}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-500 text-[11px]">
                                                        {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "-"}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditRateForm(item)}
                                                                className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded border border-amber-200 text-[11px] font-medium transition cursor-pointer"
                                                                title="Revise this rate"
                                                            >
                                                                Revise
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleViewCountHistory(item.yarnCount)}
                                                                className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
                                                                title="View revision history for this count"
                                                            >
                                                                <History className="h-3 w-3" />
                                                                History
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteSizingRateRecord(item.id)}
                                                                className="p-1 text-red-600 hover:bg-red-50 rounded border border-red-100 transition cursor-pointer"
                                                                title="Delete rate entry"
                                                            >
                                                                <Trash className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Full Historical Revision Log */}
                    {sizingRateTab === "history" && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                    <History className="h-4 w-4 text-blue-600" />
                                    Rate Revision History Log
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-600 font-medium">Filter by Yarn Count:</span>
                                    <select
                                        value={historyFilterCount}
                                        onChange={(e) => {
                                            const selected = e.target.value;
                                            setHistoryFilterCount(selected);
                                            if (sizingVendor?.id) {
                                                dispatch(fetchVendorSizingRateHistory({ vendorId: sizingVendor.id, yarnCount: selected })).then((res: any) => {
                                                    if (res.payload) setSizingRateHistory(Array.isArray(res.payload) ? res.payload : []);
                                                });
                                            }
                                        }}
                                        className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                        <option value="">All Yarn Counts</option>
                                        {Array.from(new Set([...activeSizingRates.map(r => r.yarnCount), ...sizingRateHistory.map(h => h.yarnCount)])).map(count => (
                                            <option key={count} value={count}>{count}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {rateLoading ? (
                                <div className="text-center py-6 text-slate-500 text-xs">Loading rate history...</div>
                            ) : sizingRateHistory.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-500 text-xs">
                                    No historical rate revisions found for this selection.
                                </div>
                            ) : (
                                <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm max-h-96">
                                    <table className="w-full text-xs text-left text-slate-700">
                                        <thead className="bg-primary text-white font-bold uppercase tracking-wider text-[11px] border-b sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2.5">S.No</th>
                                                <th className="px-3 py-2.5">Yarn Count</th>
                                                <th className="px-3 py-2.5 text-right">Sizing Rate (₹)</th>
                                                <th className="px-3 py-2.5">Effective Date</th>
                                                <th className="px-3 py-2.5">Status</th>
                                                <th className="px-3 py-2.5">Updated By</th>
                                                <th className="px-3 py-2.5">Updated At</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 bg-white">
                                            {sizingRateHistory.map((item, idx) => (
                                                <tr key={item.id} className={item.activeFlag ? "bg-blue-50/30 font-medium" : "hover:bg-slate-50"}>
                                                    <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                                                    <td className="px-3 py-2 font-bold text-slate-900">{item.yarnCount}</td>
                                                    <td className="px-3 py-2 text-right font-bold text-slate-900">
                                                        ₹{Number(item.sizingRate).toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2">{item.effectiveDate || "-"}</td>
                                                    <td className="px-3 py-2">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                item.activeFlag
                                                                    ? "bg-green-100 text-green-800 border border-green-200"
                                                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                                            }`}
                                                        >
                                                            {item.activeFlag ? "Active Current" : "Revised (History)"}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                                                            <User className="h-3 w-3 text-slate-500" />
                                                            {item.updatedBy || item.createdBy || "Admin"}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-500 text-[11px]">
                                                        {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : (item.createdAt ? new Date(item.createdAt).toLocaleString() : "-")}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={() => setIsSizingRateModalOpen(false)}
                            className="btn btn-secondary text-xs"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}