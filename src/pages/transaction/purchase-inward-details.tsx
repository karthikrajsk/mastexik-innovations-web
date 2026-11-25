import { DataTable, DateRangeFilter } from "@/components/data/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Pagination, usePagination } from "@/components/common/Pagination";
import { formatDate } from "@/lib/utils";
import { FabricBarcodePiece, getFabricBarcodeLink } from "@/lib/barcode";
import { getAllPurchaseInwards, hardDeletePurchaseInward, updatePurchaseInwardAccounting } from "@/state/purchaseInwardSlice";
import { AppDispatch, RootState } from "@/state/store";
import { getAllVendors } from "@/state/vendorSlice";
import { getAllPurchaseOrders } from "@/state/purchaseOrderSlice";
import { getAllYarnMasters } from "@/state/yarnSlice";
import { getAllSubCategories, getSubCategoryByCategory } from "@/state/subCategorySlice";
import { useDeletionStatus } from "@/hooks/useDeletionStatus";
import { useHighlightRow } from "@/hooks/useHighlightRow";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { DocumentAttachmentModal } from "@/components/modals/DocumentAttachmentModal";
import { useFileCounts } from "@/hooks/useFileCounts";


interface LotEntry {
  id: number;
  lotNumber: string | null;
  poTypeId: number;
  yarnId: number | null;
  fabricId: number | null;
  fabricMasterId: number | null;
  warehouseId: number;
  quantity: number;
  rejectedQuantity: number;
  cost: number | null;
  remarks: string | null;
  activeFlag: boolean;
}

interface PieceEntry {
  id: number;
  pieceNumber: string;
  pieceRollNo?: string;
  pieceNo?: string;
  quantity: number;
  meter?: number;
  weight: number;
  inspectedNtWt?: number;
  netWeight?: number;
  cost: number;
  grade?: string;
  remarks: string;
  activeFlag: boolean;
  warehouseId: number;
  sourceType: string;
  poType: string;
  fabricId: number;
  fabricMasterId: number;
}

interface YarnStockDetail {
  itemId: number;
  orderItemId: number;
  yarnCode: string;
  uomId: number;
  lotNo: string;
  inwardQty: number;
  inwardBags: number;
  kgsPerBag: number;
  acceptedQty: number;
  rejectedQty: number;
  warehouseId: number;
}

interface InwardItem {
  id: number;
  inwardId: number;
  poItemId: number;
  quantityReceived: number;
  price: number;
  activeFlag: boolean;
  fabricCode: string | null;
  lotEntries: LotEntry[] | null;
  pieceEntries: PieceEntry[] | null;
  yarnStockDetails?: YarnStockDetail[] | null;
  millNameId?: number;
}

interface InwardDetail {
  id: number;
  poTypeId: number;
  vendorId: number;
  companyId?: number | null;
  inwardDate: string;
  remarks: string | null;
  activeFlag: boolean;
  fabricCode: string | null;
  purchaseOrderId: number;
  purchaseInwardItemsDtl: InwardItem[];
  dcNumber: string;
  dcDate: string;
  purchaseInwardNo: string;
  isAccounted?: boolean;
  invoiceNumber?: string;
  invoiceDate?: string;
  purchaseAccount?: string;
  supplierAccount?: string;
  taxAmount?: number;
  totalAmount?: number;
  accountingRemarks?: string;
  yarnMillId?: number | string | null;
  millId?: number | string | null;
  millInvNo?: string | null;
}

export function PurchaseInwardDetails() {
  const { purchaseInwardList, paginationInfo, loading } = useSelector((state: RootState) => state.purchaseInward);
  const { purchaseOrderList } = useSelector((state: RootState) => state.purchaseOrder);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { yarnList } = useSelector((state: RootState) => state.yarn);
  const { subCategoryList, subCategoryByCategoryList } = useSelector((state: RootState) => state.subCategory);
  
  // const { deletionStatus: inwardCanDeleteStatus, deletionErrors: inwardDeleteErrors, loading: deletionStatusLoading } = useDeletionStatus({
  //   endpoint: '/purchase-inward/',
  //   items: purchaseInwardList,
  //   enabled: purchaseInwardList.length > 0
  // });

  
  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    resetPage,
    getOffset,
    setItemsPerPage
  } = usePagination({ itemsPerPage: 10 });

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentInward, setCurrentInward] = useState<InwardDetail | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  // const highlightRowId = useHighlightRow();
  const selectedCompanyId = useMemo(() => {
    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    return storedCompanyId ? Number(storedCompanyId) : undefined;
  }, []);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkPrintModalOpen, setIsBulkPrintModalOpen] = useState(false);

  // Accounting modal state
  const [isAccountingModalOpen, setIsAccountingModalOpen] = useState(false);
  const [accountingInward, setAccountingInward] = useState<InwardDetail | null>(null);
  const [accountingFormData, setAccountingFormData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    purchaseAccount: 'Yarn Purchase Account',
    supplierAccount: '',
    taxAmount: '',
    totalAmount: '',
    accountingRemarks: '',
  });
  const [isSavingAccounting, setIsSavingAccounting] = useState(false);
  const [selectedAttachmentContainer, setSelectedAttachmentContainer] = useState<string | null>(null);
  const [attachmentModalTitle, setAttachmentModalTitle] = useState<string>('');

  useEffect(() => {
    const listParams: { companyId?: number } = {
      // offset: getOffset(),
      // limit: itemsPerPage
    };
    if (selectedCompanyId) {
      listParams.companyId = selectedCompanyId;
    }
    const purchaseOrderParams: { companyId?: number } = {};
    if (selectedCompanyId) {
      purchaseOrderParams.companyId = selectedCompanyId;
    }
    dispatch(getAllPurchaseInwards(listParams));
    dispatch(getAllPurchaseOrders(purchaseOrderParams));
    dispatch(getAllVendors({ fetchAll: true }));
    dispatch(getAllYarnMasters({}));
    dispatch(getSubCategoryByCategory({ categoryName: 'Mill', fetchAll: true } as any));
    dispatch(getAllSubCategories({ fetchAll: true } as any));
  }, [dispatch, currentPage, getOffset, itemsPerPage, selectedCompanyId]);

  // Create vendor map for quick lookup
  const vendorMap = useMemo(() => {
    return (
      vendorList?.reduce((acc: Record<number, string>, vendor: { id: number; vendorName: string }) => {
        acc[vendor.id] = vendor.vendorName;
        return acc;
      }, {}) || {}
    );
  }, [vendorList]);

  // Create mill map for quick lookup from subCategorySlice (where categoryName = 'Mill')
  const millMap = useMemo(() => {
    const map: Record<number, string> = {};
    if (Array.isArray(subCategoryList)) {
      subCategoryList.forEach((sc: any) => {
        if (sc.id) {
          map[Number(sc.id)] = sc.subCategoryName || sc.name || '';
        }
      });
    }
    if (Array.isArray(subCategoryByCategoryList)) {
      subCategoryByCategoryList.forEach((sc: any) => {
        if (sc.id) {
          map[Number(sc.id)] = sc.subCategoryName || sc.name || '';
        }
      });
    }
    return map;
  }, [subCategoryList, subCategoryByCategoryList]);

  const handleOpenAccountingModal = useCallback((inward: InwardDetail) => {
    setAccountingInward(inward);
    const supplierName = vendorMap[inward.vendorId] || 'Supplier Account';
    
    // Autogenerate invoice number if not present
    const grnNo = inward.purchaseInwardNo || inward.dcNumber || `GRN-${inward.id}`;
    const autoGenInvoiceNo = inward.invoiceNumber || `INV-${grnNo}`;

    // Current date for invoice date
    const currentDate = new Date().toISOString().split('T')[0];
    const invoiceDate = inward.invoiceDate || currentDate;

    // Derived Purchase Account based on PO Type: 1 = Yarn, 2/3 = Fabric, other = General Item
    let derivedPurchaseAccount = 'General Purchase Account';
    if (inward.poTypeId === 1) {
      derivedPurchaseAccount = 'Yarn Purchase Account';
    } else if (inward.poTypeId === 2 || inward.poTypeId === 3) {
      derivedPurchaseAccount = 'Fabric Purchase Account';
    }

    setAccountingFormData({
      invoiceNumber: autoGenInvoiceNo,
      invoiceDate: invoiceDate,
      purchaseAccount: inward.purchaseAccount || derivedPurchaseAccount,
      supplierAccount: inward.supplierAccount || supplierName,
      taxAmount: '',
      totalAmount: '',
      accountingRemarks: inward.accountingRemarks || '',
    });
    setIsAccountingModalOpen(true);
  }, [vendorMap]);

  const handleSaveAccounting = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!accountingInward) return;

    setIsSavingAccounting(true);
    try {
      await dispatch(
        updatePurchaseInwardAccounting({
          ...accountingInward,
          id: accountingInward.id,
          companyId: accountingInward.companyId || selectedCompanyId,
          isAccounted: true,
          invoiceNumber: accountingFormData.invoiceNumber,
          invoiceDate: accountingFormData.invoiceDate,
          purchaseAccount: accountingFormData.purchaseAccount,
          supplierAccount: accountingFormData.supplierAccount,
          taxAmount: accountingFormData.taxAmount ? Number(accountingFormData.taxAmount) : 0,
          totalAmount: accountingFormData.totalAmount ? Number(accountingFormData.totalAmount) : 0,
          accountingRemarks: accountingFormData.accountingRemarks,
        })
      ).unwrap();

      setIsAccountingModalOpen(false);
    } catch (err: any) {
      console.error("Error saving accounting details:", err);
    } finally {
      setIsSavingAccounting(false);
    }
  };

  const handleUnaccount = async () => {
    if (!accountingInward) return;
    if (!window.confirm("Are you sure you want to unmark this GRN as accounted? The accounting status will return to Pending.")) {
      return;
    }

    setIsSavingAccounting(true);
    try {
      await dispatch(
        updatePurchaseInwardAccounting({
          ...accountingInward,
          id: accountingInward.id,
          companyId: accountingInward.companyId || selectedCompanyId,
          isAccounted: false,
        })
      ).unwrap();

      toast.info("GRN status reset to Pending.");
      setIsAccountingModalOpen(false);
    } catch (err: any) {
      console.error("Error unmarking accounting details:", err);
    } finally {
      setIsSavingAccounting(false);
    }
  };


  // Create yarn map for quick lookup
  const yarnMap = useMemo(() => {
    return (
      yarnList?.reduce((acc: Record<number, string>, yarn: { id: number; yarnName: string }) => {
        acc[yarn.id] = yarn.yarnName;
        return acc;
      }, {}) || {}
    );
  }, [yarnList]);

  // Create purchase order items map for quick lookup
  const purchaseOrderItemsMap = useMemo(() => {
    const itemsMap: Record<number, any> = {};

    purchaseOrderList?.forEach((po: any) => {
      if (po.purchaseOrderItemsDtl && Array.isArray(po.purchaseOrderItemsDtl)) {
        po.purchaseOrderItemsDtl.forEach((item: any) => {
          itemsMap[item.id] = {
            ...item,
            poTypeId: po.poTypeId, // Store PO type for determining product name format
          };
        });
      }
    });

    return itemsMap;
  }, [purchaseOrderList]);

  // Helper function to get product name - prioritizes yarnCode/fabricCode from stock details, then falls back to PO items
  const getProductName = (inward: InwardDetail): string => {
    if (!inward.purchaseInwardItemsDtl || inward.purchaseInwardItemsDtl.length === 0) return "N/A";

    const productNames: string[] = [];

    // Loop through all items to get product names
    inward.purchaseInwardItemsDtl.forEach((item) => {
      let productName = "";

      // PRIORITY 1: Check yarnStockDetails for yarnCode (for yarn products)
      if (item.yarnStockDetails && item.yarnStockDetails.length > 0) {
        const firstYarn = item.yarnStockDetails[0];
        if (firstYarn.yarnCode) {
          productName = firstYarn.yarnCode;
        }
      }

      // PRIORITY 2: Check itemStockDetails for itemName (for item products)
      if (!productName && (item as any).itemStockDetails && (item as any).itemStockDetails.length > 0) {
        const firstItemStock = (item as any).itemStockDetails[0];
        if (firstItemStock.itemName) {
          productName = firstItemStock.itemName;
        }
      }

      // PRIORITY 3: Check pieceEntries for fabricCode (for woven fabric products)
      if (!productName && item.pieceEntries && item.pieceEntries.length > 0) {
        // Try item-level fabricCode first
        if (item.fabricCode) {
          productName = item.fabricCode;
        }
        // Try inward-level fabricCode
        else if (inward.fabricCode) {
          productName = inward.fabricCode;
        }
        // If no fabricCode but has pieceEntries, it's a piece-based product
        else if (item.pieceEntries.length > 0) {
          productName = item.pieceEntries[0].poType || "Woven Fabric";
        }
      }

      // PRIORITY 4: Check if yarnId exists in lot entries (for yarn products)
      if (!productName && item.lotEntries && item.lotEntries.length > 0) {
        const firstLot = item.lotEntries[0];

        // If yarnId exists in lot entry, use it to get yarn name from yarn master
        if (firstLot.yarnId && yarnMap[firstLot.yarnId]) {
          productName = yarnMap[firstLot.yarnId];
        }
      }

      // PRIORITY 5: Fall back to purchase order item
      if (!productName) {
        const poItemId = item.poItemId;

        if (poItemId) {
          const poItem = purchaseOrderItemsMap[poItemId];

          if (poItem) {
            try {
              const poTypeId = poItem.poTypeId;

              // PO Type 1: Yarn - return yarn name from PO item
              if (poTypeId === 1) {
                productName = poItem.yarnName || "Yarn not specified";
              }
              // PO Type 2 or 3: Fabric - return fabric code and quality
              else if (poTypeId === 2 || poTypeId === 3) {
                if (poItem.fabricCode && poItem.quality) {
                  productName = `${poItem.fabricCode}-${poItem.quality}`;
                } else if (poItem.fabricCode) {
                  productName = poItem.fabricCode;
                } else if (poItem.fabricName) {
                  productName = poItem.fabricName;
                } else {
                  productName = "Fabric not specified";
                }
              }
              // PO Type 4: Item - return item name
              else if (poTypeId === 4) {
                productName = poItem.itemName || "Item not specified";
              } else {
                productName = "Unknown product type";
              }
            } catch (error) {
              console.error("Error getting product name:", error);
              productName = "Error loading product";
            }
          } else {
            productName = "Product not found";
          }
        } else {
          productName = "N/A";
        }
      }

      // Add to product names array if not empty and not already added
      if (productName && productName !== "N/A" && !productNames.includes(productName)) {
        productNames.push(productName);
      }
    });

    // Return joined product names or single name
    if (productNames.length === 0) return "N/A";
    if (productNames.length === 1) return productNames[0];
    return productNames.join(", ");
  };

  const extractPieceEntriesForRow = useCallback((inward: InwardDetail): FabricBarcodePiece[] => {
    if (inward.poTypeId !== 2) return [];
    const firstItem = inward.purchaseInwardItemsDtl?.[0];
    const poItem = firstItem?.poItemId ? purchaseOrderItemsMap[firstItem.poItemId] : undefined;
    return (inward.purchaseInwardItemsDtl ?? [])
      .flatMap(item => item.pieceEntries ?? [])
      .map(piece => {
        const barcodeValue = piece.pieceNumber || piece.pieceRollNo || piece.pieceNo;
        if (!barcodeValue) return null;
        const [fabricCodePiece, fabricQualityPiece] = (poItem?.fabricCode || inward.fabricCode || '').split(' - ');
        const meter = piece.meter ?? piece.quantity ?? firstItem?.quantityReceived;
        const netWeight = piece.inspectedNtWt ?? piece.netWeight ?? piece.weight;
        return {
          barcode: barcodeValue,
          fabricCode: fabricCodePiece || poItem?.fabricCode || inward.fabricCode || '',
          fabricQuality: fabricQualityPiece || poItem?.quality || '',
          grade: piece.grade ?? poItem?.grade ?? '',
          meter,
          netWeight: netWeight ?? undefined,
        } as FabricBarcodePiece;
      })
      .filter((e): e is FabricBarcodePiece => Boolean(e));
  }, [purchaseOrderItemsMap]);

  const handleToggleRow = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean, data: any[]) => {
    setSelectedIds(checked ? new Set(data.map((r: any) => r.id)) : new Set());
  }, []);

  const handleClearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const handleCancelSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  const processedCityList = useMemo(() => {
    return purchaseInwardList.map((city: any, index: number) => {
      const rawItems = city.purchaseInwardItemsDtl || city.items || [];
      const uniqueItemsMap = new Map();
      rawItems.forEach((item: any) => {
        const key = item.purchaseOrderItemId || item.poItemId || item.id;
        if (key && !uniqueItemsMap.has(String(key))) {
          uniqueItemsMap.set(String(key), item);
        }
      });
      const uniqueItems = Array.from(uniqueItemsMap.values());
      const quantityDetails = uniqueItems.map((item: any) => item.quantityReceived).filter((q: any) => q != null && q !== '').join(', ') || '';

      return {
        ...city,
        quantityReceived: quantityDetails,
        serialNo: (paginationInfo?.offset || 0) + index + 1
      };
    });
  }, [purchaseInwardList, paginationInfo?.offset]);

  const containerNames = useMemo(() => {
    return (processedCityList || []).map((inward: any) => `purchase_inward_${inward.id}`);
  }, [processedCityList]);

  const { counts: fileCounts, updateCount: updateFileCount } = useFileCounts(containerNames);

  const handleOpenAttachmentModal = useCallback((inward: InwardDetail) => {
    setSelectedAttachmentContainer(`purchase_inward_${inward.id}`);
    setAttachmentModalTitle(`Purchase Inward / GRN #${inward.purchaseInwardNo || inward.dcNumber || inward.id} Files`);
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: "S.No",
        accessor: 'serialNo',
        width: 50,
        disableFilters: true,
      },
       {
        Header: 'Inward / GRN Date',
        accessor: 'inwardDate',
        Cell: ({ value }: { value: string }) => {
          // Format date as DD/MM/YYYY
          const date = new Date(value);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        },
        Filter: DateRangeFilter
      },
      {
        Header: 'Inward / GRN No',
        id: 'inwardNumber',
        accessor: (row: InwardDetail) => row.purchaseInwardNo || 'N/A',
        Cell: ({ value }: { value: string }) => value,
        // disableFilters: true,
        width: 100,
      },
     
      {
        Header: 'PO Number',
        accessor: 'purchaseOrderNo',
      },
      
      // {
      //   Header: 'PO No',
      //   accessor: 'purchaseOrderId',
      //   Cell: ({ value }: { value: number }) => {
      //     const po = purchaseOrderList.find((po: any) => po.id === value);
      //     return po ? po.poNo : value;
      //   },
      //   filter: (rows: any[], id: string[], filterValue: string) => {
      //     if (!filterValue) return rows;
      //     return rows.filter(row => {
      //       const po = purchaseOrderList.find((po: any) => po.id === row.values.purchaseOrderId);
      //       const poNo = po ? po.poNo : '';
      //       return poNo.toString().toLowerCase().includes(filterValue.toLowerCase());
      //     });
      //   },
      // },
      {
        Header: 'Supplier/Vendor',
        id: 'vendor',
        accessor: (row: InwardDetail) => {
          const vId = row.vendorId ?? (row as any).supplierId;
          if (vId && vendorMap[Number(vId)]) {
            return vendorMap[Number(vId)];
          }
          if ((row as any).vendorName) return (row as any).vendorName;
          if ((row as any).supplierName) return (row as any).supplierName;
          if ((row as any).vendor?.vendorName) return (row as any).vendor.vendorName;
          if ((row as any).supplier?.supplierName) return (row as any).supplier.supplierName;
          return 'N/A';
        },
        Cell: ({ value }: { value: string }) => value || 'N/A',
      },
      {
        Header: 'Yarn Mill Name',
        id: 'yarnMillName',
        accessor: (row: InwardDetail) => {
          const millId = row.yarnMillId ?? row.millId ?? (row as any).millNameId ?? row.purchaseInwardItemsDtl?.[0]?.millNameId ?? (row.purchaseInwardItemsDtl?.[0] as any)?.yarnMillId;
          if (millId && millMap[Number(millId)]) {
            return millMap[Number(millId)];
          }
          if ((row as any).millName) return (row as any).millName;
          if (row.purchaseInwardItemsDtl?.[0] && (row.purchaseInwardItemsDtl[0] as any).millName) {
            return (row.purchaseInwardItemsDtl[0] as any).millName;
          }
          return 'N/A';
        },
        Cell: ({ value }: { value: string }) => value || 'N/A',
      },
      {
        Header: 'Yarn Mill Inv. No',
        id: 'millInvNo',
        accessor: (row: InwardDetail) => row.millInvNo || (row as any).yarnMillInvNo || (row as any).millInvoiceNo || 'N/A',
        Cell: ({ value }: { value: string }) => value || 'N/A',
      },
      {
        Header: 'Product Name',
        id: 'productName',
        accessor: (row: InwardDetail) => getProductName(row),
        width: 200,
        Cell: ({ value }: { value: string }) => (
          <div className="w-[200px] max-w-[200px] whitespace-normal break-words leading-tight">
            {value}
          </div>
        ),
      },
     
      {
        Header: 'dc Number',
        accessor: 'dcNumber',
      },
      {
        Header: 'dc Date',
        accessor: 'dcDate',
      },
       { Header: 'Quantity', accessor: 'quantityReceived' },
      {
        Header: 'Files',
        accessor: 'id',
        disableFilters: true,
        Cell: (props: any) => {
          const { row } = props;
          const containerName = `purchase_inward_${row.original.id}`;
          const count = fileCounts[containerName] || 0;
          return count > 0 ? (
            <button
              onClick={() => handleOpenAttachmentModal(row.original)}
              className="text-blue-600 underline hover:text-blue-800 text-sm font-medium cursor-pointer"
            >
              View Files ({count})
            </button>
          ) : (
            <button
              onClick={() => handleOpenAttachmentModal(row.original)}
              className="text-blue-600 underline hover:text-blue-800 text-sm font-medium cursor-pointer"
            >
              Upload
            </button>
          );
        },
      },
        {
        Header: 'Barcode',
        accessor: 'barcodeLink',
        disableFilters: true,
        Cell: ({ row }: { row: any }) => {
          const inward: InwardDetail = row.original;
          if (inward.poTypeId !== 2) {
            return <span className="text-xs text-secondary-500">-</span>;
          }

          const companyIdParam = inward.companyId ?? selectedCompanyId;
          const flattenedPieceEntries = (inward.purchaseInwardItemsDtl ?? [])
            .flatMap(item => item.pieceEntries ?? []);
          const firstItem = inward.purchaseInwardItemsDtl?.[0];
          const poItem = firstItem?.poItemId ? purchaseOrderItemsMap[firstItem.poItemId] : undefined;

          const pieceEntriesForLink = flattenedPieceEntries
            .map(piece => {
              const barcodeValue = piece.pieceNumber || piece.pieceRollNo || piece.pieceNo;
              if (!barcodeValue) {
                return null;
              }

              const fabricDetails = poItem?.fabricCode || inward.fabricCode || '';
              const [fabricCodePiece, fabricQualityPiece] = (fabricDetails || '').split(' - ');
              const meter = piece.meter ?? piece.quantity ?? firstItem?.quantityReceived;
              const netWeight = piece.inspectedNtWt ?? piece.netWeight ?? piece.weight;

              return {
                barcode: barcodeValue,
                fabricCode: fabricCodePiece || poItem?.fabricCode || inward.fabricCode || '',
                fabricQuality: fabricQualityPiece || poItem?.quality || '',
                grade: piece.grade ?? poItem?.grade ?? poItem?.fabricQuality ?? '',
                meter,
                netWeight: netWeight ?? undefined,
              } as FabricBarcodePiece;
            })
            .filter((entry): entry is FabricBarcodePiece => Boolean(entry));

          const primaryPieceData = pieceEntriesForLink[0];
          const primaryBarcodeValue =
            primaryPieceData?.barcode ||
            inward.purchaseInwardNo ||
            `INWARD-${inward.id}`;

          if (!primaryBarcodeValue) {
            return <span className="text-xs text-secondary-500">-</span>;
          }

          const netWeightValues = pieceEntriesForLink
            .map(piece => piece.netWeight)
            .filter((value): value is string | number => value !== undefined && value !== null);

          const totalNetWeight = netWeightValues.length
            ? netWeightValues.reduce((sum: number, value: any) => sum + Number(value), 0)
            : undefined;
          const netWeightDisplay = totalNetWeight !== undefined ? totalNetWeight : '--';
          const pieceCount = pieceEntriesForLink.length || flattenedPieceEntries.length;

          const link = getFabricBarcodeLink({
            barcode: primaryBarcodeValue,
            fabricCode: primaryPieceData?.fabricCode || poItem?.fabricCode || inward.fabricCode || '',
            fabricQuality: primaryPieceData?.fabricQuality || poItem?.quality || '',
            grade: primaryPieceData?.grade || poItem?.grade || poItem?.fabricQuality || '',
            meter: primaryPieceData?.meter ?? firstItem?.quantityReceived,
            netWeight: totalNetWeight,
            companyId: companyIdParam,
            pieceEntries: pieceEntriesForLink.length > 0 ? pieceEntriesForLink : undefined,
          });

          if (!link) {
            return <span className="text-xs text-secondary-500">-</span>;
          }

          return (
            <div className="flex flex-col gap-1 text-xs">
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium text-sm"
              >
                Barcode
              </a>
              {/* <span className="text-[0.65rem] text-secondary-500">
                Pieces: {pieceCount || '0'}
              </span> */}
            </div>
          );
        },
      },
      {
        Header: 'Accounting',
        id: 'accounting',
        width: 140,
        accessor: (row: InwardDetail) => row.isAccounted ? 'Accounted' : 'Pending',
        Cell: ({ row }: { row: { original: InwardDetail } }) => {
          const inward = row.original;
          const isAccounted = Boolean(inward.isAccounted);

          return (
            <div 
              className="flex items-center gap-2 cursor-pointer select-none py-1 px-2 rounded-md hover:bg-gray-100/70 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenAccountingModal(inward);
              }}
              title={isAccounted ? "Click to view/edit accounting details" : "Click to complete accounting"}
            >
              <input
                type="checkbox"
                checked={isAccounted}
                readOnly
                onChange={() => {}} 
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
              />
              {isAccounted ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Accounted
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                  Pending
                </span>
              )}
            </div>
          );
        },
      },
    ],
    [vendorMap, purchaseOrderList, purchaseOrderItemsMap, yarnMap, selectedCompanyId, handleOpenAccountingModal]
  );

  const totalBarcodeCount = useMemo(() => {
    let count = 0;
    for (const id of selectedIds) {
      const row = processedCityList.find((r: any) => r.id === id);
      if (row) count += extractPieceEntriesForRow(row as InwardDetail).length;
    }
    return count;
  }, [selectedIds, processedCityList, extractPieceEntriesForRow]);

  const checkboxColumn = useMemo(() => {
    const fabricRows = processedCityList.filter((r: any) => r.poTypeId === 2);
    return {
      id: 'bulkSelect',
      Header: (
        <div className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={fabricRows.length > 0 && fabricRows.every((r: any) => selectedIds.has(r.id))}
            onChange={e => handleSelectAll(e.target.checked, fabricRows)}
            className="w-3.5 h-3.5 cursor-pointer accent-black"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          />
          <span className="text-xs font-semibold">All</span>
        </div>
      ),
      accessor: 'id',
      disableFilters: true,
      width: 60,
      Cell: ({ row }: { row: any }) => {
        if (row.original.poTypeId !== 2) {
          return <span className="text-xs text-secondary-500">-</span>;
        }
        const id = row.original.id;
        return (
          <div onClick={(e: React.MouseEvent) => e.stopPropagation()} className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={selectedIds.has(id)}
              onChange={() => handleToggleRow(id)}
              className="w-3.5 h-3.5 cursor-pointer accent-black "
            />
          </div>
        );
      }
    };
  }, [processedCityList, selectedIds, handleSelectAll, handleToggleRow]);

  const activeColumns = useMemo(() => {
    if (!selectMode) return columns;
    const filtered = columns.filter((c: any) => c.accessor !== 'barcodeLink');
    const actionsIdx = filtered.findIndex((c: any) => c.accessor === 'actions' || c.id === 'actions');
    if (actionsIdx >= 0) return [...filtered.slice(0, actionsIdx), checkboxColumn, ...filtered.slice(actionsIdx)];
    return [...filtered, checkboxColumn];
  }, [selectMode, columns, checkboxColumn]);

  const handleOpenBarcodeStickerPage = useCallback(() => {
    const allEntries: FabricBarcodePiece[] = [];
    for (const id of selectedIds) {
      const row = processedCityList.find((r: any) => r.id === id);
      if (row) allEntries.push(...extractPieceEntriesForRow(row as InwardDetail));
    }
    if (!allEntries.length) return;
    const link = getFabricBarcodeLink({
      barcode: allEntries[0].barcode,
      pieceEntries: allEntries,
      companyId: selectedCompanyId,
    });
    if (link) window.open(link, '_blank');
    setIsBulkPrintModalOpen(false);
  }, [selectedIds, processedCityList, extractPieceEntriesForRow, selectedCompanyId]);

  const handleAdd = () => {
    navigate("/transaction/purchase-inward");
  };

  const handleEdit = (inward: InwardDetail) => {
    const parentId = inward.id;
    const childIds: number[] = [];
    if (inward.purchaseInwardItemsDtl) {
      childIds.push(...(inward.purchaseInwardItemsDtl as any[]).map(item => item.id).filter(Boolean));
    }
    
    const queryParams = new URLSearchParams();
    queryParams.set('parentId', String(parentId));
    if (childIds.length > 0) {
      childIds.forEach(childId => queryParams.append('childId', String(childId)));
    }
    
    navigate(
      `/transaction/purchase-inward?${queryParams.toString()}`,
      { state: { purchaseInwardDtl: inward } }
    );
  };

  const handleView = (inward: InwardDetail) => {
    setCurrentInward(inward);
    setIsViewModalOpen(true);
  };

const handleDelete = (inward: InwardDetail) => {
  // if (!inwardCanDeleteStatus[inward.id]) {
  //   const errorMessage = inwardDeleteErrors[inward.id] || 'The data is already in use';
  //   toast.error(errorMessage);
  //   return;
  // }
  
  setCurrentInward(inward);
  setIsDeleteModalOpen(true);
};

  const confirmDelete = async () => {
  if (!currentInward) return;

  try {
    await dispatch(hardDeletePurchaseInward({ id: currentInward.id, companyId: currentInward.companyId ?? undefined })).unwrap();
    // await dispatch(deletePurchaseInward({ id: currentInward.id, companyId: currentInward.companyId ?? undefined })).unwrap();
    resetPage();
    const reloadParams: {
      offset: number;
      limit: number;
      companyId?: number;
    } = { offset: 0, limit: itemsPerPage };
    if (selectedCompanyId) {
      reloadParams.companyId = selectedCompanyId;
    }
    await dispatch(getAllPurchaseInwards(reloadParams));
    
    setIsDeleteModalOpen(false);
  } catch (error: any) {
    // Error is already handled in the thunk with toast
    // Just close the modal
    setIsDeleteModalOpen(false);
  }
};

  const totalOrders = paginationInfo?.total ?? (Array.isArray(processedCityList) ? processedCityList.length : 0);
  const currentOffset = paginationInfo?.offset || 0;
  const displayStart = totalOrders === 0 ? 0 : currentOffset + 1;
  const displayEnd = Math.min(currentOffset + processedCityList.length, totalOrders);

  return (
    <div>
      <div className="pb-5">
      {selectMode && (
        <div className="flex items-center justify-between px-4 py-2.5 mb-0 bg-blue-200 border border-primary rounded-t-md">
          <div className="flex items-center gap-3 text-sm text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m0 14v1m8-8h-1M5 12H4m14.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707" /><rect x="3" y="7" width="18" height="13" rx="2" strokeWidth={2} /></svg>
            <span className="font-semibold">{selectedIds.size} {selectedIds.size === 1 ? 'entry' : 'entries'} selected</span>
            <span className="text-primary text-xs">{totalBarcodeCount} {totalBarcodeCount === 1 ? 'barcode' : 'barcodes'} will be printed</span>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button onClick={handleClearSelection} className="text-xs text-primary hover:text-primary font-medium underline-offset-2 hover:underline">
                Clear
              </button>
            )}
            <button
              disabled={selectedIds.size === 0}
              onClick={() => setIsBulkPrintModalOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${selectedIds.size === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary shadow'}`}
            >
              Print Bundle of Barcodes
            </button>
          </div>
        </div>
      )}
      </div>

      <DataTable
        title="Purchase Inward / GRN Details"
        columns={activeColumns}
        data={processedCityList}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        showActions={true}
        showColumnFilters={true}
        isShowPagination={false}
        filterPlaceholder="Search purchase inwards..."
        disableFullDataFetch={true}
        virtualScroll={true}
        virtualScrollHeight="65vh"
        onRowClick={selectMode ? (row) => handleToggleRow(row.id) : undefined}
        getRowClassName={selectMode ? (row) => selectedIds.has(row.id) ? 'bg-[#EDE7F6]' : '' : undefined}
        headerActions={
          <button
            onClick={() => selectMode ? handleCancelSelectMode() : setSelectMode(true)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${selectMode ? 'border-blue-600 bg-blue-600 text-white shadow' : 'border-blue-600 bg-white text-blue-700 hover:bg-blue-50'}`}
          >
            {selectMode ? 'Cancel Selection' : 'Print Multiple Barcode'}
          </button>
        }
      />


      {/* Bulk Print Confirmation Modal */}
      <Modal
        isOpen={isBulkPrintModalOpen}
        onClose={() => setIsBulkPrintModalOpen(false)}
        title="Print Bundle of Barcodes"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800">{totalBarcodeCount}</span> barcode sticker{totalBarcodeCount !== 1 ? 's' : ''} across{' '}
            <span className="font-semibold text-gray-800">{selectedIds.size}</span> {selectedIds.size === 1 ? 'entry' : 'entries'} will be sent to the sticker page.
          </p>
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-md bg-gray-50">
            {Array.from(selectedIds).map(id => {
              const row = processedCityList.find((r: any) => r.id === id) as InwardDetail | undefined;
              if (!row) return null;
              const count = extractPieceEntriesForRow(row).length;
              return (
                <div key={id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-800">{row.purchaseInwardNo || `Inward #${row.id}`}</span>
                    <span className="ml-2 text-xs text-gray-500">{row.inwardDate ? new Date(row.inwardDate).toLocaleDateString() : ''}</span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-light text-primary">
                    {count} {count === 1 ? 'barcode' : 'barcodes'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => setIsBulkPrintModalOpen(false)} className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
              Cancel
            </button>
            <button onClick={handleOpenBarcodeStickerPage} className="px-4 py-2 text-sm bg-primary text-white hover:bg-primary-light rounded-md transition-colors font-semibold">
              Open Barcode Sticker Page
            </button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Inward Details - #${currentInward?.id || ''}`}
        className="max-w-6xl"
      >
        {currentInward && (
          <div className="space-y-6">
            {/* Header Information */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Inward ID</p>
                <p className="font-medium">{currentInward.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Inward Date</p>
                <p className="font-medium">
                  {(() => {
                    const date = new Date(currentInward.inwardDate);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}/${month}/${year}`;
                  })()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">PO ID</p>
                <p className="font-medium">{currentInward.purchaseOrderId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dc Number</p>
                <p className="font-medium">{currentInward.dcNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dc Date</p>
                <p className="font-medium">{currentInward.dcDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Remarks</p>
                <p className="font-medium">{currentInward.remarks || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${currentInward.activeFlag ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                >
                  {currentInward.activeFlag ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Items Section */}
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-3">Inward Items</h3>
              {currentInward.purchaseInwardItemsDtl?.length > 0 ? (
                <div className="space-y-4">
                  {currentInward.purchaseInwardItemsDtl.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-500">Item ID</p>
                          <p className="font-medium">{item.id}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Quantity Received</p>
                          <p className="font-medium">{item.quantityReceived}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Price</p>
                          <p className="font-medium">{item.price}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">PO Item ID</p>
                          <p className="font-medium">{item.poItemId}</p>
                        </div>

                      </div>

                      {/* Lot Entries */}
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Lot Entries:</h4>
                        {item.lotEntries && item.lotEntries.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lot #</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rejected</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {item.lotEntries && item.lotEntries.map((lot) => (
                                  <tr key={lot.id}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                                      {lot.lotNumber || 'N/A'}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{lot.quantity}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{lot.rejectedQuantity}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{lot.cost}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                                      {lot.remarks || 'N/A'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-gray-500">No lot entries for this item</p>
                        )}
                      </div>

                      {/* Piece Entries */}
                      <div>
                        <h4 className="font-medium mb-2">Piece Entries:</h4>
                        {item.pieceEntries && item.pieceEntries.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Piece #</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Weight</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {item.pieceEntries && item.pieceEntries.map((piece) => (
                                  <tr key={piece.id}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                                      {piece.pieceNumber || 'N/A'}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{piece.quantity}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{piece.weight}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{piece.cost}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">{piece.warehouseId}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                                      {piece.remarks || 'N/A'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-gray-500">No piece entries for this item</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No items found for this inward</p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
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
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete Fabric?</p>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button onClick={confirmDelete} className="btn btn-danger">
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Accounting Details Modal */}
      <Modal
        isOpen={isAccountingModalOpen}
        onClose={() => setIsAccountingModalOpen(false)}
        title="Accounting Details"
        className="max-w-2xl"
      >
        {accountingInward && (
          <form onSubmit={handleSaveAccounting} className="space-y-5">
            {/* Header Read-Only Details */}
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div>
                <span className="block text-slate-500 font-medium mb-0.5">GRN Number</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {accountingInward.purchaseInwardNo || `INW-${accountingInward.id}`}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 font-medium mb-0.5">Supplier Name</span>
                <span className="font-semibold text-slate-800 text-sm truncate block">
                  {vendorMap[accountingInward.vendorId] || 'N/A'}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 font-medium mb-0.5">GRN Date</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {accountingInward.inwardDate ? formatDate(accountingInward.inwardDate) : 'N/A'}
                </span>
              </div>
            </div>

            {/* Display Accounting Details (Read-Only) */}
            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                <span className="block text-slate-500 font-medium mb-1">Invoice / Bill Number</span>
                <span className="font-semibold text-slate-800 text-xs block">
                  {accountingFormData.invoiceNumber}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                <span className="block text-slate-500 font-medium mb-1">Invoice / Bill Date</span>
                <span className="font-semibold text-slate-800 text-xs block">
                  {accountingFormData.invoiceDate ? formatDate(accountingFormData.invoiceDate) : 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                <span className="block text-slate-500 font-medium mb-1">Purchase Account</span>
                <span className="font-semibold text-slate-800 text-xs block">
                  {accountingFormData.purchaseAccount}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                <span className="block text-slate-500 font-medium mb-1">Supplier Account</span>
                <span className="font-semibold text-slate-800 text-xs block truncate">
                  {accountingFormData.supplierAccount}
                </span>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={accountingFormData.accountingRemarks}
                  onChange={(e) => setAccountingFormData({ ...accountingFormData, accountingRemarks: e.target.value })}
                  placeholder="Enter optional accounting notes..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <div>
                {accountingInward.isAccounted && (
                  <button
                    type="button"
                    onClick={handleUnaccount}
                    disabled={isSavingAccounting}
                    className="px-3.5 py-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-300 rounded-md hover:bg-amber-100 transition-colors disabled:opacity-50"
                  >
                    Unmark as Accounted
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAccountingModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAccounting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingAccounting ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    accountingInward.isAccounted ? 'Save Changes' : 'Save & Mark as Accounted'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
      {selectedAttachmentContainer && (
        <DocumentAttachmentModal
          isOpen={Boolean(selectedAttachmentContainer)}
          onClose={() => setSelectedAttachmentContainer(null)}
          containerName={selectedAttachmentContainer}
          title={attachmentModalTitle}
          onFilesUpdated={(newCount) => updateFileCount(selectedAttachmentContainer, newCount)}
        />
      )}
    </div>
  );
}