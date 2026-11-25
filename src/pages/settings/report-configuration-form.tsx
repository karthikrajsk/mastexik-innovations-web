import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { AppDispatch, RootState } from "@/state/store";
import {
  createReport,
  updateReport,
  getAllReports,
  ReportColumn,
  ReportTemplate,
  ReportConfig,
  ColumnFormData,
  saveTemplate,
  setCurrentTemplate,
  updateCurrentTemplate,
  clearCurrentTemplate
} from "@/state/reportConfigSlice";
import { addMenuMaster, getAllMenuMasters } from "@/state/menuMasterSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft, Copy, Eye, Edit, Database, CheckCircle, Play, Copy as CopyIcon, ArrowUp, ArrowDown } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import ReportConfigurationTable from "./report-configuration-table";
import { TransactionModuleService, TransactionModuleField } from "@/services/TransactionModuleService";
import { ReportTemplateService } from "@/services/ReportTemplateService";
import TemplateEditor from "@/components/report/TemplateEditor";
import apiService from "@/services/ApiService";
import { CommonSearchableSelect } from "@/components/ui/CommonSearchableSelect";
import { toReportSlug } from "@/lib/utils";

interface ScreenOption {
  value: string;
  label: string;
}

interface ScreenColor {
  bg: string;
  text: string;
  border: string;
  lightBg: string;
  darkBg: string;
}

interface DynamicConfig {
  SCREEN_OPTIONS: ScreenOption[];
  SECTION_OPTIONS: Record<string, string[]>;
  FIELD_OPTIONS: Record<string, Record<string, TransactionModuleField[]>>;
  SCREEN_COLORS: Record<string, ScreenColor>;
  FILTER_TYPE_OPTIONS: ScreenOption[];
  FORMULA_TYPE_OPTIONS: ScreenOption[];
}

const initialDynamicConfig: DynamicConfig = {
  SCREEN_OPTIONS: [],
  SECTION_OPTIONS: {},
  FIELD_OPTIONS: {},
  SCREEN_COLORS: {},
  FILTER_TYPE_OPTIONS: [
    { value: "From & To", label: "From & To" },
    { value: "Field Name", label: "Field Name" },
    { value: "Dropdown", label: "Dropdown" },
    { value: "Checkbox", label: "Checkbox" },
    { value: "Radio", label: "Radio" },
  ],
  FORMULA_TYPE_OPTIONS: [
    { value: "Simple", label: "Simple (e.g., A + B)" },
    { value: "Report columns", label: "Report Columns (Column Picker)" },
    { value: "Calculation", label: "Calculation" },
    { value: "Complex", label: "Complex (e.g., IF, SUM)" },
  ]
};

const COLOR_PALETTE: ScreenColor[] = [
  { bg: "bg-blue-500", text: "text-blue-800", border: "border-blue-300", lightBg: "bg-blue-50", darkBg: "bg-blue-100" },
  { bg: "bg-purple-500", text: "text-purple-800", border: "border-purple-300", lightBg: "bg-purple-50", darkBg: "bg-purple-100" },
  { bg: "bg-amber-500", text: "text-amber-800", border: "border-amber-300", lightBg: "bg-amber-50", darkBg: "bg-amber-100" },
  { bg: "bg-green-500", text: "text-green-800", border: "border-green-300", lightBg: "bg-green-50", darkBg: "bg-green-100" },
  { bg: "bg-orange-500", text: "text-orange-800", border: "border-orange-300", lightBg: "bg-orange-50", darkBg: "bg-orange-100" },
  { bg: "bg-indigo-500", text: "text-indigo-800", border: "border-indigo-300", lightBg: "bg-indigo-50", darkBg: "bg-indigo-100" },
  { bg: "bg-pink-500", text: "text-pink-800", border: "border-pink-300", lightBg: "bg-pink-50", darkBg: "bg-pink-100" },
  { bg: "bg-teal-500", text: "text-teal-800", border: "border-teal-300", lightBg: "bg-teal-50", darkBg: "bg-teal-100" },
];

const SAMPLE_REPORT: ReportConfig = {
  reportName: "Sales Order Status",
  columns: [
    {
      id: "col_1",
      columnName: "Order Date",
      screenName: "Sales Order - Domestic",
      sectionName: "orderDetails",
      fieldName: "orderDate",
      isFormulaApplied: false,
      formulaType: "",
      formulaBar: "",
      isFilterRequired: true,
      filterType: "From & To",
    },
    {
      id: "col_2",
      columnName: "Sort No",
      screenName: "Sales Order - Domestic",
      sectionName: "itemDetails",
      fieldName: "fabricCode",
      isFormulaApplied: false,
      formulaType: "",
      formulaBar: "",
      isFilterRequired: true,
      filterType: "Field Name",
    },
    {
      id: "col_3",
      columnName: "Order Qty",
      screenName: "Sales Order - Domestic",
      sectionName: "itemDetails",
      fieldName: "orderQty",
      isFormulaApplied: false,
      formulaType: "",
      formulaBar: "",
      isFilterRequired: false,
      filterType: "",
    },
    {
      id: "col_4",
      columnName: "Rate/Unit",
      screenName: "Sales Order - Domestic",
      sectionName: "itemDetails",
      fieldName: "pricePerUnit",
      isFormulaApplied: false,
      formulaType: "",
      formulaBar: "",
      isFilterRequired: false,
      filterType: "",
    },
    {
      id: "col_5",
      columnName: "Total Amount",
      screenName: "Sales Order - Domestic",
      sectionName: "itemDetails",
      fieldName: "",
      isFormulaApplied: true,
      formulaType: "Report columns",
      formulaBar: "[Order Qty] * [Rate/Unit]",
      isFilterRequired: false,
      filterType: "",
    },
  ],
};

export function ReportConfigurationForm() {
  console.log("🎯 ReportConfigurationForm component mounted");

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentTemplate, templateLoading } = useSelector((state: RootState) => state.reportConfig);
  const { list: menuList } = useSelector((state: RootState) => state.menuMaster);

  const [columns, setColumns] = useState<ColumnFormData[]>([]);
  const [reportName, setReportName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingReportId, setEditingReportId] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [tableView, setTableView] = useState(true);
  const [selectedScreen, setSelectedScreen] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [dynamicConfig, setDynamicConfig] = useState<DynamicConfig>(initialDynamicConfig);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [reportSaved, setReportSaved] = useState(false);
  const [queryResultRows, setQueryResultRows] = useState<any[]>([]);
  const [queryResultColumns, setQueryResultColumns] = useState<string[]>([]);
  const [queryExecutionData, setQueryExecutionData] = useState<any>(null);
  const [llmResultId, setLlmResultId] = useState<number | null>(null);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const sqlRef = useRef<HTMLTextAreaElement | null>(null);

  // Edit mode: 'form' or 'query'
  const [editMode, setEditMode] = useState<'form' | 'query'>('form');
  // Local SQL buffer (prefill from LLM or template)
  const [querySql, setQuerySql] = useState<string>("");

  const getTemplateNameFallback = () => {
    const state = location.state as any;
    if (currentTemplate?.reportName && currentTemplate.reportName.trim()) {
      return currentTemplate.reportName.trim();
    }
    if (reportName && reportName.trim()) {
      return reportName.trim();
    }
    if (typeof state?.report?.reportName === 'string' && state.report.reportName.trim()) {
      return state.report.reportName.trim();
    }
    return 'LLM Result';
  };

  const persistQueryState = (sql: string, queryData?: any) => {
    const nameFallback = getTemplateNameFallback();
    if (!currentTemplate) {
      dispatch(
        setCurrentTemplate({
          reportName: nameFallback,
          templateFields: [],
          queryContent: sql,
          queryData: queryData ?? null,
        })
      );
    } else {
      dispatch(
        updateCurrentTemplate({
          ...currentTemplate,
          reportName: nameFallback,
          queryContent: sql,
          queryData: queryData ?? currentTemplate.queryData,
        })
      );
    }
  };

  // Initialize SQL from navigation state, existing report, or current template
  useEffect(() => {
    const s = location.state as any;
    if (typeof s?.queryText === 'string' && s.queryText.trim()) {
      setQuerySql(s.queryText);
      setEditMode('query');
    } else if (s?.report?.queryContent && typeof s.report.queryContent === 'string') {
      setQuerySql(s.report.queryContent);
      setEditMode('query');
    } else if (currentTemplate?.queryContent) {
      setQuerySql(currentTemplate.queryContent);
    }
  }, [location.state, currentTemplate]);

  // Save SQL back to template store
  const saveQueryIntoTemplate = () => {
    persistQueryState(querySql, queryExecutionData ?? currentTemplate?.queryData ?? null);
    toast.success('Query saved to template');
  };

  const extractSelectColumns = (sql: string): string[] => {
    try {
      const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM/is);
      if (!selectMatch) return [];

      const selectClause = selectMatch[1];
      const columns: string[] = [];

      const aliasPattern = /AS\s+(?:"([^"]+)"|'([^']+)'|(\w+))/gi;
      let match;
      while ((match = aliasPattern.exec(selectClause)) !== null) {
        const alias = match[1] || match[2] || match[3];
        if (alias) columns.push(alias);
      }

      return columns;
    } catch {
      return [];
    }
  };

  const orderColumnsFromSQL = (rows: any[], sql: string): string[] => {
    if (!Array.isArray(rows) || rows.length === 0) return [];

    const sqlColumns = extractSelectColumns(sql);
    const responseKeys = Object.keys(rows[0]);

    if (sqlColumns.length === 0) return responseKeys;

    return sqlColumns.filter(col => responseKeys.includes(col));
  };

  // Hook up your backend here to execute SQL and preview
  const runQuery = async () => {
    const liveSql = sqlRef?.current?.value ?? currentTemplate?.queryContent ?? '';
    if (!liveSql.trim()) {
      toast.error('No SQL to execute');
      return;
    }
    try {
      const payload = { id: llmResultId || null, sql: liveSql };
      const res = await apiService.post('/llm/execute-query', payload);
      const returnedId = res?.id ?? res?.data?.id ?? null;
      if (typeof returnedId === 'number') setLlmResultId(returnedId);
      const rows = res?.rows || res?.data?.rows || res?.data || [];
      const cols = orderColumnsFromSQL(rows, liveSql);
      setQuerySql(liveSql);
      setQueryResultRows(rows);
      setQueryResultColumns(cols);
      setQueryExecutionData(res ?? null);
      persistQueryState(liveSql, res ?? null);
      toast.success('Query executed');
    } catch (e: any) {
      console.error('Execute query failed', e);
      toast.error(e?.message || 'Failed to execute query');
    }
  };

  // Track if we have auto-seeded a template from LLM flow to avoid overwriting with empty template
  const seededFromLLMRef = useRef<boolean>(false);

  const [fieldMetadataCache, setFieldMetadataCache] = useState<Record<string, TransactionModuleField>>({});

  const loadTransactionModules = async (): Promise<DynamicConfig> => {
    try {
      const config = { ...initialDynamicConfig };

      console.log("🔄 Starting module load...");
      const modules = await TransactionModuleService.loadModules();
      console.log("✅ Modules loaded:", modules.length);

      if (!modules || modules.length === 0) {
        console.error("❌ No modules returned from API");
        toast.error("No transaction modules found. Check backend API.");
        return initialDynamicConfig;
      }

      config.SCREEN_OPTIONS = modules.map(module => ({
        value: module.name,
        label: module.displayName
      }));

      console.log("📋 Screen options:", config.SCREEN_OPTIONS);

      config.SECTION_OPTIONS = {};
      config.FIELD_OPTIONS = {};
      const newFieldMetadataCache: Record<string, TransactionModuleField> = {};

      modules.forEach((module, index) => {
        console.log(`📦 Processing module: ${module.name} with ${module.sections?.length || 0} sections`);

        if (module.sections && module.sections.length > 0) {
          config.SECTION_OPTIONS[module.name] = module.sections.map(s => s.name);
          config.FIELD_OPTIONS[module.name] = {};

          module.sections.forEach((section) => {
            config.FIELD_OPTIONS[module.name][section.name] = section.fields || [];

            section.fields?.forEach(field => {
              const cacheKey = `${module.name}::${section.name}::${field.name}`;
              newFieldMetadataCache[cacheKey] = field;
            });
          });
        } else {
          config.SECTION_OPTIONS[module.name] = [];
          config.FIELD_OPTIONS[module.name] = {};
        }

        config.SCREEN_COLORS[module.name] = COLOR_PALETTE[index % COLOR_PALETTE.length];
      });

      setFieldMetadataCache(newFieldMetadataCache);
      console.log("✅ Configuration loaded:", {
        screens: config.SCREEN_OPTIONS.length,
        sections: Object.keys(config.SECTION_OPTIONS).length
      });

      return config;
    } catch (error) {
      console.error("❌ Failed to load transaction modules:", error);
      toast.error("Failed to load transaction modules from server");
      return initialDynamicConfig;
    }
  };

  useEffect(() => {
    const initializeConfig = async () => {
      setIsLoading(true);
      dispatch(getAllMenuMasters());
      const config = await loadTransactionModules();
      setDynamicConfig(config);
      setIsLoading(false);
    };

    initializeConfig();
  }, [dispatch]);

  useEffect(() => {
    const state = location.state as { report?: ReportConfig; openTemplate?: boolean; clone?: boolean } | null;
    if (state?.report) {
      const isClone = !!state.clone;
      setIsEditing(!isClone);
      setEditingReportId(isClone ? null : (state.report.id || null));
      setReportName(isClone ? `${state.report.reportName} - Copy` : state.report.reportName);

      const mappedCols = (state.report.columns || []).map((col, idx) => ({
        ...col,
        id: isClone ? `col_${Date.now()}_${idx}` : (col.id || `col_${Date.now()}_${idx}`)
      }));
      setColumns(mappedCols as any);

      if (state.report.columns && state.report.columns.length > 0) {
        const screenCounts: Record<string, number> = {};
        state.report.columns.forEach(col => {
          screenCounts[col.screenName] = (screenCounts[col.screenName] || 0) + 1;
        });
        const dominantScreen = Object.keys(screenCounts).reduce((a, b) =>
          screenCounts[a] > screenCounts[b] ? a : b
        );
        setSelectedScreen(dominantScreen);
      }

      if (state.openTemplate && !isClone) {
        if (!currentTemplate) {
          const hasColumns = Array.isArray(state.report?.columns) && state.report.columns.length > 0;
          if (hasColumns) {
            generateTemplate();
          } else {
            setShowTemplateEditor(true);
          }
        } else {
          setShowTemplateEditor(true);
        }
      }
    }
  }, [location.state]);

  // Seed SQL editor and preview from LLM result when navigated from Report Approval
  useEffect(() => {
    const s = location.state as any;
    if (s?.queryText || s?.responseJson) {
      // Prefill SQL editor content
      const sql = typeof s?.queryText === 'string' ? s.queryText : '';
      let seededPreviewData: any = null;
      // Parse response rows for preview
      try {
        if (typeof s?.responseJson === 'string') {
          const rows = JSON.parse(s.responseJson);
          const cols = orderColumnsFromSQL(rows, sql);
          seededPreviewData = Array.isArray(rows)
            ? { data: { rows }, message: 'Seeded preview data', status: 'success' }
            : null;
          setQueryResultRows(Array.isArray(rows) ? rows : []);
          setQueryResultColumns(cols);
          if (seededPreviewData) {
            setQueryExecutionData(seededPreviewData);
          }

          // Seed form columns from response headers if form is empty
          if (Array.isArray(rows) && rows.length > 0 && Array.isArray(cols) && cols.length > 0 && columns.length === 0) {
            const headerToFieldMap: Record<string, { section: string; field: string }> = {
              'PO NO': { section: 'main', field: 'buyer_po_no' },
              'Shipment Name': { section: 'relationships', field: 'shipment_terms_id' },
              'Exchange Rate': { section: 'quantities', field: 'exchange_rate' },
              'Order Date': { section: 'dates', field: 'order_date' },
            };
            const salesOrderScreen = dynamicConfig.SCREEN_OPTIONS.find(opt => /sales order/i.test(opt.value) || /sales order/i.test(opt.label))?.value || '';
            const newCols: ColumnFormData[] = cols.map((k, idx) => {
              const m = headerToFieldMap[k as keyof typeof headerToFieldMap];
              return {
                id: `col_${Date.now()}_${idx}`,
                columnName: k,
                screenName: m ? salesOrderScreen : '',
                sectionName: m?.section || '',
                fieldName: m?.field || '',
                isFormulaApplied: false,
                formulaType: '',
                formulaBar: '',
                isFilterRequired: false,
                filterType: '',
              } as ColumnFormData;
            });
            if (newCols.length) {
              setColumns(newCols);
              if (salesOrderScreen && !selectedScreen) setSelectedScreen(salesOrderScreen);

              // Auto-generate a template from seeded columns if no template fields exist yet
              if (!seededFromLLMRef.current && (!currentTemplate || (currentTemplate.templateFields?.length ?? 0) === 0)) {
                (async () => {
                  try {
                    const safeReportName = (reportName && reportName.trim())
                      || ((location.state as any)?.report?.reportName)
                      || (currentTemplate?.reportName && currentTemplate.reportName.trim())
                      || 'LLM Result';

                    const reportData: ReportConfig = {
                      reportName: safeReportName,
                      columns: newCols.map(({ id, ...col }) => col),
                    };
                    const template = await ReportTemplateService.generateTemplate(reportData);
                    const sliceTemplate: ReportTemplate = {
                      reportConfigId: editingReportId || undefined,
                      reportName: template.reportName,
                      templateFields: template.templateFields,
                      data: template.data,
                      templateContent: '',
                      queryContent: sql,
                      queryData: seededPreviewData,
                    };
                    dispatch(setCurrentTemplate(sliceTemplate));
                    seededFromLLMRef.current = true;
                  } catch (genErr) {
                    console.error('Failed to auto-generate template from LLM columns', genErr);
                  }
                })();
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to parse responseJson from navigation state', e);
      }
      // Persist llmResultId for subsequent executions
      if (typeof s?.llmResultId === 'number') {
        setLlmResultId(s.llmResultId);
      }
      // Ensure a template exists so Template Editor + SQL panel can render
      const name = s?.report?.reportName || reportName || 'LLM Result';
      if (!currentTemplate) {
        dispatch(setCurrentTemplate({
          reportName: name || 'LLM Result',
          templateFields: [],
          queryContent: sql,
          queryData: seededPreviewData,
        }));
      } else {
        dispatch(updateCurrentTemplate({
          ...currentTemplate,
          reportName: (currentTemplate.reportName && currentTemplate.reportName.trim()) || name || 'LLM Result',
          queryContent: sql || currentTemplate.queryContent,
          queryData: seededPreviewData ?? currentTemplate.queryData,
        }));
      }
      setShowTemplateEditor(true);
    }
  }, [location.state]);

  const getScreenColor = (screenName: string): ScreenColor => {
    return dynamicConfig.SCREEN_COLORS[screenName] || {
      bg: "bg-gray-500",
      text: "text-gray-800",
      border: "border-gray-300",
      lightBg: "bg-gray-50",
      darkBg: "bg-gray-100"
    };
  };

  const addColumn = (position: 'top' | 'bottom' | number = 'top') => {
    const newColumn: ColumnFormData = {
      id: `col_${Date.now()}`,
      columnName: "",
      screenName: "",
      sectionName: "",
      fieldName: "",
      isFormulaApplied: false,
      formulaType: "",
      formulaBar: "",
      isFilterRequired: false,
      filterType: "",
    };
    
    let nextCols: ColumnFormData[];
    if (position === 'top') {
      nextCols = [newColumn, ...columns];
    } else if (position === 'bottom') {
      nextCols = [...columns, newColumn];
    } else {
      nextCols = [...columns];
      nextCols.splice(position, 0, newColumn);
    }
    
    setColumns(nextCols);
    // Update SQL if we're in query mode
    setQuerySql(prev => syncSqlSelectWithColumns(nextCols, prev));
  };

  const moveColumnUp = (index: number) => {
    if (index === 0) return;
    const nextCols = [...columns];
    const temp = nextCols[index];
    nextCols[index] = nextCols[index - 1];
    nextCols[index - 1] = temp;
    setColumns(nextCols);
    setQuerySql(prev => syncSqlSelectWithColumns(nextCols, prev));
  };

  const moveColumnDown = (index: number) => {
    if (index === columns.length - 1) return;
    const nextCols = [...columns];
    const temp = nextCols[index];
    nextCols[index] = nextCols[index + 1];
    nextCols[index + 1] = temp;
    setColumns(nextCols);
    setQuerySql(prev => syncSqlSelectWithColumns(nextCols, prev));
  };

  // Extract SELECT items and their aliases from current SQL
  const extractSelectList = (sql: string): string[] => {
    if (!sql) return [];
    const match = sql.match(/select\s+([\s\S]*?)\s+from\s/i);
    if (!match) return [];
    // naive split by commas; adequate for simple SELECTs
    return match[1]
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  };

  const getAliasLabel = (item: string): string => {
    const m = item.match(/\bas\s+"([^"]+)"/i);
    if (m) return m[1].trim();
    // fallback: try alias without quotes
    const m2 = item.match(/\bas\s+([a-zA-Z0-9_]+)/i);
    if (m2) return m2[1].trim();
    return item; // fallback to full item string
  };

  // Replace only the SELECT list, keep rest intact
  const replaceSelectList = (sql: string, newItems: string[]): string => {
    if (!sql) return '';
    const regex = /(select\s*)([\s\S]*?)(\s+from\s)/i;
    if (!regex.test(sql)) return sql; // no change if structure isn't present
    return sql.replace(regex, (_m, p1, _p2, p3) => `${p1}${newItems.join(',\n    ')}${p3}`);
  };

  // Build a SELECT item for a column
  const toSelectItem = (col: ColumnFormData): string => {
    const label = col.columnName?.trim() || col.fieldName || 'column';
    // Prefer resolved DB column if present, else fallback to fieldName
    const source = col.databaseColumnName?.trim() || col.fieldName?.trim() || label;
    return `${source} AS "${label}"`;
  };

  // Sync SQL SELECT list with current columns while preserving untouched items
  const syncSqlSelectWithColumns = (cols: ColumnFormData[], prevSql: string): string => {
    const baseSql = prevSql?.trim() || '';
    const hasFrom = /\sfrom\s/i.test(baseSql);
    const newLabels = cols.map(c => (c.columnName?.trim() || c.fieldName || 'column'));

    if (!hasFrom) {
      const items = cols.map(toSelectItem);
      return `SELECT\n    ${items.join(',\n    ')}\nFROM ...`;
    }

    const existingItems = extractSelectList(baseSql);
    // Preserve existing items whose alias label is still present
    const retained: string[] = [];
    const existingLabels = new Set<string>();
    existingItems.forEach(it => {
      const label = getAliasLabel(it);
      existingLabels.add(label);
      if (newLabels.includes(label)) {
        retained.push(it); // keep as-is
      }
    });

    // Add new items for columns not present before
    const additions = cols
      .filter(c => !existingLabels.has(c.columnName?.trim() || c.fieldName || 'column'))
      .map(toSelectItem);

    const finalItems = [...retained, ...additions];
    return replaceSelectList(baseSql, finalItems);
  };

  const removeColumn = (id: string | undefined) => {
    if (!id) return;
    const nextCols = columns.filter((col) => col.id !== id);
    setColumns(nextCols);
    // Update SQL if we're in query mode
    setQuerySql(prev => syncSqlSelectWithColumns(nextCols, prev));
  };

  const updateColumn = (id: string | undefined, field: keyof ColumnFormData, value: any) => {
    if (!id) return;
    const nextCols = columns.map((col) =>
      col.id === id ? { ...col, [field]: value } : col
    );
    setColumns(nextCols);

    // If label or mapping changed, reflect in SELECT item
    if (field === 'columnName' || field === 'fieldName' || field === 'databaseColumnName') {
      setQuerySql(prev => syncSqlSelectWithColumns(nextCols, prev));
    }
  };

  const handleScreenChange = (id: string | undefined, screenName: string) => {
    if (!id) return;

    const updatedColumns = columns.map((col) => {
      if (col.id === id) {
        return {
          ...col,
          screenName: screenName,
          sectionName: "",
          fieldName: "",
          // Clear database metadata when screen changes
          tableName: undefined,
          databaseColumnName: undefined,
          dataType: undefined,
        };
      }
      return col;
    });

    setColumns(updatedColumns);

    if (screenName && !selectedScreen) {
      setSelectedScreen(screenName);
    }
  };

  const handleSectionChange = (id: string | undefined, sectionName: string) => {
    if (!id) return;

    const updatedColumns = columns.map((col) => {
      if (col.id === id) {
        return {
          ...col,
          sectionName: sectionName,
          fieldName: "",
          // Clear database metadata when section changes
          tableName: undefined,
          databaseColumnName: undefined,
          dataType: undefined,
        };
      }
      return col;
    });

    setColumns(updatedColumns);
    setQuerySql(prev => syncSqlSelectWithColumns(updatedColumns, prev));
  };

  // Updated field change handler with metadata extraction
  const handleFieldChange = async (id: string | undefined, fieldName: string) => {
    if (!id) return;

    const updatedColumns = await Promise.all(columns.map(async (col) => {
      if (col.id === id && col.screenName && col.sectionName) {
        // Get field metadata from cache
        const cacheKey = `${col.screenName}::${col.sectionName}::${fieldName}`;
        let fieldMetadata = fieldMetadataCache[cacheKey];

        if (!fieldMetadata) {
          // Fallback: try to get field mapping from service
          try {
            // Check if getFieldMapping method exists
            if (typeof (TransactionModuleService as any).getFieldMapping === 'function') {
              fieldMetadata = await (TransactionModuleService as any).getFieldMapping(
                col.screenName,
                col.sectionName,
                fieldName
              );
            }
          } catch (error) {
            console.error("Error fetching field mapping:", error);
          }
        }

        // If we have metadata, use it; otherwise use basic field info
        if (fieldMetadata) {
          return {
            ...col,
            fieldName: fieldName,
            // Add database metadata
            tableName: fieldMetadata.tableName,
            databaseColumnName: fieldMetadata.databaseColumnName,
            dataType: fieldMetadata.dataType,
          };
        } else {
          // Fallback: create basic metadata
          return {
            ...col,
            fieldName: fieldName,
            tableName: `unknown_${col.screenName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            databaseColumnName: fieldName,
            dataType: 'varchar',
          };
        }
      }
      return col;
    }));

    setColumns(updatedColumns);
    setQuerySql(prev => syncSqlSelectWithColumns(updatedColumns, prev));
  };

  // Add this to your ReportConfigurationForm component
  const DataDebugInfo = () => {
    const [rawData, setRawData] = useState<any>(null);

    const fetchRawData = async () => {
      try {
        console.log("🔍 Fetching raw structure data...");
        const response = await apiService.get('/module-field-mappings/structure');
        console.log("📦 RAW API RESPONSE:", response);
        setRawData(response);

        // Also log the dynamic config
        const config = await loadTransactionModules();
        console.log("🎯 DYNAMIC CONFIG:", config);
      } catch (error) {
        console.error("❌ Error fetching raw data:", error);
      }
    };

    return (
      <Card className="mb-4 bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">Data Structure Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchRawData} className="mb-4">
            Fetch Raw Data
          </Button>
          {rawData && (
            <div className="text-xs max-h-64 overflow-auto">
              <pre>{JSON.stringify(rawData, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!reportName.trim()) {
      newErrors.reportName = "Report Name is required";
    }

    if (columns.length === 0) {
      newErrors.columns = "At least one column is required";
    }

    columns.forEach((col, idx) => {
      if (!col.columnName.trim()) {
        newErrors[`columns.${idx}.columnName`] = "Column Name is required";
      }
      if (!col.screenName) {
        newErrors[`columns.${idx}.screenName`] = "Screen Name is required";
      }
      if (!col.sectionName) {
        newErrors[`columns.${idx}.sectionName`] = "Section Name is required";
      }
      if (!col.fieldName && !col.isFormulaApplied) {
        newErrors[`columns.${idx}.fieldName`] = "Field Name is required when formula is not applied";
      }
      if (col.isFormulaApplied && !col.formulaBar?.trim()) {
        newErrors[`columns.${idx}.formulaBar`] = "Formula is required when formula is applied";
      }
      if (col.isFilterRequired && !col.filterType) {
        newErrors[`columns.${idx}.filterType`] = "Filter Type is required when filter is enabled";
      }
    });

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateTemplate = async () => {
    try {
      const safeReportName = (reportName && reportName.trim())
        || ((location.state as any)?.report?.reportName)
        || (currentTemplate?.reportName && currentTemplate.reportName.trim())
        || 'LLM Result';

      const reportData: ReportConfig = {
        reportName: safeReportName,
        columns: columns.map(({ id, ...col }) => col),
      };

      const template = await ReportTemplateService.generateTemplate(reportData);
      const existingQuery = (currentTemplate?.queryContent && currentTemplate.queryContent.trim())
        || (querySql && querySql.trim())
        || '';
      const existingQueryData = currentTemplate?.queryData ?? queryExecutionData ?? null;

      const sliceTemplate: ReportTemplate = {
        reportConfigId: editingReportId || undefined,
        reportName: template.reportName,
        templateFields: template.templateFields,
        data: template.data,
        templateContent: '',
        queryContent: undefined,
        queryData: existingQueryData,
      };

      const payload = {
        reportName: reportData.reportName,
        columns: reportData.columns.map((c) => ({
          columnName: c.columnName,
          screenName: c.screenName,
          sectionName: c.sectionName,
          fieldName: c.fieldName,
          isFormulaApplied: c.isFormulaApplied,
          formulaType: c.formulaType || "",
          formulaBar: c.formulaBar || "",
          isFilterRequired: c.isFilterRequired,
          filterType: c.filterType || "",
          tableName: c.tableName,
          databaseColumnName: c.databaseColumnName,
          dataType: c.dataType,
        })),
      };

      let generatedQuery: string | null = null;
      try {
        const res = await apiService.post('/llm/generate-query', payload);
        generatedQuery = res?.data?.generatedQuery ?? res?.generatedQuery ?? null;
      } catch (e) {
        console.error('Failed to generate SQL query', e);
      }

      if (generatedQuery && generatedQuery.trim()) {
        sliceTemplate.queryContent = generatedQuery;
        setQuerySql(generatedQuery);
      } else if (existingQuery) {
        const syncedQuery = syncSqlSelectWithColumns(columns, existingQuery);
        sliceTemplate.queryContent = syncedQuery;
        setQuerySql(syncedQuery);
        if (existingQueryData) {
          setQueryExecutionData(existingQueryData);
        }
      }

      dispatch(setCurrentTemplate(sliceTemplate));
      setShowTemplateEditor(true);
      toast.success("Template generated successfully!");
    } catch (error) {
      console.error("Error generating template:", error);
      toast.error("Failed to generate template");
    }
  };

  const handleTemplateUpdate = (updatedTemplate: ReportTemplate) => {
    dispatch(updateCurrentTemplate(updatedTemplate));
  };

  const saveTemplateHandler = async () => {
    if (!currentTemplate) return;

    // Apply safe fallback for report name BEFORE validation
    const normalizedQueryData = currentTemplate.queryData ?? queryExecutionData ?? (queryResultRows.length ? { data: { rows: queryResultRows } } : null);

    const templateWithReportName: ReportTemplate = {
      ...currentTemplate,
      reportName: getTemplateNameFallback(),
      reportConfigId: editingReportId || undefined,
      queryContent: currentTemplate.queryContent ?? querySql,
      queryData: normalizedQueryData,
    };

    const validation = ReportTemplateService.validateTemplate(templateWithReportName);
    if (!validation.isValid) {
      toast.error("Template validation failed: " + validation.errors[0]);
      return;
    }

    await dispatch(saveTemplate(templateWithReportName));
    
    // Add to Menu Master automatically if not already exists
    const reportIdForMenu = templateWithReportName.reportConfigId;
    if (reportIdForMenu) {
      const slug = toReportSlug(templateWithReportName.reportName, reportIdForMenu);
      const menuUrl = `/reports/${slug}`;
      
      const existingMenu = menuList?.find(m => m.menuUrl === menuUrl);
      
      if (!existingMenu) {
        const menuPayload = {
          screenName: templateWithReportName.reportName,
          menuUrl: menuUrl
        };
        dispatch(addMenuMaster(menuPayload));
      }
    }

    // toast.success("Template saved successfully!");
    setShowTemplateEditor(false);
    dispatch(clearCurrentTemplate());
    await dispatch(getAllReports({}));
    navigate("/settings/report-configuration-list");
  };

  const cancelTemplate = () => {
    setShowTemplateEditor(false);
    dispatch(clearCurrentTemplate());
  };

  const onSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    const reportData: ReportConfig = {
      reportName,
      columns: columns.map(({ id, ...col }) => col),
    };

    setIsGeneratingTemplate(true);
    try {
      let reportId: number | undefined;
      if (isEditing && editingReportId) {
        reportData.id = editingReportId;
        await dispatch(updateReport(reportData));
        reportId = editingReportId;
      } else {
        const result = await dispatch(createReport(reportData));
        if (result.payload?.data?.id) {
          reportId = result.payload.data.id;
          setEditingReportId(reportId as number);
        }
      }

      setReportSaved(true);
      // toast.success("Report saved! You can now generate a template.");
      await generateTemplate();
    } catch (error) {
      console.error("Error saving report:", error);
      toast.error("Failed to save report");
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  const handleCancel = () => {
    if (showTemplateEditor) {
      cancelTemplate();
    } else {
      navigate("/settings/report-configuration-list");
    }
  };

  const loadSampleData = () => {
    setReportName(SAMPLE_REPORT.reportName);
    setColumns(SAMPLE_REPORT.columns.map(col => ({ ...col, id: col.id || `col_${Date.now()}` })) as ColumnFormData[]);
    setSelectedScreen("Sales Order - Domestic");
    toast.info("Sample 'Sales Order Status' report loaded!");
  };

  const screenColor = getScreenColor(selectedScreen);

  // Hydrate form fields from current template when switching back from Template Editor
  const syncFormFromTemplate = () => {
    if (!currentTemplate) return;
    try {
      setReportName((currentTemplate.reportName && currentTemplate.reportName.trim()) || reportName || 'LLM Result');
      const cols: ColumnFormData[] = (currentTemplate.templateFields || []).map((f: any, idx: number) => ({
        id: f.columnId || `col_${Date.now()}_${idx}`,
        columnName: f.columnName || '',
        screenName: f.screenName || '',
        sectionName: f.sectionName || '',
        fieldName: f.fieldName || '',
        isFormulaApplied: !!f.isFormula,
        formulaType: f.formulaType || '',
        formulaBar: f.formulaBar || '',
        isFilterRequired: false,
        filterType: '',
        tableName: f.tableName,
        databaseColumnName: f.databaseColumnName,
        dataType: f.dataType,
      }));
      if (cols.length) {
        setColumns(cols);
        const screenCounts: Record<string, number> = {};
        cols.forEach(c => { if (c.screenName) screenCounts[c.screenName] = (screenCounts[c.screenName] || 0) + 1; });
        const dominant = Object.keys(screenCounts).sort((a, b) => (screenCounts[b] - screenCounts[a]))[0];
        if (dominant) setSelectedScreen(dominant);
      }
    } catch (e) {
      console.warn('Failed to sync form from template', e);
    }
  };

  if (showTemplateEditor && currentTemplate) {
    return (
      <div className="p-6 pt-16">
        <div className="flex items-center gap-4 mb-6">
          {/* <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-200 rounded-lg dark:hover:bg-gray-700"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-semibold">Template Editor</h1> */}
           <div className="flex items-center gap-4">
                      <Button variant="outline"  onClick={handleCancel} className="mr-auto">
                        <ArrowLeft size={18} className="mr-2" /> Back
                      </Button>
                       <h1 className="text-2xl font-semibold">Template Editor</h1>
                    </div>
          {/* Switch back to Form editing */}
          <Button
            variant="outline"
            onClick={() => { syncFormFromTemplate(); setShowTemplateEditor(false); setEditMode('form'); }}
            className="flex items-center gap-2"
          >
            <Edit size={16} /> Edit Form
          </Button>
          <span className="text-sm text-green-600 ml-auto flex items-center gap-2">
            <CheckCircle size={18} />
            Report Saved
          </span>
        </div>

        <Card className={`mb-6 ${screenColor.lightBg} ${screenColor.border} border-2`}>
          <CardHeader className={`${screenColor.darkBg} rounded-t-lg`}>
            <CardTitle className={`${screenColor.text} font-bold`}>
              {currentTemplate.reportName} - Edit Template
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <TemplateEditor
              template={currentTemplate}
              onUpdateTemplate={handleTemplateUpdate}
              screenColors={dynamicConfig.SCREEN_COLORS}
              selectedScreen={selectedScreen}
            />
          </CardContent>
        </Card>

        <Card className={`mb-6 ${screenColor.lightBg} ${screenColor.border} border-2`}>
          <CardHeader className={`${screenColor.darkBg} rounded-t-lg`}>
            <CardTitle className={`${screenColor.text} font-bold`}>
              SQL Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <textarea
              ref={sqlRef}
              value={currentTemplate.queryContent || ''}
              onChange={(e) => { setQueryResultRows([]); setQueryResultColumns([]); handleTemplateUpdate({ ...currentTemplate, queryContent: e.target.value }); }}
              className="w-full min-h-40 font-mono p-3 border rounded"
              placeholder="Generated SQL will appear here"
            />
            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => {
                  if (currentTemplate.queryContent) {
                    navigator.clipboard.writeText(currentTemplate.queryContent);
                    toast.success('SQL copied');
                  }
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <CopyIcon size={16} /> Copy SQL
              </Button>
              <Button
                onClick={async () => {
                  const liveSql = sqlRef?.current?.value ?? currentTemplate?.queryContent ?? '';
                  if (!liveSql.trim()) {
                    toast.error('No SQL to execute');
                    return;
                  }
                  try {
                    const payload = { id: llmResultId || null, sql: liveSql };
                    const res = await apiService.post('/llm/execute-query', payload);
                    const returnedId = res?.id ?? res?.data?.id ?? null;
                    if (typeof returnedId === 'number') setLlmResultId(returnedId);
                    const rows = res?.rows || res?.data?.rows || res?.data || [];
                    const cols = Array.isArray(rows) && rows.length > 0 ? Object.keys(rows[0]) : [];
                    setQuerySql(liveSql);
                    setQueryResultRows(rows);
                    setQueryResultColumns(cols);
                    setQueryExecutionData(res ?? null);
                    persistQueryState(liveSql, res ?? null);
                    toast.success('Query executed');
                  } catch (e: any) {
                    console.error('Execute query failed', e);
                    toast.error(e?.message || 'Failed to execute query');
                  }
                }}
                className={`flex items-center gap-2 ${screenColor.bg} hover:opacity-90 text-white`}
              >
                <Play size={16} /> Run Query
              </Button>
            </div>
          </CardContent>
        </Card>

        {queryResultColumns.length > 0 && (
          <Card className={`mb-6 ${screenColor.lightBg} ${screenColor.border} border-2`}>
            <CardHeader className={`${screenColor.darkBg} rounded-t-lg`}>
              <CardTitle className={`${screenColor.text} font-bold`}>
                Query Result Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {queryResultColumns.map((col) => (
                      <TableHead key={col}>{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queryResultRows.map((row, idx) => (
                    <TableRow key={idx}>
                      {queryResultColumns.map((col) => (
                        <TableCell key={col}>{String(row[col] ?? '')}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            onClick={cancelTemplate}
            className="btn btn-secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={saveTemplateHandler}
            className={`btn btn-primary ${screenColor.bg} hover:opacity-90 text-white`}
            disabled={templateLoading}
          >
            {templateLoading ? "Saving..." : "Confirm & Save Template"}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 pt-16 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64 align-self-center">
          <div className="text-center">
            <Database className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
            <p className="mt-4 text-gray-600">Loading transaction modules from database...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-16">
      <div className="flex items-center gap-4 mb-6">
         <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={handleCancel} className="mr-auto">
                      <ArrowLeft size={18} className="mr-2" /> Back
                    </Button>
                    <h1 className="text-2xl font-semibold">
          {isEditing ? "Edit Report Configuration" : "Add Report Configuration"}
        </h1>
                  </div>

        {/* <button
          onClick={handleCancel}
          className="p-2 hover:bg-gray-200 rounded-lg dark:hover:bg-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-semibold">
          {isEditing ? "Edit Report Configuration" : "Add Report Configuration"}
        </h1> */}
        <span className="text-sm text-gray-500 ml-auto">
          {dynamicConfig.SCREEN_OPTIONS.length} transaction modules available
        </span>
      </div>

      <Card className={`mb-6 ${screenColor.lightBg} ${screenColor.border} border-2`}>
        <CardHeader className={`${screenColor.darkBg} rounded-t-lg`}>
          <CardTitle className={`${screenColor.text} font-bold`}>
            Report Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Report Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Enter Report Name (e.g., Sales Order Status, Purchase Order Status)"
              className="input w-full"
            />
            {formErrors.reportName && (
              <p className="mt-1 text-sm text-red-600">{formErrors.reportName}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className={`${screenColor.lightBg} ${screenColor.border} border-2`}>
        <CardHeader className={`${screenColor.darkBg} rounded-t-lg flex flex-row items-center justify-between flex-wrap gap-4 sticky top-0 z-20 shadow-sm`}>
          <CardTitle className={`${screenColor.text} font-bold`}>
            Report Columns
          </CardTitle>
          <div className="flex gap-2 flex-wrap items-center">
            {!isEditing && columns.length === 0 && (
              <Button
                onClick={loadSampleData}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Copy size={18} /> Load Sample
              </Button>
            )}
            <Button
              onClick={() => addColumn('top')}
              className="flex items-center gap-2"
              variant="outline"
              disabled={dynamicConfig.SCREEN_OPTIONS.length === 0}
            >
              <Plus size={18} /> Add Column
            </Button>
            {columns.length > 0 && editMode === 'form' && (
              <Button
                onClick={() => setTableView(!tableView)}
                className="flex items-center gap-2"
                variant="outline"
              >
                {tableView ? <Edit size={18} /> : <Eye size={18} />}
                {tableView ? "Edit Mode" : "Table View"}
              </Button>
            )}

            {/* Mode toggle */}
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant={editMode === 'form' ? 'default' : 'outline'}
                onClick={() => setEditMode('form')}
                className="flex items-center gap-2"
              >
                <Edit size={16} /> Form
              </Button>
              <Button
                variant={editMode === 'query' ? 'default' : 'outline'}
                onClick={() => setEditMode('query')}
                className="flex items-center gap-2"
              >
                <Database size={16} /> Query
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {editMode === 'form' ? (
            <>
              {formErrors.columns && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded text-red-700 text-sm">
                  {formErrors.columns}
                </div>
              )}

              {columns.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>No columns added yet.</p>
                  <p className="text-sm mt-2">Click "Add Column" or "Load Sample" to get started.</p>
                  {dynamicConfig.SCREEN_OPTIONS.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 max-w-2xl mx-auto">
                      {dynamicConfig.SCREEN_OPTIONS.slice(0, 8).map((screen) => (
                        <div
                          key={screen.value}
                          className={`p-2 rounded text-xs text-center ${getScreenColor(screen.value).bg} text-white truncate`}
                          title={screen.label}
                        >
                          {screen.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : tableView ? (
                <ReportConfigurationTable
                  columns={columns}
                  onRemove={removeColumn}
                  onEdit={() => setTableView(false)}
                  formErrors={formErrors}
                  screenColors={dynamicConfig.SCREEN_COLORS}
                  selectedScreen={selectedScreen}
                />
              ) : (
                <div className="space-y-6">
                  {columns.map((column, idx) => {
                    const columnScreenColor = getScreenColor(column.screenName);
                    const availableFields = column.screenName && column.sectionName
                      ? dynamicConfig.FIELD_OPTIONS[column.screenName]?.[column.sectionName] || []
                      : [];

                    return (
                      <div
                        key={column.id}
                        className={`p-4 border-2 rounded-lg ${columnScreenColor.lightBg} ${columnScreenColor.border}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-sm">Column {columns.length - idx}</h3>
                            {column.screenName && (
                              <span className={`px-2 py-1 rounded text-xs font-bold ${columnScreenColor.bg} text-white`}>
                                {column.screenName}
                              </span>
                            )}
                            {/* Show database table info */}
                            {column.tableName && (
                              <span className="px-2 py-1 rounded text-xs bg-gray-200 text-gray-700">
                                📊 {column.tableName}.{column.databaseColumnName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => addColumn(idx + 1)}
                              className="p-2 hover:bg-blue-100 rounded text-blue-600"
                              title="Add Column After"
                            >
                              <Plus size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveColumnUp(idx)}
                              disabled={idx === 0}
                              className="p-2 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveColumnDown(idx)}
                              disabled={idx === columns.length - 1}
                              className="p-2 hover:bg-gray-200 rounded text-gray-600 disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeColumn(column.id)}
                              className="p-2 hover:bg-red-100 rounded text-red-600 dark:hover:bg-red-900 ml-2"
                              title="Remove Column"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Column Name */}
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Column Name <span className="text-red-600">*</span>
                            </label>
                            <input
                              type="text"
                              value={column.columnName}
                              onChange={(e) =>
                                updateColumn(column.id, "columnName", e.target.value)
                              }
                              placeholder="e.g., Order Date, Total Amount"
                              className="input w-full text-sm"
                            />
                            {formErrors[`columns.${idx}.columnName`] && (
                              <p className="text-xs text-red-600 mt-1">
                                {formErrors[`columns.${idx}.columnName`]}
                              </p>
                            )}
                          </div>

                          {/* Screen Name */}
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Screen Name <span className="text-red-600">*</span>
                            </label>
                            <CommonSearchableSelect
                              value={column.screenName}
                              onValueChange={(val) =>
                                handleScreenChange(column.id, val)
                              }
                              placeholder="Select Transaction Screen"
                              options={dynamicConfig.SCREEN_OPTIONS}
                              className="text-sm bg-white"
                              error={formErrors[`columns.${idx}.screenName`]}
                            />
                            {formErrors[`columns.${idx}.screenName`] && (
                              <p className="text-xs text-red-600 mt-1">
                                {formErrors[`columns.${idx}.screenName`]}
                              </p>
                            )}
                          </div>

                          {/* Section Name */}
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Section Name <span className="text-red-600">*</span>
                            </label>
                            <CommonSearchableSelect
                              value={column.sectionName}
                              onValueChange={(val) =>
                                handleSectionChange(column.id, val)
                              }
                              placeholder="Select Section"
                              options={(column.screenName &&
                                dynamicConfig.SECTION_OPTIONS[column.screenName]?.map((sec) => ({
                                  value: sec,
                                  label: sec
                                }))) || []}
                              className="text-sm bg-white"
                              disabled={!column.screenName}
                              error={formErrors[`columns.${idx}.sectionName`]}
                            />
                            {formErrors[`columns.${idx}.sectionName`] && (
                              <p className="text-xs text-red-600 mt-1">
                                {formErrors[`columns.${idx}.sectionName`]}
                              </p>
                            )}
                          </div>

                          {/* Field Name - UPDATED with metadata display */}
                          <div>
                            <label className="block text-sm font-medium mb-1">
                              Field Name {!column.isFormulaApplied && <span className="text-red-600">*</span>}
                            </label>
                            <CommonSearchableSelect
                              value={column.fieldName}
                              onValueChange={(val) =>
                                handleFieldChange(column.id, val)
                              }
                              placeholder="Select Field"
                              options={availableFields.map((field) => ({
                                value: field.name,
                                label: `${field.label} - ${field.type || 'text'}`
                              }))}
                              className="text-sm bg-white"
                              disabled={!column.sectionName || column.isFormulaApplied}
                              error={formErrors[`columns.${idx}.fieldName`]}
                            />
                            {formErrors[`columns.${idx}.fieldName`] && (
                              <p className="text-xs text-red-600 mt-1">
                                {formErrors[`columns.${idx}.fieldName`]}
                              </p>
                            )}
                            {/* Show field metadata info */}
                            {column.fieldName && !column.isFormulaApplied && column.tableName && (
                              <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                                <div className="flex items-center gap-2">
                                  <Database size={12} />
                                  <span className="font-mono">
                                    {column.tableName}.{column.databaseColumnName}
                                  </span>
                                  <span className="ml-auto text-gray-600">
                                    {column.dataType}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Formula Applied Checkbox */}
                          <div className="col-span-2">
                            <label className="flex items-center gap-2 text-sm font-medium">
                              <input
                                type="checkbox"
                                checked={column.isFormulaApplied}
                                onChange={(e) =>
                                  updateColumn(
                                    column.id,
                                    "isFormulaApplied",
                                    e.target.checked
                                  )
                                }
                                className="w-4 h-4 rounded"
                              />
                              Apply Formula
                            </label>
                          </div>

                          {/* Formula Fields */}
                          {column.isFormulaApplied && (
                            <>
                              <div>
                                <label className="block text-sm font-medium mb-1">
                                  Formula Type
                                </label>
                                <CommonSearchableSelect
                                  value={column.formulaType || ""}
                                  onValueChange={(val) =>
                                    updateColumn(column.id, "formulaType", val)
                                  }
                                  placeholder="Select Type"
                                  options={dynamicConfig.FORMULA_TYPE_OPTIONS}
                                  className="text-sm bg-white"
                                />
                              </div>

                              <div className="col-span-2">
                                <label className="block text-sm font-medium mb-1">
                                  Formula Bar <span className="text-red-600">*</span>
                                </label>
                                {column.formulaType === "Report columns" ? (
                                  <div className="space-y-2">
                                    <div className={`bg-white dark:bg-gray-800 p-3 rounded border-2 ${columnScreenColor.border} min-h-24`}>
                                      <p className="text-xs font-medium mb-2 text-gray-600 dark:text-gray-400">
                                        Available Columns:
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {columns.slice(0, idx).map((col) => (
                                          <button
                                            key={col.id}
                                            type="button"
                                            onClick={() => {
                                              const current = column.formulaBar || "";
                                              const newFormula = current ?
                                                `${current} [${col.columnName}]` :
                                                `[${col.columnName}]`;
                                              updateColumn(column.id, "formulaBar", newFormula);
                                            }}
                                            className={`px-2 py-1 rounded text-xs transition font-medium ${columnScreenColor.bg} text-white hover:opacity-75`}
                                          >
                                            {col.columnName}
                                          </button>
                                        ))}
                                      </div>
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {['+', '-', '*', '/'].map((operator) => (
                                          <button
                                            key={operator}
                                            type="button"
                                            onClick={() => {
                                              const current = column.formulaBar || "";
                                              updateColumn(column.id, "formulaBar", current + ` ${operator} `);
                                            }}
                                            className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
                                          >
                                            {operator}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <textarea
                                      value={column.formulaBar || ""}
                                      onChange={(e) =>
                                        updateColumn(column.id, "formulaBar", e.target.value)
                                      }
                                      placeholder="e.g., [Order Qty] * [Rate/Unit]"
                                      className="input w-full text-sm min-h-20 font-mono"
                                    />
                                  </div>
                                ) : (
                                  <textarea
                                    value={column.formulaBar || ""}
                                    onChange={(e) =>
                                      updateColumn(column.id, "formulaBar", e.target.value)
                                    }
                                    placeholder="Enter your formula (e.g., A + B, [Column1] * 0.18)"
                                    className="input w-full text-sm min-h-20 font-mono"
                                  />
                                )}
                                {formErrors[`columns.${idx}.formulaBar`] && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {formErrors[`columns.${idx}.formulaBar`]}
                                  </p>
                                )}
                              </div>
                            </>
                          )}

                          {/* Filter Required Checkbox */}
                          <div className="col-span-2">
                            <label className="flex items-center gap-2 text-sm font-medium">
                              <input
                                type="checkbox"
                                checked={column.isFilterRequired}
                                onChange={(e) =>
                                  updateColumn(
                                    column.id,
                                    "isFilterRequired",
                                    e.target.checked
                                  )
                                }
                                className="w-4 h-4 rounded"
                              />
                              Apply Filter
                            </label>
                          </div>

                          {/* Filter Type */}
                          {column.isFilterRequired && (
                            <div className="col-span-2">
                              <label className="block text-sm font-medium mb-1">
                                Filter Type <span className="text-red-600">*</span>
                              </label>
                              <CommonSearchableSelect
                                value={column.filterType || ""}
                                onValueChange={(val) =>
                                  updateColumn(column.id, "filterType", val)
                                }
                                placeholder="Select Filter Type"
                                options={dynamicConfig.FILTER_TYPE_OPTIONS}
                                className="text-sm bg-white"
                                error={formErrors[`columns.${idx}.filterType`]}
                              />
                              {formErrors[`columns.${idx}.filterType`] && (
                                <p className="text-xs text-red-600 mt-1">
                                  {formErrors[`columns.${idx}.filterType`]}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {columns.length > 0 && (
                    <div className="flex justify-center mt-6">
                      <Button
                        onClick={() => addColumn('bottom')}
                        className="flex items-center gap-2 border-dashed border-2 hover:bg-gray-50"
                        variant="outline"
                      >
                        <Plus size={18} /> Add Next Column
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            // Query mode content
            <div>
              <label className="block text-sm font-medium mb-2">SQL Query</label>
              <textarea
                ref={sqlRef}
                value={querySql}
                onChange={(e) => setQuerySql(e.target.value)}
                className="input w-full font-mono text-sm h-40"
                placeholder="Write or paste your SELECT query here..."
              />
              <div className="mt-3 flex gap-2">
                <Button onClick={runQuery} className="flex items-center gap-2">
                  <Play size={16} /> Run Query
                </Button>
                <Button onClick={saveQueryIntoTemplate} variant="outline" className="flex items-center gap-2">
                  <CheckCircle size={16} /> Save SQL to Template
                </Button>
              </div>

              {queryResultRows.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Preview</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {queryResultColumns.map((c) => (
                          <TableHead key={c}>{c}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queryResultRows.slice(0, 50).map((r, idx) => (
                        <TableRow key={idx}>
                          {queryResultColumns.map((c) => (
                            <TableCell key={c}>{String(r[c] ?? '')}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="text-xs text-gray-500 mt-2">Showing up to 50 rows.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-3 mt-6">
        <Button
          onClick={handleCancel}
          className="btn btn-secondary"
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          className={`btn btn-primary ${screenColor.bg} hover:opacity-90 text-white`}
          disabled={columns.length === 0 || isGeneratingTemplate}
        >
          {isGeneratingTemplate ? "Generating..." : "Generate Template"}
        </Button>
      </div>
    </div>
  );
}

export default ReportConfigurationForm;