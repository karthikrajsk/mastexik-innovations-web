import React, { useMemo, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { YarnDeliveryChallanTemplate, BeamDeliveryChallanTemplate, YarnDeliveryChallanData } from '@/components/templates';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/state/store';
import { getAllVendors } from '@/state/vendorSlice';
import { getAllCompanies } from '@/state/company-master-slice';
import { getAllSizingPlan } from '@/state/sizingPlanSlice';
import { getAllSubCategories } from '@/state/subCategorySlice';
import { getAllWarehouse } from '@/state/warehouseSlice';
import { getAllCities } from '@/state/citySlice';
import { getAllStates } from '@/state/stateSlice';
import { getAllWeavingYarnIssue } from '@/state/weavingYarnIssueSlice';
import { getAllYarnDispatch } from '@/state/yarn-dispatch-for-dyeing-slice';
import { getAllBeamOutward } from '@/state/beamOutwardSlice';
import { getAllBeamInward } from '@/state/beamInwardSlice';
import { getAllTransports } from '@/state/transportSlice';
import { getAllSizingYarnOutward } from '@/state/sizingYarnOutwardSlice';
import { getAllWeavingYarnOutward } from '@/state/weavingYarnOutwardSlice';
import { getAllSizingJobWorkOrders } from '@/state/sizingJobWorkOrderSlice';
import { getAllWeavingJobWorkOrders } from '@/state/weavingJobWorkOrderSlice';
import { getAllYarnMasters } from '@/state/yarnSlice';
import { getAllYarnChallan } from '@/state/yarnChallanSlice';
import { getAllCustomers } from '@/state/customerSlice';
import { getAllConsignee } from '@/state/consigneeSlice';
import { getAllWeavingContract } from '@/state/weavingContractSlice';
import { getAllDyeingWorkOrdersByType } from '@/state/processContractSlice';

import { getAllPurchaseOrders } from '@/state/purchaseOrderSlice';
import { getAllPurchaseReturns } from '@/state/purchaseReturnSlice';
import { getAllItemOutwards } from '@/state/itemOutwardSlice';

import { formatDate } from '@/lib/utils';
import { getAllItemMasters } from '@/state/itemSlice';
import { resolveOrderLabel, resolvePlanLabel, extractArray as sharedExtractArray } from "@/pages/transaction/sizing-beam-outward-shared";

export default function YarnDeliveryChallanPrint() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const challanId = searchParams.get('id');
  const typeParam = searchParams.get('type');
  
  // Use a ref-like approach to get stored data once for type determination
  const storedDataStr = localStorage.getItem('yarnReturnPrintData');
  const storedData = useMemo(() => {
    if (!storedDataStr) return null;
    try {
      return JSON.parse(storedDataStr);
    } catch (e) {
      return null;
    }
  }, [storedDataStr]);

  const type = typeParam || location.state?.type || (storedData?.type) || 'sizing';
  const dispatch = useDispatch<AppDispatch>();

  // Get related data from Redux store
  const { sizingYarnIssuetList = [] } = useSelector((state: RootState) => state.sizingYarnIssue);
  const { weavingYarnIssuetList = [] } = useSelector((state: RootState) => state.weavingYarnIssue);
  const { list: processingYarnIssueList = [] } = useSelector((state: RootState) => state.yarnDispatchForDyeing);
  const { list: sizingYarnOutwardList = [] } = useSelector((state: RootState) => state.sizingYarnOutward);
  const { list: weavingYarnOutwardList = [] } = useSelector((state: RootState) => state.weavingYarnOutward);
  const { sizingJobWorkOrderList = [] } = useSelector((state: RootState) => (state as any).sizingJobWorkOrder || { sizingJobWorkOrderList: [] });
  const { weavingJobWorkOrderList = [] } = useSelector((state: RootState) => state.weavingJobWorkOrder || { weavingJobWorkOrderList: [] });
  const { beamOutwardList = [] } = useSelector((state: RootState) => (state as any).beamOutward || { beamOutwardList: [] });
  const { beamInwardList = [] } = useSelector((state: RootState) => (state as any).beamInward || { beamInwardList: [] });
  const { transportList = [] } = useSelector((state: RootState) => (state as any).transport || { transportList: [] });
  const { yarnChallanList = [] } = useSelector((state: RootState) => (state as any).yarnChallan || { yarnChallanList: [] });
  const { customerList = [] } = useSelector((state: RootState) => state.customer);
  const { consigneeList = [] } = useSelector((state: RootState) => (state as any).consignee || { consigneeList: [] });
  const { weavingContractList = [] } = useSelector((state: RootState) => state.weavingContracts || { weavingContractList: [] });
  const { processContractList = [] } = useSelector((state: RootState) => state.dyeingWorkOrde || { processContractList: [] });
  
  const { vendorList = [] } = useSelector((state: RootState) => state.vendor);
  const { purchaseOrderList = [] } = useSelector((state: RootState) => state.purchaseOrder || { purchaseOrderList: [] });
  const { purchaseReturnList = [] } = useSelector((state: RootState) => state.purchaseReturn || { purchaseReturnList: [] });
  const { itemOutwardList = [] } = useSelector((state: RootState) => state.itemOutward);
  const { companyMasterList = [] } = useSelector((state: RootState) => (state.companyMaster as any) || { companyMasterList: [] });
  const { sizingPlanList = [] } = useSelector((state: RootState) => state.sizingPlan);
  const { subCategoryList = [] } = useSelector((state: RootState) => state.subCategory);
  const { warehouseList = [] } = useSelector((state: RootState) => state.warehouse);
  const { cityList = [] } = useSelector((state: RootState) => state.city);
  const { stateList = [] } = useSelector((state: RootState) => state.state);
  const { yarnList = [] } = useSelector((state: RootState) => state.yarn || { yarnList: [] });

  // Fetch missing data if needed
  useEffect(() => {
    const companyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const params = companyId ? { companyId: Number(companyId) } : {};
    
    dispatch(getAllVendors({ fetchAll: true, ...params }));
    dispatch(getAllCompanies({ fetchAll: true }));
    dispatch(getAllSizingPlan({ fetchAll: true, ...params }));
    dispatch(getAllSubCategories({ fetchAll: true }));
    dispatch(getAllWarehouse({ fetchAll: true }));
    dispatch(getAllCities({ fetchAll: true }));
    dispatch(getAllStates({ fetchAll: true }));
    dispatch(getAllTransports({ fetchAll: true }));
    dispatch(getAllYarnMasters({ fetchAll: true }));

    if (type === 'weaving') {
      dispatch(getAllWeavingYarnIssue(params));
      dispatch(getAllWeavingContract({ fetchAll: true, ...params }));
    }
    if (type === 'processing') {
      dispatch(getAllYarnDispatch({ processType: "YARN" }));
      dispatch(getAllDyeingWorkOrdersByType({ type: "YARN", offset: 0, limit: 1000 }));
    }
    if (type === 'beam-outward') {
      if (beamOutwardList.length === 0) dispatch(getAllBeamOutward(params));
      if (beamInwardList.length === 0) dispatch(getAllBeamInward({ fetchAll: true, ...params }));
    }
    if (type === 'yarn-challan') {
      dispatch(getAllYarnChallan({ fetchAll: true }));
      dispatch(getAllCustomers({ fetchAll: true }));
      dispatch(getAllConsignee({ fetchAll: true }));
    }
    if (type === 'purchase-return') {
      dispatch(getAllPurchaseReturns({ fetchAll: true, ...params }));
      dispatch(getAllPurchaseOrders({ fetchAll: true, ...params }));
      dispatch(getAllItemMasters({ fetchAll: true }));
    }
    if (type === 'sizing-outward') {
      dispatch(getAllSizingYarnOutward({ fetchAll: true, ...params }));
      dispatch(getAllSizingJobWorkOrders({ fetchAll: true, ...params }));
      dispatch(getAllCustomers({ fetchAll: true }));
    }
    if (type === 'weaving-outward') {
      dispatch(getAllWeavingYarnOutward({ fetchAll: true, ...params }));
      dispatch(getAllWeavingJobWorkOrders({ fetchAll: true, ...params }));
      dispatch(getAllCustomers({ fetchAll: true }));
      dispatch(getAllWeavingContract({ fetchAll: true, ...params }));
    }
    if (type === 'item-outward') {
      dispatch(getAllItemOutwards({ fetchAll: true, ...params }));
      dispatch(getAllItemMasters({ fetchAll: true }));
    }
  }, [dispatch, type]);

  const challanDataFromState = useMemo(() => {
    // 1. Priority: Location State
    if (location.state?.challan) return location.state.challan;
    
    // 2. Priority: Find in Redux list if ID is provided
    if (challanId) {
      let found = null;
      if (type === 'weaving') {
        const list = (weavingYarnIssuetList as any)?.data ?? weavingYarnIssuetList;
        found = Array.isArray(list) ? list.find((c: any) => String(c.id) === String(challanId)) : null;
      } else if (type === 'processing') {
        found = processingYarnIssueList.find((c: any) => String(c.id) === String(challanId));
      } else if (type === 'beam-outward') {
        const list = (beamOutwardList as any)?.data ?? beamOutwardList;
        found = Array.isArray(list) ? list.find((c: any) => String(c.id) === String(challanId)) : null;
      } else if (type === 'yarn-challan') {
        const list = (yarnChallanList as any)?.data ?? yarnChallanList;
        found = Array.isArray(list) ? list.find((c: any) => String(c.id) === String(challanId)) : null;
      } else if (type === 'purchase-return') {
        const list = (purchaseReturnList as any)?.data ?? purchaseReturnList;
        found = Array.isArray(list) ? list.find((c: any) => String(c.id) === String(challanId)) : null;
      } else if (type === 'sizing-outward') {
        const list = (sizingYarnOutwardList as any)?.data ?? sizingYarnOutwardList;
        found = Array.isArray(list) ? list.find((c: any) => String(c.id) === String(challanId)) : null;
      } else if (type === 'weaving-outward') {
        const list = (weavingYarnOutwardList as any)?.data ?? weavingYarnOutwardList;
        found = Array.isArray(list) ? list.find((c: any) => String(c.id) === String(challanId)) : null;
      } else if (type === 'item-outward') {
        const list = (itemOutwardList as any)?.data ?? itemOutwardList;
        found = Array.isArray(list) ? list.find((c: any) => String(c.id) === String(challanId)) : null;
      } else {
        const list = (sizingYarnIssuetList as any)?.data ?? sizingYarnIssuetList;
        found = Array.isArray(list) ? list.find((c: any) => String(c.id) === String(challanId)) : null;
      }
      if (found) return found;
    }

    // 3. Priority: LocalStorage fallback (only if type matches or if no type in storage)
    if (storedData) {
      const storedType = storedData.type || 'sizing';
      if (storedType === type) {
        if (!challanId || String(storedData.id) === String(challanId)) {
          return storedData;
        }
      }
    }

    return null;
  }, [location.state?.challan, challanId, type, sizingYarnIssuetList, weavingYarnIssuetList, processingYarnIssueList, yarnChallanList, purchaseReturnList, storedData, beamOutwardList, sizingYarnOutwardList, weavingYarnOutwardList, itemOutwardList]);

  // Map the raw data to the template format
  const templateData: YarnDeliveryChallanData | null = useMemo(() => {
    if (!challanDataFromState) return null;

    // Get company info
    const selectedCompanyId = challanDataFromState.companyId || localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany');
    const company = companyMasterList?.find((c: any) => String(c.id) === String(selectedCompanyId)) || {};
    const companyAddress = company?.address?.[0] || {};
    
    // Resolve city and state names for company
    const companyCity = cityList.find((c: any) => String(c.id) === String(companyAddress.cityId));
    const companyState = stateList.find((s: any) => String(s.id) === String(companyAddress.stateId));

    // Helper to process address and avoid duplication of city/pincode
    const formatAddressLineAndCity = (addrObj: any, cityObj: any) => {
      const line1 = addrObj.line1 || addrObj.address || '';
      const line2 = addrObj.line2 || '';
      const pin = addrObj.pinCode || '';
      let city = cityObj?.cityName || addrObj.cityName || '';
      
      let parts = line1.split(',').map((s: string) => s.trim()).filter(Boolean);
      
      // If city is not explicitly provided, try to extract it from the last parts of line1
      if (!city && parts.length > 1) {
        const last = parts[parts.length - 1];
        if (last === pin || /^\d{6}$/.test(last)) {
          parts.pop();
          if (parts.length > 0) city = parts.pop() || '';
        } else {
          city = parts.pop() || '';
        }
      }

      // Clean address parts to remove city and pin if they are successfully identified
      const cleanedParts = parts.filter((p: any) => {
        const normalizedP = p.toLowerCase();
        const normalizedCity = city.toLowerCase();
        return normalizedP !== normalizedCity && normalizedP !== pin && !/^\d{6}$/.test(p);
      });

      const address = [cleanedParts.join(', '), line2].filter(Boolean).join(', ');
      // city - pin, but avoid "- pin" if city is missing, and avoid "pin - pin"
      const cityPincode = city ? (pin && city !== pin ? `${city} - ${pin}` : city) : pin;
      
      return { address, cityPincode };
    };

    const companyAddressInfo = formatAddressLineAndCity(companyAddress, companyCity);
    const fullAddress = companyAddressInfo.address;
    const companyCityPincode = companyAddressInfo.cityPincode;
    
    // Resolution helpers
    const resolveContractNo = (record: any) => {
      if (!record) return "";
      const candidates = [
        record.weavingContractNo,
        record.weavingContractNumber,
        record.contractNo,
        record.contractNumber,
        record.contractCode,
        record.referenceNo,
        record.documentNo,
        record.label,
        record.name,
      ];
      return candidates.find((v) => v != null && String(v).trim() !== "") || "";
    };

    const resolvePlanNo = (record: any) => {
      if (!record) return "";
      const candidates = [
        record.sizingPlanNo,
        record.planNo,
        record.planNumber,
        record.sizingPlanNumber,
        record.referenceNo,
        record.label,
        record.name,
      ];
      return candidates.find((v) => v != null && String(v).trim() !== "") || "";
    };

    // Get vendor info
    let vId = type === 'beam-outward' 
      ? (challanDataFromState.weavingVendorId || challanDataFromState.vendorId) 
      : (challanDataFromState.vendorId || challanDataFromState.vendorName); // handle both ID and potentially embedded name/id
    
    // Fallback for sizing-outward if vendorId is missing in challan record
    if (!vId && type === 'sizing-outward') {
      const sizingOrder = sharedExtractArray(sizingJobWorkOrderList).find((o: any) => String(o.id ?? o.sizingJobWorkOrderId) === String(challanDataFromState.sizingOrderId));
      vId = sizingOrder?.vendorId;
    }

    if (!vId && type === 'weaving-outward') {
      const weavingOrder = sharedExtractArray(weavingJobWorkOrderList).find((o: any) => String(o.id ?? o.weavingJobWorkOrderId) === String(challanDataFromState.weavingJobWorkOrderId));
      vId = weavingOrder?.vendorId;
    }

    const vendor = vendorList.find((v: any) => String(v.id) === String(vId)) || {};
    
    // Delivery To logic for sizing-outward: External -> Customer Master, Internal -> Company Master
    let deliveryTo: any = vendor;
    if (type === 'sizing-outward') {
      const sizingOrder = sharedExtractArray(sizingJobWorkOrderList).find((o: any) => String(o.id ?? o.sizingJobWorkOrderId) === String(challanDataFromState.sizingOrderId));

      if (Number(challanDataFromState.orderTypeId) === 2) {
        // External -> Customer Master
        const customerId = sizingOrder?.buyerId ?? sizingOrder?.customerId ?? challanDataFromState.buyerId;
        const customer = (customerList as any)?.data 
          ? (customerList as any).data.find((c: any) => String(c.id) === String(customerId))
          : (Array.isArray(customerList) ? customerList.find((c: any) => String(c.id) === String(customerId)) : null);
        
        if (customer) {
          deliveryTo = {
            ...customer,
            vendorName: customer.customerName || customer.name,
            address: customer.address || customer.customerAddresses
          };
        }
      } else if (Number(challanDataFromState.orderTypeId) === 1) {
        // Internal -> Company Master (Factory Company)
        const factoryId = sizingOrder?.factoryCompanyId ?? sizingOrder?.tradingCompanyId ?? challanDataFromState.factoryCompanyId;
        const factory = companyMasterList.find((c: any) => String(c.id) === String(factoryId));
        
        if (factory) {
          deliveryTo = {
            ...factory,
            vendorName: factory.companyName || factory.name,
            address: factory.address
          };
        }
      }
    }

    if (type === 'weaving-outward') {
      const weavingOrder = sharedExtractArray(weavingJobWorkOrderList).find((o: any) => String(o.id ?? o.weavingJobWorkOrderId) === String(challanDataFromState.weavingJobWorkOrderId));

      if (Number(challanDataFromState.orderTypeId) === 2) {
        // External -> Customer Master
        const customerId = weavingOrder?.buyerId ?? weavingOrder?.customerId ?? challanDataFromState.buyerId;
        const customer = (customerList as any)?.data 
          ? (customerList as any).data.find((c: any) => String(c.id) === String(customerId))
          : (Array.isArray(customerList) ? customerList.find((c: any) => String(c.id) === String(customerId)) : null);
        
        if (customer) {
          deliveryTo = {
            ...customer,
            vendorName: customer.customerName || customer.name,
            address: customer.address || customer.customerAddresses
          };
        }
      } else if (Number(challanDataFromState.orderTypeId) === 1) {
        // Internal -> Company Master (Factory Company)
        const factoryId = weavingOrder?.factoryCompanyId ?? weavingOrder?.tradingCompanyId ?? challanDataFromState.factoryCompanyId;
        const factory = companyMasterList.find((c: any) => String(c.id) === String(factoryId));
        
        if (factory) {
          deliveryTo = {
            ...factory,
            vendorName: factory.companyName || factory.name,
            address: factory.address
          };
        }
      }
    }

    // Handle both array and object structures for vendor address
    const vendorAddress = Array.isArray(deliveryTo?.address) ? (deliveryTo.address[0] || {}) : (deliveryTo.address || {});
    
    // Resolve city and state names for vendor
    const vendorCity = cityList.find((c: any) => String(c.id) === String(vendorAddress.cityId));
    const vendorState = stateList.find((s: any) => String(s.id) === String(vendorAddress.stateId));

    const vendorAddressInfo = formatAddressLineAndCity(vendorAddress, vendorCity);

    // Get sizing plan info
    const sizingPlan = sizingPlanList.find((p: any) => p.id === challanDataFromState.sizingPlanId) || {};

    // Get transport info
    const transport = transportList.find((t: any) => String(t.id) === String(challanDataFromState.transportId)) || {};

    let items: any[] = [];
    if (type === 'weaving') {
      items = (challanDataFromState.requirements || []).flatMap((req: any) => 
        (req.yarnIssues || []).map((issue: any) => {
          const weavingContract = weavingContractList.find((c: any) => String(c.id) === String(challanDataFromState.weavingContractId));
          const contractLabel = resolveContractNo(weavingContract) || resolveContractNo(challanDataFromState) || (challanDataFromState.weavingContractId ? String(challanDataFromState.weavingContractId) : '');
          return {
            ...issue,
            yarnName: issue.yarnName || req.yarnName,
            sizingPlanNo: contractLabel,
            issueQty: issue.issueQty || issue.qty || 0,
            grossWt: issue.grossWt || issue.issueQty || 0
          };
        })
      );
    } else if (type === 'processing') {
      const dyeingContract = processContractList.find((c: any) => String(c.id) === String(challanDataFromState.dyeingWorkOrderId));
      const contractLabel = resolveContractNo(dyeingContract) || resolveContractNo(challanDataFromState) || (challanDataFromState.dyeingWorkOrderId ? String(challanDataFromState.dyeingWorkOrderId) : '');
      if (Array.isArray(challanDataFromState.yarnIssues) && challanDataFromState.yarnIssues.length > 0) {
        items = challanDataFromState.yarnIssues.map((issue: any) => ({
          ...issue,
          yarnName: issue.yarnName || challanDataFromState.finishedYarn || challanDataFromState.greigeYarn || 'Yarn',
          sizingPlanNo: contractLabel,
          issueQty: issue.issueQty || 0,
          lotNo: issue.lotNumber || issue.lotId || '',
          noOfBags: issue.noOfBags || 0,
          grossWt: issue.grossWt || (challanDataFromState.grossWt / challanDataFromState.yarnIssues.length) || issue.issueQty || 0
        }));
      } else {
        items = [{
          ...challanDataFromState,
          yarnName: challanDataFromState.finishedYarn || challanDataFromState.greigeYarn || 'Yarn',
          sizingPlanNo: contractLabel,
          issueQty: challanDataFromState.dispatchedQuantity || 0,
          lotNo: challanDataFromState.lotId || '',
          noOfBags: challanDataFromState.noOfBags || 0,
          grossWt: challanDataFromState.grossWt || challanDataFromState.dispatchedQuantity || 0
        }];
      }
    } else if (type === 'purchase-return') {
      const unifiedItems = Array.isArray(challanDataFromState.items) && challanDataFromState.items.length > 0
        ? challanDataFromState.items
        : [
          ...((challanDataFromState.yarnItems || []).map((i: any) => ({ ...i, itemType: 'yarn' }))),
          ...((challanDataFromState.fabricItems || []).map((i: any) => ({ ...i, itemType: 'fabric' }))),
          ...((challanDataFromState.itemItems || []).map((i: any) => ({ ...i, itemType: 'item' })))
        ];

      items = unifiedItems.map((item: any) => {
        // Resolve PO number
        const poId = item.purchaseOrderId || challanDataFromState.purchaseOrderId;
        const po = Array.isArray(purchaseOrderList)
          ? purchaseOrderList.find((p: any) => String(p.id) === String(poId))
          : (purchaseOrderList as any)?.data?.find((p: any) => String(p.id) === String(poId));

        return {
          ...item,
          yarnName: item.yarnName || (item.fabricCode ? `${item.fabricCode}${item.quality ? '-' + item.quality : ''}` : ''),
          sizingPlanNo: item.lotNo || po?.poNo || challanDataFromState.poNo || '',
          issueQty: item.returnQuantity || item.quantity || 0,
          grossWt: item.grossWt || item.returnQuantity || item.quantity || 0,
          lotNo: item.lotNo || ''
        };
      });
    } else if (type === 'yarn-challan') {
      // Use yarnIssueDetails if available, otherwise fallback to items
      const rawItems = (challanDataFromState.yarnIssueDetails && challanDataFromState.yarnIssueDetails.length > 0)
        ? challanDataFromState.yarnIssueDetails
        : (challanDataFromState.items || []);

      items = rawItems.map((issue: any) => {
        const yarn = yarnList.find((y: any) => String(y.id) === String(issue.yarnId));
        return {
          ...issue,
          yarnName: issue.yarnName || yarn?.yarnName || yarn?.name || '',
          sizingPlanNo: issue.sizingPlanNo || '',
          issueQty: issue.issueQty || issue.issuedQty || 0,
          grossWt: issue.grossWt || issue.issueQty || issue.issuedQty || 0,
          lotNo: issue.lotNumber || issue.lotNo || '',
          noOfBags: issue.noOfBags || 0,
          conesPerBag: issue.conesPerBag || 0,
          conesWeight: issue.conesWeight || 0,
          kgsPerBag: issue.kgsPerBag || 0
        };
      });
    } else if (type === 'beam-outward') {
      let plan = sizingPlanList.find((p: any) => p.id === challanDataFromState.sizingPlanId) || {};
      if (!plan?.sizingQualityDetails && challanDataFromState?.sizingQualityDetails) {
        plan = { ...plan, sizingQualityDetails: challanDataFromState.sizingQualityDetails };
      }
      const beamInwardId = challanDataFromState?.beamInwardId;
      const associatedBeamInward = beamInwardId 
        ? (Array.isArray(beamInwardList) ? beamInwardList.find((b: any) => String(b.id) === String(beamInwardId)) : null)
        : null;
      const beamInwardQualities = associatedBeamInward?.beamInwardQualityDetails || [];
      
      const outwardDetails = Array.isArray(challanDataFromState.outwardDetails) && challanDataFromState.outwardDetails.length > 0
        ? challanDataFromState.outwardDetails
        : [challanDataFromState];
      
      items = outwardDetails.map((detail: any) => {
        let fetchedYarnName = detail.yarnName || `Beam - ${detail.sizedBeamNo || ''}`;
        let fetchedTotalEnds = detail.totalEnds || null;
        
        if (!detail.yarnName && plan?.sizingQualityDetails && Array.isArray(plan.sizingQualityDetails)) {
          let matchingQuality = null;
          
          if (detail?.fabricMasterId || detail?.fabricId || detail?.fabricCodeId) {
            matchingQuality = plan.sizingQualityDetails.find((q: any) => {
              const fabricId = q?.fabricId ?? q?.fabricCodeId ?? q?.fabricMasterId;
              const detailFabricId = detail?.fabricMasterId ?? detail?.fabricId ?? detail?.fabricCodeId;
              return fabricId != null && detailFabricId != null && String(fabricId) === String(detailFabricId);
            });
          } else {
            matchingQuality = plan.sizingQualityDetails[0];
          }
          
          if (matchingQuality) {
            if (matchingQuality.yarnId) {
              const yarn = yarnList.find((y: any) => String(y.id) === String(matchingQuality.yarnId));
              if (yarn) {
                fetchedYarnName = yarn.yarnName || matchingQuality.quality || fetchedYarnName;
              } else {
                fetchedYarnName = matchingQuality.quality || fetchedYarnName;
              }
            } else {
              fetchedYarnName = matchingQuality.quality || fetchedYarnName;
            }
          }
        }
        
        if (!fetchedTotalEnds && beamInwardQualities.length > 0) {
          let matchingBeamQuality = null;
          if (detail?.fabricMasterId || detail?.fabricId || detail?.fabricCodeId) {
            matchingBeamQuality = beamInwardQualities.find((q: any) => {
              const fabricId = q?.fabricId ?? q?.fabricCodeId ?? q?.fabricMasterId;
              const detailFabricId = detail?.fabricMasterId ?? detail?.fabricId ?? detail?.fabricCodeId;
              return fabricId != null && detailFabricId != null && String(fabricId) === String(detailFabricId);
            });
          } else {
            matchingBeamQuality = beamInwardQualities[0];
          }
          if (matchingBeamQuality?.totalEnds) {
            fetchedTotalEnds = matchingBeamQuality.totalEnds;
          }
        }
        
        return {
          ...detail,
          ...challanDataFromState,
          yarnName: fetchedYarnName,
          sizingPlanNo: challanDataFromState.sizingPlanNo || plan.sizingPlanNo || '',
          sizedBeamNo: detail.sizedBeamNo || '',
          beamMeters: detail.beamMeters || detail.wrapMeters || 0,
          width: detail.width || detail.fabricPanelWidth || 0,
          expectedFabricMeter: detail.expectedFabricMeter || 0,
          totalEnds: fetchedTotalEnds || detail.flangeNo || '',
          noOfBags: detail.sizedBeamNo || '',
          noOfCones: detail.beamMeters || detail.wrapMeters || 0,
          netWt: detail.width || detail.fabricPanelWidth || 0,
          grossWt: detail.expectedFabricMeter || 0,
          lotNo: fetchedTotalEnds || detail.flangeNo || ''
        };
      });
    } else if (type === 'sizing-outward') {
      const rawItems = (challanDataFromState.yarnIssueDetails && challanDataFromState.yarnIssueDetails.length > 0)
        ? challanDataFromState.yarnIssueDetails
        : (challanDataFromState.items || challanDataFromState.details || []);

      const sizingOrder = sharedExtractArray(sizingJobWorkOrderList).find((o: any) => String(o.id ?? o.sizingJobWorkOrderId) === String(challanDataFromState.sizingOrderId));
        
      const plan = sizingPlanList.find((p: any) => String(p.id) === String(challanDataFromState.sizingPlanId));
      
      const warehouse = warehouseList.find((w: any) => String(w.id) === String(plan?.warehouseId));

      items = rawItems.map((item: any) => {
        const planLabel = resolvePlanNo(plan) || resolvePlanNo(challanDataFromState) || (challanDataFromState.sizingPlanId ? String(challanDataFromState.sizingPlanId) : '');
        const orderLabel = Number(challanDataFromState.orderTypeId) === 2 
          ? (sizingOrder?.sizingWorkOrderNo || sizingOrder?.sizingJobWorkOrderNo || sizingOrder?.orderNo || resolveOrderLabel(sizingOrder)) 
          : (planLabel || sizingOrder?.sizingWorkOrderNo || sizingOrder?.sizingJobWorkOrderNo || resolveOrderLabel(sizingOrder));
          
        return {
          ...item,
          yarnName: item.yarnName || challanDataFromState.yarnName || '',
          sizingPlanNo: orderLabel || item.sizingPlanNo || planLabel || challanDataFromState.sizingPlanNo || challanDataFromState.sizingOrderNo || challanDataFromState.sizingJobWorkOrderNo || '',
          issueQty: item.issuedQuantity || item.issueQty || 0,
          grossWt: item.grossWt || item.issuedQuantity || 0,
          lotNo: item.lotNo || '',
          millName: item.millName, // user wants millName from record
          noOfBags: item.inwardBags || item.issuingBags || item.noOfBags || '', // user wants inwardBags
          location: warehouse?.warehouseName || 'N/A' // user wants warehouse from plan
        };
      });
    } else if (type === 'weaving-outward') {
      const rawItems = (challanDataFromState.yarnIssueDetails && challanDataFromState.yarnIssueDetails.length > 0)
        ? challanDataFromState.yarnIssueDetails
        : (challanDataFromState.items || challanDataFromState.details || []);

      const weavingOrder = sharedExtractArray(weavingJobWorkOrderList).find((o: any) => String(o.id ?? o.weavingJobWorkOrderId) === String(challanDataFromState.weavingJobWorkOrderId));
        
      const contracts = sharedExtractArray(weavingContractList);
      const contract = contracts.find((c: any) => {
        const cId = c.id ?? c.weavingContractId;
        return cId != null && String(cId) === String(challanDataFromState.weavingContractId);
      });

      items = rawItems.map((item: any) => {
        const contractLabel = resolveContractNo(contract) || resolveContractNo(weavingOrder) || resolveContractNo(challanDataFromState) || (challanDataFromState.weavingContractId ? String(challanDataFromState.weavingContractId) : '');
        const orderLabel = Number(challanDataFromState.orderTypeId) === 2 
          ? (weavingOrder?.weavingWorkOrderNo || weavingOrder?.jobWorkOrderNo || weavingOrder?.orderNo || resolveOrderLabel(weavingOrder)) 
          : (contractLabel || weavingOrder?.weavingWorkOrderNo || weavingOrder?.jobWorkOrderNo || resolveOrderLabel(weavingOrder));
          
        return {
          ...item,
          yarnName: item.yarnName || challanDataFromState.yarnName || '',
          sizingPlanNo: orderLabel || item.sizingPlanNo || contractLabel || challanDataFromState.weavingContractNo || challanDataFromState.weavingJobWorkOrderNo || challanDataFromState.contractNo || challanDataFromState.orderNo || '',
          issueQty: item.issuedQuantity || item.issueQty || 0,
          grossWt: item.grossWt || item.issuedQuantity || 0,
          lotNo: item.lotNo || '',
          millName: item.millName,
          noOfBags: item.issuingBags || item.noOfBags || '',
          location: 'N/A'
        };
      });
    } else if (type === 'item-outward') {
      const rawItems = (challanDataFromState.itemOutwardStockDetails || challanDataFromState.itemOutwardItemsDtl || challanDataFromState.items || []);
      items = rawItems.map((item: any) => ({
        ...item,
        yarnName: item.itemName || '',
        sizingPlanNo: item.inwardNo || '',
        issueQty: Number(item.issuingQuantity || item.quantity || 0).toFixed(2),
        grossWt: Number(item.issuingQuantity || item.quantity || 0).toFixed(2),
        lotNo: item.itemCode || '',
        noOfBags: item.issuingBags || '',
      }));
    } else {
      items = (challanDataFromState.sizingYarnIssue || []);
    }

    const mappedItems = items.map((item: any, index: number) => {
      const cones = (Number(item.noOfBags) || 0) * (Number(item.conesPerBag) || 0);
      const mill = subCategoryList.find((sc: any) => String(sc.id) === String(item.millId));
      const warehouse = warehouseList.find((w: any) => String(w.id) === String(item.warehouseId));

      return {
        sNo: index + 1,
        sizingPlanNo: item.sizingPlanNo || sizingPlan.sizingPlanNo || '',
        yarnName: item.yarnName || '',
        millName: item.millName || mill?.subCategoryName || 'N/A',
        noOfBags: item.noOfBags || '',
        noOfCones: cones > 0 ? cones : (item.noOfCones || '-'),
        netWt: item.issueQty || '',
        grossWt: item.grossWt || item.issueQty || '',
        kgsPerBag: item.kgsPerBag || '',
        lotNo: item.lotNo || item.lotNumber || '',
        location: item.location || warehouse?.warehouseName || 'N/A',
        sizedBeamNo: item.sizedBeamNo || '',
        beamMeters: item.beamMeters || 0,
        width: item.width || 0,
        expectedFabricMeter: item.expectedFabricMeter || 0,
        totalEnds: item.totalEnds || '',
      };
    });

    const planNoLabel = type === 'item-outward' ? 'Inward No' : ((type === 'sizing-outward' || type === 'weaving-outward') && Number(challanDataFromState.orderTypeId) === 2 ? 'Order No' : 'Plan No');

    // Handle yarn-challan type: use buyer and consignee instead of company and vendor
    if (type === 'yarn-challan') {
      const buyer = (customerList as any)?.data 
        ? (customerList as any).data.find((c: any) => String(c.id) === String(challanDataFromState.buyerId))
        : (Array.isArray(customerList) ? customerList.find((c: any) => String(c.id) === String(challanDataFromState.buyerId)) : null);
      
      const buyerAddresses = buyer?.address || buyer?.customerAddresses || [];
      const buyerAddress = Array.isArray(buyerAddresses) ? (buyerAddresses[0] || {}) : (buyerAddresses || {});
      
      const buyerCity = cityList.find((c: any) => String(c.id) === String(buyerAddress.cityId));
      const buyerState = stateList.find((s: any) => String(s.id) === String(buyerAddress.stateId));

      const consignee = (consigneeList as any)?.data
        ? (consigneeList as any).data.find((c: any) => String(c.id) === String(challanDataFromState.consigneeId))
        : (Array.isArray(consigneeList) ? consigneeList.find((c: any) => String(c.id) === String(challanDataFromState.consigneeId)) : null);
      
      const consigneeAddresses = consignee?.address || consignee?.consigneeAddresses || [];
      const consigneeAddress = Array.isArray(consigneeAddresses) ? (consigneeAddresses[0] || {}) : (consigneeAddresses || {});
      
      const consigneeCity = cityList.find((c: any) => String(c.id) === String(consigneeAddress.cityId));
      const consigneeState = stateList.find((s: any) => String(s.id) === String(consigneeAddress.stateId));

      return {
        erpCompany: {
          name: company.companyName || company.name || 'Company Name',
          address: fullAddress || 'Address',
          cityPincode: companyCityPincode,
          stateCode: companyState?.stateName ? `${companyState.stateName} - ${companyAddress.stateCode || ''}` : (companyAddress.stateCode || ''),
          gst: company.gstNo || company.gstin || companyAddress.gstNo || 'GST NO',
        },
        company: {
          name: buyer?.customerName || buyer?.name || 'Buyer Name',
          address: buyerAddress.line1 || buyerAddress.address || 'Address',
          cityPincode: `${buyerCity?.cityName || buyerAddress.cityName || ''} - ${buyerAddress.pinCode || ''}`,
          stateCode: `${buyerState?.stateName || buyerAddress.stateName || ''} - ${buyerAddress.stateCode || ''}`,
          gst: buyer?.gstNo || buyer?.gstin || buyerAddress.gstNo || 'GST NO',
          country: buyerAddress.countryName || 'India',
        },
        vendor: {
          name: consignee?.consigneeName || consignee?.name || 'Consignee Name',
          address: consigneeAddress.line1 || consigneeAddress.address || 'Address',
          cityPincode: `${consigneeCity?.cityName || consigneeAddress.cityName || ''} - ${consigneeAddress.pinCode || ''}`,
          stateCode: `${consigneeState?.stateName || consigneeAddress.stateName || ''} - ${consigneeAddress.stateCode || ''}`,
          gst: consignee?.gstNo || consignee?.gstin || consigneeAddress.gstNo || 'GST NO',
          country: consigneeAddress.countryName || 'India',
        },
        dcDetails: {
          dcNoCardNo: challanDataFromState.challanNo || '',
          vehicleNo: challanDataFromState.vehicleNo || 'N/A',
          dcDate: formatDate(challanDataFromState.challanDate) || '',
          remarks: challanDataFromState.remarks || '',
          transportName: transport.transportName || 'N/A',
        },
        planNoLabel,
        items: mappedItems,
      } as any;
    }

    return {
      company: {
        name: company?.companyName || company?.name || 'Company Name',
        address: fullAddress || 'Address',
        cityPincode: companyCityPincode,
        stateCode: companyState?.stateName ? `${companyState.stateName} - ${companyAddress.stateCode || ''}` : (companyAddress.stateCode || ''),
        gst: company?.gstNo || company?.gstin || companyAddress.gstNo || 'GST NO',
        country: companyAddress.countryName || 'India',
      },
      vendor: {
        name: deliveryTo.vendorName || deliveryTo.name || vendor.vendorName || vendor.name || 'Vendor Name',
        address: vendorAddressInfo.address || 'Address',
        cityPincode: vendorAddressInfo.cityPincode,
        stateCode: `${vendorState?.stateName || vendorAddress.stateName || (vendorAddress.stateCode ? vendorAddress.stateCode : '')} - ${vendorAddress.stateCode || ''}`,
        gst: deliveryTo.gstNo || deliveryTo.gstno || deliveryTo.gstin || vendor.gstno || vendor.gstNo || vendorAddress.gstNo || 'GST NO',
        country: vendorAddress.countryName || 'India',
      },
      dcDetails: {
        dcNoCardNo: challanDataFromState.returnNo || challanDataFromState.outwardNo || challanDataFromState.issueNo || challanDataFromState.yarnIssueChallanNo || challanDataFromState.fabricDispatchId || '',
        vehicleNo: challanDataFromState.vehicleNo || 'N/A',
        dcDate: formatDate(challanDataFromState.returnDate || challanDataFromState.outwardDate || challanDataFromState.sizingYarnIssueDate || challanDataFromState.yarnIssueDate || challanDataFromState.fabricDispatchDate) || '',
        remarks: type === 'item-outward' 
          ? [
              challanDataFromState.department ? `Dept: ${challanDataFromState.department}` : '',
              (challanDataFromState.machineNo || challanDataFromState.machineName) ? `Machine: ${challanDataFromState.machineNo || challanDataFromState.machineName}` : '',
              challanDataFromState.remark || challanDataFromState.remarks || ''
            ].filter(Boolean).join(' | ')
          : (challanDataFromState.remark || challanDataFromState.remarks || ''),
        transportName: transport.transportName || challanDataFromState.transportName || challanDataFromState.transportationDetails || 'N/A',
      },
      planNoLabel,
      items: mappedItems,
      beamItems: type === 'beam-outward' ? mappedItems : undefined,
    } as any;
  }, [challanDataFromState, companyMasterList, vendorList, sizingPlanList, sizingJobWorkOrderList, subCategoryList, warehouseList, yarnList, type, beamInwardList, transportList, cityList, stateList, customerList, consigneeList, purchaseOrderList, purchaseReturnList, weavingContractList, processContractList]);

  if (!templateData) {
    return <div className="p-10 text-center text-gray-600 font-medium">Loading Challan Data...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen py-10 print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none">
        <div className="flex justify-between items-center p-4 border-b print:hidden">
          <span className="font-semibold text-gray-700"></span>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print Challan
          </button>
        </div>
        {type === 'beam-outward' ? (
          <BeamDeliveryChallanTemplate data={templateData} />
        ) : (
          <YarnDeliveryChallanTemplate data={templateData} isYarnChallan={type === 'yarn-challan'} />
        )}
      </div>
    </div>
  );
}
