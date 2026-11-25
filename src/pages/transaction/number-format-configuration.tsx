import { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { AppDispatch, RootState } from "@/state/store";
import { getAllMenuMasters } from "@/state/menuMasterSlice";
import { getAllCompanies } from "@/state/company-master-slice";
import {
  createNumberFormatConfiguration,
  updateNumberFormatConfiguration,
  getNumberFormatConfigurationById,
  getAllNumberFormatConfigurations,
  NumberFormatConfiguration
} from "@/state/numberFormatConfigurationSlice";
import { toast } from "react-toastify";
import { X, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import CommonSearchableSelect from "@/components/ui/CommonSearchableSelect";

const resolveSelectedCompanyId = () => {
  if (typeof window === "undefined") return null;
  try {
    const direct = window.localStorage.getItem("selectedCompanyId");
    if (direct) {
      const numeric = Number(direct);
      if (!Number.isNaN(numeric)) return numeric;
      const parsed = JSON.parse(direct);
      const parsedId = Number(parsed?.id ?? parsed?.companyId);
      if (!Number.isNaN(parsedId)) return parsedId;
    }
    const fallback = window.localStorage.getItem("selectedCompany");
    if (fallback) {
      const numeric = Number(fallback);
      if (!Number.isNaN(numeric)) return numeric;
      const parsed = JSON.parse(fallback);
      const parsedId = Number(parsed?.id ?? parsed?.companyId);
      if (!Number.isNaN(parsedId)) return parsedId;
    }
  } catch {
    return null;
  }
  return null;
};

const getPrefixSuffix = (fullPrefix: string, companyCode: string) => {
  if (!fullPrefix) return "";
  let temp = fullPrefix;
  if (companyCode && temp.startsWith(`${companyCode}/`)) {
    temp = temp.slice(companyCode.length + 1);
  }
  const deptSuffixes = ["W/", "B/", "G/", "WEV/", "BRU/", "GAR/"];
  for (const s of deptSuffixes) {
    if (temp.startsWith(s)) {
      temp = temp.slice(s.length);
      break;
    }
  }
  return temp;
};

interface ExtendedNumberFormatConfiguration extends NumberFormatConfiguration {
  department?: string;
}

interface FormData {
  configurations: ExtendedNumberFormatConfiguration[];
}

interface TabNameSelectorProps {
  index: number;
  screenName?: string;
  watchedConfigurations?: ExtendedNumberFormatConfiguration[];
  register: any;
  setValue: any;
  getTabNameOptions: (screenName: string) => Promise<string[]>;
}

function TabNameSelector({ index, screenName, watchedConfigurations, register, setValue, getTabNameOptions }: TabNameSelectorProps) {
  const [tabOptions, setTabOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const currentTabName = watchedConfigurations?.[index]?.tabName || "";

  useEffect(() => {
    const loadTabOptions = async () => {
      console.log('🔄 TabNameSelector: loadTabOptions called');
      console.log('📱 Screen name:', screenName);
      console.log('📊 Current tab name:', currentTabName);

      if (!screenName) {
        console.log('❌ No screen name, clearing options');
        setTabOptions([]);
        return;
      }

      setLoading(true);
      console.log('⏳ Loading tab options...');

      try {
        const options = await getTabNameOptions(screenName);
        console.log('✅ Options received:', options);
        console.log('📈 Options count:', options.length);
        setTabOptions(options);
      } catch (error) {
        console.error('❌ Error loading tab options:', error);
        setTabOptions([]);
      } finally {
        setLoading(false);
        console.log('✅ Loading complete');
      }
    };

    loadTabOptions();
  }, [screenName, getTabNameOptions, currentTabName]);

  const configurationsForSameScreen = watchedConfigurations?.filter((config, configIndex) =>
    configIndex !== index && config.screenName === screenName
  ) || [];

  const usedTabsForScreen = configurationsForSameScreen
    .map(config => config.tabName)
    .filter(Boolean);

  const availableTabs = tabOptions.filter(tabName => {
    if (screenName === 'Sales Order Management') {
      const currentDept = (watchedConfigurations?.[index] as any)?.department || "";
      const isAlreadyUsed = configurationsForSameScreen.some(config => 
        config.tabName === tabName && 
        ((config as any).department || "") === currentDept
      );
      return !isAlreadyUsed;
    }
    return !usedTabsForScreen.includes(tabName) || tabName === currentTabName;
  });

  const allTabsUsed = tabOptions.length > 0 && availableTabs.length === 0 && !currentTabName;

  console.log('📊 TabNameSelector render state:');
  console.log('- tabOptions:', tabOptions);
  console.log('- loading:', loading);
  console.log('- configurationsForSameScreen:', configurationsForSameScreen.length);
  console.log('- usedTabsForScreen:', usedTabsForScreen);
  console.log('- availableTabs:', availableTabs);
  console.log('- allTabsUsed:', allTabsUsed);

  return (
    <div>
      <select
        {...register(`configurations.${index}.tabName`)}
        value={currentTabName}
        onChange={(e) => {
          console.log('🔄 Tab changed:', e.target.value);
          setValue(`configurations.${index}.tabName`, e.target.value);
        }}
        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
        disabled={loading || !screenName}
      >
        <option value="">
          {loading ? "Loading..." : !screenName ? "Select Screen First" : "Select Tab"}
        </option>
        {availableTabs.map((tabName) => (
          <option key={tabName} value={tabName}>
            {tabName || "(No Tab)"}
          </option>
        ))}
      </select>
      {allTabsUsed && (
        <p className="text-amber-600 text-xs mt-1">All tabs for this screen are in use</p>
      )}
    </div>
  );
}

export default function NumberFormatConfigurationForm() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { list: menuMasterList } = useSelector((state: RootState) => state.menuMaster);
  const { loading: saving, currentItem, list: existingList } = useSelector((state: RootState) => state.numberFormatConfiguration);
  const { companyMasterList } = useSelector((state: RootState) => state.companyMaster);

  const companyCode = useMemo(() => {
    const cid = resolveSelectedCompanyId();
    const list: any[] = Array.isArray(companyMasterList) ? companyMasterList : [];
    const found = list.find((c: any) => Number(c?.id) === cid);
    return String(found?.companyCode || localStorage.getItem("companyCode") || localStorage.getItem("selectedCompanyCode") || "");
  }, [companyMasterList]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [existingConfigurations, setExistingConfigurations] = useState<NumberFormatConfiguration[]>([]);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      configurations: [{
        screenName: "",
        tabName: "",
        prefix: "",
        financialYear: "",
        sequenceNumber: "",
        separator: "",
        formatPreview: ""
      }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "configurations"
  });

  const watchedConfigurations = watch("configurations");
  const [dynamicTabCache, setDynamicTabCache] = useState<Record<string, string[]>>({});

  useEffect(() => {
    dispatch(getAllMenuMasters());
    dispatch(getAllCompanies({ fetchAll: true }));
    const companyId = resolveSelectedCompanyId();
    dispatch(getAllNumberFormatConfigurations(companyId != null ? { companyId } : {}));
  }, [dispatch]);

  useEffect(() => {
    const configuration = location.state?.configuration;
    const mode = location.state?.mode;

    if (mode === 'edit' && configuration?.id) {
      setIsEditMode(true);
      const companyId = resolveSelectedCompanyId();
      const payload = companyId != null ? { id: configuration.id, companyId } : configuration.id;
      dispatch(getNumberFormatConfigurationById(payload));
    }
  }, [location.state, dispatch]);

  useEffect(() => {
    if (isEditMode && currentItem) {
      let resolvedTabName = currentItem.tabName || "";
      let resolvedDept = "";
      if (currentItem.screenName === "Sales Order Management" && resolvedTabName.includes("-")) {
        const parts = resolvedTabName.split("-");
        resolvedTabName = parts[0];
        const dept = parts[1]; // e.g. "weaving"
        resolvedDept = dept.charAt(0).toUpperCase() + dept.slice(1);
      }
      setValue("configurations", [{
        ...currentItem,
        tabName: resolvedTabName,
        department: resolvedDept
      }] as any);
    }
  }, [currentItem, isEditMode, setValue]);

  const computePreview = useCallback((config: any) => {
    return [config.prefix, config.sequenceNumber, config.financialYear]
      .filter(Boolean)
      .join(config.separator || "");
  }, []);

  const getAvailableScreenNames = useCallback((currentIndex: number): string[] => {
    const uniqueScreens = new Set(menuMasterList?.map(item => item.screenName) || []);
    const allScreens = Array.from(uniqueScreens).sort();

    return allScreens.filter(screenName => {
      if (screenName === "Sales Order Management") {
        return true;
      }
      const configurationsForScreen = watchedConfigurations?.filter((config, idx) =>
        idx !== currentIndex && config.screenName === screenName
      ) || [];

      if (configurationsForScreen.length === 0) {
        return true;
      }

      const tabsForScreen = dynamicTabCache[screenName] || [];

      if (tabsForScreen.length === 0) {
        return false;
      }

      const usedTabs = configurationsForScreen
        .map(config => config.tabName)
        .filter(Boolean);

      const remainingTabs = tabsForScreen.filter(tab => !usedTabs.includes(tab));
      return remainingTabs.length > 0;
    });
  }, [menuMasterList, watchedConfigurations, dynamicTabCache]);

  const screenNameOptions = useMemo(() => {
    return getAvailableScreenNames(0);
  }, [getAvailableScreenNames]);

  const extractTabsFromComponent = useCallback(async (screenName: string): Promise<string[]> => {
    try {
      const componentModules: Record<string, () => Promise<any>> = {
        "Sales Order Management": () => import('./sales-order-management'),
        "Sizing Plan": () => import('./sizing-plan-details'),
        "Sizing Yarn Issue": () => import('./sizing-yarn-issue-details'),
        "Beam Management": () => import('./beam-management'),
        "Fabric Inspection Management": () => import('./fabric-inspection-management'),
        "Processing Issue Management": () => import('./processing-issue-management'),
        "Packing List Management": () => import('./packing-list-management'),
        "Process Contract Management": () => import('./process-contact-management'),
        "Processing Receive Management": () => import('./process-receive-management'),
        "Generate Invoice": () => import('./invoice-management'),
        "Piece Split/Join": () => import('./piece-split-join'),
      };

      const importFn = componentModules[screenName];
      if (!importFn) {
        console.warn(`No import function for screen: ${screenName}`);
        return [];
      }

      console.log(`🔄 Importing module for: ${screenName}`);
      const componentModule = await importFn();
      console.log(`✅ Module imported successfully`);

      // Strategy 1: Check for TAB_NAMES named export (RECOMMENDED)
      if (componentModule.TAB_NAMES && Array.isArray(componentModule.TAB_NAMES)) {
        console.log(`✅ Found TAB_NAMES export:`, componentModule.TAB_NAMES);
        return componentModule.TAB_NAMES;
      }

      // Strategy 2: Check for tabs property on default export
      const Component = componentModule.default;
      if (Component?.tabs && Array.isArray(Component.tabs)) {
        console.log(`✅ Found tabs property on component:`, Component.tabs);
        return Component.tabs;
      }

      // Strategy 3: Check for tabs in module root
      if (componentModule.tabs && Array.isArray(componentModule.tabs)) {
        console.log(`✅ Found tabs in module:`, componentModule.tabs);
        return componentModule.tabs;
      }

      // Strategy 4: Try source parsing (works in dev, may fail in production)
      if (Component && typeof Component === 'function') {
        try {
          const componentSource = Component.toString();

          // Only try parsing if source looks unminified
          if (componentSource.length > 200 && componentSource.includes('activeTab')) {
            const tabPattern = /activeTab\s*===\s*["']([^"']+)["']/g;
            const tabNames: string[] = [];
            let match;

            while ((match = tabPattern.exec(componentSource)) !== null) {
              const tabName = match[1];
              if (tabName && !tabNames.includes(tabName)) {
                tabNames.push(tabName);
              }
            }

            if (tabNames.length > 0) {
              console.log(`✅ Extracted tabs from source:`, tabNames);
              return tabNames.sort();
            }
          }
        } catch (parseError) {
          console.warn(`Source parsing failed (expected in production):`, parseError);
        }
      }

      console.warn(`⚠️ No tabs found for "${screenName}". Please add: export const TAB_NAMES = [...] to the component file.`);
      return [];

    } catch (error) {
      console.error(`❌ Error extracting tabs for ${screenName}:`, error);
      return [];
    }
  }, []);

  const getTabNameOptions = useCallback(async (screenName: string): Promise<string[]> => {
    if (!screenName) return [];

    if (dynamicTabCache[screenName]) {
      return dynamicTabCache[screenName];
    }

    let tabs = await extractTabsFromComponent(screenName);
    if (screenName === "Sales Order Management") {
      tabs = tabs.filter(t => !t.includes("-"));
    }

    setDynamicTabCache(prev => ({
      ...prev,
      [screenName]: tabs
    }));

    return tabs;
  }, [dynamicTabCache, extractTabsFromComponent]);

  const addNewConfiguration = () => {
    append({
      screenName: "",
      tabName: "",
      prefix: "",
      financialYear: "",
      sequenceNumber: "",
      separator: "",
      formatPreview: ""
    });
  };

  const removeConfiguration = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      toast.error("At least one configuration is required");
    }
  };

  const validateUniqueTabNames = (configurations: NumberFormatConfiguration[]): { valid: boolean; message?: string } => {
    const tabNameMap = new Map<string, { indices: number[]; config: NumberFormatConfiguration }>();

    configurations.forEach((config, index) => {
      const key = `${config.screenName}-${config.tabName || '(no-tab)'}`;
      if (!tabNameMap.has(key)) {
        tabNameMap.set(key, { indices: [], config });
      }
      tabNameMap.get(key)!.indices.push(index);
    });

    const duplicates = Array.from(tabNameMap.entries()).find(([_, { indices }]) => indices.length > 1);

    if (duplicates) {
      const [key, { config }] = duplicates;
      const tabName = config.tabName || "(No Tab)";
      return {
        valid: false,
        message: `Tab name already exists: "${tabName}" for screen "${config.screenName}". Each screen-tab combination must be unique.`
      };
    }

    return { valid: true };
  };

  const onSubmit = async (data: FormData) => {
    const codePrefix = companyCode ? `${companyCode}/` : "";

    const mergedConfigurations = data.configurations.map(config => {
      let resolvedTabName = config.tabName || "";
      const dept = (config as any).department;
      if (config.screenName === "Sales Order Management" && dept) {
        resolvedTabName = `${resolvedTabName}-${dept.toLowerCase()}`;
      }
      return {
        ...config,
        tabName: resolvedTabName
      };
    });

    const hasEmptyRequiredFields = mergedConfigurations.some(config => {
      const selectedDept = (config as any).department || "";
      let deptSuffix = "";
      if (config.screenName === "Sales Order Management" && selectedDept) {
        if (selectedDept.toLowerCase() === "weaving") deptSuffix = "W/";
        else if (selectedDept.toLowerCase() === "brushing") deptSuffix = "B/";
        else if (selectedDept.toLowerCase() === "garments") deptSuffix = "G/";
      }
      const fullCodePrefix = companyCode ? `${companyCode}/${deptSuffix}` : (deptSuffix ? `${deptSuffix}` : "");

      const prefixSuffix = fullCodePrefix && config.prefix.startsWith(fullCodePrefix)
        ? config.prefix.slice(fullCodePrefix.length).trim()
        : config.prefix.trim();
      return !config.screenName || !prefixSuffix || !config.financialYear || !config.sequenceNumber || !config.separator;
    });

    if (hasEmptyRequiredFields) {
      toast.error("Please fill all required fields");
      return;
    }

    const validation = validateUniqueTabNames(mergedConfigurations);
    if (!validation.valid) {
      toast.error(validation.message || "Duplicate tab names are not allowed");
      return;
    }

    const storedCompanyId = resolveSelectedCompanyId();
    if (storedCompanyId == null) {
      toast.error("Please select a company before submitting");
      return;
    }

    for (const config of mergedConfigurations) {
      const preview = computePreview(config);

      const sameScreen = existingList.find(existing =>
        existing.screenName === config.screenName &&
        existing.tabName === config.tabName &&
        (isEditMode ? existing.id !== config.id : true)
      );
      if (sameScreen) {
        const deptPart = config.tabName && config.tabName.includes("-") ? ` (${config.tabName.split("-")[1]})` : "";
        toast.error(`"${config.screenName}"${deptPart} already added in number format configuration`);
        return;
      }

      const samePreview = existingList.find(existing =>
        existing.formatPreview === preview &&
        (isEditMode ? existing.id !== config.id : true)
      );
      if (samePreview) {
        toast.error(`This "${preview}" already exists`);
        return;
      }
    }

    try {
      for (const config of mergedConfigurations) {
        const configWithCompany = {
          ...config,
          formatPreview: computePreview(config),
          companyId: storedCompanyId
        };

        if (isEditMode && config.id) {
          await dispatch(updateNumberFormatConfiguration({
            id: config.id,
            data: configWithCompany,
            companyId: storedCompanyId
          })).unwrap();
        } else {
          await dispatch(createNumberFormatConfiguration(configWithCompany)).unwrap();
        }
      }

      toast.success("Configuration saved successfully");
      navigate("/settings/number-format-configuration-list");
    } catch (error: any) {
      console.error("Error saving configurations:", error);

      let errorMessage = "Failed to save configurations";

      if (error?.payload?.data) {
        if (typeof error.payload.data === 'string') {
          errorMessage = error.payload.data;
        } else if (error.payload.data.message) {
          errorMessage = error.payload.data.message;
        } else if (error.payload.data.error) {
          errorMessage = error.payload.data.error;
        }
      } else if (error?.payload) {
        if (typeof error.payload === 'string') {
          errorMessage = error.payload;
        } else if (error.payload.message) {
          errorMessage = error.payload.message;
        } else if (error.payload.error) {
          errorMessage = error.payload.error;
        }
      } else if (typeof error === 'string' && !error.includes("status code")) {
        errorMessage = error;
      } else if (error?.message && !error.message.includes("status code")) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data && typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      }

      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    navigate("/settings/number-format-configuration-list");
  };

  return (
    <div className="p-6 pt-16">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate("/settings/number-format-configuration-list")}
            className="mr-auto"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-semibold ">
            {isEditMode ? "Edit Number Format Configuration" : "Add Number Format Configuration"}
          </h1>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-20">
                    S.No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[200px]">
                    Screen Name <span className="text-red-600">*</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[150px]">
                    Tab Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[150px]">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[120px]">
                    Prefix <span className="text-red-600">*</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[100px]">
                    FY <span className="text-red-600">*</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[100px]">
                    Seq No <span className="text-red-600">*</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[100px]">
                    Separator <span className="text-red-600">*</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-[180px]">
                    Preview
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-24">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fields.map((field, index) => (
                  <tr key={field.id} className="hover:bg-gray-50">
                    {/* S.No */}
                    <td className="px-4 py-3 text-sm text-gray-900 text-center font-medium">
                      {index + 1}
                    </td>

                    {/* Screen Name */}
                    {/* <td className="px-4 py-3">
                      {(() => {
                        const availableScreens = getAvailableScreenNames(index);
                        const currentScreenName = watchedConfigurations?.[index]?.screenName || "";
                        const isCurrentSelected = availableScreens.includes(currentScreenName) || currentScreenName === "";

                        return (
                          <>
                            <select
                              {...register(`configurations.${index}.screenName`, { required: "Required" })}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            >
                              <option value="">Select Screen</option>
                              {availableScreens.map((screenName) => (
                                <option key={screenName} value={screenName}>
                                  {screenName}
                                </option>
                              ))}
                            </select>
                            {!isCurrentSelected && currentScreenName && (
                              <p className="text-amber-600 text-xs mt-1">All tabs for this screen are already used</p>
                            )}
                            {errors.configurations?.[index]?.screenName && (
                              <p className="text-red-500 text-xs mt-1">Required</p>
                            )}
                          </>
                        );
                      })()}
                    </td> */}
                    {/* Screen Name */}
                    <td className="px-4 py-3">
                      {(() => {
                        const availableScreens = getAvailableScreenNames(index);
                        const currentScreenName = watchedConfigurations?.[index]?.screenName || "";
                        const isCurrentSelected = availableScreens.includes(currentScreenName) || currentScreenName === "";

                        return (
                          <>
                            <CommonSearchableSelect
                              className="w-full"
                              placeholder="Select Screen"
                              options={availableScreens.map(screenName => ({
                                value: screenName,
                                label: screenName
                              }))}
                              value={currentScreenName}
                              {...register(`configurations.${index}.screenName`, { required: "Required" })}
                              onValueChange={(value) => {
                                setValue(`configurations.${index}.screenName`, value, { shouldValidate: true });
                                // Reset tab name when screen changes
                                setValue(`configurations.${index}.tabName`, "", { shouldValidate: true });
                              }}
                            />
                            {!isCurrentSelected && currentScreenName && (
                              <p className="text-amber-600 text-xs mt-1">All tabs for this screen are already used</p>
                            )}
                            {errors.configurations?.[index]?.screenName && (
                              <p className="text-red-500 text-xs mt-1">Required</p>
                            )}
                          </>
                        );
                      })()}
                    </td>

                    {/* Tab Name */}
                    <td className="px-4 py-3">
                      <TabNameSelector
                        index={index}
                        screenName={watchedConfigurations?.[index]?.screenName}
                        watchedConfigurations={watchedConfigurations}
                        register={register}
                        setValue={setValue}
                        getTabNameOptions={getTabNameOptions}
                      />
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3">
                      {watchedConfigurations?.[index]?.screenName === "Sales Order Management" ? (
                        <select
                          {...register(`configurations.${index}.department`)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                          onChange={(e) => {
                            const newDept = e.target.value;
                            setValue(`configurations.${index}.department`, newDept, { shouldValidate: true });
                            
                            // Re-calculate prefix with the new department suffix
                            const currentFullPrefix = watchedConfigurations?.[index]?.prefix || "";
                            const currentSuffix = getPrefixSuffix(currentFullPrefix, companyCode);
                            
                            let deptSuffix = "";
                            if (newDept) {
                              if (newDept.toLowerCase() === "weaving") deptSuffix = "W/";
                              else if (newDept.toLowerCase() === "brushing") deptSuffix = "B/";
                              else if (newDept.toLowerCase() === "garments") deptSuffix = "G/";
                            }
                            const codePrefix = companyCode ? `${companyCode}/${deptSuffix}` : (deptSuffix ? `${deptSuffix}` : "");
                            
                            setValue(
                              `configurations.${index}.prefix`,
                              `${codePrefix}${currentSuffix}`,
                              { shouldValidate: true }
                            );
                          }}
                        >
                          <option value="">Select Department</option>
                          <option value="Weaving">Weaving</option>
                          <option value="Brushing">Brushing</option>
                          <option value="Garments">Garments</option>
                        </select>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>

                    {/* Prefix */}
                    <td className="px-4 py-3">
                      {(() => {
                        const selectedDept = (watchedConfigurations?.[index] as any)?.department || "";
                        let deptSuffix = "";
                        if (watchedConfigurations?.[index]?.screenName === "Sales Order Management" && selectedDept) {
                          if (selectedDept.toLowerCase() === "weaving") deptSuffix = "W/";
                          else if (selectedDept.toLowerCase() === "brushing") deptSuffix = "B/";
                          else if (selectedDept.toLowerCase() === "garments") deptSuffix = "G/";
                        }
                        const fullPrefix = watchedConfigurations?.[index]?.prefix || "";
                        const codePrefix = companyCode ? `${companyCode}/${deptSuffix}` : (deptSuffix ? `${deptSuffix}` : "");
                        const suffix = getPrefixSuffix(fullPrefix, companyCode);
                        return (
                          <>
                            <div className="flex items-center border border-gray-300 rounded focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden">
                              {codePrefix && (
                                <span className="px-2 py-1.5 bg-gray-100 text-gray-500 text-sm border-r border-gray-300 whitespace-nowrap select-none">
                                  {codePrefix}
                                </span>
                              )}
                              <input
                                type="text"
                                value={suffix}
                                onChange={(e) => {
                                  const cleanInput = e.target.value;
                                  setValue(
                                    `configurations.${index}.prefix`,
                                    codePrefix ? `${codePrefix}${cleanInput}` : cleanInput,
                                    { shouldValidate: true }
                                  );
                                }}
                                className="flex-1 px-2 py-1.5 focus:outline-none text-sm bg-white"
                                placeholder="SO"
                              />
                            </div>
                            {errors.configurations?.[index]?.prefix && (
                              <p className="text-red-500 text-xs mt-1">Required</p>
                            )}
                          </>
                        );
                      })()}
                    </td>

                    {/* Financial Year */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        {...register(`configurations.${index}.financialYear`, { required: "Required" })}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        placeholder="FY24"
                      />
                      {errors.configurations?.[index]?.financialYear && (
                        <p className="text-red-500 text-xs mt-1">Required</p>
                      )}
                    </td>

                    {/* Sequence Number */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        {...register(`configurations.${index}.sequenceNumber`, { required: "Required" })}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        placeholder="001"
                      />
                      {errors.configurations?.[index]?.sequenceNumber && (
                        <p className="text-red-500 text-xs mt-1">Required</p>
                      )}
                    </td>

                    {/* Separator */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        {...register(`configurations.${index}.separator`, { required: "Required" })}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                        placeholder="-"
                      />
                      {errors.configurations?.[index]?.separator && (
                        <p className="text-red-500 text-xs mt-1">Required</p>
                      )}
                    </td>

                    {/* Format Preview */}
                    <td className="px-4 py-3">
                      <div className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm font-mono text-gray-700">
                        {computePreview(watchedConfigurations?.[index]) || "Preview"}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-center">
                      {fields.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeConfiguration(index)}
                          className="inline-flex items-center justify-center w-8 h-8 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Remove configuration"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={addNewConfiguration}
                          className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Add configuration"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add New Configuration Button */}
          {fields.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t">
              <button
                type="button"
                onClick={addNewConfiguration}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Configuration
              </button>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? "Saving..." : (isEditMode ? "Update Configuration" : "Save Configuration")}
          </button>
        </div>
      </div>
    </div>
  );
}