import { useEffect, useMemo, useState, ChangeEvent, useRef } from "react";
import { FileText, ClipboardList, Plus, Save, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllSizingJobWorkOrders, getAllSizingJobWorkOrdersByFactoryCompanyId } from "@/state/sizingJobWorkOrderSlice";
import { createFlangeInward, updateFlangeInward, getAllFlangeInwards, getFlangeInwardsByFactoryCompanyId } from "@/state/flangeInwardSlice";
import { documentNumberService } from "@/services/DocumentNumberService";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import { getAllBeamInward } from "@/state/beamInwardSlice";
import { getIssuedFlangeNos } from "@/state/flangeIssueSlice";
import { useDocumentNumber } from "@/hooks/UseDocumentNumberReturn";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import { toast } from "react-toastify";

interface FlangeInwardFormData {
    flangeInwardNo: string;
    beamInwardDate: string;
    buyerKey?: string;
    sizingJobWorkOrderId?: string;
}

interface FlangeRow {
    id?: number | string;
    flangeNo: string;
    flangeId?: string;
}

interface PendingFlangeRow {
    tempId: string;
    flangeNo: string;
    flangeId?: string;
}

const createPendingFlangeRow = (): PendingFlangeRow => ({
    tempId: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    flangeNo: "",
    flangeId: "",
});

const resolveStoredCompanyId = () => {
    try {
        const direct = localStorage.getItem("selectedCompanyId");
        if (direct) {
            const directNumber = Number(direct);
            if (!Number.isNaN(directNumber)) return directNumber;
            const parsedDirect = JSON.parse(direct);
            const parsedValue = Number(parsedDirect?.id ?? parsedDirect?.companyId);
            if (!Number.isNaN(parsedValue)) return parsedValue;
        }
        const fallback = localStorage.getItem("selectedCompany");
        if (fallback) {
            const fallbackNumber = Number(fallback);
            if (!Number.isNaN(fallbackNumber)) return fallbackNumber;
            const parsedFallback = JSON.parse(fallback);
            const parsedValue = Number(parsedFallback?.id ?? parsedFallback?.companyId);
            if (!Number.isNaN(parsedValue)) return parsedValue;
        }
    } catch { }
    return null;
};

const FlangeInwardEntry = () => {
    const { sizingJobWorkOrderList } = useSelector((state: RootState) => state.sizingJobWorkOrder as any);
    const { customerList } = useSelector((state: RootState) => state.customer as any);
    const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
    const { issuedFlangesList } = useSelector((state: RootState) => state.flangeIssue as any);
    const { beamInwardList: masterBeamInwardList } = useSelector((state: RootState) => state.beamInward as any);
    const { list: flangeInwardList } = useSelector((state: RootState) => state.flangeInward as any);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const location = useLocation();
    const extractArray = (data: any) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        return [];
    };
    const normalizedCustomers = useMemo(() => extractArray(customerList), [customerList]);
    const normalizedCompanies = useMemo(() => extractArray(companyMasterList), [companyMasterList]);
    const normalizedSizingOrders = useMemo(() => extractArray(sizingJobWorkOrderList), [sizingJobWorkOrderList]);

    const getEntityLabel = (entities: any[], ids: Array<string | number | null | undefined>, keys: string[]) => {
        for (const candidate of ids) {
            if (candidate == null || candidate === "") continue;
            const match = entities.find((entry: any) => String(entry.id) === String(candidate));
            if (match) {
                for (const key of keys) {
                    const value = match[key];
                    if (value) return String(value);
                }
            }
        }
        return "-";
    };
    const sizingOrdersMeta = useMemo(
        () =>
            normalizedSizingOrders
                .filter((order: any) => order.isActive !== false || String(order.id) === String(beamInwardDtl?.sizingJobWorkOrderId || beamInwardDtl?.sizingOrderId))
                .map((order: any) => {
                const orderTypeValue = Number(order?.orderTypeId ?? 0);
                const isInternal = orderTypeValue === 1;
                const buyerCandidates = isInternal
                    ? [order?.tradingCompanyId, order?.buyerId, order?.companyId, order?.factoryCompanyId]
                    : [order?.buyerId, order?.customerId, order?.consigneeId];
                const buyerLabel =
                    getEntityLabel(
                        isInternal ? normalizedCompanies : normalizedCustomers,
                        buyerCandidates,
                        isInternal ? ["companyName", "name", "customerName"] : ["customerName", "buyerName", "name", "companyName"]
                    ) || order?.buyerName || order?.customerName || order?.consigneeName || "-";
                const orderNo =
                    order?.sizingWorkOrderNo ||
                    order?.sizingJobWorkOrderNo ||
                    order?.jobWorkOrderNo ||
                    order?.orderNo ||
                    `SO-${order?.id ?? ""}`;
                const buyerKeyBase = buyerCandidates.find((value) => value != null && value !== "");
                return {
                    ...order,
                    orderTypeId: orderTypeValue,
                    buyerKey: `${isInternal ? "1" : "2"}-${buyerKeyBase ?? order?.id ?? ""}`,
                    buyerLabel,
                    orderNo,
                };
            }),
        [normalizedSizingOrders, normalizedCompanies, normalizedCustomers]
    );
    const buyerOptions = useMemo(() => {
        const map = new Map<string, string>();
        sizingOrdersMeta.forEach((order: any) => {
            if (!order?.buyerKey) return;
            if (!map.has(order.buyerKey)) map.set(order.buyerKey, order.buyerLabel || "-");
        });
        return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
    }, [sizingOrdersMeta]);
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FlangeInwardFormData>();
    const buyerField = register("buyerKey", { required: "Buyer Name is required" });
    const sizingOrderField = register("sizingJobWorkOrderId", { required: "Sizing Order No is required" });
    const buyerKeyWatch = watch("buyerKey");
    const sizingOrderWatch = watch("sizingJobWorkOrderId");
    const beamInwardDateWatch = watch("beamInwardDate");
    const buyerSelectionMeta = useMemo(() => {
        if (!buyerKeyWatch) return null;
        const separatorIndex = buyerKeyWatch.indexOf("-");
        if (separatorIndex <= 0) return null;
        const prefix = buyerKeyWatch.slice(0, separatorIndex);
        const idPart = buyerKeyWatch.slice(separatorIndex + 1);
        const numericId = Number(idPart);
        if (!Number.isFinite(numericId)) return null;
        const typeId = prefix === "1" ? 1 : prefix === "2" ? 2 : null;
        return { typeId, numericId };
    }, [buyerKeyWatch]);

    const beamInwardDtlFromState = location.state?.beamInwardDtl;
    const initialBeamInwardDtl = useMemo(() => {
        if (beamInwardDtlFromState) return beamInwardDtlFromState;
        try {
            const stored = sessionStorage.getItem("flangeInwardEdit");
            if (stored) return JSON.parse(stored);
        } catch { }
        return null;
    }, [beamInwardDtlFromState]);
    const [beamInwardDtl, setBeamInwardDtl] = useState<any>(initialBeamInwardDtl);
    const isEditMode = !!beamInwardDtl;
    // const [flangeInwardNo, setflangeInwardNo] = useState("");
    // const [isflangeInwardNoLoading, setIsflangeInwardNoLoading] = useState(false);
    const [orderTypeId, setOrderTypeId] = useState<string>("");
    const [orderPrefilled, setOrderPrefilled] = useState(false);
    const [flangeItems, setFlangeItems] = useState<FlangeRow[]>([]);
    const [pendingFlangeRows, setPendingFlangeRows] = useState<PendingFlangeRow[]>([]);
    const [showAddFlangeForm, setShowAddFlangeForm] = useState(false);
    const resolvedBuyerId = useMemo(() => {
        if (!buyerSelectionMeta?.numericId) return null;
        const normalizedOrderType = orderTypeId || String(buyerSelectionMeta.typeId || "");
        if (normalizedOrderType === "1") {
            const matched = normalizedCompanies.find((company: any) => String(company?.id) === String(buyerSelectionMeta.numericId));
            if (matched?.id != null) return Number(matched.id);
        }
        if (normalizedOrderType === "2") {
            const matched = normalizedCustomers.find((customer: any) => String(customer?.id) === String(buyerSelectionMeta.numericId));
            if (matched?.id != null) return Number(matched.id);
        }
        return null;
    }, [buyerSelectionMeta, orderTypeId, normalizedCompanies, normalizedCustomers]);
    const issuedFlangeOptions = useMemo(() => {
        const raw = Array.isArray(issuedFlangesList) ? issuedFlangesList : [];
        const normalized = raw
            .filter((entry: any) => {
                const resolvedId = entry?.flangeId ?? entry?.id ?? entry?.flange_id;
                const isSelected = flangeItems.some(item => String(item.flangeId) === String(resolvedId));
                return entry.isActive !== false || isSelected;
            })
            .map((entry: any) => {
                const resolvedId = entry?.flangeId ?? entry?.id ?? entry?.flange_id;
                const flangeNoCandidates = [entry?.flangeNo, entry?.flange_no, entry?.flangeNumber, entry?.flange_name];
                const resolvedNo = flangeNoCandidates.find((value) => value != null && value !== "") ?? "";
                return {
                    flangeId: resolvedId != null ? String(resolvedId) : "",
                    flangeNo: resolvedNo ? String(resolvedNo) : "",
                };
            })
            .filter((entry) => entry.flangeId && entry.flangeNo);
        const unique = new Map<string, { flangeId: string; flangeNo: string }>();
        normalized.forEach((entry) => {
            if (!unique.has(entry.flangeId)) unique.set(entry.flangeId, entry);
        });
        return Array.from(unique.values());
    }, [issuedFlangesList]);

    const isSavingRef = useRef(false);
    const hasGeneratedNumberRef = useRef(false);

    // Generate document number for new beam inward entries
    useEffect(() => {
        const generateDocumentNumber = async () => {
            if (beamInwardDtlFromState || hasGeneratedNumberRef.current) {
                return;
            }

            try {
                const result = await documentNumberService.generateDocumentNumber({
                    screenName: 'Sizing Flange Inward'
                });

                setValue('flangeInwardNo', result.documentNumber, { shouldValidate: true });
                hasGeneratedNumberRef.current = true;
            } catch (error) {
                console.error('Failed to generate beam inward number:', error);
                toast.error('Failed to generate beam inward number');
            }
        };

        generateDocumentNumber();
    }, [beamInwardDtlFromState, setValue]);

    // Cleanup document number cache if not saved
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasGeneratedNumberRef.current && !isSavingRef.current && !beamInwardDtlFromState) {
                documentNumberService.clearMemoryCache('Sizing Flange Inward');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (hasGeneratedNumberRef.current && !isSavingRef.current && !beamInwardDtlFromState) {
                documentNumberService.clearMemoryCache('Sizing Flange Inward');
            }
        };
    }, [beamInwardDtlFromState]);


    useEffect(() => {
        setValue('flangeInwardNo', beamInwardDtlFromState?.flangeInwardNo || '');
    }, [beamInwardDtlFromState, setValue]);


    const beamOrderTypeMap = useMemo(() => {
        const raw = extractArray(masterBeamInwardList);
        const map = new Map<string, string>();
        raw.forEach((entry: any) => {
            if (entry?.id != null && entry?.orderTypeId != null) map.set(String(entry.id), String(entry.orderTypeId));
        });
        return map;
    }, [masterBeamInwardList]);
    useEffect(() => {
        const companyId = resolveStoredCompanyId();
        if (companyId) {
            dispatch(getAllSizingJobWorkOrdersByFactoryCompanyId({ factoryCompanyId: companyId }) as any);
            dispatch(getIssuedFlangeNos({ issuedCompanyId: companyId }) as any);
            dispatch(getFlangeInwardsByFactoryCompanyId({ companyId, fetchAll: true } as any));
        } else {
            dispatch(getAllSizingJobWorkOrders({} as any));
            dispatch(getAllFlangeInwards({ fetchAll: true } as any));
        }
        dispatch(getAllCustomers({fetchAll: true} as any));
        dispatch(getAllCompanies({fetchAll : true} as any));
        dispatch(getAllBeamInward({} as any));
    }, [dispatch]);
    useEffect(() => {
        if (beamInwardDtlFromState) {
            setBeamInwardDtl(beamInwardDtlFromState);
            try {
                sessionStorage.setItem("flangeInwardEdit", JSON.stringify(beamInwardDtlFromState));
            } catch { }
        }
    }, [beamInwardDtlFromState]);
    // useEffect(() => {
    //   // The hook handles generation automatically via shouldGenerateOnMount
    //   // We don't need to manually generate anymore
    // }, [beamInwardDtl, flangeInwardList]);

    useEffect(() => {
        const rawDate = beamInwardDtl?.flangeInwardDate ?? beamInwardDtl?.beamInwardDate;
        const dateValue = rawDate ? new Date(rawDate) : new Date();
        setValue("beamInwardDate", dateValue.toISOString().split("T")[0]);
    }, [beamInwardDtl, setValue]);
    useEffect(() => {
        if (!beamInwardDtl) {
            setFlangeItems([]);
            return;
        }
        const source = Array.isArray(beamInwardDtl.beamInwardBeamDetails)
            ? beamInwardDtl.beamInwardBeamDetails
            : Array.isArray(beamInwardDtl.flangeDetails)
                ? beamInwardDtl.flangeDetails
                : [];
        if (source.length) {
            setFlangeItems(
                source.map((entry: any) => ({
                    id: entry.id != null ? entry.id : undefined,
                    flangeNo: entry.flangeNo ? String(entry.flangeNo) : "",
                    flangeId: entry.flangeId != null ? String(entry.flangeId) : "",
                }))
            );
        } else {
            setFlangeItems([]);
        }
    }, [beamInwardDtl]);
    useEffect(() => {
        if (!beamInwardDtl || orderPrefilled) return;
        const existingOrderId =
            beamInwardDtl.sizingJobWorkOrderId ??
            beamInwardDtl.sizingJobWorkOrder?.id ??
            beamInwardDtl.sizingOrderId;
        if (existingOrderId) {
            const idStr = String(existingOrderId);
            setValue("sizingJobWorkOrderId", idStr);
            const matchedOrder = sizingOrdersMeta.find((order: any) => String(order.id) === idStr);
            if (matchedOrder?.buyerKey) {
                setValue("buyerKey", matchedOrder.buyerKey);
                setOrderTypeId(String(matchedOrder.orderTypeId ?? ""));
            } else if (beamInwardDtl.orderTypeId) {
                setOrderTypeId(String(beamInwardDtl.orderTypeId));
            }
        } else if (beamInwardDtl.orderTypeId) {
            setOrderTypeId(String(beamInwardDtl.orderTypeId));
        } else if (beamInwardDtl.beamInwardId != null) {
            const fromMap = beamOrderTypeMap.get(String(beamInwardDtl.beamInwardId));
            if (fromMap) setOrderTypeId(fromMap);
        }
        setOrderPrefilled(true);
    }, [beamInwardDtl, orderPrefilled, setValue, sizingOrdersMeta, beamOrderTypeMap]);
    useEffect(() => {
        if (!sizingOrderWatch) {
            if (!beamInwardDtl || orderPrefilled) setOrderTypeId("");
            return;
        }
        const matchedOrder = sizingOrdersMeta.find((order: any) => String(order.id) === String(sizingOrderWatch));
        if (matchedOrder) {
            setOrderTypeId(String(matchedOrder.orderTypeId ?? ""));
            if (matchedOrder.buyerKey && matchedOrder.buyerKey !== buyerKeyWatch) {
                setValue("buyerKey", matchedOrder.buyerKey);
            }
        }
    }, [sizingOrderWatch, sizingOrdersMeta, buyerKeyWatch, setValue, beamInwardDtl, orderPrefilled]);
    const buyerOptionsBySelection = useMemo(() => {
        if (!buyerKeyWatch) return sizingOrdersMeta;
        return sizingOrdersMeta.filter((order: any) => order.buyerKey === buyerKeyWatch);
    }, [buyerKeyWatch, sizingOrdersMeta]);
    const handleBuyerChange = (e: ChangeEvent<HTMLSelectElement>) => {
        buyerField.onChange(e);
        setValue("sizingJobWorkOrderId", "");
        setOrderTypeId("");
        setFlangeItems([]);
    };
    const handleSizingOrderChange = (e: ChangeEvent<HTMLSelectElement>) => {
        sizingOrderField.onChange(e);
        setFlangeItems([]);
    };
    const handleShowAddFlangeForm = () => {
        if (!orderTypeId) {
            alert("Select Order Type first");
            return;
        }
        setPendingFlangeRows([createPendingFlangeRow()]);
        setShowAddFlangeForm(true);
    };
    const handleAddPendingRow = () => {
        setPendingFlangeRows((rows) => [...rows, createPendingFlangeRow()]);
    };
    const handleRemovePendingRow = (tempId: string) => {
        setPendingFlangeRows((rows) => {
            if (rows.length === 1) return [createPendingFlangeRow()];
            return rows.filter((row) => row.tempId !== tempId);
        });
    };
    const handlePendingInputChange = (tempId: string, value: string) => {
        setPendingFlangeRows((rows) => rows.map((row) => (row.tempId === tempId ? { ...row, flangeNo: value } : row)));
    };
    const handlePendingSelectChange = (tempId: string, value: string) => {
        const selected = issuedFlangeOptions.find((fl: any) => String(fl.flangeId) === value);
        setPendingFlangeRows((rows) =>
            rows.map((row) =>
                row.tempId === tempId
                    ? {
                        ...row,
                        flangeId: value,
                        flangeNo: selected ? String(selected.flangeNo || "") : "",
                    }
                    : row
            )
        );
    };
    const handleCancelPendingRows = () => {
        setPendingFlangeRows([]);
        setShowAddFlangeForm(false);
    };
    const handleSavePendingRows = () => {
        if (!orderTypeId) {
            alert("Select Order Type first");
            return;
        }
        if (!pendingFlangeRows.length) {
            setShowAddFlangeForm(false);
            return;
        }
        const isInternalOrder = orderTypeId === "1";
        const preparedRows = pendingFlangeRows.map((row) => {
            if (isInternalOrder) {
                const selected = issuedFlangeOptions.find((fl: any) => String(fl.flangeId) === String(row.flangeId));
                return {
                    flangeId: selected ? String(selected.flangeId) : "",
                    flangeNo: selected ? String(selected.flangeNo || "") : "",
                };
            }
            return {
                flangeId: "",
                flangeNo: row.flangeNo.trim(),
            };
        });
        if (preparedRows.some((row) => (isInternalOrder ? !row.flangeId : !row.flangeNo))) {
            alert(isInternalOrder ? "Select a flange for each row" : "Enter Empty Beam No for each row");
            return;
        }
        const existingKeys = new Set(
            flangeItems
                .map((item) => {
                    if (isInternalOrder && item.flangeId) return `id-${item.flangeId}`;
                    if (!isInternalOrder && item.flangeNo) return `no-${item.flangeNo.trim().toLowerCase()}`;
                    return null;
                })
                .filter(Boolean) as string[]
        );
        const pendingKeys = new Set<string>();
        for (const row of preparedRows) {
            const key = isInternalOrder ? `id-${row.flangeId}` : `no-${row.flangeNo.toLowerCase()}`;
            if (pendingKeys.has(key) || existingKeys.has(key)) {
                alert("Flange already added");
                return;
            }
            pendingKeys.add(key);
        }
        const rowsToAdd = preparedRows.map((row) => ({
            flangeNo: row.flangeNo,
            flangeId: row.flangeId || undefined,
        }));
        setFlangeItems((prev) => [...prev, ...rowsToAdd]);
        setPendingFlangeRows([]);
        setShowAddFlangeForm(false);
    };
    const handleRemoveFlange = (index: number) => {
        setFlangeItems((prev) => prev.filter((_, i) => i !== index));
    };
    const orderTypeLabel = orderTypeId === "1" ? "Internal" : orderTypeId === "2" ? "External" : "";

    const onSubmit = async (formData: FlangeInwardFormData) => {

        const isEditMode = Boolean(beamInwardDtlFromState?.id);
        let flangeInwardNo = formData.flangeInwardNo || beamInwardDtlFromState?.flangeInwardNo || "";
        if (!beamInwardDtlFromState?.id && !flangeInwardNo) {
            try {
                const docResponse = await documentNumberService.generateDocumentNumber({
                    screenName: "Sizing Flange Inward"
                });
                flangeInwardNo = docResponse.documentNumber;
            } catch (error) {
                console.warn("Failed to generate document number:", error);
            }
        }

        isSavingRef.current = true;

        if (!orderTypeId) {
            alert("Order Type is required");
            return;
        }
        if (!flangeItems.length) {
            alert("Add at least one flange");
            return;
        }
        const storedCompanyId = localStorage.getItem("selectedCompanyId") || localStorage.getItem("selectedCompany");
        const factoryCompanyId = storedCompanyId ? Number(storedCompanyId) : null;

        const payload: any = {
            flangeInwardDate: formData.beamInwardDate,
            flangeInwardNo: flangeInwardNo,
            orderTypeId: parseInt(orderTypeId),
            buyerId: resolvedBuyerId ?? undefined,
            sizingJobWorkOrderId: formData.sizingJobWorkOrderId ? parseInt(formData.sizingJobWorkOrderId) : undefined,
            noOfFlanges: flangeItems.length,
            flangeDetails: flangeItems.map((item) => ({
                id: item.id != null ? parseInt(String(item.id)) : undefined,
                flangeNo: item.flangeNo,
                flangeId: item.flangeId ? parseInt(item.flangeId) : undefined,
            })),
        };
        if (factoryCompanyId) {
            payload.factoryCompanyId = factoryCompanyId;
        }
        try {
            if (isEditMode) {
                await dispatch(
                    updateFlangeInward({
                        id: beamInwardDtl.id,
                        data: payload,
                        factoryCompanyId: factoryCompanyId ?? undefined,
                    }) as any
                ).unwrap();
            } else {
                await dispatch((factoryCompanyId ? createFlangeInward({ ...payload, factoryCompanyId }) : createFlangeInward(payload)) as any).unwrap();
                documentNumberService.clearMemoryCache("Sizing Flange Inward");
            }
            try {
                sessionStorage.removeItem("flangeInwardEdit");
            } catch { }
            navigate("/transaction/flange-inward-details");
        } catch (error) {
            console.error("Error submitting flange inward", error);
        }
    };
    return (
        <div className=" p-6 pt-16">
            <div className="p-6 bg-white shadow-md rounded-lg">
                <div className="flex justify-between items-center border-b pb-4">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                try {
                                    sessionStorage.removeItem("flangeInwardEdit");
                                } catch { }
                                navigate("/transaction/flange-inward-details");
                            }}
                            className="mr-auto"
                        >
                            <ArrowLeft size={18} className="mr-2" />
                            Back
                        </Button>
                        <h2 className="text-2xl font-semibold">Sizing Flange Inward</h2>
                    </div>
                 
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText size={20} />
                                Order Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700">Inward Date</label>
                                <input
                                    type="date"
                                    {...register("beamInwardDate", { required: "Inward Date is required" })}
                                    value={beamInwardDateWatch || ""}
                                    readOnly
                                    className="input bg-gray-100"
                                />
                                {errors.beamInwardDate && <p className="mt-1 text-sm text-red-600">{errors.beamInwardDate.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700">Inward No</label>
                                <input type="text" className="w-full border px-3 py-2 rounded bg-gray-100"
                {...register('flangeInwardNo')} readOnly />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700">Buyer Name</label>
                                <CommonSearchableSelect
                                    {...buyerField}
                                    value={buyerKeyWatch || ""}
                                    onChange={handleBuyerChange}
                                    options={buyerOptions.map(({ key, label }) => ({
                                        value: key,
                                        label: label,
                                    }))}
                                    placeholder="Select Buyer"
                                    className="mt-1"
                                    error={errors.buyerKey?.message as string}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700">Sizing Order No</label>
                                <CommonSearchableSelect
                                    {...sizingOrderField}
                                    value={sizingOrderWatch || ""}
                                    onChange={handleSizingOrderChange}
                                    options={buyerOptionsBySelection.map((order: any) => ({
                                        value: String(order.id),
                                        label: order.orderNo,
                                    }))}
                                    placeholder="Select Sizing Order"
                                    className="mt-1"
                                    disabled={!buyerKeyWatch}
                                    error={errors.sizingJobWorkOrderId?.message as string}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700">Order Type</label>
                                <input className="input mt-1 bg-gray-100" readOnly value={orderTypeLabel || ""} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <div className="flex flex-row p-6 justify-between">
                            <div className="flex items-center gap-2">
                                <ClipboardList size={20} />
                                Flange Details
                            </div>
                            <Button
                                type="button"
                                onClick={handleShowAddFlangeForm}
                                className="bg-primary hover:bg-primary text-white"
                                disabled={showAddFlangeForm}
                            >
                                <Plus size={18} className="mr-2" />
                                Add Flange
                            </Button>
                        </div>
                        <CardContent>
                            {showAddFlangeForm && (
                                <div className="mt-4 mb-6">
                                    <table className="w-full border-collapse border border-gray-300 text-center">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border p-2">Sl.No</th>
                                                <th className="border p-2 text-center">Empty Beam No *</th>
                                                <th className="border p-2 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingFlangeRows.map((row, index) => (
                                                <tr key={row.tempId}>
                                                    <td className="border p-2">{index + 1}</td>
                                                    <td className="border p-2">
                                                        {orderTypeId === "1" ? (
                                                            <CommonSearchableSelect
                                                                value={row.flangeId || ""}
                                                                onChange={(val) => handlePendingSelectChange(row.tempId, val)}
                                                                options={issuedFlangeOptions.map((fl: any) => ({
                                                                    value: String(fl.flangeId),
                                                                    label: fl.flangeNo,
                                                                }))}
                                                                placeholder="Select Empty Beam No"
                                                            />
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                value={row.flangeNo}
                                                                onChange={(e) => handlePendingInputChange(row.tempId, e.target.value)}
                                                                className="input"
                                                                placeholder="Enter Empty Beam No"
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="border p-2">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {pendingFlangeRows.length > 1 && (
                                                                <Button
                                                                    type="button"
                                                                    onClick={() => handleRemovePendingRow(row.tempId)}
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    <X size={16} />
                                                                </Button>
                                                            )}
                                                            {index === pendingFlangeRows.length - 1 && (
                                                                <Button type="button" onClick={handleAddPendingRow} size="icon" className="bg-primary text-white">
                                                                    <Plus size={16} />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="mt-4 flex justify-end gap-2">
                                        <Button type="button" className="bg-primary text-white" onClick={handleSavePendingRows}>
                                            Add {pendingFlangeRows.length > 1 ? "Flanges" : "Flange"}
                                        </Button>
                                        <Button type="button" variant="outline" onClick={handleCancelPendingRows}>
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {flangeItems.length ? (
                                <table className="w-full border-collapse border border-gray-300 text-center">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border p-2">Sl.No</th>
                                            <th className="border p-2">Empty Beam No</th>
                                            <th className="border p-2">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {flangeItems.map((item, index) => (
                                            <tr key={index} className="border">
                                                <td className="border p-2">{index + 1}</td>
                                                <td className="border p-2">{item.flangeNo || "-"}</td>
                                                <td className="border p-2">
                                                    <Button
                                                        type="button"
                                                        onClick={() => handleRemoveFlange(index)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <X size={18} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-center text-sm text-secondary-500">No flanges added yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                
            </div>
            <div className="flex justify-end mt-4">
               <Button onClick={handleSubmit(onSubmit)} className="bg-primary hover:bg-primary text-white px-6 flex items-center">
                        <Save size={18} className="mr-2" />
                        {isEditMode ? "Update" : "Save"}
                    </Button>
                    </div>
        </div>
    );
};

export default FlangeInwardEntry;
