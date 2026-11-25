/**
 * Invoice Print Page
 * Displays the Tax Invoice Template for printing
 */

import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { TaxInvoiceTemplate, BrushedTaxInvoiceTemplate, TaxInvoiceData } from '@/components/templates';
import { useResolvedCompanyId } from '@/hooks/useCompanyContext';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '@/state/store';
import { formatDate } from '@/lib/utils';
import { getAllTransports } from '@/state/transportSlice';
import { getAllCompanies } from '@/state/company-master-slice';
import { getAllCustomers } from '@/state/customerSlice';
import { getAllConsignee } from '@/state/consigneeSlice';
import { getAllSalesOrders } from '@/state/salesOrderSlice';
import { getAllPaymentTerms } from '@/state/paymentTermsSlice';
import { getAllShipmentTerms } from '@/state/shipmentTermsSlice';
import { getAllShipmentModes } from '@/state/shipmentModeSlice';
import { getAllTermsConditions } from '@/state/termsConditions';
import { getAllEmployees } from '@/state/employeeSlice';
import { getAllInvoices, getAllInvoicesByCompanyId } from '@/state/invoiceSlice';
import { getAllCities } from '@/state/citySlice';
import { getAllStates } from '@/state/stateSlice';
import { getAllCountries } from '@/state/countrySlice';

/**
 * Convert number to words (Indian format)
 */
const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';
  if (num < 20) return ones[num];
  if (num < 100) {
    return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
  }
  if (num < 1000) {
    return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + numberToWords(num % 100) : '');
  }
  if (num < 100000) {
    return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '');
  }
  if (num < 10000000) {
    return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + numberToWords(num % 100000) : '');
  }
  return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + numberToWords(num % 10000000) : '');
};

const formatAmountInWords = (amount: number): string => {
  if (!amount || isNaN(amount)) return 'INR Zero only';
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let words = 'INR ' + numberToWords(rupees) + ' only';
  if (paise > 0) {
    words = 'INR ' + numberToWords(rupees) + ' and ' + numberToWords(paise) + ' Paise only';
  }
  return words;
};

export default function InvoicePrint() {
  const resolvedCompanyId = useResolvedCompanyId();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const invoiceId = searchParams.get('id');

  // Get related data from Redux store
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster as any);
  const { customerList } = useSelector((state: RootState) => state.customer);
  const { consigneeList } = useSelector((state: RootState) => state.consignee);
  const { salesOrderList } = useSelector((state: RootState) => state.salesOrder);
  const { paymentTermsList } = useSelector((state: RootState) => state.paymentTerms);
  const { shipmentTermsList } = useSelector((state: RootState) => state.shipmentTerms);
  const { shipmentModesList } = useSelector((state: RootState) => state.shipmentMode);
  const { termsContitionsList } = useSelector((state: RootState) => state.termsConditions);
  const { employeeList } = useSelector((state: RootState) => state.employee);
  const { transportList } :any= useSelector((state: RootState) => state.transport);
  const { invoiceList, loading: invoiceLoading } = useSelector((state: RootState) => state.invoice);
  const { cityList } = useSelector((state: RootState) => state.city);
  const { stateList } = useSelector((state: RootState) => state.state);
  const { countryList } = useSelector((state: RootState) => state.country);

  const invoiceData = useMemo(() => {
    if (location.state?.invoice) return location.state.invoice;
    if (invoiceId && invoiceList) {
      const list = (invoiceList as any)?.data ?? invoiceList;
      if (Array.isArray(list)) {
        return list.find((inv: any) => String(inv.id) === String(invoiceId));
      }
    }
    return null;
  }, [location.state?.invoice, invoiceId, invoiceList]);

  // Fetch necessary data
  useEffect(() => {
    const companyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    
    dispatch(getAllTransports({ fetchAll: true }));
    dispatch(getAllCompanies({ fetchAll: true }));
    dispatch(getAllCustomers({ fetchAll: true }));
    dispatch(getAllConsignee({ fetchAll: true }));
    dispatch(getAllSalesOrders({ fetchAll: true }));
    dispatch(getAllPaymentTerms({ fetchAll: true }));
    dispatch(getAllShipmentTerms({ fetchAll: true }));
    dispatch(getAllShipmentModes({ fetchAll: true }));
    dispatch(getAllTermsConditions({ fetchAll: true }));
    dispatch(getAllEmployees({ fetchAll: true }));
    dispatch(getAllCities({ fetchAll: true }));
    dispatch(getAllStates({ fetchAll: true }));
    dispatch(getAllCountries({ fetchAll: true }));
    
    if (companyId) {
      dispatch(getAllInvoicesByCompanyId(Number(companyId)));
    } else {
      dispatch(getAllInvoices({}));
    }
  }, [dispatch]);

  // Normalize transport list
  const transportsArr: any = useMemo(() => {
    const raw = (transportList?.data ?? transportList) || [];
    return Array.isArray(raw) ? raw : [];
  }, [transportList]);

  // Redirect if no invoice data and no way to get it
  useEffect(() => {
    if (!invoiceData && !invoiceLoading && !invoiceId && !location.state?.invoice) {
      navigate('/transaction/invoice-details');
    }
  }, [invoiceData, invoiceLoading, invoiceId, location.state?.invoice, navigate]);

  // Transform invoice data to template format
  const templateData: TaxInvoiceData | null = useMemo(() => {
    if (!invoiceData) return null;

    // Get company info
    const companyId = resolvedCompanyId || localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const company = companyMasterList?.find((c: any) => String(c.id) === String(companyId)) || {};
    const companyAddress = company?.address?.find((a: any) => a.isDefault) || company?.address?.[0] || {};
    
    // Get customer/buyer info
    const customer = Array.isArray(customerList?.data) 
      ? customerList.data.find((c: any) => String(c.id) === String(invoiceData.customerId))
      : Array.isArray(customerList)
      ? customerList.find((c: any) => String(c.id) === String(invoiceData.customerId))
      : null;
    
    // Get consignee info
    const consignee = Array.isArray(consigneeList?.data)
      ? consigneeList.data.find((c: any) => String(c.id) === String(invoiceData.consigneeId || invoiceData.consgineeId))
      : Array.isArray(consigneeList)
      ? consigneeList.find((c: any) => String(c.id) === String(invoiceData.consigneeId || invoiceData.consgineeId))
      : null;

    // Get city, state, country helpers
    const getCity = (cityId: any) => {
      const cities = Array.isArray(cityList?.data) ? cityList.data : Array.isArray(cityList) ? cityList : [];
      return cities.find((c: any) => String(c.id) === String(cityId));
    };

    const getState = (stateId: any) => {
      const states = Array.isArray(stateList?.data) ? stateList.data : Array.isArray(stateList) ? stateList : [];
      return states.find((s: any) => String(s.id) === String(stateId));
    };

    const getCountry = (countryId: any) => {
      const countries = Array.isArray(countryList?.data) ? countryList.data : Array.isArray(countryList) ? countryList : [];
      return countries.find((c: any) => String(c.id) === String(countryId));
    };

    const getCityName = (cityId: any) => {
      const city = getCity(cityId);
      return city?.cityName || city?.name || '';
    };

    const consigneeCity = consignee?.cityName || 
                          consignee?.address?.[0]?.cityName || 
                          consignee?.address?.cityName || 
                          getCityName(consignee?.cityId || consignee?.address?.[0]?.cityId || consignee?.address?.cityId);

    // Get sales order info
    const salesOrder = Array.isArray(salesOrderList?.data)
      ? salesOrderList.data.find((so: any) => String(so.id) === String(invoiceData.salesOrderId) || (invoiceData.soNo && String(so.salesOrderNo) === String(invoiceData.soNo)))
      : Array.isArray(salesOrderList)
      ? salesOrderList.find((so: any) => String(so.id) === String(invoiceData.salesOrderId) || (invoiceData.soNo && String(so.salesOrderNo) === String(invoiceData.soNo)))
      : null;

    // Format addresses
    const formatAddress = (addr: any) => {
      if (!addr) return '';
      if (typeof addr === 'string') return addr;
      
      const line1 = addr.line1 || addr.addressLine1 || '';
      const line2 = addr.line2 || addr.addressLine2 || '';
      
      let cityName = addr.cityName || addr.city || '';
      let stateName = addr.stateName || addr.state || '';
      let countryName = addr.countryName || addr.country || '';

      // Resolve IDs to names if they are numbers
      if (addr.cityId && (!cityName || !isNaN(Number(cityName)))) {
        const city = getCity(addr.cityId);
        cityName = city?.cityName || city?.name || cityName;
      }

      if (addr.stateId && (!stateName || !isNaN(Number(stateName)))) {
        const state = getState(addr.stateId);
        stateName = state?.stateName || state?.name || stateName;
      }

      if (addr.countryId && (!countryName || !isNaN(Number(countryName)))) {
        const country = getCountry(addr.countryId);
        countryName = country?.countryName || country?.name || countryName;
      }

      const pincode = addr.pinCode || addr.pincode || addr.postalCode || '';

      const addressParts = [];
      if (line1) addressParts.push(line1);
      if (line2) addressParts.push(line2);
      
      const cityPincode = [cityName, pincode].filter(Boolean).join(' - ');
      if (cityPincode) addressParts.push(cityPincode);
      
      if (stateName && isNaN(Number(stateName))) addressParts.push(stateName);
      if (countryName && isNaN(Number(countryName))) addressParts.push(countryName);

      return addressParts.join(',\n');
    };

    // Helper to get state details for a party
    const getPartyStateDetails = (addr: any) => {
      let stateName = addr?.stateName || addr?.state || '';
      let stateCode = addr?.stateCode || '';

      if (addr?.stateId && (!stateName || !isNaN(Number(stateName)))) {
        const state = getState(addr.stateId);
        stateName = state?.stateName || state?.name || stateName;
        stateCode = state?.stateCode || stateCode;
      } else if (addr?.cityId && (!stateName || !isNaN(Number(stateName)))) {
        const city = getCity(addr.cityId);
        if (city?.stateId) {
          const state = getState(city.stateId);
          stateName = state?.stateName || state?.name || stateName;
          stateCode = state?.stateCode || stateCode;
        }
      }
      
      return { 
        name: isNaN(Number(stateName)) ? stateName : '', 
        code: stateCode 
      };
    };

    // Format company address
    const companyAddr = formatAddress(companyAddress);
    const companyPostalCode = companyAddress?.pinCode || '';
    const companyStateDetails = getPartyStateDetails(companyAddress);

    // Find dispatch address: first address where isDefault is false, fallback to companyAddress
    const dispatchAddrObj = company?.address?.find((a: any) => !a.isDefault) || companyAddress;
    const dispatchAddress = formatAddress(dispatchAddrObj);
    const dispatchGstin = company?.gstin || dispatchAddrObj?.gstNo || companyAddress?.gstNo || '';
    const dispatchCity = dispatchAddrObj?.cityId ? getCity(dispatchAddrObj.cityId)?.cityName : '';
    const dispatchStateDetails = getPartyStateDetails(dispatchAddrObj);
    const dispatchState = dispatchStateDetails.name;
    const dispatchStateCode = dispatchStateDetails.code;

    // Format buyer address
    const buyerAddressObj = customer?.address?.[0] || customer?.address || {};
    const buyerAddr = formatAddress(buyerAddressObj);
    const buyerStateDetails = getPartyStateDetails(buyerAddressObj);

    // Format consignee address
    const consigneeAddressObj = consignee?.address?.[0] || consignee?.address || {};
    const consigneeAddr = formatAddress(consigneeAddressObj);
    const consigneeStateDetails = getPartyStateDetails(consigneeAddressObj);

    // Get payment terms
    const paymentTerms = paymentTermsList?.find((pt: any) => String(pt.id) === String(invoiceData.paymentTermsId));
    
    // Get shipment terms
    const shipmentTermsId = invoiceData.deliveryTermsId || invoiceData.shipmentTermsId;
    const shipmentTerms = Array.isArray(shipmentTermsList) 
      ? shipmentTermsList.find((st: any) => String(st.id) === String(shipmentTermsId))
      : null;
    
    // Get shipment mode
    const shipmentModeId = invoiceData.shipmentModeId || invoiceData.shipmentMode;
    const shipmentMode = shipmentModesList?.find((sm: any) => String(sm.id) === String(shipmentModeId));
    
    // Get agent
    const agentId = invoiceData.agentId;
    const agent = Array.isArray(employeeList) 
      ? employeeList.find((e: any) => String(e.id) === String(agentId))
      : null;

    // Get transport
    const transportId = invoiceData.transportId || invoiceData.transportNameId;
    const transport: any = transportsArr.find((t: any) => String(t.id) === String(transportId));

    // Get company bank (if available in invoice data)
    const companyBankId = invoiceData.companyBankId;
    const selectedBank = Array.isArray(company?.bank) 
      ? company.bank.find((b: any) => String(b.id) === String(companyBankId))
      : null;

    const companyBank = selectedBank?.bankName || invoiceData.companyBankName || '';
    const companyBankAccountNo = selectedBank?.accountNo || invoiceData.companyBankAccountNo || '';
    const companyBankIFSC = selectedBank?.ifscCode || '';
    const companyBankBranch = selectedBank?.branch || ''; // Using branch if it exists
    const branchAndIFSC = [companyBankBranch, companyBankIFSC].filter(Boolean).join(' & ');

    // Calculate tax summary
    const items = invoiceData.items || [];
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
    const taxableAmount = items.reduce((sum: number, item: any) => sum + (item.taxableAmount || 0), 0);
    const gstAmount = invoiceData.taxAmount || 0;
    const additional = invoiceData.additional || invoiceData.additionTotal || 0;
    const less = invoiceData.less || invoiceData.discountTotal || 0;
    const roundOff = invoiceData.roundOff || 0;
    const grandTotal = invoiceData.totalAmount || 0;

    // Calculate CGST and SGST (assuming equal split if both exist)
    const cgstPercent = invoiceData.cgstPercent || 0;
    const sgstPercent = invoiceData.sgstPercent || 0;
    const cgst = invoiceData.cgstAmount || (cgstPercent > 0 ? gstAmount / 2 : 0);
    const sgst = invoiceData.sgstAmount || (sgstPercent > 0 ? gstAmount / 2 : 0);
    const igstPercent = invoiceData.igstPercent || 0;
    const igst = invoiceData.igstAmount || (igstPercent > 0 ? gstAmount : 0);

    // Transform items
    const transformedItems = items.map((item: any, index: number) => ({
      srNo: index + 1,
      description: item.productName || item.description || '-',
      hsn: item.hsnCode || '-',
      noOfBags: item.noOfBags || item.noOfRolls || undefined,
      quantity: item.quantity || 0,
      uom: item.uom || 'KGS',
      rate: item.rate || 0,
      amount: item.taxableAmount || item.amount || 0,
    }));

    // Additional charges
    const additionalCharges = invoiceData.addDiscItems?.filter((item: any) => item.type === 'addition') || [];
    const transformedAdditionalCharges = additionalCharges.map((item: any) => ({
      description: item.description || '',
      amount: item.amount || 0,
    }));

    // Less charges
    const lessCharges = invoiceData.addDiscItems?.filter((item: any) => item.type === 'discount') || [];
    const transformedLessCharges = lessCharges.map((item: any) => ({
      description: item.description || '',
      amount: item.amount || 0,
    }));

    return {
      company: {
        name: company?.companyName || company?.name || 'Company Name',
        address: companyAddr,
        postalCode: companyPostalCode,
        phone: company?.phone || companyAddress?.phone || '',
        division: company?.division || '',
        cin: company?.cin || '',
        gstin: company?.gstin || companyAddress?.gstNo || '',
        pan: company?.pan || '',
        logoUrl: company?.logoUrl || '',
        dispatchAddress: dispatchAddress,
        dispatchGstin: dispatchGstin,
        dispatchCity: dispatchCity,
        dispatchState: dispatchState,
        dispatchStateCode: dispatchStateCode,
        state: companyStateDetails.name,
        stateCode: companyStateDetails.code,
      },
      invoice: {
        invoiceNo: invoiceData.invoiceNo || '',
        invoiceDate: invoiceData.invoiceDate || new Date().toISOString(),
        soNo: invoiceData.soNo || salesOrder?.salesOrderNo || '',
        soDate: salesOrder?.orderDate || '',
        poNo: invoiceData.poNo || salesOrder?.purchaseOrderNo || salesOrder?.buyerPoNo || salesOrder?.poNo || '',
        poDate: invoiceData.poDate || salesOrder?.poDate || salesOrder?.orderDate || '',
        paymentTerms: paymentTerms?.termName || invoiceData.paymentTermsName || invoiceData.paymentTerms || '',
        deliveryTerms: invoiceData.deliveryTerms || shipmentTerms?.termName || invoiceData.shipmentModeName || '',
        deliveryNote: invoiceData.deliveryNote || '',
        agentName: agent?.employeeName || invoiceData.agentName || '',
        lrDate: invoiceData.lrDate || '',
        termsOfDelivery: invoiceData.termsOfDelivery || invoiceData.termsAndConditions || termsContitionsList?.find((tc: any) => String(tc.id) === String(invoiceData.termsConditionsId))?.termsConditionsName || '',
        vehicleNo: invoiceData.vehicleNo || '',
        destination: invoiceData.destination || consigneeCity || '',
        transport: invoiceData.transportName || transport?.transportName || '',
        lrNo: invoiceData.lrNo || '',
        irn: invoiceData.irn || '',
        ackNo: invoiceData.ackNo || '',
        ackDate: invoiceData.ackDate || '',
        ewayBillNo: invoiceData.ewayBillNo || '',
        ewayBillDate: invoiceData.ewayBillDate || '',
        comments: invoiceData.comments || '',
        deliveryNoteDate: invoiceData.deliveryNoteDate || '',
      },
      buyer: {
        name: customer?.customerName || customer?.name || '',
        address: buyerAddr,
        gstNo: customer?.gstNo || buyerAddressObj?.gstNo || buyerAddressObj?.gstin || '',
        state: buyerStateDetails.name,
        stateCode: buyerStateDetails.code || invoiceData.buyerStateCode || '',
      },
      consignee: {
        name: consignee?.consigneeName || consignee?.name || '',
        address: consigneeAddr,
        gstNo: consignee?.gstNo || consigneeAddressObj?.gstNo || consigneeAddressObj?.gstin || '',
        state: consigneeStateDetails.name,
        stateCode: consigneeStateDetails.code,
      },
      items: transformedItems,
      additionalCharges: transformedAdditionalCharges.length > 0 ? transformedAdditionalCharges : undefined,
      lessCharges: transformedLessCharges.length > 0 ? transformedLessCharges : undefined,
      taxSummary: {
        add: additional,
        less: less,
        total: invoiceData.taxableAmountTotal || taxableAmount || totalAmount,
        igst: igst > 0 ? igst : undefined,
        cgst: cgst > 0 ? cgst : undefined,
        sgst: sgst > 0 ? sgst : undefined,
        cgstPercent: cgstPercent > 0 ? cgstPercent : undefined,
        sgstPercent: sgstPercent > 0 ? sgstPercent : undefined,
        tcsAmount: invoiceData.tcsAmount || 0,
        roundOff: roundOff,
        cessAmount: invoiceData.cessAmount || undefined,
        grandTotal: grandTotal,
      },
      amountInWords: formatAmountInWords(grandTotal),
      termsAndConditions: invoiceData.termsConditionsName || invoiceData.termsAndConditions || termsContitionsList?.find((tc: any) => String(tc.id) === String(invoiceData.termsConditionsId))?.termsConditionsName || '',
      declaration: 'We declare that this invoice shows the actual price\nof the goods described and that all particulars are\ntrue and correct',
      bankDetails: {
        bankName: companyBank || 'Bank Name',
        accountNo: companyBankAccountNo || '',
        branch: companyBankBranch,
        ifscCode: companyBankIFSC,
        branchAndIFSC: branchAndIFSC || '',
      },
    };
  }, [invoiceData, companyMasterList, customerList, consigneeList, salesOrderList, paymentTermsList, shipmentTermsList, shipmentModesList, employeeList, transportsArr, termsContitionsList, cityList, stateList, countryList]);

  if (!templateData) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Loading invoice data...</p>
      </div>
    );
  }

  const isBrushed = Number(invoiceData?.isBrushedPiece) === 1;

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: '20px', textAlign: 'right' }}>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 mt-12 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
        >
          Print
        </button>
        <button
          onClick={() => navigate('/transaction/invoice-management')}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Back
        </button>
      </div>
      {isBrushed ? (
        <BrushedTaxInvoiceTemplate data={templateData} />
      ) : (
        <TaxInvoiceTemplate data={templateData} />
      )}
    </div>
  );
}

