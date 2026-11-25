import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { BarcodeSticker } from '@/components/templates/BarcodeSticker';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { getAllCompanies } from '@/state/company-master-slice';
import { getAllFabricMastersForDropdown } from '@/state/fabricMasterSlice';
import { AppDispatch, RootState } from '@/state/store';

const BarcodeStickerPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { companyName: contextCompanyName } = useCompanyContext();
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster);
  const { fabricMasterFullList } = useSelector((state: RootState) => state.fabricMaster);
  
  const [searchParams] = useSearchParams();
  const barcode = searchParams.get('barcode') || '';
  const fabricQualityParam = searchParams.get('fabricQuality') || '';
  const fabricQualityId = searchParams.get('fabricQualityId') || '';
  const fabricCodeParam = searchParams.get('fabricCode') || '';
  const fabricCodeId = searchParams.get('fabricCodeId') || '';
  const meters = searchParams.get('meter') || '';
  const yards = searchParams.get('yards') || '';
  const netWeight = searchParams.get('netWeight') || '';
  const avgWeight = searchParams.get('avgWeight') || '';
  const grossWeight = searchParams.get('grossWeight') || '';
  const companyId = searchParams.get('companyId') || '';

  const [showMeter, setShowMeter] = useState(true);
  const [showGross, setShowGross] = useState(false);
  const [showYards, setShowYards] = useState(false);
  const [showNet, setShowNet] = useState(true);
  const [showAvg, setShowAvg] = useState(false);
  const [showCompany, setShowCompany] = useState(false);
  const [displayCompanyName, setDisplayCompanyName] = useState(contextCompanyName || '');
  const [resolvedFabricCode, setResolvedFabricCode] = useState(fabricCodeParam || '');
  const [resolvedFabricQuality, setResolvedFabricQuality] = useState(fabricQualityParam || '');

  useEffect(() => {
    if ((fabricCodeId || fabricQualityId) && (!fabricMasterFullList || fabricMasterFullList.length === 0)) {
      dispatch(getAllFabricMastersForDropdown());
    }
  }, [fabricCodeId, fabricQualityId, dispatch, fabricMasterFullList]);

  useEffect(() => {
    // Default to params
    let newCode = fabricCodeParam;
    let newQuality = fabricQualityParam;

    if (fabricMasterFullList && fabricMasterFullList.length > 0) {
      if (fabricCodeId) {
        const fabric = fabricMasterFullList.find((f: any) => String(f.id) === fabricCodeId);
        if (fabric) {
          newCode = fabric.fabricCode || '';
          // If quality is not explicitly provided in params or via its own ID, 
          // pull it from the fabric code master record
          if (!fabricQualityParam && !fabricQualityId) {
            newQuality = fabric.fabricQuality || '';
          }
        }
      }
      
      if (fabricQualityId) {
        const fabric = fabricMasterFullList.find((f: any) => String(f.id) === fabricQualityId);
        if (fabric) {
          newQuality = fabric.fabricQuality || fabric.fabricCode || '';
        }
      }
    }

    setResolvedFabricCode(newCode);
    setResolvedFabricQuality(newQuality);
  }, [fabricMasterFullList, fabricCodeId, fabricQualityId, fabricCodeParam, fabricQualityParam]);

  useEffect(() => {
    if (showCompany && companyId && (!companyMasterList || companyMasterList.length === 0)) {
      dispatch(getAllCompanies({ fetchAll: true }));
    }
  }, [showCompany, companyId, dispatch, companyMasterList]);

  useEffect(() => {
    if (showCompany) {
      if (companyId && companyMasterList && companyMasterList.length > 0) {
        const company = companyMasterList.find((c: any) => String(c.id) === companyId);
        if (company) {
          setDisplayCompanyName(company.name || company.companyName || '');
        } else if (contextCompanyName) {
          setDisplayCompanyName(contextCompanyName);
        }
      } else if (contextCompanyName) {
        setDisplayCompanyName(contextCompanyName);
      }
    }
  }, [companyMasterList, companyId, showCompany, contextCompanyName]);

  const handlePrint = () => {
    window.print();
  };

  if (!barcode) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">No barcode data provided in the URL parameters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 print:bg-white p-0">
      <div className="mb-6 p-4 bg-white rounded shadow-md print:hidden flex flex-col items-center gap-4">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showMeter} onChange={e => setShowMeter(e.target.checked)} />
            <span className="text-sm font-medium">Meter</span>
          </label>
           <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showNet} onChange={e => setShowNet(e.target.checked)} />
            <span className="text-sm font-medium">Net Wt</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showGross} onChange={e => setShowGross(e.target.checked)} />
            <span className="text-sm font-medium">Gross Wt</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showYards} onChange={e => setShowYards(e.target.checked)} />
            <span className="text-sm font-medium">Yards</span>
          </label>
         
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showAvg} onChange={e => setShowAvg(e.target.checked)} />
            <span className="text-sm font-medium">Avg Wt</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showCompany} onChange={e => setShowCompany(e.target.checked)} />
            <span className="text-sm font-medium">Company</span>
          </label>
        </div>
        <button 
          onClick={handlePrint}
          className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors font-semibold"
        >
          Print Barcode
        </button>
      </div>
      <BarcodeSticker 
        barcode={barcode} 
        companyName={displayCompanyName}
        fabricQuality={resolvedFabricQuality}
        fabricCode={resolvedFabricCode}
        meter={meters}
        yards={yards}
        netWeight={netWeight}
        avgWeight={avgWeight}
        grossWeight={grossWeight}
        showMeter={showMeter}
        showGross={showGross}
        showYards={showYards}
        showNet={showNet}
        showAvg={showAvg}
        showCompany={showCompany}
      />
    </div>
  );
};

export default BarcodeStickerPage;
