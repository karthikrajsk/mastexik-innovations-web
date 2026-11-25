import React, { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/state/store';
import { getAllStates } from '@/state/stateSlice';
import { getAllCompanies, createCompany, updateCompany, deleteCompany } from '@/state/company-master-slice';
import { DataTable } from '@/components/data/DataTable';
import { Pagination, usePagination } from '@/components/common/Pagination';
import { CodesUtil } from '@/utils/codesUtil';
import { CodesAPI } from '@/services/codes_api';
import { CodeDetail, CodeHeader } from '@/types/codes';
import mediaService, { MediaDetailResponse } from '@/services/MediaUploadService';
import { toast } from 'react-toastify';
import CommonSearchableSelect from '@/components/ui/CommonSearchableSelect';

// Types
interface AddressDetail {
  line1: string; // Address
  stateId: string; // maps to state master id
  stateCode: string; // auto from state
  pinCode: string; // 6 digits
  addressType: 'Domestic' | 'Export' | 'Both';
  isDefault: boolean; // single selection
}

interface BankDetail {
  bankName: string;
  accountNo: string;
  ifscCode: string;
}
interface LCBankDetail {
  lcBankRefNo: string;
  dateOfIssue: string;
  lutNo: string;
}
interface InvoiceDetailConfig {
  id?: number;
  invoiceTypeId?: string | number | null;
  prefix: string;
  financialYear: string;
  sequenceNumber: string;
  preview?: string;
}

const TRADE_TYPE_GROUP_KEY = 'TRADE_TYPE';
const TRADE_TYPE_HEADER_ID = 2;
const ALLOWED_INVOICE_CODES = new Set(['DOMESTIC', 'INTERNATIONAL', 'WEAVING JOBWORK', 'SIZING SALES', 'YARN SALES']);
const ALLOWED_INVOICE_IDS = new Set([201, 202, 203, 204, 205]);
const CODES_STORAGE_KEY = 'codes_header';
const defaultInvoiceRow: InvoiceDetailConfig = {
  invoiceTypeId: '',
  prefix: '',
  financialYear: '',
  sequenceNumber: '',
  preview: ''
};

const normalizeCodeValue = (value?: string | number | null) => String(value ?? '').trim().toUpperCase();

const getDetailKey = (detail: CodeDetail) => {
  if (!detail) return '';
  if (detail.id != null) return String(detail.id);
  const code = detail.code || detail.value;
  if (code) return normalizeCodeValue(code);
  return '';
};

const getDetailLabel = (detail: CodeDetail) => detail.value || detail.code || `Code ${detail.id}`;

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
  } catch (error) {
    console.warn('Failed to cache codes headers', error);
  }
};

const readHeadersFromStorage = (): CodeHeader[] => {
  try {
    const stored = localStorage.getItem(CODES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return normalizeHeadersResponse(parsed);
    }
  } catch (error) {
    console.error('Failed to parse codes header from storage:', error);
  }
  return [];
};

const extractInvoiceTypeDetails = (headers: CodeHeader[]): CodeDetail[] => {
  if (!Array.isArray(headers)) return [];
  const tradeHeader = headers.find((h: any) => normalizeCodeValue(h?.code_group ?? h?.codeGroup) === TRADE_TYPE_GROUP_KEY)
    || headers.find((h: any) => Number(h?.id) === TRADE_TYPE_HEADER_ID);
  if (!tradeHeader || !Array.isArray(tradeHeader.details)) return [];
  return tradeHeader.details.filter((detail: CodeDetail) => {
    const codeValue = normalizeCodeValue(detail.code || detail.value);
    const id = Number(detail.id);
    return ALLOWED_INVOICE_CODES.has(codeValue) || ALLOWED_INVOICE_IDS.has(id);
  });
};

const normalizeInvoiceRowsForForm = (rows?: InvoiceDetailConfig[]): InvoiceDetailConfig[] => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [{ ...defaultInvoiceRow }];
  }
  return rows.map((row) => {
    const prefix = row.prefix ?? '';
    const financialYear = row.financialYear ?? '';
    const sequenceNumber = row.sequenceNumber ?? '';
    return {
      ...defaultInvoiceRow,
      ...row,
      invoiceTypeId: row.invoiceTypeId !== undefined && row.invoiceTypeId !== null ? String(row.invoiceTypeId) : '',
      prefix,
      financialYear,
      sequenceNumber,
      preview: row.preview ?? formatInvoicePreview({ prefix, financialYear, sequenceNumber })
    };
  });
};

interface InvoiceDetailPayload {
  id?: number;
  invoiceTypeId: number;
  prefix: string;
  financialYear: string;
  sequenceNumber: string;
  preview: string;
}

const sanitizeInvoiceRowsForSubmit = (rows?: InvoiceDetailConfig[]): InvoiceDetailPayload[] => {
  if (!Array.isArray(rows)) return [];
  return rows.reduce<InvoiceDetailPayload[]>((acc, row) => {
    const invoiceTypeId = row.invoiceTypeId !== undefined && row.invoiceTypeId !== null && row.invoiceTypeId !== ''
      ? Number(row.invoiceTypeId)
      : null;
    const prefix = (row.prefix || '').trim();
    const financialYear = (row.financialYear || '').trim();
    const sequenceNumber = (row.sequenceNumber || '').trim();

    if (!invoiceTypeId || !prefix || !financialYear || !sequenceNumber) {
      return acc;
    }

    acc.push({
      id: row.id,
      invoiceTypeId,
      prefix,
      financialYear,
      sequenceNumber,
      preview: formatInvoicePreview({ ...row, prefix, financialYear, sequenceNumber })
    });
    return acc;
  }, []);
};

const formatInvoicePreview = (row?: InvoiceDetailConfig) => {
  if (!row) return '';
  const parts = [row.prefix, row.financialYear, row.sequenceNumber]
    .map((value) => (value || '').toString().trim())
    .filter(Boolean);
  return parts.join('/');
};

interface CompanyData {
  id?: number;
  companyName: string;
  companyType: 'Domestic' | 'Export' | 'Both';
  companyCode: string;
  gstNo: string;
  pan: string;
  cin?: string;
  iecCode?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  msmeNumber?: string;
  logoUrl?: string | null; // preview URL
  logoMediaDetailSno?: number | null;
  logoMediaSno?: number | null;
  msmeType?: string; // non-mandatory
  tin?: string; // non-mandatory
  icBankRefNo?: string;
  luteNo?: string;
  address: AddressDetail[];
  bank: BankDetail[];
  invoiceItems?: InvoiceDetailConfig[];
  lcBank?: LCBankDetail[];
}

export function CompanyMaster() {
  const dispatch = useDispatch<AppDispatch>();
  const { stateList } = useSelector((state: RootState) => state.state);
  const { companyMasterList, loading, error, pagination } = useSelector((state: RootState) => state.companyMaster);
  const { currentPage, itemsPerPage, handlePageChange, getOffset, resetPage } = usePagination({ itemsPerPage: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [current, setCurrent] = useState<CompanyData | null>(null);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string>("");
  const [codeSuggestions, setCodeSuggestions] = useState<any[]>([])
  const [activeCodeIndex, setActiveCodeIndex] = useState(-1)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<MediaDetailResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [invoiceTypeOptions, setInvoiceTypeOptions] = useState<CodeDetail[]>([]);

  useEffect(() => {
    dispatch(getAllStates({ fetchAll: true }));
    dispatch(getAllCompanies({ fetchAll: true }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(getAllCompanies({ fetchAll: true }));
  }, [currentPage, dispatch, itemsPerPage, getOffset]);

  useEffect(() => {
    let isMounted = true;

    const loadInvoiceTypes = async () => {
      let headers: CodeHeader[] = readHeadersFromStorage();

      if (!headers.length) {
        const cachedHeaders = normalizeHeadersResponse(CodesUtil.getHeaders?.());
        if (cachedHeaders.length) {
          headers = cachedHeaders;
        }
      }

      if (!headers.length) {
        try {
          await CodesUtil.loadOnce(async () => normalizeHeadersResponse(await CodesAPI.getCodesHeader()));
          const loadedHeaders = normalizeHeadersResponse(CodesUtil.getHeaders?.());
          if (loadedHeaders.length) {
            headers = loadedHeaders;
          }
        } catch (error) {
          console.error('Failed to preload invoice types', error);
        }
      }

      if (!headers.length) {
        try {
          const apiHeaders = await CodesAPI.getCodesHeader();
          headers = normalizeHeadersResponse(apiHeaders);
        } catch (error) {
          console.error('Failed to fetch invoice types', error);
        }
      }

      if (headers.length) {
        cacheHeadersToStorage(headers);
      }

      if (!isMounted) return;
      setInvoiceTypeOptions(extractInvoiceTypeDetails(headers));
    };

    loadInvoiceTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync local companies with Redux state
  useEffect(() => {
    const sortedCompanies = [...(companyMasterList || [])]
      .sort((a: CompanyData, b: CompanyData) => (b.id || 0) - (a.id || 0))
      .map((company, index) => ({
        ...company,
        serialNo: (pagination.offset || 0) + index + 1
      }));
    setCompanies(sortedCompanies);
  }, [companyMasterList, pagination.offset]);

  // Form
  const { register, handleSubmit, reset, setValue, watch, control, getValues, formState: { errors } } = useForm<CompanyData>({
    mode: 'onBlur',
    defaultValues: {
      invoiceItems: [{ ...defaultInvoiceRow }]
    }
  });

  // Field arrays
  const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
    name: 'address',
    control,
  });

  const { fields: bankFields, append: appendBank, remove: removeBank } = useFieldArray({
    name: 'bank',
    control,
  });

  const { fields: invoiceFields, append: appendInvoice, remove: removeInvoice } = useFieldArray({
    name: 'invoiceItems',
    control,
  });

  const { fields: lcBankFields, append: appendLCBank, remove: removeLCBank } = useFieldArray({
    name: 'lcBank',
    control,
  });

  const companyNameValue = watch("companyName");
  const companyTypeValue = watch("companyType");

  useEffect(() => {
    if (companyTypeValue === 'Domestic') {
      setValue('lcBank', []);
    }
  }, [companyTypeValue, setValue]);

  // Existing names for suggestions
  const existingNames = useMemo(
    () => companies.map((c: any) => (c?.companyName ?? "")).filter(Boolean),
    [companies]
  );

  // Auto PAN from GST
  const gstValue = watch('gstNo');
  useEffect(() => {
    if (gstValue && gstValue.length === 15 && /^\d{2}/.test(gstValue)) {
      const extractedPan = gstValue.substring(2, 12).toUpperCase();
      setValue('pan', extractedPan, { shouldValidate: true });
    } else {
      setValue('pan', '', { shouldValidate: true });
    }
  }, [gstValue, setValue]);

  const filteredSuggestions = useMemo(() => {
    const q = (companyNameValue || "").toLowerCase();
    if (!q) return [] as string[];
    return existingNames
      .filter((name: string) => name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [companyNameValue, existingNames]);

  useEffect(() => {
    const currentName = (companyNameValue || "").trim().toLowerCase();
    if (!currentName) {
      setDuplicateError("");
      return;
    }
    const excludeName = isEditing ? (currentCompany?.companyName || "").toLowerCase() : "";
    const isDuplicate = existingNames.some(
      (n: string) => n.toLowerCase() === currentName && n.toLowerCase() !== excludeName
    );
    setDuplicateError(isDuplicate ? "This company name already exists" : "");
  }, [companyNameValue, isEditing, currentCompany, existingNames]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        if (activeSuggestionIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(filteredSuggestions[activeSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue("companyName", suggestion, {
      shouldValidate: true,
      shouldDirty: true
    });
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setDuplicateError("");
  };

  // Destructure register for companyCode
  const { onChange: codeOnChange, onBlur: codeOnBlur, ref: codeRef, name: codeName } = register("companyCode", { required: "Company Code is required" })

  // Suggestion handlers for companyCode
  const handleCodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    codeOnChange(e)
    const value = e.target.value
    const filtered = companies.filter((c: any) =>
      c.companyCode.toLowerCase().includes(value.toLowerCase())
    )
    setCodeSuggestions(filtered)
    setShowSuggestions(!!(value && filtered.length > 0))
    if (filtered.length > 0) {
      setActiveCodeIndex(0)
    }
  }

  const handleCodeFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value) {
      const filtered = companies.filter((c: any) =>
        c.companyCode.toLowerCase().includes(value.toLowerCase())
      )
      setCodeSuggestions(filtered)
      setShowSuggestions(true)
      if (filtered.length > 0) {
        setActiveCodeIndex(0)
      }
    }
  }

  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return
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
      setShowSuggestions(false)
    }
  }

  const selectCodeSuggestion = (item: any) => {
    // Use setValue with shouldValidate and shouldDirty options
    setValue('companyCode', item.companyCode, { shouldValidate: true, shouldDirty: true })

    setShowSuggestions(false)
    setActiveCodeIndex(-1)
  }

  const handleCodeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    codeOnBlur(e)
    setTimeout(() => {
      setShowSuggestions(false)
    }, 200)

    // Optional: Auto-select exact match on blur
    const value = watch('companyCode')
    if (value) {
      const exact = companies.find((c: any) =>
        c.companyCode.toLowerCase() === value.toLowerCase()
      )
      if (exact) {
        selectCodeSuggestion(exact)
      }
    }
  }

  const getStateCode = (stateId: string) => {
    const state = stateList.find((state: any) => state.id.toString() === stateId);
    return state ? state.stateCode : "";
  };

  // Auto state code for addresses
  const addressWatch = watch('address');
  const invoiceDataWatch = watch('invoiceItems');

  // Auto state code for addresses
  useEffect(() => {
    if (!stateList || stateList.length === 0) return;

    const subscription = watch((value, { name }) => {
      // Only react to stateId changes in address fields
      if (name && name.match(/^address\.\d+\.stateId$/)) {
        const match = name.match(/^address\.(\d+)\.stateId$/);
        if (match) {
          const index = parseInt(match[1]);
          const selectedStateId = value.address?.[index]?.stateId;

          if (selectedStateId) {
            const selectedState = stateList.find((s: any) =>
              s.id === Number(selectedStateId) || s.id === selectedStateId
            );

            if (selectedState && selectedState.stateCode) {
              setValue(`address.${index}.stateCode`, selectedState.stateCode, {
                shouldValidate: true,
                shouldDirty: true
              });
            }
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [stateList, watch, setValue]);

  const columns = useMemo(() => ([
    { Header: 'Sl No', accessor: 'serialNo' },
    { Header: 'Company Name', accessor: 'companyName' },
    { Header: 'GST No', accessor: 'gstNo' },
    { Header: 'Address', accessor: (row: any) => row.address?.[0]?.line1 || '' },
  ]), []);

  const openAdd = () => {
    setIsEditing(false);
    setCurrent(null);
    setCurrentCompany(null);
    setLogoPreview(null);
    setSelectedFile(null);
    setUploadedMedia(null);
    reset({
      companyName: '',
      companyType: 'Domestic',
      companyCode: '',
      gstNo: '',
      pan: '',
      cin: '',
      iecCode: '',
      phoneNumber: '',
      email: '',
      website: '',
      msmeNumber: '',
      logoUrl: null,
      logoMediaDetailSno: null,
      logoMediaSno: null,
      msmeType: '',
      tin: '',
      icBankRefNo: '',
      luteNo: '',
      address: [{
        line1: '',
        stateId: '',
        stateCode: '',
        pinCode: '',
        addressType: 'Domestic',
        isDefault: false,
      }],
      bank: [{
        bankName: '',
        accountNo: '',
        ifscCode: '',
      }],
      lcBank: [{
        lcBankRefNo: '',
        dateOfIssue: '',
        lutNo: '',
      }],
      invoiceItems: [{ ...defaultInvoiceRow }],
    } as CompanyData);
    setIsModalOpen(true);
  };

  const onEdit = (row: CompanyData) => {
    setIsEditing(true);
    setCurrent(row);
    setCurrentCompany(row);
    const normalizedInvoiceRows = normalizeInvoiceRowsForForm(row.invoiceItems);
    const normalizedAddress = (row.address || []).map(addr => ({
      ...addr,
      pinCode: addr.pinCode || (addr as any).pincode || ''
    }));
    reset({
      ...row,
      address: normalizedAddress,
      invoiceItems: normalizedInvoiceRows
    } as CompanyData);
    setLogoPreview(row.logoUrl || null);
    if (row.logoMediaDetailSno) {
      setUploadedMedia({
        mediaDetailSno: row.logoMediaDetailSno,
        mediaUrl: row.logoUrl || '',
      } as MediaDetailResponse);
    }
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const onDelete = (row: CompanyData) => {
    setCurrent(row);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!current?.id) return;
    try {
      await dispatch(deleteCompany(current.id)).unwrap();
      resetPage();
      dispatch(getAllCompanies({ fetchAll: true }));
    } catch (error) {
      console.error('Error deleting company:', error);
    }
    setIsDeleteModalOpen(false);
  };

  const onView = (row: CompanyData) => {
    const normalizedAddress = (row.address || []).map(addr => ({
      ...addr,
      pinCode: addr.pinCode || (addr as any).pincode || ''
    }));
    setCurrent({
      ...row,
      address: normalizedAddress
    });
    setIsViewModalOpen(true);
  };

  // const onSubmit = async (data: CompanyData) => {
  //   if (!data.logoMediaDetailSno) {
  //     toast.error('Please upload a company logo');
  //     return;
  //   }

  //   try {
  //     const invoiceDataPayload = sanitizeInvoiceRowsForSubmit(data.invoiceItems);
  //     const payload = {
  //       ...data,
  //       invoiceItems: invoiceDataPayload
  //     };

  //     if (isEditing && current?.id) {
  //       await dispatch(updateCompany({ ...payload, id: current.id })).unwrap();
  //     } else {
  //       await dispatch(createCompany(payload)).unwrap();
  //     }
  //     resetPage();
  //     dispatch(getAllCompanies({ offset: 0, limit: itemsPerPage }));
  //     setCurrentCompany(null);
  //     setIsModalOpen(false);
  //     reset();
  //     setLogoPreview(null);
  //     setSelectedFile(null);
  //     setUploadedMedia(null);
  //   } catch (error: any) {
  //     toast.error(error?.message || 'Error saving company');
  //     console.error('Error saving company:', error);
  //   }
  // };
  const onSubmit = async (data: CompanyData) => {
    // First, check for any form validation errors
    const hasErrors = Object.keys(errors).length > 0;

    if (hasErrors) {
      toast.error('Please fix all validation errors before saving');

      // Scroll to the first error if needed
      const firstError = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstError}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Then check for duplicate error
    if (duplicateError) {
      toast.error(duplicateError);
      return;
    }

    // Validate invoice items
    if (!data.invoiceItems || data.invoiceItems.length === 0) {
      toast.error('At least one invoice detail is required');
      return;
    }

    // Validate each invoice item
    const invalidInvoiceItems = data.invoiceItems.some(item =>
      !item.invoiceTypeId || !item.prefix || !item.financialYear || !item.sequenceNumber
    );

    if (invalidInvoiceItems) {
      toast.error('Please fill all required invoice details');
      return;
    }

    // Validate addresses
    if (!data.address || data.address.length === 0) {
      toast.error('At least one address is required');
      return;
    }

    const invalidAddress = data.address.some(addr =>
      !addr.line1 || !addr.stateId || !addr.pinCode
    );

    if (invalidAddress) {
      toast.error('Please fill all required address fields');
      return;
    }

    // Validate banks
    if (!data.bank || data.bank.length === 0) {
      toast.error('At least one bank detail is required');
      return;
    }

    const invalidBank = data.bank.some(bank =>
      !bank.bankName || !bank.accountNo || !bank.ifscCode
    );

    if (invalidBank) {
      toast.error('Please fill all required bank details');
      return;
    }

    // Validate L/C Bank if needed
    if ((data.companyType === 'Export' || data.companyType === 'Both') &&
      (!data.lcBank || data.lcBank.length === 0)) {
      toast.error('L/C Bank details are required for Export/Both company types');
      return;
    }

    try {
      const invoiceDataPayload = sanitizeInvoiceRowsForSubmit(data.invoiceItems);
      const payload = {
        ...data,
        invoiceItems: invoiceDataPayload
      };

      if (isEditing && current?.id) {
        await dispatch(updateCompany({ ...payload, id: current.id })).unwrap();
      } else {
        await dispatch(createCompany(payload)).unwrap();
      }

      resetPage();
      dispatch(getAllCompanies({ fetchAll: true }));
      setCurrentCompany(null);
      setIsModalOpen(false);
      reset();
      setLogoPreview(null);
      setSelectedFile(null);
      setUploadedMedia(null);
    } catch (error: any) {
      const errorMessage = typeof error === 'string'
        ? error
        : error?.message || 'Error saving company';
      toast.error(errorMessage);
      console.error('Error saving company:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must not exceed 5MB');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadLogo = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setIsUploading(true);
      const base64File = await mediaService.fileToBase64(selectedFile);
      const mediaType = mediaService.getMediaType(selectedFile);

      const response = await mediaService.uploadMedia({
        base64File,
        fileName: selectedFile.name,
        contentType: selectedFile.type,
        mediaType,
        containerName: 'company-logos',
        mediaDetailDescription: `Logo for company`,
      });

      setUploadedMedia(response);
      setValue('logoMediaDetailSno', response.mediaDetailSno);
      setValue('logoUrl', response.mediaUrl || '');
      setSelectedFile(null);
      setLogoPreview(response.mediaUrl || '');
      toast.success('Logo uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload logo');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className='p-6 pt-16'>
 

      <DataTable
        columns={columns}
        data={companies}
        title="Company Master"
        onAdd={openAdd}
        onEdit={onEdit}
        // onDelete={onDelete}
        onView={onView}
        showActions={true}
        showExport={false}
        showColumnFilters={true}
        filterPlaceholder="Search Company..."
        // totalCount={pagination?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
        disableFullDataFetch={true}
      />

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-8 shadow-lg w-3/4 h-full max-h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
              {isEditing ? 'Update Company' : 'Add Company'}
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" onClick={() => setIsModalOpen(false)} className="bi bi-x cursor-pointer" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
              </svg>
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Main Company Details */}
              <section>
                <h3 className="text-lg font-semibold mb-4">Main Company Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700">Company Name <span className="text-red-600">*</span></label>
                    <input className="input mt-1" placeholder="ABC Textiles"
                      {...register('companyName',
                        {
                          required: 'Company Name is required',
                          validate: (value) => {
                            const val = (value || "").trim().toLowerCase();
                            if (!val) return true;
                            const excludeName = isEditing ? (currentCompany?.companyName || "").toLowerCase() : "";
                            const exists = existingNames.some((n: string) => n.toLowerCase() === val && n.toLowerCase() !== excludeName);
                            return exists ? "This company name already exists" : true;
                          },
                          pattern: { value: /^[A-Za-z0-9\s.&-]+$/, message: 'Only letters/numbers/spaces . & -' },
                        }
                      )}
                      onFocus={() => setShowSuggestions(true)}
                      onChange={(e) => {
                        setValue("companyName", e.target.value, { shouldValidate: true });
                        setShowSuggestions(true);
                        setActiveSuggestionIndex(-1);
                      }}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowSuggestions(false);
                          setActiveSuggestionIndex(-1);
                        }, 200);
                      }}
                      onKeyDown={handleKeyDown}
                      autoComplete="off"
                    />
                    {(showSuggestions && filteredSuggestions.length > 0) && (
                      <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md max-h-48 overflow-auto">
                        {filteredSuggestions.map((s: string, index: number) => (
                          <li
                            key={s}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${index === activeSuggestionIndex ? 'bg-blue-100 border border-blue-300' : ''
                              }`}
                            onMouseEnter={() => setActiveSuggestionIndex(index)}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSuggestionClick(s);
                            }}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                    {duplicateError && !errors.companyName && (
                      <p className="mt-1 text-sm text-red-600">{duplicateError}</p>
                    )}
                    {errors.companyName && <p className="text-red-500 text-sm">{errors.companyName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Type <span className="text-red-600">*</span></label>
                    <select className="input mt-1" {...register('companyType', { required: true })}>
                      <option>Domestic</option>
                      <option>Export</option>
                      <option>Both</option>
                    </select>
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700">Company Code <span className="text-red-600">*</span></label>
                    <input className="input mt-1" placeholder="CMP001"
                      {...register('companyCode', { required: 'Company Code is required', pattern: { value: /^[A-Za-z0-9-]+$/, message: 'Alpha-numeric only' } })}
                      onChange={handleCodeInputChange}
                      onFocus={handleCodeFocus}
                      onBlur={handleCodeBlur}
                      onKeyDown={handleCodeKeyDown}
                      autoComplete="off"
                    />
                    {errors.companyCode && <p className="text-red-500 text-sm">{errors.companyCode.message}</p>}
                    {showSuggestions && (
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
                              {item.companyCode} - {item.companyName}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">GST No <span className="text-red-600">*</span></label>
                    <input className="input mt-1" placeholder="12ABCDE1234F1Z5" autoComplete='off'
                      {...register('gstNo', { required: 'GST No is required', pattern: { value: /^[0-9]{2}[A-Z0-9]{13}$/, message: 'Invalid GST format (15 alphanumeric, starting with 2 digits)' } })}
                    />
                    {errors.gstNo && <p className="text-red-500 text-sm">{errors.gstNo.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">PAN <span className="text-red-600">*</span></label>
                    <input className="input mt-1" readOnly {...register('pan', { required: 'PAN auto-fetched from GST' })} />
                    {errors.pan && <p className="text-red-500 text-sm">{errors.pan.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">CIN</label>
                    <input className="input mt-1" {...register('cin')} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">TIN</label>
                    <input className="input mt-1" {...register('tin')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">IEC Code</label>
                    <input className="input mt-1" {...register('iecCode')} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input className="input mt-1" placeholder="9876543210" {...register('phoneNumber', { pattern: { value: /^\d{7,15}$/, message: 'Numbers only (7-15 digits)' } })} />
                    {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">E-mail</label>
                    <input className="input mt-1" type="email" {...register('email')} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <input className="input mt-1" {...register('website')} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">MSME Number</label>
                    <input className="input mt-1" {...register('msmeNumber')} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">MSME Type</label>
                    <input className="input mt-1" placeholder="e.g., Micro/Small/Medium" {...register('msmeType')} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">I.C. Bank Ref No</label>
                    <input className="input mt-1" {...register('icBankRefNo')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">LUTE No</label>
                    <input className="input mt-1" {...register('luteNo')} />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Company Logo</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-2">
                      <input
                        type="file"
                        id="logoFile"
                        onChange={handleFileSelect}
                        accept="image/*"
                        disabled={isUploading}
                        className="hidden"
                      />
                      <label htmlFor="logoFile" className="cursor-pointer">
                        <div className="text-gray-600">
                          {selectedFile ? (
                            <p>{selectedFile.name}</p>
                          ) : (
                            <div>
                              <p className="font-medium">Click to select image</p>
                              <p className="text-sm text-gray-500">or drag and drop</p>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>

                    {logoPreview && (
                      <div className="mt-4 text-center">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="max-h-32 mx-auto rounded"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleUploadLogo}
                      disabled={!selectedFile || isUploading}
                      className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isUploading ? 'Uploading...' : 'Upload Logo'}
                    </button>

                    {uploadedMedia ? (
                      <p className="text-green-600 text-sm mt-2">✓ Logo uploaded successfully</p>
                    ) : (
                      <p className="text-gray-500 text-sm mt-2">Logo upload is optional</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Address Details */}
              <section>
                <h3 className="text-lg font-semibold mb-4">Address Details</h3>
                {addressFields.map((field, index) => {
                  return (
                    <div key={field.id} className="border rounded p-4 mb-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-md font-medium">Address {index + 1}</h4>
                        {addressFields.length > 1 && (
                          <button type="button" onClick={() => removeAddress(index)} className="btn btn-danger text-sm">Remove</button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-3">
                          <label className="block text-sm font-medium text-gray-700">Address <span className="text-red-600">*</span></label>
                          <input className="input mt-1" {...register(`address.${index}.line1`, { required: 'Address is required' })} />
                          {errors.address?.[index]?.line1 && <p className="text-red-500 text-sm">{errors.address[index].line1.message}</p>}
                        </div>

                        {/* <div>
                          <label className="block text-sm font-medium text-gray-700">State <span className="text-red-600">*</span></label>
                          <select className="input mt-1" {...register(`address.${index}.stateId`, { required: 'State is required' })}>
                            <option value="">Select State</option>
                            {stateList?.map((s: any) => (
                              <option key={s.id} value={s.id}>{s.stateName}</option>
                            ))}
                          </select>
                          {errors.address?.[index]?.stateId && <p className="text-red-500 text-sm">{errors.address[index].stateId.message}</p>}
                        </div> */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            State <span className="text-red-600">*</span>
                          </label>

                          <CommonSearchableSelect
                            className="min-w-[220px] mt-1"
                            placeholder="Select State"
                            options={(stateList || []).map((s: any) => ({
                              value: String(s.id),
                              label: s.stateName
                            }))}
                            {...register(`address.${index}.stateId` as const, {
                              required: 'State is required'
                            })}
                            error={errors.address?.[index]?.stateId?.message as string}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">State Code <span className="text-red-600">*</span></label>
                          <input className="input mt-1" readOnly {...register(`address.${index}.stateCode`, { required: 'State Code is required' })} />
                          {errors.address?.[index]?.stateCode && <p className="text-red-500 text-sm">{errors.address[index].stateCode.message}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Pin Code <span className="text-red-600">*</span></label>
                          <Controller
                            name={`address.${index}.pinCode`}
                            control={control}
                            rules={{
                              required: 'Pin Code is required',
                              pattern: { value: /^\d{6}$/, message: '6 digits only' }
                            }}
                            render={({ field }) => (
                              <input
                                {...field}
                                className="input mt-1"
                                type="text"
                                placeholder="6-digit PIN"
                                maxLength={6}
                                onKeyPress={(e) => {
                                  if (!/[0-9]/.test(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, "");
                                  if (val.length <= 6) {
                                    field.onChange(val);
                                  }
                                }}
                              />
                            )}
                          />
                          {errors.address?.[index]?.pinCode && <p className="text-red-500 text-sm">{errors.address[index].pinCode.message}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Address Type <span className="text-red-600">*</span></label>
                          <select className="input mt-1" {...register(`address.${index}.addressType`, { required: true })}>
                            <option>Domestic</option>
                            <option>Export</option>
                            <option>Both</option>
                          </select>
                        </div>

                        <div className="col-span-3 flex items-center gap-2">
                          <Controller
                            name={`address.${index}.isDefault`}
                            control={control}
                            render={({ field }) => (
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  if (checked) {
                                    addressFields.forEach((_, i) => {
                                      if (i !== index) {
                                        setValue(`address.${i}.isDefault`, false, { shouldValidate: false });
                                      }
                                    });
                                  }
                                  field.onChange(checked);
                                }}
                              />
                            )}
                          />
                          <label className="text-sm font-medium text-gray-700">Is Default</label>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button type="button" onClick={() => appendAddress({ line1: '', stateId: '', stateCode: '', pinCode: '', addressType: 'Domestic', isDefault: false })} className="btn btn-secondary">Add Address</button>
              </section>

              {/* Invoice Details Section */}
              <section>
                <h3 className="text-lg font-semibold mb-4">Invoice Details</h3>
                <div className="border rounded">
                  <div className="grid grid-cols-5 gap-4 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700">
                    <div>Invoice Type</div>
                    <div>Prefix</div>
                    <div>Financial Year</div>
                    <div>Seq No</div>
                    <div>Preview</div>
                  </div>
                  {invoiceFields.map((field, index) => {
                    const currentRow = invoiceDataWatch?.[index];
                    const preview = formatInvoicePreview(currentRow);
                    return (
                      <div key={field.id} className="grid grid-cols-5 gap-4 px-4 py-3 border-t text-sm items-end">
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Invoice Type <span className="text-red-600">*</span></label>
                          <select
                            className="input mt-1"
                            {...register(`invoiceItems.${index}.invoiceTypeId` as const, { required: 'Invoice Type is required' })}
                          >
                            <option value="">Select Type</option>
                            {invoiceTypeOptions.map((option) => {
                              const key = getDetailKey(option);
                              if (!key) return null;
                              const normalizedKey = normalizeCodeValue(key);
                              const isUsed = (invoiceDataWatch || []).some((row, rowIdx) => (
                                rowIdx !== index && normalizeCodeValue(row?.invoiceTypeId) === normalizedKey
                              ));
                              if (isUsed) return null;
                              return (
                                <option key={key} value={key}>{getDetailLabel(option)}</option>
                              );
                            })}
                          </select>
                          {errors.invoiceItems?.[index]?.invoiceTypeId && (
                            <p className="text-red-500 text-xs mt-1">{errors.invoiceItems[index]?.invoiceTypeId?.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Prefix <span className="text-red-600">*</span></label>
                          <input
                            className="input mt-1"
                            {...register(`invoiceItems.${index}.prefix` as const, { required: 'Prefix is required' })}
                          />
                          {errors.invoiceItems?.[index]?.prefix && (
                            <p className="text-red-500 text-xs mt-1">{errors.invoiceItems[index]?.prefix?.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Financial Year <span className="text-red-600">*</span></label>
                          <input
                            className="input mt-1"
                            {...register(`invoiceItems.${index}.financialYear` as const, { required: 'Financial Year is required' })}
                          />
                          {errors.invoiceItems?.[index]?.financialYear && (
                            <p className="text-red-500 text-xs mt-1">{errors.invoiceItems[index]?.financialYear?.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600">Seq No <span className="text-red-600">*</span></label>
                          <input
                            className="input mt-1"
                            {...register(`invoiceItems.${index}.sequenceNumber` as const, {
                              required: 'Seq No is required',
                              pattern: { value: /^\d+$/, message: 'Digits only' }
                            })}
                          />
                          {errors.invoiceItems?.[index]?.sequenceNumber && (
                            <p className="text-red-500 text-xs mt-1">{errors.invoiceItems[index]?.sequenceNumber?.message}</p>
                          )}
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600">Preview</label>
                            <div className="mt-1 min-h-[38px] rounded border px-2 py-2 bg-gray-50 text-gray-700">
                              {preview || '-'}
                            </div>
                          </div>
                          {invoiceFields.length > 1 && (
                            <button type="button" onClick={() => removeInvoice(index)} className="btn btn-danger text-xs whitespace-nowrap">
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button type="button" onClick={() => appendInvoice({ ...defaultInvoiceRow })} className="btn btn-secondary mt-4">Add Invoice Row</button>
              </section>

              {/* Bank Details */}
              <section>
                <h3 className="text-lg font-semibold mb-4">Bank Details</h3>
                {bankFields.map((field, index) => (
                  <div key={field.id} className="border rounded p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium">Bank {index + 1}</h4>
                      {bankFields.length > 1 && (
                        <button type="button" onClick={() => removeBank(index)} className="btn btn-danger text-sm">Remove</button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Name <span className="text-red-600">*</span></label>
                        <input className="input mt-1" {...register(`bank.${index}.bankName`, { required: 'Bank Name is required', pattern: { value: /^[A-Za-z\s.&-]+$/, message: 'Alphabets only' } })} />
                        {errors.bank?.[index]?.bankName && <p className="text-red-500 text-sm">{errors.bank[index].bankName.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">A/C No <span className="text-red-600">*</span></label>
                        <input className="input mt-1" {...register(`bank.${index}.accountNo`, { required: 'Account No is required', pattern: { value: /^\d+$/, message: 'Numbers only' } })} />
                        {errors.bank?.[index]?.accountNo && <p className="text-red-500 text-sm">{errors.bank[index].accountNo.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">IFSC Code <span className="text-red-600">*</span></label>
                        <input className="input mt-1" {...register(`bank.${index}.ifscCode`, { required: 'IFSC is required', pattern: { value: /^[A-Za-z0-9]{5,15}$/i, message: 'Alpha-numeric' } })} />
                        {errors.bank?.[index]?.ifscCode && <p className="text-red-500 text-sm">{errors.bank[index].ifscCode.message}</p>}
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => appendBank({ bankName: '', accountNo: '', ifscCode: '' })} className="btn btn-secondary">Add Bank</button>
              </section>

              {/* L/C Bank Details */}
              {(companyTypeValue === 'Export' || companyTypeValue === 'Both') && (
                <section>
                  <h3 className="text-lg font-semibold mb-4">L/C Bank Details</h3>
                  {lcBankFields.map((field, index) => (
                    <div key={field.id} className="border rounded p-4 mb-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-md font-medium">L/C Bank {index + 1}</h4>
                        {lcBankFields.length > 1 && (
                          <button type="button" onClick={() => removeLCBank(index)} className="btn btn-danger text-sm">Remove</button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">L/C Bank Ref No <span className="text-red-600">*</span></label>
                          <input className="input mt-1" placeholder="LC/BNK/2025/1045" {...register(`lcBank.${index}.lcBankRefNo` as const, { required: 'L/C Bank Ref No is required' })} />
                          {errors.lcBank?.[index]?.lcBankRefNo && <p className="text-red-500 text-sm">{errors.lcBank[index]?.lcBankRefNo?.message}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Date of Issue <span className="text-red-600">*</span></label>
                          <input className="input mt-1" type="date" {...register(`lcBank.${index}.dateOfIssue` as const, { required: 'Date of Issue is required' })} />
                          {errors.lcBank?.[index]?.dateOfIssue && <p className="text-red-500 text-sm">{errors.lcBank[index]?.dateOfIssue?.message}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">LUT No <span className="text-red-600">*</span></label>
                          <input className="input mt-1" placeholder="ADLUT2024-25/98765" {...register(`lcBank.${index}.lutNo` as const, { required: 'LUT No is required' })} />
                          {errors.lcBank?.[index]?.lutNo && <p className="text-red-500 text-sm">{errors.lcBank[index]?.lutNo?.message}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => appendLCBank({ lcBankRefNo: '', dateOfIssue: '', lutNo: '' })} className="btn btn-secondary">Add L/C Bank</button>
                </section>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && current && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 shadow-lg w-2/3 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Company Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-gray-600">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><strong>Name:</strong> {current.companyName}</p>
              <p><strong>Type:</strong> {current.companyType}</p>
              <p><strong>Code:</strong> {current.companyCode}</p>
              <p><strong>GST:</strong> {current.gstNo}</p>
              <p><strong>PAN:</strong> {current.pan}</p>
              {current.cin && <p><strong>CIN:</strong> {current.cin}</p>}
              {current.iecCode && <p><strong>IEC:</strong> {current.iecCode}</p>}
              {current.phoneNumber && <p><strong>Phone:</strong> {current.phoneNumber}</p>}
              {current.email && <p><strong>Email:</strong> {current.email}</p>}
              {current.website && <p><strong>Website:</strong> {current.website}</p>}
              {current.msmeNumber && <p><strong>MSME:</strong> {current.msmeNumber}</p>}
              {current.msmeType && <p><strong>MSME Type:</strong> {current.msmeType}</p>}
              {current.address.length > 0 && (
                <div className="col-span-2">
                  <p><strong>Addresses:</strong></p>
                  {current.address.map((a, i) => (
                    <p key={i} className="ml-4">{a.line1} ({a.stateCode}) - {a.pinCode}, Type: {a.addressType}, Default: {a.isDefault ? 'Yes' : 'No'}</p>
                  ))}
                </div>
              )}

              {current.bank.length > 0 && (
                <div className="col-span-2">
                  <p><strong>Banks:</strong></p>
                  {current.bank.map((b, i) => (
                    <p key={i} className="ml-4">{b.bankName} | {b.accountNo} | {b.ifscCode}</p>
                  ))}
                </div>
              )}

              {current.invoiceItems && current.invoiceItems.length > 0 && (
                <div className="col-span-2">
                  <p><strong>Invoice Details:</strong></p>
                  {current.invoiceItems.map((inv, i) => (
                    <p key={i} className="ml-4">
                      {(inv.preview && inv.preview.length ? inv.preview : formatInvoicePreview(inv)) || '-'} (Type: {inv.invoiceTypeId})
                    </p>
                  ))}
                </div>
              )}

              {(current.companyType === 'Export' || current.companyType === 'Both') && current.lcBank && current.lcBank.length > 0 && (
                <div className="col-span-2">
                  <p><strong>L/C Banks:</strong></p>
                  {current.lcBank.map((b, i) => (
                    <p key={i} className="ml-4"><strong>Ref No:</strong> {b.lcBankRefNo} | <strong>Issue Date:</strong> {b.dateOfIssue} | <strong>LUT No:</strong> {b.lutNo}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 shadow-lg w-[400px]">
            <h3 className="text-lg font-semibold mb-4">Delete Company</h3>
            <p>Are you sure you want to delete this company?</p>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary btn" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button className="btn-danger btn" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* <Pagination
        totalItems={pagination.total}
        itemsPerPage={itemsPerPage}
        offset={pagination.offset || 0}
        hasNext={pagination.next}
        hasPrev={pagination.prev}
        onPageChange={handlePageChange}
        currentPage={currentPage}
      /> */}
    </div>
  );
}

export default CompanyMaster;