import { NumberFormatConfiguration } from "@/state/numberFormatConfigurationSlice";

const resolveSelectedCompanyId = (): number | null => {
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

const INVOICE_TAB_TYPE_MAP: Record<string, number[]> = {
  invoicedomestic: [201],
  invoiceexport: [202],
  invoicejobwork: [203],
  invoicesizingsales: [204],
  invoiceyarnsales: [205]
};

export interface DocumentNumberRequest {
  screenName: string;
  tabName?: string | number;
  companyId?: number;
}

export interface DocumentNumberResponse {
  documentNumber: string;
  configuration: NumberFormatConfiguration;
}

class DocumentNumberService {
  private static instance: DocumentNumberService;
  private cache: Map<string, NumberFormatConfiguration[]> = new Map();
  private generatedSequenceMemory: Map<string, string> = new Map();

  private constructor() { }

  static getInstance(): DocumentNumberService {
    if (!DocumentNumberService.instance) {
      DocumentNumberService.instance = new DocumentNumberService();
    }
    return DocumentNumberService.instance;
  }

  /**
   * Normalize tab name to match configuration format
   * For Sales Order Management: 1 -> "domestic", 2 -> "export"
   */
  private normalizeTabName(screenName: string, tabName?: string | number): string | undefined {
    if (tabName === null || tabName === undefined) {
      return undefined;
    }

    // For Sales Order Management, convert numeric tab to string, handles department suffixes too
    if (screenName === 'Sales Order Management') {
      const tabStr = String(tabName);
      if (tabStr === '1' || tabStr === 'domestic') return 'domestic';
      if (tabStr === '2' || tabStr === 'export') return 'export';
      if (tabStr.startsWith('1-') || tabStr.startsWith('domestic-')) {
        const dept = tabStr.split('-')[1];
        return `domestic-${dept}`;
      }
      if (tabStr.startsWith('2-') || tabStr.startsWith('export-')) {
        const dept = tabStr.split('-')[1];
        return `export-${dept}`;
      }
    }

    // For other screens, return as string
    return String(tabName);
  }

  private getConfigCacheKey(companyId?: number | null): string {
    return companyId != null
      ? `number-format-configurations:company:${companyId}`
      : "number-format-configurations:global";
  }

  /**
   * Generate the next document number for a given screen and tab
   */
  async generateDocumentNumber(request: DocumentNumberRequest): Promise<DocumentNumberResponse> {
  const { screenName, companyId: requestCompanyId } = request;
  const companyId = requestCompanyId ?? resolveSelectedCompanyId();
  const normalizedTabName = this.normalizeTabName(screenName, request.tabName);

  console.log('========================================');
  console.log('[generateDocumentNumber] 🔵 NEW REQUEST (SIMPLIFIED)');
  console.log('[generateDocumentNumber] Screen:', screenName);
  console.log('[generateDocumentNumber] Tab:', normalizedTabName);
  console.log('[generateDocumentNumber] CompanyId:', companyId ?? 'none');

  // Get configuration
  const configuration = await this.getConfiguration(screenName, normalizedTabName, companyId);
console.log('[generateDocumentNumber] Retrieved configuration:', configuration);
  if (!configuration) {
    console.warn('[generateDocumentNumber] ⚠️ No configuration found - using fallback');
    return this.generateFallbackDocumentNumber(screenName, normalizedTabName);
  }

  console.log('[generateDocumentNumber] Configuration:', {
    prefix: configuration.prefix,
    financialYear: configuration.financialYear,
    sequenceNumber: configuration.sequenceNumber
  });

  // Get last used number from database/memory only
  const lastNumber = await this.getLastUsedNumber(configuration, screenName, normalizedTabName, companyId);
  console.log('[generateDocumentNumber] Last used number:', lastNumber);

  // Generate next number
  let nextNumber: string;
  if (lastNumber) {
    nextNumber = this.incrementSequenceNumber(lastNumber, configuration);
    console.log(`[generateDocumentNumber] Incrementing: "${lastNumber}" → "${nextNumber}"`);
  } else {
    nextNumber = configuration.sequenceNumber;
    console.log(`[generateDocumentNumber] Using initial: "${nextNumber}"`);
  }

  // Format the document number
  const documentNumber = this.formatDocumentNumber(nextNumber, configuration);
  console.log('[generateDocumentNumber] ✅ Generated:', documentNumber);

  // Store in memory for this session
  const memoryKey = this.getMemoryKey(screenName, normalizedTabName, companyId);
  this.generatedSequenceMemory.set(memoryKey, nextNumber);
  console.log('[generateDocumentNumber] ✅ Stored in memory cache');

  console.log('[generateDocumentNumber] 🟢 COMPLETE');
  console.log('========================================');

  return {
    documentNumber,
    configuration
  };
}

  /**
   * Get the number format configuration for a screen/tab combination
   */
  private async getConfiguration(screenName: string, tabName?: string, companyId?: number | null): Promise<NumberFormatConfiguration | null> {
    const configurations = await this.getAllConfigurations(companyId);

    console.log('[DocumentNumberService.getConfiguration] Looking for config:', { screenName, tabName, companyId });
    console.log('[DocumentNumberService.getConfiguration] Total configurations available:', configurations.length);

    // Find exact match first
    const match = configurations.find(config => {
      const configScreenName = (config.screenName || "").trim().toLowerCase();
      const targetScreenName = (screenName || "").trim().toLowerCase();
      const screenNameMatch = configScreenName === targetScreenName;
      
      const configTab = config.tabName === null || config.tabName === undefined ? "" : String(config.tabName).trim().toLowerCase();
      const targetTab = tabName === null || tabName === undefined ? "" : String(tabName).trim().toLowerCase();
      
      const tabNameMatch = configTab === targetTab;
        
      const activeFlagMatch = config.activeFlag === true;

      if (screenNameMatch) {
        console.log(`[DocumentNumberService.getConfiguration] Checking match for ${targetScreenName}:`, {
          configTab,
          targetTab,
          tabMatch: tabNameMatch,
          active: activeFlagMatch
        });
      }

      return screenNameMatch && tabNameMatch && activeFlagMatch;
    });

    if (match) {
      console.log("[DocumentNumberService.getConfiguration] Found exact match:", match);
      return match;
    }

    // Fallback to null tabName if no exact match
    if (tabName !== null && tabName !== undefined && String(tabName).trim() !== "") {
      console.log("[DocumentNumberService.getConfiguration] No exact match, trying fallback with null tabName");
      const fallbackMatch = configurations.find(config => {
        const configScreenName = (config.screenName || "").trim().toLowerCase();
        const targetScreenName = (screenName || "").trim().toLowerCase();
        
        const configTab = config.tabName === null || config.tabName === undefined ? "" : String(config.tabName).trim().toLowerCase();
        
        return configScreenName === targetScreenName &&
          configTab === "" &&
          config.activeFlag === true;
      });

      if (fallbackMatch) {
        console.log('[DocumentNumberService.getConfiguration] Found fallback match:', fallbackMatch);
        return fallbackMatch;
      }
    }

    console.log('[DocumentNumberService.getConfiguration] No configuration found');
    return null;
  }

  /**
   * Get all number format configurations
   */
  private async getAllConfigurations(companyId?: number | null): Promise<NumberFormatConfiguration[]> {
    const cacheKey = this.getConfigCacheKey(companyId);
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (cached.length > 0) {
        return cached;
      }
    }

    const maxRetries = 2;
    let lastError: any = null;
    const basePath = companyId != null
      ? `/number-format-configurations/company/${companyId}`
      : '/number-format-configurations';
    const requestUrl = `${basePath}?limit=1000&offset=0`;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { default: apiService } = await import('./ApiService');

        console.log(`[DocumentNumberService.getAllConfigurations] Attempt ${attempt}/${maxRetries} - Fetching number format configurations`);
        const response = await apiService.get(requestUrl);

        console.log('[DocumentNumberService.getAllConfigurations] Response received:', typeof response, response ? 'has data' : 'null');
        
        let configurations = response.data || response || [];

        // Handle nested data structure
        if (Array.isArray(configurations)) {
          // configurations is already an array
        } else if (configurations.data && Array.isArray(configurations.data)) {
          configurations = configurations.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          // Handle paginated response structure
          configurations = response.data.data;
        }

        console.log('[DocumentNumberService.getAllConfigurations] ✓ Successfully fetched configurations:', configurations.length);
        this.cache.set(cacheKey, configurations);
        return configurations;
      } catch (error: any) {
        lastError = error;
        const statusCode = error?.response?.status || error?.status;
        const errorMsg = error?.message || String(error);

        console.warn(
          `[DocumentNumberService.getAllConfigurations] ⚠ Attempt ${attempt}/${maxRetries} failed`,
          { statusCode, error: errorMsg }
        );

        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000;
          console.log(`[DocumentNumberService.getAllConfigurations] Retrying after ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    console.error(
      '[DocumentNumberService.getAllConfigurations] ❌ Failed to fetch configurations after',
      maxRetries,
      'attempts. Will use fallback generation for document numbers.',
      lastError
    );

    return [];
  }

  /**
   * Create a unique key for storing generated sequences in memory
   */
  private getMemoryKey(screenName: string, tabName?: string, companyId?: number | null): string {
    const normalizedTabName = tabName !== null && tabName !== undefined ? String(tabName).trim() : 'default';
    const companyPart = companyId != null ? `company:${companyId}` : 'global';
    return `${screenName}:${normalizedTabName}:${companyPart}`;
  }

  /**
   * Clear the configuration cache
   */
  clearCache(companyId?: number | null): void {
    if (companyId != null) {
      const cacheKey = this.getConfigCacheKey(companyId);
      this.cache.delete(cacheKey);
      console.log(`[clearCache] Cleared configuration cache for company ${companyId}`);
    } else {
      this.cache.clear();
      console.log(`[clearCache] Cleared all configuration cache`);
    }
  }

  /**
   * Update memory cache after successful save
   * This ensures the next document generation will query the database with the latest sequence
   */
  updateMemoryCache(screenName: string, sequenceNumber: string, tabName?: string | number, companyId?: number | null): void {
    const normalizedTabName = this.normalizeTabName(screenName, tabName);
    const memoryKey = this.getMemoryKey(screenName, normalizedTabName, companyId);
    this.generatedSequenceMemory.set(memoryKey, sequenceNumber);
    console.log(`[updateMemoryCache] Updated cache for ${memoryKey}: ${sequenceNumber}`);
  }

  /**
   * Clear memory cache to force database query on next generation
   */
  clearMemoryCache(screenName?: string, tabName?: string | number, companyId?: number | null): void {
    const resolvedCompanyId = companyId ?? resolveSelectedCompanyId();
    
    if (screenName) {
      const normalizedTabName = this.normalizeTabName(screenName, tabName);
      const memoryKey = this.getMemoryKey(screenName, normalizedTabName, resolvedCompanyId);
      this.generatedSequenceMemory.delete(memoryKey);
      console.log(`[clearMemoryCache] Cleared cache for ${memoryKey}`);
    } else {
      if (resolvedCompanyId != null) {
        const companyKey = `:company:${resolvedCompanyId}`;
        for (const key of this.generatedSequenceMemory.keys()) {
          if (key.endsWith(companyKey)) {
            this.generatedSequenceMemory.delete(key);
          }
        }
        console.log(`[clearMemoryCache] Cleared company-specific memory cache for ${resolvedCompanyId}`);
      } else {
        this.generatedSequenceMemory.clear();
        console.log(`[clearMemoryCache] Cleared all memory cache`);
      }
    }
  }

  /**
   * Update the lastGeneratedSequence for a configuration
   */
  private async updateLastGeneratedSequence(configId: number, sequenceNumber: string): Promise<void> {
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { default: apiService } = await import('./ApiService');

        console.log(`[DocumentNumberService.updateLastGeneratedSequence] Attempt ${attempt}/${maxRetries} - Updating config ${configId}`);
        const response = await apiService.get(`/number-format-configurations/${configId}`);
        const currentConfig = response?.data || response;

        if (!currentConfig) {
          console.warn('[DocumentNumberService.updateLastGeneratedSequence] Configuration not found:', configId);
          return;
        }

        const updatedConfig = {
          ...currentConfig,
          lastGeneratedSequence: sequenceNumber || null
        };

        await apiService.put(`/number-format-configurations/${configId}`, updatedConfig);
        console.log('[DocumentNumberService.updateLastGeneratedSequence] ✓ Successfully updated to:', sequenceNumber);

        this.clearCache();
        return;
      } catch (error: any) {
        lastError = error;
        const statusCode = error?.response?.status || error?.status;
        const errorMsg = error?.message || String(error);

        console.warn(
          `[DocumentNumberService.updateLastGeneratedSequence] ⚠ Attempt ${attempt}/${maxRetries} failed`,
          { statusCode, error: errorMsg }
        );

        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000;
          console.log(`[DocumentNumberService.updateLastGeneratedSequence] Retrying after ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    console.error(
      '[DocumentNumberService.updateLastGeneratedSequence] ❌ Failed to update after',
      maxRetries,
      'attempts. Document number will not persist, but sequence was generated.',
      lastError
    );
  }

  /**
   * Get the last used document number for a configuration
   * Priority: 1) Memory cache, 2) Existing data (always check), 3) Never use orphaned lastGeneratedSequence
   */
 private async getLastUsedNumber(
  configuration: NumberFormatConfiguration,
  screenName: string,
  tabName?: string,
  companyId?: number | null
): Promise<string | null> {
  try {
    const memoryKey = this.getMemoryKey(screenName, tabName, companyId);
    console.log('[getLastUsedNumber] ========================================');
    console.log('[getLastUsedNumber] SIMPLIFIED VERSION - Database records only');
    console.log('[getLastUsedNumber] Memory key:', memoryKey);
    console.log('[getLastUsedNumber] Configuration:', {
      prefix: configuration.prefix,
      financialYear: configuration.financialYear,
      sequenceNumber: configuration.sequenceNumber
    });

    // STEP 1: Check memory cache for current session
    const cachedSequence = this.generatedSequenceMemory.get(memoryKey);
    if (cachedSequence) {
      console.log(`[getLastUsedNumber] ✅ Using memory cache: "${cachedSequence}"`);
      console.log('[getLastUsedNumber] ========================================');
      return cachedSequence;
    }

    // STEP 2: Check database for actual saved records
    console.log('[getLastUsedNumber] 🔍 Checking database for actual records...');
    const lastNumberFromDB = await this.findLastUsedNumberFromExistingData(configuration, companyId);

    if (lastNumberFromDB) {
      console.log(`[getLastUsedNumber] ✅ Database highest sequence: "${lastNumberFromDB}"`);
      
      // Update memory cache
      this.generatedSequenceMemory.set(memoryKey, lastNumberFromDB);
      
      console.log('[getLastUsedNumber] ========================================');
      return lastNumberFromDB;
    }

    // STEP 3: No data exists - use initial sequence from config
    console.log('[getLastUsedNumber] ℹ️ No existing records found');
    console.log('[getLastUsedNumber] ℹ️ Using initial sequence:', configuration.sequenceNumber);
    console.log('[getLastUsedNumber] ========================================');
    return null;

  } catch (error) {
    console.error('[getLastUsedNumber] ❌ Error:', error);
    console.log('[getLastUsedNumber] ========================================');
    return null;
  }
}


  /**
   * Extract array from various API response formats
   */
  private extractArrayFromResponse(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data?.data)) return response.data.data;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  }

  private getSalesOrderExportType(order: any): { numeric: number | null; normalized: string } {
    const rawValue = order?.exportType ?? order?.export_type;
    const normalized = rawValue === null || rawValue === undefined ? '' : String(rawValue).trim().toLowerCase();
    const numeric = Number(rawValue);
    return {
      numeric: Number.isNaN(numeric) ? null : numeric,
      normalized
    };
  }

  private isSalesOrderTabMatch(order: any, tabName: 'domestic' | 'export'): boolean {
    const { numeric, normalized } = this.getSalesOrderExportType(order);
    if (tabName === 'domestic') {
      if (numeric === 1) return true;
      return normalized === 'domestic';
    }
    if (tabName === 'export') {
      if (numeric === 2) return true;
      return normalized === 'export';
    }
    return false;
  }

  /**
   * Find the last used number by querying existing transaction data
   * This finds the HIGHEST sequence number ever used (not just active records)
   */
  private async findLastUsedNumberFromExistingData(configuration: NumberFormatConfiguration, companyId?: number | null): Promise<string | null> {
    const { screenName, tabName, prefix, financialYear, separator } = configuration;

    try {
      const { default: apiService } = await import('./ApiService');
      let lastNumber: string | null = null;

      console.log('[findLastUsedNumberFromExistingData] Querying for screen:', screenName);

      switch (screenName) {
        case 'Sales Beam/Jobwork Return':
          // Query sales returns
          const salesReturnResponse = await apiService.get('/sales-returns', { limit: 1000 });
          const salesReturns = this.extractArrayFromResponse(salesReturnResponse);
          lastNumber = this.extractLastNumberFromOrders(salesReturns, 'salesReturnNo', prefix, financialYear, separator);
          console.log('[DocumentNumberService] Sales Returns - Last number found:', lastNumber);
          break;

        case 'Sales Order Management':
          const salesOrderResponse = await apiService.get('/sales-orders', { limit: 1000 });
          const salesOrders = this.extractArrayFromResponse(salesOrderResponse);
          const normalizedSalesOrders = salesOrders.map((order: any) => ({
            ...order,
            exportType: order.exportType || order.export_type
          }));

          console.log('[DocumentNumberService] Sales Orders - Total:', normalizedSalesOrders.length);
          console.log('[DocumentNumberService] Looking for tabName:', tabName);

          const tabNameStr = String(tabName || '');
          if (tabNameStr.includes('-')) {
            const [type, dept] = tabNameStr.split('-');
            const matchedOrders = normalizedSalesOrders.filter((order: any) =>
              this.isSalesOrderTabMatch(order, type as any) &&
              String(order.department || '').trim().toLowerCase() === dept.trim().toLowerCase()
            );
            console.log(`[DocumentNumberService] Matched orders for ${tabName}:`, matchedOrders.length);
            lastNumber = this.extractLastNumberFromOrders(matchedOrders, 'salesOrderNo', prefix, financialYear, separator);
          } else {
            if (tabName === 'domestic') {
              const domesticOrders = normalizedSalesOrders.filter((order: any) => this.isSalesOrderTabMatch(order, 'domestic'));
              console.log('[DocumentNumberService] Domestic orders:', domesticOrders.length);
              lastNumber = this.extractLastNumberFromOrders(domesticOrders, 'salesOrderNo', prefix, financialYear, separator);
            } else if (tabName === 'export') {
              const exportOrders = normalizedSalesOrders.filter((order: any) => this.isSalesOrderTabMatch(order, 'export'));
              console.log('[DocumentNumberService] Export orders:', exportOrders.length);
              lastNumber = this.extractLastNumberFromOrders(exportOrders, 'salesOrderNo', prefix, financialYear, separator);
            }
          }
          break;

        case 'Purchase Order':
          const purchaseOrderResponse = await apiService.get('/purchase-orders', { limit: 1000 });
          const purchaseOrders = this.extractArrayFromResponse(purchaseOrderResponse);
          lastNumber = this.extractLastNumberFromOrders(purchaseOrders, 'poNo', prefix, financialYear, separator);
          break;

             case 'Beam Gating':
          const beamGatingResponse = await apiService.get('/beam-gating', { limit: 1000 });
          const beamGatingData = this.extractArrayFromResponse(beamGatingResponse);
          lastNumber = this.extractLastNumberFromOrders(beamGatingData, 'beamGatingNo', prefix, financialYear, separator);
          break;

          //   case 'Piece Split/Join':
          // const pieceSplitJoinResponse = await apiService.get('/purchase-orders', { limit: 1000 });
          // const pieceSplitJoinData = this.extractArrayFromResponse(pieceSplitJoinResponse);
          // lastNumber = this.extractLastNumberFromOrders(pieceSplitJoinData, 'poNo', prefix, financialYear, separator);
          // break;

           case 'Piece Split/Join':
          if (tabName === 'SPLIT') {
            const pieceSplitResponse = await apiService.get('/piece-split', { limit: 1000 });
            const pieceSplit = this.extractArrayFromResponse(pieceSplitResponse);

            console.log('[DocumentNumberService] Sizing Yarn Issues - Total records:', pieceSplit.length);
            console.log('[DocumentNumberService] Sample records:', pieceSplit.slice(0, 3).map(s => ({
              id: s.id,
              pieceSplitNo: s.pieceSplitNo,
            })));

            // CRITICAL FIX: Use 'issueNo' field (auto-generated), NOT 'yarnIssueChallanNo' (manual)
            lastNumber = this.extractLastNumberFromOrders(pieceSplit, 'pieceSplitNo', prefix, financialYear, separator);

            console.log('[DocumentNumberService] Sizing Yarn Issues - Last sequence extracted:', lastNumber);
          } else if (tabName === 'JOIN') {
            const pieceJoinResponse = await apiService.get('/piece-join', { limit: 1000 });
            const pieceJoin = this.extractArrayFromResponse(pieceJoinResponse);
            lastNumber = this.extractLastNumberFromOrders(pieceJoin, 'pieceJoinNo', prefix, financialYear, separator);
          }
          break;

        case 'Beam Inward':
            const beamInwardResponse = await apiService.get('/beam-inward', { limit: 1000 });
            const beamInwardOrders = this.extractArrayFromResponse(beamInwardResponse);
            lastNumber = this.extractLastNumberFromOrders(beamInwardOrders, 'beamInwardNo', prefix, financialYear, separator);
            break;
 
          case 'Factory Beam Inward':
  // Query factory beam inward entries
  const factoryBeamInwardResponse = await apiService.get('/factory-beam-inward', { limit: 1000 });
  const factoryBeamInwards = this.extractArrayFromResponse(factoryBeamInwardResponse);
  lastNumber = this.extractLastNumberFromOrders(factoryBeamInwards, 'beamInwardNo', prefix, financialYear, separator);
  break;

        case 'Fabric Inspection Management':
          if (tabName === 'greigeFabricInspection') {
            // Query fabric inspections
            const greigeInspectionResponse = await apiService.get('/fabric-inspections', { limit: 1000 });
            const greigeInspections = this.extractArrayFromResponse(greigeInspectionResponse);
            lastNumber = this.extractLastNumberFromOrders(greigeInspections, 'inspectionNo', prefix, financialYear, separator);
          } else if (tabName === 'finishedFabricInspection') {
            // Query fabric inspections (same endpoint, filter by type if needed)
            const finishedInspectionResponse = await apiService.get('/fabric-inspections', { limit: 1000 });
            const finishedInspections = this.extractArrayFromResponse(finishedInspectionResponse);
            lastNumber = this.extractLastNumberFromOrders(finishedInspections, 'inspectionNo', prefix, financialYear, separator);
          }
          break;

        case 'Sizing Plan':
            const sizingPlanResponse = await apiService.get('/sizing-plan', { limit: 1000 });
            const sizingPlans = this.extractArrayFromResponse(sizingPlanResponse);
            lastNumber = this.extractLastNumberFromOrders(sizingPlans, 'sizingPlanNo', prefix, financialYear, separator);
            break;

        case 'Sizing Yarn Issue':
            const sizingYarnResponse = await apiService.get('/sizing-yarn-issues', { limit: 1000 });
            const sizingYarnIssues = this.extractArrayFromResponse(sizingYarnResponse);

            console.log('[DocumentNumberService] Sizing Yarn Issues - Total records:', sizingYarnIssues.length);
            console.log('[DocumentNumberService] Sample records:', sizingYarnIssues.slice(0, 3).map(s => ({
              id: s.id,
              issueNo: s.issueNo,
            })));

            // CRITICAL FIX: Use 'issueNo' field (auto-generated), NOT 'yarnIssueChallanNo' (manual)
            lastNumber = this.extractLastNumberFromOrders(sizingYarnIssues, 'issueNo', prefix, financialYear, separator);

            console.log('[DocumentNumberService] Sizing Yarn Issues - Last sequence extracted:', lastNumber);
            break;

        case 'Sizing Jobwork Order':
          const sizingJobworkResponse = await apiService.get('/sizing-jobwork-orders', { limit: 1000 });
          const sizingJobworkOrders = this.extractArrayFromResponse(sizingJobworkResponse);
          lastNumber =
            this.extractLastNumberFromOrders(sizingJobworkOrders, 'sizingWorkOrderNo', prefix, financialYear, separator) ||
            this.extractLastNumberFromOrders(sizingJobworkOrders, 'weavingWorkOrderNo', prefix, financialYear, separator) ||
            this.extractLastNumberFromOrders(sizingJobworkOrders, 'jobWorkOrderNo', prefix, financialYear, separator);
          break;

        case 'Customer Inquiry List':
          // Query customer inquiries
          const inquiryResponse = await apiService.get('/customer-inquiries', { limit: 1000 });
          const inquiries = this.extractArrayFromResponse(inquiryResponse);
          lastNumber = this.extractLastNumberFromOrders(inquiries, 'inquiryNo', prefix, financialYear, separator);
          break;

        case 'Costing List':
          // Query costings
          const costingResponse = await apiService.get('/costing-transaction', { limit: 1000 });
          const costings = this.extractArrayFromResponse(costingResponse);
          lastNumber = this.extractLastNumberFromOrders(costings, 'costingNo', prefix, financialYear, separator);
          break;

        case 'Quotation List':
          // Query quotations
          const quotationResponse = await apiService.get('/quotations', { limit: 1000 });
          const quotations = this.extractArrayFromResponse(quotationResponse);
          lastNumber = this.extractLastNumberFromOrders(quotations, 'quotationNo', prefix, financialYear, separator);
          break;

        case 'Opening Balance':
          // Query opening balance
          const openingBalanceResponse = await apiService.get('/opening-balance', { limit: 1000 });
          const openingBalances = this.extractArrayFromResponse(openingBalanceResponse);
          lastNumber = this.extractLastNumberFromOrders(openingBalances, 'openingBalanceNo', prefix, financialYear, separator);
          break;

            case 'Stock Transfer':
          // Query stock transfers
          const stockResponse = await apiService.get('/stock-transfers', { limit: 1000 });
          const stockData = this.extractArrayFromResponse(stockResponse);
          lastNumber = this.extractLastNumberFromOrders(stockData, 'stockTransferNo', prefix, financialYear, separator);
          break;

        case 'Purchase Inward / GRN Details':
          // Query purchase inward
          const purchaseInwardResponse = await apiService.get('/purchase-inward', { limit: 1000 });
          const purchaseInward = this.extractArrayFromResponse(purchaseInwardResponse);
          console.log('[DocumentNumberService] Purchase Inward - Records found:', purchaseInward.length);
          lastNumber = this.extractLastNumberFromOrders(purchaseInward, 'purchaseInwardNo', prefix, financialYear, separator);
          break;

        case 'Purchase Return / GRN Return':
          // Query purchase returns
          const purchaseReturnResponse = await apiService.get('/purchase-returns', { limit: 1000 });
          const purchaseReturns = this.extractArrayFromResponse(purchaseReturnResponse);
          lastNumber = this.extractLastNumberFromOrders(purchaseReturns, 'returnNo', prefix, financialYear, separator);
          break;

        case 'Weaving Contract':
          // Query weaving contracts
          const weavingContractResponse = await apiService.get('/weaving-contracts', { limit: 1000 });
          const weavingContracts = this.extractArrayFromResponse(weavingContractResponse);
          lastNumber = this.extractLastNumberFromOrders(weavingContracts, 'weavingContractNo', prefix, financialYear, separator);
          break;

        case 'Weaving Jobwork Order':
          // Query weaving yarn issues
          const weavingJobworkResponse = await apiService.get('/weaving-work-orders', { limit: 1000 });
          const weavingJobwork = this.extractArrayFromResponse(weavingJobworkResponse);
          lastNumber = this.extractLastNumberFromOrders(weavingJobwork, 'weavingWorkOrderNo', prefix, financialYear, separator);
          break;

        case 'Weaving Yarn Issue':
            const weavingYarnIssueResponse = await apiService.get('/weaving-yarn-issues', { limit: 1000 });
          const weavingYarnIssues = this.extractArrayFromResponse(weavingYarnIssueResponse);
          lastNumber =
            this.extractLastNumberFromOrders(weavingYarnIssues, 'yarnIssueChallanNo', prefix, financialYear, separator);
            break;

        case 'Weaving Yarn Outward':
          const weavingYarnOutwardResponse = await apiService.get('/weaving-yarn-outward', { limit: 1000 });
          const weavingYarnOutwards = this.extractArrayFromResponse(weavingYarnOutwardResponse);
          lastNumber =
            this.extractLastNumberFromOrders(weavingYarnOutwards, 'outwardNo', prefix, financialYear, separator);
          break;

        case 'Weft Inward':
          // Query weft inward entries
          const weftInwardResponse = await apiService.get('/weft-inward', { limit: 1000 });
          const weftInwards = this.extractArrayFromResponse(weftInwardResponse);
          lastNumber = this.extractLastNumberFromOrders(weftInwards, 'inwardNo', prefix, financialYear, separator);
          break;

        case 'Sizing Yarn Inward':
          // Query sizing yarn inward entries
          const sizingYarnInwardResponse = await apiService.get('/sizing-yarn-inward', { limit: 1000 });
          const sizingYarnInwards = this.extractArrayFromResponse(sizingYarnInwardResponse);
          lastNumber =
            this.extractLastNumberFromOrders(sizingYarnInwards, 'inwardNo', prefix, financialYear, separator) ||
            this.extractLastNumberFromOrders(sizingYarnInwards, 'sizingYarnInwardNo', prefix, financialYear, separator);
          break;

        case 'Sizing Yarn Outward':
          const sizingYarnOutwardResponse = await apiService.get('/sizing-yarn-outward', { limit: 1000 });
          const sizingYarnOutwards = this.extractArrayFromResponse(sizingYarnOutwardResponse);
          lastNumber =
            this.extractLastNumberFromOrders(sizingYarnOutwards, 'outwardNo', prefix, financialYear, separator) ||
            this.extractLastNumberFromOrders(sizingYarnOutwards, 'documentNo', prefix, financialYear, separator);
          break;

             case 'Sizing Beam Outward':
          const sizingBeamOutwardResponse = await apiService.get('/sizing-beam-outward', { limit: 1000 });
          const sizingBeamOutwards = this.extractArrayFromResponse(sizingBeamOutwardResponse);
          lastNumber =
            this.extractLastNumberFromOrders(sizingBeamOutwards, 'sizingBeamOutwardNo', prefix, financialYear, separator) ||
            this.extractLastNumberFromOrders(sizingBeamOutwards, 'documentNo', prefix, financialYear, separator);
          break;


        case 'Warping Production':
          const warpingResponse = await apiService.get('/warping-production', { limit: 1000 });
          const warpingRecords = this.extractArrayFromResponse(warpingResponse);
          lastNumber = this.extractLastNumberFromOrders(warpingRecords, 'warpingProductionNo', prefix, financialYear, separator);
          break;

        case 'Sizing Production':
          const sizingProductionResponse = await apiService.get('/sizing-production', { limit: 1000 });
          const sizingProductions = this.extractArrayFromResponse(sizingProductionResponse);
          lastNumber = this.extractLastNumberFromOrders(sizingProductions, 'sizingProductionNo', prefix, financialYear, separator);
          break;

        case 'Weaving Production':
          const weavingProductionResponse = await apiService.get('/weaving-production', { limit: 1000 });
          const weavingProductions = this.extractArrayFromResponse(weavingProductionResponse);
          lastNumber =
            this.extractLastNumberFromOrders(weavingProductions, 'weavingProductionNo', prefix, financialYear, separator);
          break;

        case 'Beam Outward':
          // Query beam outward entries
          const beamOutwardResponse = await apiService.get('/beam-outward', { limit: 1000 });
          const beamOutwards = this.extractArrayFromResponse(beamOutwardResponse);
          lastNumber =
            this.extractLastNumberFromOrders(beamOutwards, 'outwardNo', prefix, financialYear, separator) ||
            this.extractLastNumberFromOrders(beamOutwards, 'beamOutwardNo', prefix, financialYear, separator);
          break;

        // case 'Sizing Plan Entry':
        //   // Query sizing plans
        //   const sizingPlanResponse = await apiService.get('/sizing-plan', { limit: 1000 });
        //   const sizingPlans = this.extractArrayFromResponse(sizingPlanResponse);
        //   lastNumber = this.extractLastNumberFromOrders(sizingPlans, 'sizingPlanNo', prefix, financialYear, separator);
        //   break;

        case 'Jobwork Fabric Receive': {
          const targetCompanyId = companyId ?? resolveSelectedCompanyId();
          if (!targetCompanyId) {
            console.warn('[DocumentNumberService] No companyId available for Jobwork Fabric Receive');
            break;
          }
          const jobworkFabricResponse = await apiService.get(`/jobwork-fabric-receive/company/${targetCompanyId}`, { limit: 1000 });
          const jobworkFabrics = this.extractArrayFromResponse(jobworkFabricResponse);
          lastNumber = this.extractLastNumberFromOrders(jobworkFabrics, 'receiveNo', prefix, financialYear, separator);
          break;
        }

        case 'Bale/Roll Packing':
          // Query bale roll packing records  
          const baleRollSlashResponse = await apiService.get('/bale-roll-packing', { limit: 1000 });
          const baleRollsSlash = this.extractArrayFromResponse(baleRollSlashResponse);
          console.log('[DocumentNumberService] Bale/Roll Packing - Total records:', baleRollsSlash.length);

          // Try rollOrBaleNo field first (primary field)
          lastNumber = this.extractLastNumberFromOrders(baleRollsSlash, 'rollOrBaleNo', prefix, financialYear, separator);
          console.log('[DocumentNumberService] Bale/Roll Packing - Last number from rollOrBaleNo:', lastNumber);

          // If rollOrBaleNo didn't yield results, try packingNo as fallback
          if (!lastNumber) {
            console.log('[DocumentNumberService] Trying packingNo field as fallback...');
            lastNumber = this.extractLastNumberFromOrders(baleRollsSlash, 'packingNo', prefix, financialYear, separator);
            console.log('[DocumentNumberService] Bale/Roll Packing - Last number from packingNo:', lastNumber);
          }

          console.log('[DocumentNumberService] Bale/Roll Packing - Final last number:', lastNumber);
          break;

        case 'Generate Packing List':
          if (tabName === 'domestic') {
            // Query domestic packing lists
            const domesticPackingListResponse = await apiService.get('/generate-packing-list', {
              limit: 1000, type: 'domestic'
            });
            const domesticPackingLists = this.extractArrayFromResponse(domesticPackingListResponse);
            lastNumber = this.extractLastNumberFromOrders(domesticPackingLists, 'packingListNo', prefix, financialYear, separator);
          } else if (tabName === 'export') {
            // Query export packing lists
            const exportPackingListResponse = await apiService.get('/generate-packing-list', {
              limit: 1000, type: 'export'
            });
            const exportPackingLists = this.extractArrayFromResponse(exportPackingListResponse);
            lastNumber = this.extractLastNumberFromOrders(exportPackingLists, 'packingListNo', prefix, financialYear, separator);
          }
          break;

        case 'Packing List Management':
          // Query all packing lists (API may not support type filtering)
          console.log('[DocumentNumberService] Querying packing lists for:', { screenName, tabName, prefix, financialYear });
          const packingListResponse = await apiService.get('/generate-packing', { limit: 1000 });
          const allPackingLists = this.extractArrayFromResponse(packingListResponse);
          console.log('[DocumentNumberService] All packing lists fetched:', allPackingLists.length, allPackingLists);
 lastNumber = this.extractLastNumberFromOrders(allPackingLists, 'packingSlipNo', prefix, financialYear, separator);
          // if (tabName === 'domestic') {
          //   // Filter domestic packing lists client-side
          //   const domesticPackingLists = allPackingLists.filter((packing: any) =>
          //     packing.orderType === 'Domestic' || packing.orderType === 'domestic'
          //   );
          //   console.log('[DocumentNumberService] Domestic packing lists:', domesticPackingLists.length, domesticPackingLists.map(p => ({ id: p.id, packingListNo: p.packingListNo, orderType: p.orderType })));
          //   lastNumber = this.extractLastNumberFromOrders(domesticPackingLists, 'packingListNo', prefix, financialYear, separator);
          // } else if (tabName === 'export') {
          //   // Filter export packing lists client-side
          //   const exportPackingLists = allPackingLists.filter((packing: any) =>
          //     packing.orderType === 'Export' || packing.orderType === 'export'
          //   );
          //   console.log('[DocumentNumberService] Export packing lists:', exportPackingLists.length, exportPackingLists.map(p => ({ id: p.id, packingListNo: p.packingListNo, orderType: p.orderType })));
          //   lastNumber = this.extractLastNumberFromOrders(exportPackingLists, 'packingListNo', prefix, financialYear, separator);
          // }
          console.log('[DocumentNumberService] Last number found:', lastNumber);
          break;

        case 'Generate Invoice':
          // Query all invoices (API may not support type filtering)
          console.log('[DocumentNumberService] Querying invoices for:', { screenName, tabName, prefix, financialYear });
          const invoiceResponse = await apiService.get('/invoices', { limit: 1000 });
          const allInvoices = this.extractArrayFromResponse(invoiceResponse);
          console.log('[DocumentNumberService] All invoices fetched:', allInvoices.length, allInvoices);

          const normalizedInvoiceTab = typeof tabName === 'string' ? tabName.trim().toLowerCase() : '';
          const targetInvoiceTypeIds = normalizedInvoiceTab ? INVOICE_TAB_TYPE_MAP[normalizedInvoiceTab] || [] : [];
          const isInvoiceTab = normalizedInvoiceTab.startsWith('invoice');
          let invoicesToProcess = allInvoices;

          if (targetInvoiceTypeIds.length > 0) {
            const filteredByType = allInvoices.filter((invoice: any) => {
              const rawTypeId = invoice?.invoiceTypeId ?? invoice?.invoiceType?.id;
              const numericTypeId = Number(rawTypeId);
              return !Number.isNaN(numericTypeId) && targetInvoiceTypeIds.includes(numericTypeId);
            });
            if (filteredByType.length > 0) {
              invoicesToProcess = filteredByType;
            }
            console.log(`[DocumentNumberService] Filtered invoices by type ${targetInvoiceTypeIds.join(',')}:`, filteredByType.length, filteredByType.map(i => ({ id: i.id, invoiceNo: i.invoiceNo, invoiceTypeId: i.invoiceTypeId })));
          }

          if (isInvoiceTab && prefix) {
            const filteredByPrefix = invoicesToProcess.filter((invoice: any) => {
              const invoiceNo = invoice?.invoiceNo || '';
              return typeof invoiceNo === 'string' && invoiceNo.startsWith(prefix);
            });
            if (filteredByPrefix.length > 0) {
              invoicesToProcess = filteredByPrefix;
            }
            console.log(`[DocumentNumberService] Filtered invoices for ${tabName}:`, filteredByPrefix.length, filteredByPrefix.map(i => ({ id: i.id, invoiceNo: i.invoiceNo })));
          }

          lastNumber = this.extractLastNumberFromOrders(invoicesToProcess, 'invoiceNo', prefix, financialYear, separator);
          console.log('[DocumentNumberService] Last number found:', lastNumber);
          break;

        case 'Processing Issue Management':
          // Query processing issues from fabric-dispatch endpoint
          const processingIssueResponse = await apiService.get('/fabric-dispatch', { limit: 1000 });
          const processingIssues = this.extractArrayFromResponse(processingIssueResponse);

          if (tabName === 'processIssueFabric') {
            // Filter fabric issues (case-insensitive)
            const fabricIssues = processingIssues.filter((issue: any) =>
              issue.processType?.toUpperCase() === 'FABRIC'
            );
            lastNumber = this.extractLastNumberFromOrders(fabricIssues, 'fabricDispatchId', prefix, financialYear, separator);
          } else if (tabName === 'processIssueYarn') {
            // Filter yarn issues (case-insensitive)
            const yarnIssues = processingIssues.filter((issue: any) =>
              issue.processType?.toUpperCase() === 'YARN'
            );
            lastNumber = this.extractLastNumberFromOrders(yarnIssues, 'fabricDispatchId', prefix, financialYear, separator);
          }
          break;

        case 'Processing Receive Management':
          // Query processing receives from finish-fabric-receives endpoint
          const processingReceiveResponse = await apiService.get('/finish-fabric-receives', { limit: 1000 });
          const processingReceives = this.extractArrayFromResponse(processingReceiveResponse);

          if (tabName === 'fabric') {
            // Filter fabric receives (case-insensitive)
            const fabricReceives = processingReceives.filter((receive: any) =>
              receive.processType?.toUpperCase() === 'FABRIC'
            );
            lastNumber = this.extractLastNumberFromOrders(fabricReceives, 'receiveNo', prefix, financialYear, separator);
          } else if (tabName === 'yarn') {
            // Filter yarn receives (case-insensitive)
            const yarnReceives = processingReceives.filter((receive: any) =>
              receive.processType?.toUpperCase() === 'YARN'
            );
            lastNumber = this.extractLastNumberFromOrders(yarnReceives, 'receiveNo', prefix, financialYear, separator);
          }
          break;

        case 'Process Contract Management':
          // Query process contracts based on fabric/yarn type
          const processContractMgmtResponse = await apiService.get('/dyeing-work-orders', { limit: 1000 });
          const processContractsMgmt = this.extractArrayFromResponse(processContractMgmtResponse);

          if (tabName === 'processContactFabric') {
            // Filter fabric contracts (case-insensitive)
            const fabricContracts = processContractsMgmt.filter((contract: any) =>
              contract.processType?.toUpperCase() === 'FABRIC'
            );
            lastNumber = this.extractLastNumberFromOrders(fabricContracts, 'dyeingWorkOrderNo', prefix, financialYear, separator);
          } else if (tabName === 'processContactYarn') {
            // Filter yarn contracts (case-insensitive)
            const yarnContracts = processContractsMgmt.filter((contract: any) =>
              contract.processType?.toUpperCase() === 'YARN'
            );
            lastNumber = this.extractLastNumberFromOrders(yarnContracts, 'dyeingWorkOrderNo', prefix, financialYear, separator);
          }
          break;

        case 'Process Contract Entry':
          // Query process contracts
          const processContractResponse = await apiService.get('/process-contract-entry', { limit: 1000 });
          const processContracts = this.extractArrayFromResponse(processContractResponse);
          lastNumber = this.extractLastNumberFromOrders(processContracts, 'contractNo', prefix, financialYear, separator);
          break;

        case 'Process Contract Yarn Entry':
          // Query process contract yarn entries
          const contractYarnResponse = await apiService.get('/process-contract-yarn-entry', { limit: 1000 });
          const contractYarns = this.extractArrayFromResponse(contractYarnResponse);
          lastNumber = this.extractLastNumberFromOrders(contractYarns, 'entryNo', prefix, financialYear, separator);
          break;

        case 'Processing Receive Yarn':
          // Query processing yarn receipts
          const processingReceiveYarnResponse = await apiService.get('/processing-receive-yarn', { limit: 1000 });
          const processingReceiveYarns = this.extractArrayFromResponse(processingReceiveYarnResponse);
          lastNumber = this.extractLastNumberFromOrders(processingReceiveYarns, 'receiveNo', prefix, financialYear, separator);
          break;

        case 'Processing Receive Fabric':
          // Query processing fabric receipts
          const processingReceiveFabricResponse = await apiService.get('/processing-receive-fabric', { limit: 1000 });
          const processingReceiveFabrics = this.extractArrayFromResponse(processingReceiveFabricResponse);
          lastNumber = this.extractLastNumberFromOrders(processingReceiveFabrics, 'receiveNo', prefix, financialYear, separator);
          break;

        case 'Yarn Return Details':
          // Query yarn returns
          const yarnReturnResponse = await apiService.get('/yarn-return', { limit: 1000 });
          const yarnReturns = this.extractArrayFromResponse(yarnReturnResponse);
          lastNumber = this.extractLastNumberFromOrders(yarnReturns, 'inwardNumber', prefix, financialYear, separator);
          break;

        case 'Beam Cut':
          const beamCutResponse = await apiService.get('/beam-cut', { limit: 1000 });
          const beamCuts = this.extractArrayFromResponse(beamCutResponse);
          lastNumber = this.extractLastNumberFromOrders(beamCuts, 'beamCutNo', prefix, financialYear, separator);
          break;

        case 'Sizing Flange Inward':
          const flangeInwardResponse = await apiService.get('/flange-inward', { limit: 1000 });
          const flangeInwards = this.extractArrayFromResponse(flangeInwardResponse);
          lastNumber = this.extractLastNumberFromOrders(flangeInwards, 'flangeInwardNo', prefix, financialYear, separator);
          break;

        case 'Empty Beam Issue':
          const flangeIssueResponse = await apiService.get('/flange_issue', { limit: 1000 });
          const flangeIssues = this.extractArrayFromResponse(flangeIssueResponse);
          lastNumber = this.extractLastNumberFromOrders(flangeIssues, 'flangeIssueNo', prefix, financialYear, separator);
          if (!lastNumber) {
            lastNumber = this.extractLastNumberFromOrders(flangeIssues, 'emptyBeamNo', prefix, financialYear, separator);
          }
          break;

        case 'Yarn Challan':
          const yarnChallanResponse = await apiService.get('/yarn-challan', { limit: 1000 });
          const yarnChallans = this.extractArrayFromResponse(yarnChallanResponse);
          lastNumber = this.extractLastNumberFromOrders(yarnChallans, 'challanNo', prefix, financialYear, separator);
          break;

        case 'Yarn Sales':
          const yarnSalesResponse = await apiService.get('/yarn-sales-orders', { limit: 1000 });
          const yarnSales = this.extractArrayFromResponse(yarnSalesResponse);
          lastNumber = this.extractLastNumberFromOrders(yarnSales, 'yarnSalesNo', prefix, financialYear, separator);
          break;

        case 'Doffing Entry':
          const doffingResponse = await apiService.get('/piece-entries', { limit: 1000 });
          const doffingEntries = this.extractArrayFromResponse(doffingResponse);
          lastNumber = this.extractLastNumberFromOrders(doffingEntries, 'doffingNo', prefix, financialYear, separator);
          break;

        case 'Material Issue':
          // Query item outwards
          const itemOutwardResponse = await apiService.get('/item-outward', { limit: 1000 });
          const itemOutwards = this.extractArrayFromResponse(itemOutwardResponse);
          lastNumber = this.extractLastNumberFromOrders(itemOutwards, 'outwardNo', prefix, financialYear, separator);
          break;

        case 'Employee Payout':
          const employeePayoutResponse = await apiService.get('/allowance-advance', { limit: 1000 });
          const employeePayouts = this.extractArrayFromResponse(employeePayoutResponse);
          lastNumber = this.extractLastNumberFromOrders(employeePayouts, 'voucherNo', prefix, financialYear, separator);
          break;

        default:
          console.warn(`No query logic for screen: ${screenName}`);
          break;
      }

      return lastNumber;
    } catch (error) {
      console.warn('Failed to query existing transaction data:', error);
      return null;
    }
  }

  private extractLastNumberFromOrders(
    orders: any[],
    numberField: string,
    prefix: string,
    financialYear: string,
    separator: string
  ): string | null {
    if (!orders || orders.length === 0) {
      console.log('[extractLastNumberFromOrders] No orders provided');
      return null;
    }

    const sep = separator || '/';
    const oldPrefix = financialYear ? `${prefix}${sep}${financialYear}${sep}` : `${prefix}${sep}`;
    const newPrefix = `${prefix}${sep}`;
    const newSuffix = financialYear ? `${sep}${financialYear}` : '';

    console.log('[extractLastNumberFromOrders] ========================================');
    console.log('[extractLastNumberFromOrders] Looking for prefix/suffix patterns:', { oldPrefix, newPrefix, newSuffix });
    console.log('[extractLastNumberFromOrders] Number field:', numberField);
    console.log('[extractLastNumberFromOrders] Total orders:', orders.length);

    // First try: Filter only active records (activeFlag !== false)
    let ordersList = orders.filter(order => order.activeFlag !== false);
    console.log('[extractLastNumberFromOrders] Active orders (activeFlag !== false):', ordersList.length);

    // If no active records found, try all records regardless of activeFlag
    if (ordersList.length === 0) {
      console.log('[extractLastNumberFromOrders] No active records found, trying all records...');
      ordersList = orders;
    }

    let highestNumber = 0;
    const validMatches: any[] = [];

    for (const order of ordersList) {
      const orderNumber = order[numberField];

      // Skip null/undefined/empty values
      if (!orderNumber || typeof orderNumber !== 'string') {
        continue;
      }

      let sequencePart: string | null = null;

      // Pattern 1: New format: prefix/sequence/financialYear (e.g. HFPL/IO/001/26-27)
      if (newSuffix && orderNumber.startsWith(newPrefix) && orderNumber.endsWith(newSuffix)) {
        sequencePart = orderNumber.substring(newPrefix.length, orderNumber.length - newSuffix.length);
      }
      // Pattern 2: Old format: prefix/financialYear/sequence (e.g. HFPL/IO/26-27/001)
      else if (oldPrefix && orderNumber.startsWith(oldPrefix)) {
        sequencePart = orderNumber.substring(oldPrefix.length);
        if (sequencePart.includes(sep)) {
          sequencePart = sequencePart.split(sep)[0];
        }
      }
      // Pattern 3: Simple format: prefix/sequence
      else if (orderNumber.startsWith(newPrefix)) {
        const temp = orderNumber.substring(newPrefix.length);
        const parts = temp.split(sep);
        for (const part of parts) {
          if (/^\d+$/.test(part)) {
            sequencePart = part;
            break;
          }
        }
      }

      if (sequencePart) {
        const sequenceNum = parseInt(sequencePart, 10);

        if (!isNaN(sequenceNum)) {
          validMatches.push({
            id: order.id,
            orderNumber,
            sequenceNum,
            activeFlag: order.activeFlag
          });

          if (sequenceNum > highestNumber) {
            highestNumber = sequenceNum;
          }
        }
      }
    }

    console.log('[extractLastNumberFromOrders] Valid matches found:', validMatches.length);
    
    if (validMatches.length > 0) {
      // Sort and show top 5
      validMatches.sort((a, b) => b.sequenceNum - a.sequenceNum);
      console.log('[extractLastNumberFromOrders] Top 5 sequences:', 
        validMatches.slice(0, 5).map(m => `${m.orderNumber} (seq: ${m.sequenceNum}, active: ${m.activeFlag})`).join(', ')
      );
      console.log('[extractLastNumberFromOrders] ✅ Highest sequence number:', highestNumber);
    } else {
      console.log('[extractLastNumberFromOrders] ⚠️ No matching records found');
    }

    console.log('[extractLastNumberFromOrders] ========================================');

    return highestNumber > 0 ? highestNumber.toString() : null;
  }


  /**
   * Generate fallback document number
   */
  private async generateFallbackDocumentNumber(screenName: string, tabName?: string): Promise<DocumentNumberResponse> {
    console.log(`[DocumentNumberService] Using fallback generation for screen: "${screenName}", tab: "${tabName}"`);

    let prefix = 'DOC';
    const sequence = '001';

    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const fy = `${currentYear % 100}-${nextYear % 100}`;
    const documentNumber = `${prefix}/${sequence}/${fy}`;

    return {
      documentNumber,
      configuration: {
        id: 0,
        screenName,
        tabName: String(tabName),
        prefix,
        sequenceNumber: sequence,
        financialYear: fy,
        separator: '/',
        activeFlag: true
      } as NumberFormatConfiguration
    };
  }

  /**
   * Increment the sequence number
   */
  private incrementSequenceNumber(lastNumber: string, configuration: NumberFormatConfiguration): string {
    const lastNum = parseInt(lastNumber, 10);
    
    if (isNaN(lastNum)) {
      console.warn('[incrementSequenceNumber] Invalid lastNumber, using config sequence');
      return configuration.sequenceNumber;
    }

    const nextNum = lastNum + 1;
    
    // Preserve leading zeros if present in configuration
    const configLength = configuration.sequenceNumber.length;
    if (configuration.sequenceNumber.startsWith('0') && configLength > 1) {
      return nextNum.toString().padStart(configLength, '0');
    }

    return nextNum.toString();
  }
  
  /**
   * Format the document number
   */
  private formatDocumentNumber(sequenceNumber: string, configuration: NumberFormatConfiguration): string {
    const { prefix, financialYear, separator } = configuration;
    return [prefix, sequenceNumber, financialYear]
      .filter(Boolean)
      .join(separator || '');
  }

  /**
   * Validate document number format
   */
  async validateDocumentNumber(documentNumber: string, screenName: string, tabName?: string | number): Promise<boolean> {
    try {
      const normalizedTabName = this.normalizeTabName(screenName, tabName);
      const companyId = resolveSelectedCompanyId();
      const configuration = await this.getConfiguration(screenName, normalizedTabName, companyId);

      if (!configuration) return false;

      const { prefix, financialYear, separator } = configuration;
      const escPrefix = (prefix || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const escFy = (financialYear || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const escSep = (separator || '/').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

      const patternNew = `^${escPrefix}${escSep}.+${escSep}${escFy}$`;
      const patternOld = `^${escPrefix}${escSep}${escFy}${escSep}.+$`;

      return new RegExp(`(${patternNew})|(${patternOld})`).test(documentNumber);
    } catch (error) {
      console.error('Failed to validate document number:', error);
      return false;
    }
  }
}

export { DocumentNumberService };
export const documentNumberService = DocumentNumberService.getInstance();
export default documentNumberService;