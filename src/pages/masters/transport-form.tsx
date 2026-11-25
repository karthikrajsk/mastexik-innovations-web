import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { AppDispatch, RootState } from "@/state/store";
import { getAllCountries } from "@/state/countrySlice";
import { getAllStates } from "@/state/stateSlice";
import { getAllCities } from "@/state/citySlice";
import { createTransport, getAllTransports, updateTransport } from "@/state/transportSlice";
import { ArrowLeft, Trash } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";

interface AddressDetail {
    id?: number;
    line1: string;
    line2: string;
    countryId: string;
    stateId: string;
    stateCode: string;
    pinCode: string;
    cityId: string;
    activeFlag: boolean;
}

interface TransportFormData {
    id?: number | null;
    transportName: string;
    gstNo: string;
    activeFlag: boolean;
}

const resolveApiErrorMessage = (error: any, fallback: string) => {
    const responseData = error?.response?.data;
    const candidates: string[] = [];

    if (typeof responseData === "string") {
        candidates.push(responseData);
    } else if (responseData) {
        if (typeof responseData.message === "string") {
            candidates.push(responseData.message);
        }
        if (typeof responseData.error === "string") {
            candidates.push(responseData.error);
        }
        if (typeof responseData.data === "string") {
            candidates.push(responseData.data);
        }
        if (responseData.data && typeof responseData.data === "object") {
            if (typeof responseData.data.message === "string") {
                candidates.push(responseData.data.message);
            }
            if (typeof responseData.data.error === "string") {
                candidates.push(responseData.data.error);
            }
            if (Array.isArray(responseData.data.errors)) {
                responseData.data.errors.forEach((err: any) => {
                    if (typeof err === "string") {
                        candidates.push(err);
                    } else if (typeof err?.message === "string") {
                        candidates.push(err.message);
                    }
                });
            }
        }
        if (Array.isArray(responseData.errors)) {
            responseData.errors.forEach((err: any) => {
                if (typeof err === "string") {
                    candidates.push(err);
                } else if (typeof err?.message === "string") {
                    candidates.push(err.message);
                }
            });
        }
    }

    const candidate = candidates.find((msg) => typeof msg === "string" && msg.trim());
    return candidate || error?.message || fallback;
};

const handleTransportSaveError = (error: any, setError: (name: keyof TransportFormData, error: { type: string; message: string }) => void) => {
    const message = resolveApiErrorMessage(error, "Failed to save transport");
    const normalized = (message || "").toLowerCase();
    if (normalized.includes("gst")) {
        setError("gstNo", { type: "server", message });
        return;
    }
    setError("transportName", { type: "server", message });
};

export function TransportForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const isEditing = !!id;

    const { transportList } = useSelector((state: RootState) => state.transport);
    const { countryList } = useSelector((state: RootState) => state.country);
    const { stateList } = useSelector((state: RootState) => state.state);
    const { cityList } = useSelector((state: RootState) => state.city);

    const [showSuggestions, setShowSuggestions] = useState(false);
    const [currentTransport, setCurrentTransport] = useState<any>(null);
    const [addressDetails, setAddressDetails] = useState<AddressDetail[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        trigger,
        setError,
        clearErrors,
        formState: { errors, isValid }
    } = useForm<TransportFormData>({
        mode: 'onBlur',
        reValidateMode: 'onBlur',
        defaultValues: {
            id: null,
            transportName: "",
            gstNo: "",
            activeFlag: true
        }
    });

    const transportNameValue = watch("transportName");
    const gstValue = watch("gstNo");
    const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;

    const handleSuggestionSelect = (name: string) => {
        setValue("transportName", name);
        setShowSuggestions(false);
    };

    useEffect(() => {
        dispatch(getAllCountries({ fetchAll: true }));
        dispatch(getAllStates({ fetchAll: true }));
        dispatch(getAllCities({ fetchAll: true }));
        dispatch(getAllTransports({ offset: 0, limit: 1000 }));
    }, [dispatch]);

    const getStateCode = (stateId: string) => {
        const st = stateList.find((s: any) => s.id?.toString() === stateId?.toString());
        return st ? st.stateCode : "";
    };

    const toEditableAddresses = (addresses: any[]) => {
        if (!Array.isArray(addresses)) return [];
        return addresses.map((addr: any, index: number) => {
            const stateId = addr?.stateId !== undefined && addr?.stateId !== null ? String(addr.stateId) : "";
            return {
                id: addr?.id ?? index + 1,
                line1: addr?.line1 || "",
                line2: addr?.line2 || "",
                countryId: addr?.countryId !== undefined && addr?.countryId !== null ? String(addr.countryId) : "",
                stateId,
                stateCode: addr?.stateCode || getStateCode(stateId),
                pinCode: addr?.pinCode ? String(addr.pinCode) : "",
                cityId: addr?.cityId !== undefined && addr?.cityId !== null ? String(addr.cityId) : "",
                activeFlag: addr?.activeFlag !== undefined ? addr.activeFlag : true,
            } as AddressDetail;
        });
    };

    useEffect(() => {
        if (!transportNameValue || !gstValue) return;
        trigger("transportName");
    }, [transportNameValue, gstValue, trigger]);

    useEffect(() => {
        if (isEditing && id) {
            const transport = transportList.find((t: any) => String(t.id) === String(id));
            if (transport) {
                setCurrentTransport(transport);
                const sourceAddresses = Array.isArray(transport.address) ? transport.address : transport.address ? [transport.address] : [];
                setAddressDetails(toEditableAddresses(sourceAddresses));
                reset({
                    id: transport.id,
                    transportName: transport.transportName,
                    gstNo: transport.gstNo || "",
                    activeFlag: transport.activeFlag
                });
            }
        } else {
            setAddressDetails([{
                id: Date.now(),
                line1: "",
                line2: "",
                countryId: "",
                stateId: "",
                stateCode: "",
                pinCode: "",
                cityId: "",
                activeFlag: true,
            }]);
        }
    }, [isEditing, id, transportList, reset]);

    const handleAddAddress = () => {
        setAddressDetails([
            ...addressDetails,
            {
                id: Date.now() + addressDetails.length,
                line1: "",
                line2: "",
                countryId: "",
                stateId: "",
                stateCode: "",
                pinCode: "",
                cityId: "",
                activeFlag: true,
            },
        ]);
    };

    const handleDeleteAddress = (id: any) => {
        setAddressDetails(addressDetails.filter((item: any) => item.id !== id));
    };

    const onSubmit = async (data: TransportFormData) => {
        const first = addressDetails[0];
        const isAddressValid = first &&
            first.line1?.trim() &&
            first.countryId &&
            first.stateId &&
            first.cityId &&
            first.pinCode?.trim();

        if (!isAddressValid) {
            toast.error("Please provide valid State Code (auto from State) and 6-digit numeric Pin Code.");
            return;
        }

        const payload = {
            ...data,
            address: first, // Following consignee logic where only the first address is sent as an object
        };

        try {
            if (isEditing) {
                await dispatch(updateTransport(payload)).unwrap();
            } else {
                await dispatch(createTransport(payload)).unwrap();
            }
            clearErrors();
            navigate("/masters/transport-master");
        } catch (error: any) {
            // handleTransportSaveError(error, setError);
            toast.error(typeof error === "string" ? error : "Failed to save transport");
        }
    };

    const existingNames = useMemo(() => transportList.map((t: any) => t.transportName).filter(Boolean), [transportList]);
    const filteredSuggestions = useMemo(() => {
        const q = (transportNameValue || "").toLowerCase();
        if (!q) return [];
        return Array.from(new Set(existingNames)).filter((n: any) => n.toLowerCase().includes(q)).slice(0, 8);
    }, [transportNameValue, existingNames]);

    return (
        <div className="p-6 pt-16">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Button onClick={() => navigate("/masters/transport-master")} variant="outline" className="mr-auto">
                        <ArrowLeft size={18} className="mr-2" />
                        Back
                    </Button>
                    <h1 className="text-2xl font-semibold">{isEditing ? "Update Transport" : "Add Transport"}</h1>
                    {/* <button onClick={() => navigate("/masters/transport-master")} className="btn btn-secondary">
                    Back to List
                </button> */}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="relative">
                            <label className="block text-sm font-medium">Transport Name <span className="text-red-600">*</span></label>
                            <input {...register("transportName", {
                                required: "Required",
                                validate: (value) => {
                                    if (!value) return true;
                                    if (!gstValue) return true;
                                    const normalizedName = value.trim().toLowerCase();
                                    const normalizedGst = gstValue.trim().toLowerCase();
                                    const isLinked = transportList.some((t: any) =>
                                        t.transportName?.trim().toLowerCase() === normalizedName &&
                                        t.gstNo?.trim().toLowerCase() === normalizedGst &&
                                        t.id !== currentTransport?.id
                                    );
                                    return isLinked ? `Transport: "${value.trim()}" is already linked with this GST no: ${gstValue.trim()}` : true;
                                }
                            })} className="input mt-1" onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} autoComplete="off" />
                            {errors.transportName && <p className="text-red-600 text-xs mt-1">{errors.transportName.message}</p>}
                            {showSuggestions && filteredSuggestions.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-40 overflow-y-auto mt-1">
                                    {filteredSuggestions.map((n, i) => (
                                        <li
                                            key={i}
                                            className="px-3 py-2 cursor-pointer hover:bg-blue-50"
                                            onMouseDown={(event) => {
                                                event.preventDefault();
                                                handleSuggestionSelect(n);
                                            }}
                                        >
                                            {n}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">GST No</label>
                            <input
                                {...register("gstNo", {
                                    validate: (value) => {
                                        if (!value) return true;
                                        if (!gstPattern.test(value)) return "Enter a valid GST number";
                                        const normalized = value.trim().toLowerCase();
                                        const duplicate = transportList.find((t: any) =>
                                            t.gstNo?.trim().toLowerCase() === normalized &&
                                            t.id !== currentTransport?.id
                                        );
                                        return duplicate ? `GST No already linked with ${duplicate.transportName || "another transport"}` : true;
                                    }
                                })}
                                className="input mt-1"
                                placeholder="33AACCT1234A1Z5"
                                autoComplete="off"
                            />
                            {errors.gstNo && <p className="text-red-600 text-xs mt-1">{errors.gstNo.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Status</label>
                            <select {...register("activeFlag")} className="input mt-1">
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-10">
                        <h3 className="font-semibold flex items-center">
                            Address Details
                            <button type="button" onClick={handleAddAddress} className="ml-2 bg-primary text-white px-2 py-1 rounded text-sm">
                                + Add Address
                            </button>
                        </h3>
                        <div className="overflow-x-auto mt-4">
                            <table className="w-full border">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="p-2 border">SL.NO</th>
                                        <th className="p-2 border">Line 1 <span className="text-red-600">*</span></th>
                                        <th className="p-2 border">Line 2</th>
                                        <th className="p-2 border">Country <span className="text-red-600">*</span></th>
                                        <th className="p-2 border">State <span className="text-red-600">*</span></th>
                                        <th className="p-2 border">City <span className="text-red-600">*</span></th>
                                        <th className="p-2 border">State Code</th>
                                        <th className="p-2 border">Pin Code <span className="text-red-600">*</span></th>
                                        <th className="p-2 border">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {addressDetails.map((item, index) => (
                                        <tr key={item.id} className="border">
                                            <td className="p-2 border text-center">{index + 1}</td>
                                            <td className="p-2 border">
                                                <input
                                                    type="text"
                                                    value={item.line1}
                                                    onChange={e => {
                                                        const updated = [...addressDetails];
                                                        updated[index].line1 = e.target.value;
                                                        setAddressDetails(updated);
                                                    }}
                                                    className="border p-1 w-full"
                                                />
                                            </td>
                                            <td className="p-2 border">
                                                <input
                                                    type="text"
                                                    value={item.line2}
                                                    onChange={e => {
                                                        const updated = [...addressDetails];
                                                        updated[index].line2 = e.target.value;
                                                        setAddressDetails(updated);
                                                    }}
                                                    className="border p-1 w-full"
                                                />
                                            </td>
                                            <td className="p-2 border">
                                                <CommonSearchableSelect
                                                    options={countryList.map((c: any) => ({
                                                        value: String(c.id),
                                                        label: c.countryName
                                                    }))}
                                                    value={String(item.countryId || '')}
                                                    placeholder="Select Country"
                                                    onChange={(val: any) => {
                                                        const updated = [...addressDetails];
                                                        updated[index].countryId = val;
                                                        updated[index].stateId = '';   // reset state
                                                        updated[index].cityId = '';    // reset city
                                                        setAddressDetails(updated);
                                                    }}
                                                />
                                            </td>
                                            <td className="p-2 border">
                                                <CommonSearchableSelect
                                                    options={stateList
                                                        .filter((s: any) =>
                                                            String(s.countrySno || s.countryId) === String(item.countryId)
                                                        )
                                                        .map((s: any) => ({
                                                            value: String(s.id),
                                                            label: s.stateName
                                                        }))
                                                    }
                                                    value={String(item.stateId || '')}
                                                    placeholder="Select State"
                                                    onChange={(val: any) => {
                                                        const stateCode = getStateCode(val);
                                                        const updated = addressDetails.map((addr, i) =>
                                                            i === index
                                                                ? { ...addr, stateId: val, stateCode, cityId: '' }
                                                                : addr
                                                        );
                                                        setAddressDetails(updated);
                                                    }}
                                                />
                                            </td>
                                            <td className="p-2 border">
                                                <CommonSearchableSelect
                                                    options={cityList
                                                        .filter((c: any) =>
                                                            String(c.stateSno || c.stateId) === String(item.stateId)
                                                        )
                                                        .map((c: any) => ({
                                                            value: String(c.id),
                                                            label: c.cityName
                                                        }))
                                                    }
                                                    value={String(item.cityId || '')}
                                                    placeholder="Select City"
                                                    onChange={(val: any) => {
                                                        const updated = [...addressDetails];
                                                        updated[index].cityId = val;
                                                        setAddressDetails(updated);
                                                    }}
                                                />
                                            </td>
                                            <td className="p-2 border text-center">{item.stateCode}</td>
                                            <td className="p-2 border">
                                                <input
                                                    type="text"
                                                    value={item.pinCode}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/\D/g, ""); // numeric only
                                                        if (val.length <= 6) {
                                                            const updated = [...addressDetails];
                                                            updated[index] = { ...updated[index], pinCode: val };
                                                            setAddressDetails(updated);
                                                        }
                                                    }}
                                                    // onChange={e => {
                                                    //     const updated = [...addressDetails];
                                                    //     updated[index].pinCode = e.target.value;
                                                    //     setAddressDetails(updated);
                                                    // }}
                                                    className="border p-1 w-full"
                                                />
                                            </td>
                                            <td className="p-2 border text-center">
                                                <button type="button" onClick={() => handleDeleteAddress(item.id)} className="text-red-600 hover:text-red-800">
                                                    <Trash className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                        <button type="button" onClick={() => navigate("/masters/transport-master")} className="btn btn-secondary">Cancel</button>
                        <button type="submit" disabled={!isValid} className={`btn ${isValid ? 'btn-primary' : 'bg-gray-300 cursor-not-allowed'}`}>
                            {isEditing ? "Update" : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
