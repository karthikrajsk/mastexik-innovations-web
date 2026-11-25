import { useEffect, useState, useContext, useRef, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { IdsContext } from "@/routes/Routes";
import { AppDispatch, RootState } from "@/state/store";
import { Trash, Edit, ArrowLeft } from "lucide-react";
import { getAllCustomers } from "@/state/customerSlice";
import { getAllFabricMasters } from "@/state/fabricMasterSlice";
import { getAllUomMaster } from "@/state/uomMasterSlice";
import { getAllAgentMasters } from "@/state/agentMasterSlice";
import { documentNumberService } from "@/services/DocumentNumberService";
import { createCosting, FabricDetail, getCostingById, updateCosting, YarnDetail } from "@/state/costingSlice";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";

interface CostingFormData {
  date: string;
  costingNo: string;
  customerName: string;
  agentId: string;
  fabricCodeQuality: string;
  uom: string;
}

interface FabricCostData {
  sizingCostPerKg: number;
  weavingChargesPerPick: number;
  fabricProcessingCostPerKg: number;
  freightCost: number;
  valueLossInterest: number;
  wastage: number;
  commissionCD: number;
  others: number;
}

interface FinalCostingData {
  marginPercent: number;
  orderQty: number;
}

export default function CostingForm() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { parentId } = useContext(IdsContext);
  const { id } = useParams<{ id?: string }>();
  const editId = parentId || id;
  const isEditMode = Boolean(editId);

  const [yarnDetails, setYarnDetails] = useState<YarnDetail[]>([]);
  const [fabricDetails, setFabricDetails] = useState<FabricDetail>({
    greyWidth: 0,
    epiDifference: 0,
    epiOnTable: 0,
    reedSpace: 0,
    totalEnds: 0,
    warpCrimp: 0,
  });
  const [fabricCostData, setFabricCostData] = useState<FabricCostData>({
    sizingCostPerKg: 0,
    weavingChargesPerPick: 0,
    fabricProcessingCostPerKg: 0,
    freightCost: 0,
    valueLossInterest: 0,
    wastage: 0,
    commissionCD: 0,
    others: 0,
  });
  const [finalCostingData, setFinalCostingData] = useState<FinalCostingData>({
    marginPercent: 0,
    orderQty: 0,
  });
  const [showYarnForm, setShowYarnForm] = useState(false);
  const [editingYarn, setEditingYarn] = useState<YarnDetail | null>(null);
  const [yarnFormData, setYarnFormData] = useState<Partial<YarnDetail>>({
    warpWeft: "Warp",
    yarnCount: 0,
    ratePerUnit: 0,
    yarnProcessingCost: 0,
    content: "",
    yarnType: "",
    epi: 0,
    ppi: 0,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<CostingFormData>();

  const { uomList = [], loading: uomLoading } = useSelector((state: RootState) => state.uom || {});

  const selectedUomId = watch("uom");
  const selectedUOM = selectedUomId
    ? (uomList.find((u: any) => String(u.id) === String(selectedUomId))?.uomName || "Meter")
    : "Meter";

  const { customerList, loading: customerLoading } = useSelector((state: RootState) => state.customer);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
  const { agentMasterList, loading: agentMasterLoading } = useSelector((state: RootState) => state.agentMaster);
  const { currentCosting, loading: costingLoading } = useSelector((state: RootState) => state.costing);

  const savedCostingData = useMemo(
    () => (location.state as any)?.costing || currentCosting,
    [location.state, currentCosting],
  );

  const customers = customerList || [];
  const fabricMasters = fabricMasterList || [];
  const agentMasters = agentMasterList || [];
  const isSavingRef = useRef(false);
  const hasGeneratedNumberRef = useRef(false);


  useEffect(() => {
      const stateCosting = (location.state as any)?.costing;
      const costingData = stateCosting || currentCosting;
      const generateDocumentNumber = async () => {
        // Only generate for new entries (not editing existing ones)
        if (costingData || hasGeneratedNumberRef.current) {
          return;
        }
  
        try {
          const result = await documentNumberService.generateDocumentNumber({
            screenName: 'Costing List'
          });
          setValue('costingNo', result.documentNumber, { shouldValidate: true });
          hasGeneratedNumberRef.current = true;
        } catch (error) {
          console.error('Failed to generate Costing List number:', error);
          toast.error('Failed to generate Costing List number');
        }
      };
  
      generateDocumentNumber();
    }, [location.state, setValue]);
  
    // Cleanup document number cache if not saved
    useEffect(() => {
        const stateCosting = (location.state as any)?.costing;
      const costingData = stateCosting || currentCosting;
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (hasGeneratedNumberRef.current && !isSavingRef.current && !costingData) {
          documentNumberService.clearMemoryCache('Costing List');
        }
      };
  
      window.addEventListener('beforeunload', handleBeforeUnload);
  
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        if (hasGeneratedNumberRef.current && !isSavingRef.current && !costingData) {
          documentNumberService.clearMemoryCache('Costing List');
        }
      };
    }, [location.state]);
  
    useEffect(() => {
      setValue('costingNo', location.state?.costingNo || '');
    }, [location.state, setValue]);
  

  // Calculate yarn cost details
  const calculateYarnCostDetails = () => {
    const warpYarns = yarnDetails.filter(y => y.warpWeft === "Warp");
    const weftYarns = yarnDetails.filter(y => y.warpWeft === "Weft");

    const yarnCalculations = yarnDetails.map(yarn => {
      const weight = calculateYarnWeight(yarn);
      const cost = weight * yarn.ratePerUnit;
      const wastagePercent = 5; // Default 5%
      const wastage = cost * (wastagePercent / 100);

      return {
        ...yarn,
        calculatedWeight: weight,
        calculatedCost: cost,
        calculatedWastage: wastage,
        wastagePercent
      };
    });

    const totalYarnWeight = yarnCalculations.reduce((sum, yarn) => sum + (yarn.calculatedWeight || 0), 0);
    const totalYarnCost = yarnCalculations.reduce((sum, yarn) => sum + (yarn.calculatedCost || 0), 0);
    const totalWastage = yarnCalculations.reduce((sum, yarn) => sum + (yarn.calculatedWastage || 0), 0);

    const glm = totalYarnWeight * 1.1;

    return {
      yarnCalculations,
      totalYarnWeight,
      totalYarnCost,
      totalWastage,
      glm
    };
  };

  const calculateYarnWeight = (yarn: YarnDetail) => {
    const density = yarn.warpWeft === "Warp" ? yarn.epi : yarn.ppi;
    return (yarn.yarnCount * density) / 1000;
  };

  // Calculate fabric cost details
  const calculateFabricCostDetails = () => {
    const yarnCosts = calculateYarnCostDetails();

    const totalCostWithoutOverheads = yarnCosts.totalYarnCost +
      fabricCostData.sizingCostPerKg +
      fabricCostData.weavingChargesPerPick +
      fabricCostData.fabricProcessingCostPerKg;

    const totalOverheads = fabricCostData.freightCost +
      (totalCostWithoutOverheads * fabricCostData.valueLossInterest / 100) +
      (totalCostWithoutOverheads * fabricCostData.wastage / 100);

    const subtotal = totalCostWithoutOverheads + totalOverheads;

    const commissionAmount = subtotal * (fabricCostData.commissionCD / 100);
    const total = subtotal + commissionAmount + fabricCostData.others;

    // Calculate rate per meter or yard based on UOM
    const ratePerUnit = selectedUOM === "Meter" ? total / 1 : total / 1.0936; // 1 meter = 1.0936 yards

    return {
      totalCostWithoutOverheads,
      totalOverheads,
      subtotal,
      commissionAmount,
      total,
      ratePerUnit
    };
  };

  // Calculate final costing details
  const calculateFinalCostingDetails = () => {
    const fabricCosts = calculateFabricCostDetails();
    const yarnCosts = calculateYarnCostDetails();

    const targetPrice = fabricCosts.total + (fabricCosts.total * finalCostingData.marginPercent / 100);
    const weavingChargesAsPerTP = targetPrice * 0.15; // Example calculation

    // Calculate yarn requirements
    const warpRequirements = yarnCosts.yarnCalculations
      .filter(y => y.warpWeft === "Warp")
      .map(yarn => ({
        name: `Warp ${yarnCosts.yarnCalculations.filter(y => y.warpWeft === "Warp").indexOf(yarn) + 1}`,
        requirement: (yarn.calculatedWeight || 0) * finalCostingData.orderQty
      }));

    const weftRequirements = yarnCosts.yarnCalculations
      .filter(y => y.warpWeft === "Weft")
      .map(yarn => ({
        name: `Weft ${yarnCosts.yarnCalculations.filter(y => y.warpWeft === "Weft").indexOf(yarn) + 1}`,
        requirement: (yarn.calculatedWeight || 0) * finalCostingData.orderQty
      }));

    // Calculate cover factor
    const coverFactor = Math.sqrt(yarnDetails.reduce((sum, y) => sum + y.epi + y.ppi, 0)) / yarnDetails.length;

    return {
      targetPrice,
      weavingChargesAsPerTP,
      warpRequirements,
      weftRequirements,
      coverFactor
    };
  };

  const yarnCostDetails = calculateYarnCostDetails();
  const fabricCostDetails = calculateFabricCostDetails();
  const finalCostingDetails = calculateFinalCostingDetails();

  // Add this helper function
const useAllDataLoaded = () => {
  const { customerList, loading: customerLoading } = useSelector((state: RootState) => state.customer);
  const { fabricMasterList } = useSelector((state: RootState) => state.fabricMaster);
  const { uomList = [] } = useSelector((state: RootState) => state.uom || {});
  const { agentMasterList, loading: agentMasterLoading } = useSelector((state: RootState) => state.agentMaster);
  
  return {
    isLoaded: !customerLoading && !agentMasterLoading &&
              Array.isArray(customerList) && customerList.length > 0 &&
              Array.isArray(fabricMasterList) && fabricMasterList.length > 0 &&
              Array.isArray(agentMasterList) && agentMasterList.length > 0 &&
              Array.isArray(uomList) && uomList.length > 0,
    data: {
      customers: customerList || [],
      fabrics: fabricMasterList || [],
      agents: agentMasterList || [],
      uoms: uomList || []
    }
  };
};

// Replace ALL your existing useEffect hooks for dropdown population with this ONE effect:

useEffect(() => {
  if (!isEditMode || !savedCostingData) return;
  
  // Wait a bit to ensure DOM is ready and data is loaded
  const timer = setTimeout(() => {
    // Set customer
    if (savedCostingData.customerName) {
      setValue("customerName", savedCostingData.customerName, { shouldValidate: true });
    }
    
    // Set agent - use agentId if available, otherwise find by name
    if (savedCostingData.agentId != null) {
      setValue("agentId", String(savedCostingData.agentId), { shouldValidate: true });
    } else if (savedCostingData.agent) {
      // Try to find agent by name in the agentMasters list
      const foundAgent = agentMasterList.find((a: any) => 
        a.agentName?.toLowerCase() === savedCostingData.agent?.toLowerCase() ||
        a.name?.toLowerCase() === savedCostingData.agent?.toLowerCase()
      );
      if (foundAgent?.id) {
        setValue("agentId", String(foundAgent.id), { shouldValidate: true });
      }
    }
    
    // Set fabric code
    if (savedCostingData.fabricCodeQuality) {
      setValue("fabricCodeQuality", savedCostingData.fabricCodeQuality, { shouldValidate: true });
    }
    
    // Set UOM
    if (savedCostingData.uomId) {
      setValue("uom", String(savedCostingData.uomId), { shouldValidate: true });
    } else if (savedCostingData.uom) {
      // Try to find by name or id
      const foundUom = uomList.find((u: any) => 
        String(u.id) === String(savedCostingData.uom) ||
        u.uomName?.toLowerCase() === String(savedCostingData.uom).toLowerCase()
      );
      if (foundUom?.id) {
        setValue("uom", String(foundUom.id), { shouldValidate: true });
      }
    }
  }, 100); // Small delay to ensure data is loaded
  
  return () => clearTimeout(timer);
}, [isEditMode, savedCostingData, agentMasterList, uomList, setValue]);

  useEffect(() => {
    dispatch(getAllCustomers({}));
    dispatch(getAllFabricMasters({}));
    dispatch(getAllUomMaster({ fetchAll: true }));
    dispatch(getAllAgentMasters({ fetchAll: true }));
  }, [dispatch]);

  useEffect(() => {
    if (isEditMode) {
      const stateCosting = (location.state as any)?.costing;
      const costingData = stateCosting || currentCosting;

      if (costingData) {
        setValue("date", costingData.date || "");
        setValue("costingNo", costingData.costingNo || "");
        setValue("customerName", costingData.customerName || "");
        if (costingData.agentId != null) {
          setValue("agentId", String(costingData.agentId));
        }
        setValue("fabricCodeQuality", costingData.fabricCodeQuality || "");
        if (costingData.uomId) {
          setValue("uom", String(costingData.uomId));
        } else if (costingData.uom) {
          const matchedUom = uomList.find((u: any) => String(u.id) === String(costingData.uom));
          setValue("uom", matchedUom ? String(matchedUom.id) : "");
        }

        if (costingData.yarnDetails && costingData.yarnDetails.length > 0) {
          setYarnDetails(costingData.yarnDetails);
        }

        if (costingData.fabricDetails) {
          setFabricDetails(costingData.fabricDetails);
        }

        if (costingData.fabricCostData) {
          setFabricCostData(costingData.fabricCostData);
        }

        if (costingData.finalCostingData) {
          setFinalCostingData(costingData.finalCostingData);
        }
      }
    }
  }, [currentCosting, isEditMode, location.state, setValue, uomList]);


  useEffect(() => {
    if (!isEditMode) {
      const today = new Date().toISOString().split('T')[0];
      setValue("date", today);
      const meterUom = uomList.find((u: any) => u.uomName?.toLowerCase() === 'meter');
      if (meterUom) {
        setValue("uom", String(meterUom.id));
      }
    }
  }, [setValue, isEditMode, uomList]);

  // Generate document number for new costings
  useEffect(() => {
    const generateDocumentNumber = async () => {
      if (isEditMode) {
        return;
      }

      try {
        const result = await documentNumberService.generateDocumentNumber({
          screenName: 'Costing List',  // Changed from 'Costing Form' to match configuration
          tabName: undefined  // No tab for Costing List
        });

        setValue('costingNo', result.documentNumber, { shouldValidate: true });
      } catch (error) {
        console.error('Failed to generate costing number:', error);
      }
    };

    generateDocumentNumber();
  }, [isEditMode, setValue]);



  useEffect(() => {
    if (isEditMode && editId) {
      const stateCosting = (location.state as any)?.costing;
      if (stateCosting) {
        // Data is available from navigation state, no need to fetch
        return;
      }
      // Fetch from backend only if not available in state
      const companyId = localStorage.getItem('companyId') ? parseInt(localStorage.getItem('companyId')!) : localStorage.getItem('selectedCompanyId') ? parseInt(localStorage.getItem('selectedCompanyId')!) : undefined;
      if (companyId) {
        dispatch(getCostingById({ id: parseInt(editId), companyId }));
      }
    }
  }, [dispatch, isEditMode, editId, location.state]);

  const handleAddYarn = () => {
    setEditingYarn(null);
    setYarnFormData({
      warpWeft: "Warp",
      yarnCount: 0,
      ratePerUnit: 0,
      yarnProcessingCost: 0,
      content: "",
      yarnType: "",
      epi: 0,
      ppi: 0,
    });
    setShowYarnForm(true);
  };

  const handleEditYarn = (yarn: YarnDetail) => {
    setEditingYarn(yarn);
    setYarnFormData(yarn);
    setShowYarnForm(true);
  };

  const handleSaveYarn = () => {
    const isWarp = (yarnFormData.warpWeft || "Warp") === "Warp";

    if (!yarnFormData.yarnCount || !yarnFormData.ratePerUnit) {
      alert("Please fill all mandatory fields");
      return;
    }

    if (isWarp && (!yarnFormData.epi || yarnFormData.epi <= 0)) {
      alert("EPI is required for Warp yarns");
      return;
    }

    if (!isWarp && (!yarnFormData.ppi || yarnFormData.ppi <= 0)) {
      alert("PPI is required for Weft yarns");
      return;
    }

    if (editingYarn) {
      setYarnDetails(
        yarnDetails.map(y => y.id === editingYarn.id ? { ...yarnFormData as YarnDetail } : y)
      );
    } else {
      const newYarn: YarnDetail = {
        ...(yarnFormData as YarnDetail),
        id: Date.now(),
      };
      setYarnDetails([...yarnDetails, newYarn]);
    }
    setShowYarnForm(false);
  };

  const handleDeleteYarn = (id: number) => {
    setYarnDetails(yarnDetails.filter(y => y.id !== id));
  };

  const handleFabricChange = (field: keyof FabricDetail, value: number) => {
    setFabricDetails({
      ...fabricDetails,
      [field]: value,
    });
  };

  const handleFabricCostChange = (field: keyof FabricCostData, value: number) => {
    setFabricCostData({
      ...fabricCostData,
      [field]: value,
    });
  };

  const handleFinalCostingChange = (field: keyof FinalCostingData, value: number) => {
    setFinalCostingData({
      ...finalCostingData,
      [field]: value,
    });
  };


  const getCurrentUserId = () => {
    try {
      const storedPayload = localStorage.getItem('authPayload');
      if (storedPayload) {
        const parsedPayload = JSON.parse(storedPayload);
        return parsedPayload.user?.id || null;
      }
    } catch (error) {
      console.error('Error retrieving user ID from localStorage:', error);
    }
    return null;
  };

  const preparePayloadWithCalculations = (formData: CostingFormData) => {
    const yarnCosts = calculateYarnCostDetails();
    const fabricCosts = calculateFabricCostDetails();
    const finalCosting = calculateFinalCostingDetails();

    // Prepare enhanced yarn details with calculations
    const enhancedYarnDetails = yarnDetails.map(yarn => {
      const yarnCalc = yarnCosts.yarnCalculations.find(yc => yc.id === yarn.id);
      return {
        ...yarn,
        // Include calculated fields
        calculatedWeight: yarnCalc?.calculatedWeight || 0,
        calculatedCost: yarnCalc?.calculatedCost || 0,
        calculatedWastage: yarnCalc?.calculatedWastage || 0,
        wastagePercent: yarnCalc?.wastagePercent || 5
      };
    });

    const selectedCustomer = customers.find((c: any) => c.customerName === formData.customerName);
    const selectedAgent = agentMasters.find((a: any) => String(a.id) === String(formData.agentId));
    const formAgentId = formData.agentId ? Number(formData.agentId) : null;
    const resolvedAgentId = selectedAgent?.id ?? (Number.isFinite(formAgentId) ? formAgentId : null) ?? savedCostingData?.agentId ?? null;
    const resolvedAgentName = selectedAgent?.agentName ?? savedCostingData?.agent ?? "";
    const selectedFabric = fabricMasters.find((f: any) => (f.fabricCode ?? f.FabricCode) === formData.fabricCodeQuality);

    const normalizeUomId = (value: string | number | undefined | null): number | null => {
      if (value === undefined || value === null || value === "") return null;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    };

    const resolvedUomId = normalizeUomId(formData.uom ?? savedCostingData?.uom);
    const resolvedUom = resolvedUomId != null ? uomList.find((item: any) => Number(item.id) === resolvedUomId) : null;

    return {
      ...formData,
      uom: resolvedUomId,
      uomFlag: resolvedUom?.uomName || resolvedUom?.name || savedCostingData?.uomFlag || "",
      buyerId: selectedCustomer?.id || null,
      agent: resolvedAgentName,
      agentId: resolvedAgentId,
      fabricTypeId: selectedFabric?.id ?? null,

      // Yarn details with calculations
      yarnDetails: enhancedYarnDetails,

      // Fabric details
      fabricDetails,

      // Enhanced fabric cost data with calculations
      fabricCostData: {
        ...fabricCostData,
        // Add calculated fields
        totalCostWithoutOverheads: fabricCosts.totalCostWithoutOverheads,
        totalOverheads: fabricCosts.totalOverheads,
        subtotal: fabricCosts.subtotal,
        commissionAmount: fabricCosts.commissionAmount,
        total: fabricCosts.total,
        ratePerUnit: fabricCosts.ratePerUnit
      },

      // Enhanced final costing data with calculations
      finalCostingData: {
        ...finalCostingData,
        // Add calculated fields
        targetPrice: finalCosting.targetPrice,
        weavingChargesAsPerTP: finalCosting.weavingChargesAsPerTP,
        warpRequirements: finalCosting.warpRequirements,
        weftRequirements: finalCosting.weftRequirements,
        coverFactor: finalCosting.coverFactor
      },

      // Add summary calculations
      yarnCostSummary: {
        totalYarnWeight: yarnCosts.totalYarnWeight,
        totalYarnCost: yarnCosts.totalYarnCost,
        totalWastage: yarnCosts.totalWastage,
        glm: yarnCosts.glm
      },

      createdBy: getCurrentUserId(),
      companyId: 0
    };
  };

  const onSubmit = async (data: CostingFormData) => {
    if (yarnDetails.length === 0) {
      toast.error("Atleast add one fabric detail");
      return;
    }

    const storedCompanyId = localStorage.getItem('selectedCompanyId') || localStorage.getItem('selectedCompany') || localStorage.getItem('companyId');
    if (!storedCompanyId) {
      alert("Please select a company before submitting");
      return;
    }

    // Prepare payload with all calculations
    const completePayload = preparePayloadWithCalculations(data);
    const companyId = parseInt(storedCompanyId);
    completePayload.companyId = companyId;

    const shouldUpdate = Boolean(editId);
    let costingNo = data.costingNo || savedCostingData?.costingNo || "";
    if (!shouldUpdate && !costingNo) {
      try {
        const docResponse = await documentNumberService.generateDocumentNumber({
          screenName: "Costing List",
        });
        costingNo = docResponse.documentNumber;
      } catch (error) {
        console.warn("Failed to generate document number:", error);
      }
    }
    isSavingRef.current = true;

    console.log("Complete Payload with Calculations:", completePayload);
// alert(JSON.stringify(completePayload, null, 2));
    let result;
    if (shouldUpdate && editId) {
      result = await dispatch(updateCosting({ id: parseInt(editId), data: completePayload, companyId }));
    } else {
      result = await dispatch(createCosting(completePayload));
      documentNumberService.clearMemoryCache("Costing List");
    }

    if ((shouldUpdate ? updateCosting.fulfilled.match(result) : createCosting.fulfilled.match(result))) {
      navigate('/transaction/costing-list');
    }
  };


const renderCustomerOptions = () => {
  return customers.map((item: any) => (
    <option key={item.id} value={item.customerName || item.name}>
      {item.customerName || item.name}
    </option>
  ));
};

const renderAgentOptions = () => {
  return agentMasters.map((item: any) => (
    <option key={item.id} value={item.id}>
      {item.agentName || item.name}
    </option>
  ));
};

const renderUOMOptions = () => {
  return uomList.map((item: any) => (
    <option key={item.id} value={item.id}>
      {item.uomName || item.name}
    </option>
  ));
};

  const renderFabricMasters = (masters: any[]) => {
    if (masters.length === 0) return <option value="">No Fabric Codes available</option>;
    return masters.map((fabric: any, index: number) => {
      const code = fabric.fabricCode ?? fabric.FabricCode ?? 'N/A';
      const value = `${code}`;
      return (
        <option key={fabric.id || index} value={value}>
          {code}
        </option>
      );
    });
  };

  if (isEditMode && costingLoading) {
    return (
      <div className="p-6 pt-16">
        <div className="text-center">Loading costing data...</div>
      </div>
    );
  }

  const handleBack = () => {
    navigate("/transaction/costing-list")
  }

  
  return (
    <div className="p-6 pt-16">
      <div className="flex justify-between border-b pb-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="mr-auto"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold mb-6 ">
            {isEditMode ? 'Edit Costing' : 'New Costing'}
          </h1>
        </div>
      </div>


      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Details Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Header Details</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register("date", { required: "Date is required" })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costing No {isEditMode && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                {...register("costingNo", { required: isEditMode ? "Costing No is required" : false })}
                placeholder="Auto-generating..."
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              {errors.costingNo && <p className="text-red-500 text-sm mt-1">{errors.costingNo.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <CommonSearchableSelect
                placeholder="Select Customer"
                value={watch("customerName") || ""}
                options={customers.map((item: any) => ({
                  value: item.customerName || item.name,
                  label: item.customerName || item.name,
                  activeFlag: item.activeFlag ?? true,
                }))}
                filterActive
                {...register("customerName", { required: "Customer Name is required" })}
                onValueChange={(value) => setValue("customerName", value, { shouldValidate: true })}
                error={errors.customerName?.message as string}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agent <span className="text-red-500">*</span>
              </label>
              <CommonSearchableSelect
                placeholder="Select Agent"
                value={watch("agentId") || ""}
                options={agentMasters.map((item: any) => ({
                  value: String(item.id),
                  label: item.agentName || item.name,
                  activeFlag: item.activeFlag ?? true,
                }))}
                filterActive
                {...register("agentId", { required: "Agent is required" })}
                onValueChange={(value) => setValue("agentId", value, { shouldValidate: true })}
                error={errors.agentId?.message as string}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort No - Construction <span className="text-red-500">*</span>
              </label>
              <CommonSearchableSelect
                placeholder="Select Sort No"
                value={watch("fabricCodeQuality") || ""}
                options={fabricMasters.map((fabric: any) => ({
                  value: String(fabric.fabricCode ?? fabric.FabricCode ?? "N/A"),
                  label: String(fabric.fabricCode ?? fabric.FabricCode ?? "N/A"),
                  activeFlag: fabric.activeFlag ?? true,
                }))}
                filterActive
                {...register("fabricCodeQuality", { required: "Sort No is required" })}
                onValueChange={(value) => setValue("fabricCodeQuality", value, { shouldValidate: true })}
                error={errors.fabricCodeQuality?.message as string}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UOM <span className="text-red-500">*</span>
              </label>
              <CommonSearchableSelect
                placeholder="Select UOM"
                value={watch("uom") || ""}
                options={uomList.map((item: any) => ({
                  value: String(item.id),
                  label: item.uomName || item.name,
                  activeFlag: item.activeFlag ?? true,
                }))}
                filterActive
                {...register("uom", { required: "UOM is required" })}
                onValueChange={(value) => setValue("uom", value, { shouldValidate: true })}
                error={errors.uom?.message as string}
              />
            </div>
          </div>
        </div>

        {/* Yarn Details Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Yarn Details</h2>
            <button
              type="button"
              onClick={handleAddYarn}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
            >
              Add Yarn
            </button>
          </div>

          {yarnDetails.length > 0 && (
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium">Warp/Weft</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium">Yarn Count</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium">Rate/Unit</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium">Processing Cost</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium">Content</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium">Yarn Type</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium">EPI</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-xs font-medium">PPI</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-xs font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {yarnDetails.map((yarn) => (
                    <tr key={yarn.id}>
                      <td className="border border-gray-300 px-3 py-2">{yarn.warpWeft}</td>
                      <td className="border border-gray-300 px-3 py-2">{yarn.yarnCount}</td>
                      <td className="border border-gray-300 px-3 py-2">{yarn.ratePerUnit}</td>
                      <td className="border border-gray-300 px-3 py-2">{yarn.yarnProcessingCost || 0}</td>
                      <td className="border border-gray-300 px-3 py-2">{yarn.content || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2">{yarn.yarnType || '-'}</td>
                      <td className="border border-gray-300 px-3 py-2">{yarn.epi}</td>
                      <td className="border border-gray-300 px-3 py-2">{yarn.ppi}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            type="button"
                            onClick={() => handleEditYarn(yarn)}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteYarn(yarn.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showYarnForm && (
            <div className="border border-gray-300 p-4 rounded mb-4 bg-gray-50">
              <h3 className="text-md font-semibold mb-3">{editingYarn ? 'Edit' : 'Add'} Yarn Detail</h3>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warp/Weft *</label>
                  <CommonSearchableSelect
                    placeholder="Select Warp/Weft"
                    value={yarnFormData.warpWeft || "Warp"}
                    options={[
                      { value: "Warp", label: "Warp" },
                      { value: "Weft", label: "Weft" },
                    ]}
                    onValueChange={(value) => setYarnFormData({ ...yarnFormData, warpWeft: value as "Warp" | "Weft" })}
                    className="w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yarn Count *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={yarnFormData.yarnCount || ""}
                    onChange={(e) => setYarnFormData({ ...yarnFormData, yarnCount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate/Unit *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={yarnFormData.ratePerUnit || ""}
                    onChange={(e) => setYarnFormData({ ...yarnFormData, ratePerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Processing Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={yarnFormData.yarnProcessingCost || ""}
                    onChange={(e) => setYarnFormData({ ...yarnFormData, yarnProcessingCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <input
                    type="text"
                    value={yarnFormData.content || ""}
                    onChange={(e) => setYarnFormData({ ...yarnFormData, content: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yarn Type</label>
                  <input
                    type="text"
                    value={yarnFormData.yarnType || ""}
                    onChange={(e) => setYarnFormData({ ...yarnFormData, yarnType: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    EPI {(yarnFormData.warpWeft || "Warp") === "Warp" && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={yarnFormData.epi || ""}
                    onChange={(e) => setYarnFormData({ ...yarnFormData, epi: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PPI {(yarnFormData.warpWeft || "Warp") === "Weft" && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={yarnFormData.ppi || ""}
                    onChange={(e) => setYarnFormData({ ...yarnFormData, ppi: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleSaveYarn}
                  className="bg-primary text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowYarnForm(false)}
                  className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Yarn Cost Details Section */}
        {yarnDetails.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Yarn Cost Details</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Material</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">Weight</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">Cost</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">Wastage (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {yarnCostDetails.yarnCalculations
                    .filter(y => y.warpWeft === "Warp")
                    .map((yarn, index) => (
                      <tr key={`warp-${yarn.id}`}>
                        <td className="border border-gray-300 px-3 py-2 text-sm font-medium bg-gray-50">Warp {index + 1}</td>
                        <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                          {yarn.calculatedWeight?.toFixed(2) || '0.00'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                          {yarn.calculatedCost?.toFixed(2) || '0.00'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={yarn.wastagePercent || 5}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  {yarnCostDetails.yarnCalculations
                    .filter(y => y.warpWeft === "Weft")
                    .map((yarn, index) => (
                      <tr key={`weft-${yarn.id}`}>
                        <td className="border border-gray-300 px-3 py-2 text-sm font-medium bg-gray-50">Weft {index + 1}</td>
                        <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                          {yarn.calculatedWeight?.toFixed(2) || '0.00'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                          {yarn.calculatedCost?.toFixed(2) || '0.00'}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={yarn.wastagePercent || 5}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="border border-gray-300 px-3 py-2 text-sm">GSM & Total Yarn Cost of Fabric</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                      {yarnCostDetails.totalYarnWeight.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                      {yarnCostDetails.totalYarnCost.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                      {yarnCostDetails.totalWastage.toFixed(2)}
                    </td>
                  </tr>
                  <tr className="bg-gray-100 font-semibold">
                    <td className="border border-gray-300 px-3 py-2 text-sm">GLM</td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-sm">
                      {yarnCostDetails.glm.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-sm"></td>
                    <td className="border border-gray-300 px-3 py-2 text-right text-sm"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fabric Details Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Fabric Details</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grey Width <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={fabricDetails.greyWidth}
                onChange={(e) => handleFabricChange('greyWidth', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                EPI Difference <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={fabricDetails.epiDifference}
                onChange={(e) => handleFabricChange('epiDifference', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                EPI on Table <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={fabricDetails.epiOnTable}
                onChange={(e) => handleFabricChange('epiOnTable', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reed Space <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={fabricDetails.reedSpace}
                onChange={(e) => handleFabricChange('reedSpace', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Ends <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={fabricDetails.totalEnds}
                onChange={(e) => handleFabricChange('totalEnds', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warp Crimp % <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={fabricDetails.warpCrimp}
                onChange={(e) => handleFabricChange('warpCrimp', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Fabric Cost Details Section */}
        {yarnDetails.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Fabric Cost Details</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold w-1/3">Cost Item</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Rate</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">
                      Rate/{selectedUOM}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium bg-gray-50">Sizing Cost per KG</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={fabricCostData.sizingCostPerKg}
                        onChange={(e) => handleFabricCostChange('sizingCostPerKg', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm bg-gray-50">
                      {(fabricCostData.sizingCostPerKg * (selectedUOM === "Meter" ? 1 : 1.0936)).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium bg-gray-50">Weaving Charges Per Pick</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={fabricCostData.weavingChargesPerPick}
                        onChange={(e) => handleFabricCostChange('weavingChargesPerPick', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm bg-gray-50">
                      {(fabricCostData.weavingChargesPerPick * (selectedUOM === "Meter" ? 1 : 1.0936)).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium bg-gray-50">Fabric Processing Cost Per KG</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={fabricCostData.fabricProcessingCostPerKg}
                        onChange={(e) => handleFabricCostChange('fabricProcessingCostPerKg', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm bg-gray-50">
                      {(fabricCostData.fabricProcessingCostPerKg * (selectedUOM === "Meter" ? 1 : 1.0936)).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="bg-yellow-50">
                    <td className="border border-gray-300 px-3 py-2 text-sm font-semibold bg-gray-50">Total Cost Without Overheads</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold bg-gray-100">
                      {fabricCostDetails.totalCostWithoutOverheads.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold bg-gray-100">
                      {(fabricCostDetails.totalCostWithoutOverheads * (selectedUOM === "Meter" ? 1 : 1.0936)).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium bg-gray-50">Freight Cost</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={fabricCostData.freightCost}
                        onChange={(e) => handleFabricCostChange('freightCost', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm bg-gray-50">
                      {(fabricCostData.freightCost * (selectedUOM === "Meter" ? 1 : 1.0936)).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium bg-gray-50">Value Loss / Interest (%)</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={fabricCostData.valueLossInterest}
                        onChange={(e) => handleFabricCostChange('valueLossInterest', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm bg-gray-50">
                      {(fabricCostDetails.totalCostWithoutOverheads * fabricCostData.valueLossInterest / 100).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium bg-gray-50">Wastage (%)</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={fabricCostData.wastage}
                        onChange={(e) => handleFabricCostChange('wastage', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm bg-gray-50">
                      {(fabricCostDetails.totalCostWithoutOverheads * fabricCostData.wastage / 100).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="bg-blue-50">
                    <td className="border border-gray-300 px-3 py-2 text-sm font-semibold bg-gray-50">Total</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold bg-gray-100">
                      {fabricCostDetails.subtotal.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold bg-gray-100">
                      {(fabricCostDetails.subtotal * (selectedUOM === "Meter" ? 1 : 1.0936)).toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium bg-gray-50">Commission & CD (%)</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={fabricCostData.commissionCD}
                        onChange={(e) => handleFabricCostChange('commissionCD', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm bg-gray-50">
                      {fabricCostDetails.commissionAmount.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium bg-gray-50">Others</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={fabricCostData.others}
                        onChange={(e) => handleFabricCostChange('others', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm bg-gray-50">
                      {(fabricCostData.others * (selectedUOM === "Meter" ? 1 : 1.0936)).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Final Costing Details Section */}
        {yarnDetails.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Final Costing Details</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold w-1/2">Details</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-green-50">
                    <td className="border border-gray-300 px-3 py-2 text-sm font-semibold bg-gray-50">Total Price</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold bg-gray-100">
                      {fabricCostDetails.total.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium bg-gray-50">Margin %</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={finalCostingData.marginPercent}
                        onChange={(e) => handleFinalCostingChange('marginPercent', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                    </td>
                  </tr>
                  <tr className="bg-blue-50">
                    <td className="border border-gray-300 px-3 py-2 text-sm font-semibold bg-gray-50">Target Price</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold bg-gray-100">
                      {finalCostingDetails.targetPrice.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium bg-gray-50">Weaving Charges as Per TP</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm bg-gray-50">
                      {finalCostingDetails.weavingChargesAsPerTP.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium bg-gray-50">Order Qty</td>
                    <td className="border border-gray-300 px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={finalCostingData.orderQty}
                        onChange={(e) => handleFinalCostingChange('orderQty', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm"
                      />
                    </td>
                  </tr>
                  {finalCostingDetails.warpRequirements.map((req, index) => (
                    <tr key={`warp-req-${index}`}>
                      <td className="border border-gray-300 px-3 py-2 text-sm font-medium bg-gray-50">
                        {req.name} Requirement (KGS)
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-sm bg-gray-50">
                        {req.requirement.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {finalCostingDetails.weftRequirements.map((req, index) => (
                    <tr key={`weft-req-${index}`}>
                      <td className="border border-gray-300 px-3 py-2 text-sm font-medium bg-gray-50">
                        {req.name} Requirement (KGS)
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-sm bg-gray-50">
                        {req.requirement.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-medium bg-gray-50">Cover Factor</td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm bg-gray-50">
                      {finalCostingDetails.coverFactor.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-2 justify-end pb-6">
          <button
            type="submit"
            className="bg-primary text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors font-medium"
          >
            {isEditMode ? 'Update' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/transaction/costing-list')}
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}