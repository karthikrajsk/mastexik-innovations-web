import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/state/store';
import { createAgencyDispatch, updateAgencyDispatch } from '@/state/agencyDispatchSlice';
import { getAllAgencyContracts } from '@/state/agencyContractSlice';
import { getAllVendors } from '@/state/vendorSlice';
import { getAllCustomers } from '@/state/customerSlice';
import { ArrowLeft, Truck, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CommonSearchableSelect } from '@/components/ui/CommonSearchableSelect';
import { toast } from 'react-toastify';
import { AgencyDispatch, DispatchStatus } from '@/types/agency';
import { useResolvedCompanyId } from '@/hooks/useCompanyContext';
import { DocumentAttachmentModal } from '@/components/modals/DocumentAttachmentModal';
import mediaUploadService from '@/services/MediaUploadService';

const DIRECT_ORDER_VALUE = '__DIRECT_ORDER__';

export const AgencyMillDispatchEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const companyId = useResolvedCompanyId();

  const editDispatch = (location.state as any)?.dispatch as AgencyDispatch | undefined;
  const isEditMode = Boolean(editDispatch);

  const { contracts } = useSelector((state: RootState) => state.agencyContract);
  const { vendorList } = useSelector((state: RootState) => state.vendor);
  const { customerList } = useSelector((state: RootState) => state.customer);

  useEffect(() => {
    if (!contracts || contracts.length === 0) {
      dispatch(getAllAgencyContracts({ fetchAll: true }));
    }
  }, [dispatch, contracts]);

  useEffect(() => {
    dispatch(getAllVendors({ fetchAll: true, companyId }));
    dispatch(getAllCustomers({ fetchAll: true }));
  }, [dispatch, companyId]);

  const today = new Date().toISOString().split('T')[0];

  const contractOptions = useMemo(
    () => [
      { value: '', label: '-- Select Contract or Direct Order --' },
      { value: DIRECT_ORDER_VALUE, label: 'Direct Order / No Contract' },
      ...(contracts || []).map((c: any) => ({
        value: c.contractNo,
        label: `${c.contractNo} (${c.seller} → ${c.buyerName})`
      }))
    ],
    [contracts]
  );

  // Form states
  const [selectedContractNo, setSelectedContractNo] = useState(
    editDispatch ? editDispatch.contractNo || DIRECT_ORDER_VALUE : ''
  );
  const [millInvoiceNo, setMillInvoiceNo] = useState(editDispatch?.millInvoiceNo || '');
  const [invoiceDate, setInvoiceDate] = useState(editDispatch?.invoiceDate || today);
  const [seller, setSeller] = useState(editDispatch?.seller || '');
  const [buyerName, setBuyerName] = useState(editDispatch?.buyerName || '');
  const [construction, setConstruction] = useState(editDispatch?.construction || '');
  const [dispatchedMtrs, setDispatchedMtrs] = useState<number | ''>(editDispatch?.dispatchedMtrs || '');
  const [taxableValue, setTaxableValue] = useState<number | ''>(editDispatch?.taxableValue || '');
  const [gstRate] = useState<number>(0.05); // Standard 5% GST on fabric
  const [lrNo, setLrNo] = useState(editDispatch?.lrNo || '');
  const [transporterName, setTransporterName] = useState(editDispatch?.transporterName || '');
  const [vehicleNo, setVehicleNo] = useState(editDispatch?.vehicleNo || '');
  const [status, setStatus] = useState<DispatchStatus>(editDispatch?.status || 'Delivered');
  const [remarks, setRemarks] = useState(editDispatch?.remarks || '');
  const [packingListFiles, setPackingListFiles] = useState<File[]>([]);
  const [selectedAttachmentContainer, setSelectedAttachmentContainer] = useState<string | null>(null);

  const selectedContract = (contracts || []).find(
    (contract: any) => contract.contractNo === selectedContractNo
  );

  const sellerOptions = useMemo(() => {
    const options = new Map<string, { value: string; label: string }>();
    const vendors = Array.isArray(vendorList) ? vendorList : (vendorList as any)?.data || [];
    vendors
      .filter((vendor: any) => vendor.activeFlag !== false)
      .forEach((vendor: any) => {
        const name = String(vendor.vendorName || vendor.name || vendor.companyName || '').trim();
        if (name && !options.has(name)) options.set(name, { value: name, label: name });
      });

    [seller, selectedContract?.seller, editDispatch?.seller].forEach((name) => {
      if (name && !options.has(name)) options.set(name, { value: name, label: name });
    });
    return Array.from(options.values());
  }, [vendorList, seller, selectedContract?.seller, editDispatch?.seller]);

  const buyerOptions = useMemo(() => {
    const options = new Map<string, { value: string; label: string }>();
    const customers = Array.isArray(customerList) ? customerList : (customerList as any)?.data || [];
    customers
      .filter((customer: any) => customer.activeFlag !== false)
      .forEach((customer: any) => {
        const name = String(customer.customerName || customer.companyName || customer.name || '').trim();
        if (name && !options.has(name)) options.set(name, { value: name, label: name });
      });

    [buyerName, selectedContract?.buyerName, editDispatch?.buyerName].forEach((name) => {
      if (name && !options.has(name)) options.set(name, { value: name, label: name });
    });
    return Array.from(options.values());
  }, [customerList, buyerName, selectedContract?.buyerName, editDispatch?.buyerName]);

  // When contract is selected, auto-fill Seller, Buyer & Construction
  const handleContractChange = (contractNo: string) => {
    setSelectedContractNo(contractNo);
    if (contractNo === DIRECT_ORDER_VALUE) {
      setSeller('');
      setBuyerName('');
      setConstruction('');
      return;
    }
    if (!contractNo) {
      setSeller('');
      setBuyerName('');
      setConstruction('');
      return;
    }

    const matched = (contracts || []).find((c: any) => c.contractNo === contractNo);
    if (matched) {
      setSeller(matched.seller || '');
      setBuyerName(matched.buyerName || '');
      setConstruction(matched.construction || '');
      if (dispatchedMtrs && matched.numericRate) {
        setTaxableValue(Math.round(Number(dispatchedMtrs) * matched.numericRate));
      }
    }
  };

  const handleMtrsChange = (val: number | '') => {
    setDispatchedMtrs(val);
    if (val && !taxableValue) {
      const matched = (contracts || []).find((c: any) => c.contractNo === selectedContractNo);
      if (matched?.numericRate) {
        setTaxableValue(Math.round(Number(val) * matched.numericRate));
      }
    }
  };

  const gstValue = useMemo(() => {
    if (!taxableValue) return 0;
    return Number(taxableValue) * gstRate;
  }, [taxableValue, gstRate]);

  const totalValue = useMemo(() => {
    if (!taxableValue) return 0;
    return Number(taxableValue) + gstValue;
  }, [taxableValue, gstValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedContractNo) {
      toast.error('Please select a contract or choose Direct Order / No Contract.');
      return;
    }
    if (!seller.trim()) {
      toast.error('Please select a Seller (Mill).');
      return;
    }
    if (!buyerName.trim()) {
      toast.error('Please select a Buyer Name.');
      return;
    }
    if (!millInvoiceNo.trim()) {
      toast.error('Please enter the Mill Invoice Number.');
      return;
    }
    if (!dispatchedMtrs || Number(dispatchedMtrs) <= 0) {
      toast.error('Please enter valid Dispatched Meters.');
      return;
    }
    if (!taxableValue || Number(taxableValue) <= 0) {
      toast.error('Please enter valid Taxable Value.');
      return;
    }

    try {
      const contractNo = selectedContractNo === DIRECT_ORDER_VALUE ? '' : selectedContractNo;
      let savedDispatch: any;
      if (isEditMode && editDispatch) {
        savedDispatch = await dispatch(updateAgencyDispatch({
          id: Number(editDispatch.id),
          data: {
            contractNo,
            millInvoiceNo,
            invoiceDate,
            seller,
            buyerName,
            construction,
            dispatchedMtrs: Number(dispatchedMtrs),
            taxableValue: Number(taxableValue),
            gstRate,
            gstValue,
            totalValue,
            lrNo,
            transporterName,
            vehicleNo,
            commissionEligibleValue: Number(taxableValue),
            status,
            remarks
          }
        })).unwrap();
      } else {
        savedDispatch = await dispatch(createAgencyDispatch({
          contractNo,
          millInvoiceNo,
          invoiceDate,
          seller,
          buyerName,
          construction,
          dispatchedMtrs: Number(dispatchedMtrs),
          taxableValue: Number(taxableValue),
          gstRate,
          gstValue,
          totalValue,
          lrNo,
          transporterName,
          vehicleNo,
          commissionEligibleValue: Number(taxableValue),
          status,
          remarks
        })).unwrap();
      }

      const savedId = Number(savedDispatch?.data?.id ?? savedDispatch?.id ?? editDispatch?.id);
      if (packingListFiles.length > 0) {
        if (!Number.isFinite(savedId) || savedId <= 0) {
          toast.error('Dispatch saved, but its packing list files could not be linked. Open the saved dispatch to upload them.');
        } else {
          const failedFileNames: string[] = [];
          for (const file of packingListFiles) {
            try {
              await mediaUploadService.uploadMedia({
                base64File: await mediaUploadService.fileToBase64(file),
                fileName: file.name,
                contentType: mediaUploadService.getMimeType(file),
                mediaType: mediaUploadService.getMediaType(file),
                containerName: `agency_dispatch_${savedId}`
              });
            } catch (error) {
              console.error(`Failed to upload packing list file ${file.name}:`, error);
              failedFileNames.push(file.name);
            }
          }

          if (failedFileNames.length > 0) {
            toast.error(`Dispatch saved, but these files failed to upload: ${failedFileNames.join(', ')}. You can retry from the dispatch edit page.`);
          } else {
            toast.success(`Uploaded ${packingListFiles.length} packing list file(s).`);
          }
        }
      }

      navigate('/agency/mill-dispatch');
    } catch (err) {
      console.error(err);
    }
  };

  const handlePackingListFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const acceptedFiles = selectedFiles.filter((file) => {
      if (!mediaUploadService.validateFileSize(file, 100)) {
        toast.error(`File "${file.name}" exceeds the 100MB size limit.`);
        return false;
      }
      return true;
    });

    if (acceptedFiles.length > 0) {
      setPackingListFiles((files) => [...files, ...acceptedFiles]);
    }
    event.target.value = '';
  };

  return (
    <div className="p-6 pt-16">
      <div className="p-6 bg-white shadow-md rounded-lg">
        {/* Top Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div className="flex items-center space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/agency/mill-dispatch')}
              className="mr-auto"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-semibold">
              {isEditMode ? 'Edit Mill Dispatch' : 'Mill Dispatch Entry'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Card 1: Order & Contract Reference */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck size={20} />
                Contract & Parties Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Link to Contract</label>
                  <CommonSearchableSelect
                    placeholder="Select Contract or Direct Order"
                    value={selectedContractNo}
                    options={contractOptions}
                    onValueChange={(val) => handleContractChange(val)}
                    onChange={(val: any) => handleContractChange(typeof val === 'string' ? val : val?.target?.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Seller (Mill) <span className="text-red-600">*</span>
                  </label>
                  <CommonSearchableSelect
                    placeholder="Select Seller / Mill"
                    value={seller}
                    options={sellerOptions}
                    onValueChange={(val) => setSeller(val)}
                    onChange={(val: any) => setSeller(typeof val === 'string' ? val : val?.target?.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Buyer Name <span className="text-red-600">*</span>
                  </label>
                  <CommonSearchableSelect
                    placeholder="Select Buyer"
                    value={buyerName}
                    options={buyerOptions}
                    onValueChange={(val) => setBuyerName(val)}
                    onChange={(val: any) => setBuyerName(typeof val === 'string' ? val : val?.target?.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Construction
                  </label>
                  <input
                    type="text"
                    value={construction}
                    onChange={e => setConstruction(e.target.value)}
                    placeholder='e.g. 100x120/225x93/6-119" 7/1End Satin'
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Invoice & Commercial Value */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} />
                Mill Invoice & Value Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Mill Invoice No <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={millInvoiceNo}
                    onChange={e => setMillInvoiceNo(e.target.value)}
                    placeholder="e.g. 2627050079"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Invoice Date <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={e => setInvoiceDate(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Dispatched Quantity (Mtrs) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={dispatchedMtrs}
                    onChange={e => handleMtrsChange(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 5241"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Basic Taxable Value (₹) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={taxableValue}
                    onChange={e => setTaxableValue(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 2053843"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">GST Rate</label>
                  <input
                    type="text"
                    value="5% (Textile Fabric)"
                    readOnly
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Calculated GST (₹)</label>
                  <input
                    type="text"
                    readOnly
                    value={`₹${gstValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 font-mono text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Total Invoice Value (₹)</label>
                  <input
                    type="text"
                    readOnly
                    value={`₹${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-100 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <label htmlFor="packing-list-files" className="block text-sm font-medium mb-1">
                      Packing List Files
                    </label>
                    <input
                      id="packing-list-files"
                      type="file"
                      multiple
                      onChange={handlePackingListFileSelect}
                      className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
                    />
                    <p className="mt-1 text-xs text-gray-500">Select multiple files; each file can be up to 100MB.</p>
                  </div>
                  {isEditMode && editDispatch?.id && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedAttachmentContainer(`agency_dispatch_${editDispatch.id}`)}
                    >
                      View / Manage Uploaded Files
                    </Button>
                  )}
                </div>
                {packingListFiles.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {packingListFiles.map((file, index) => (
                      <li key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                        <span className="truncate pr-3">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setPackingListFiles((files) => files.filter((_, fileIndex) => fileIndex !== index))}
                          className="shrink-0 text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Logistics & Transport Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck size={20} />
                Transport & Delivery Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Transporter Name</label>
                  <input
                    type="text"
                    value={transporterName}
                    onChange={e => setTransporterName(e.target.value)}
                    placeholder="e.g. VRL Logistics"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">LR / Bilty Number</label>
                  <input
                    type="text"
                    value={lrNo}
                    onChange={e => setLrNo(e.target.value)}
                    placeholder="e.g. VRL-84912"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    value={vehicleNo}
                    onChange={e => setVehicleNo(e.target.value)}
                    placeholder="e.g. TN-57-B-9901"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Delivery Status</label>
                  <CommonSearchableSelect
                    placeholder="Select Status"
                    value={status}
                    options={[
                      { value: "Delivered", label: "Delivered" },
                      { value: "In-Transit", label: "In-Transit" },
                      { value: "Cancelled", label: "Cancelled" },
                    ]}
                    onValueChange={(val) => setStatus(val as DispatchStatus)}
                    onChange={(val: any) => setStatus((typeof val === 'string' ? val : val?.target?.value) as DispatchStatus)}
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-sm font-medium mb-1">Remarks</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="e.g. Delivered at Kolhapur Plant in good order"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/agency/mill-dispatch')}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white px-6 font-semibold"
            >
              {isEditMode ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
      {selectedAttachmentContainer && (
        <DocumentAttachmentModal
          isOpen
          containerName={selectedAttachmentContainer}
          title="Packing List Files"
          onClose={() => setSelectedAttachmentContainer(null)}
        />
      )}
    </div>
  );
};

export default AgencyMillDispatchEntryPage;
