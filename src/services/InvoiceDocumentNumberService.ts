
import { NumberFormatConfiguration } from "@/state/numberFormatConfigurationSlice";

export interface DocumentNumberRequest {
  screenName: string;
  tabName?: string | number;
}

export interface DocumentNumberResponse {
  documentNumber: string;
  configuration: NumberFormatConfiguration;
}

class InvoiceDocumentNumberService {
  private static instance: InvoiceDocumentNumberService;
  private cache: Map<string, NumberFormatConfiguration[]> = new Map();
  private generatedSequenceMemory: Map<string, string> = new Map();
  private deletedSequencesMemory: Map<string, Set<number>> = new Map();
  private lastGeneratedSequence: Map<string, number> = new Map(); // Track last generated sequence per tab

  private constructor() { }

  static getInstance(): InvoiceDocumentNumberService {
    if (!InvoiceDocumentNumberService.instance) {
      InvoiceDocumentNumberService.instance = new InvoiceDocumentNumberService();
    }
    return InvoiceDocumentNumberService.instance;
  }

  /**
   * Normalize tab name for invoice screen
   */
  private normalizeTabName(tabName?: string | number): string | undefined {
    if (tabName === null || tabName === undefined) {
      return 'INVC';
    }

    if (typeof tabName === 'string') {
      const normalized = tabName.trim().toLowerCase();
      if (normalized.startsWith('invoice')) {
        return normalized;
      }
    }

    // Map numeric values
    if (tabName === 201 || tabName === '201') return 'invoiceDomestic';
    if (tabName === 202 || tabName === '202') return 'invoiceExport';
    if (tabName === 203 || tabName === '203') return 'invoiceJobwork';
    if (tabName === 204 || tabName === '204') return 'invoiceSizingSales';
    if (tabName === 205 || tabName === '205') return 'invoiceYarnSales';

    return 'INVC';
  }

  /**
   * Generate the next document number for invoice
   */
  async generateDocumentNumber(request: DocumentNumberRequest): Promise<DocumentNumberResponse> {
    const { screenName } = request;
    const normalizedTabName = this.normalizeTabName(request.tabName);

    console.log('========================================');
    console.log('[InvoiceDocumentNumberService] 🔵 NEW INVOICE NUMBER REQUEST');
    console.log('[InvoiceDocumentNumberService] Screen:', screenName);
    console.log('[InvoiceDocumentNumberService] Tab:', normalizedTabName);

    const configuration = await this.getConfiguration(screenName, normalizedTabName);

    if (!configuration) {
      console.warn('[InvoiceDocumentNumberService] ⚠️ No configuration found - using fallback');
      return this.generateFallbackDocumentNumber(screenName, normalizedTabName);
    }

    console.log('[InvoiceDocumentNumberService] Configuration:', {
      prefix: configuration.prefix,
      financialYear: configuration.financialYear,
      sequenceNumber: configuration.sequenceNumber
    });

    // Get next available number
    const nextNumber = await this.getNextAvailableNumber(configuration, screenName, normalizedTabName);
    
    const documentNumber = this.formatDocumentNumber(nextNumber, configuration);
    console.log('[InvoiceDocumentNumberService] ✅ Generated:', documentNumber);

    // Store in memory
    const memoryKey = this.getMemoryKey(screenName, normalizedTabName);
    this.generatedSequenceMemory.set(memoryKey, nextNumber);
    this.lastGeneratedSequence.set(memoryKey, parseInt(nextNumber, 10));
    
    console.log('[InvoiceDocumentNumberService] 🟢 COMPLETE');
    console.log('========================================');

    return {
      documentNumber,
      configuration
    };
  }

  /**
   * Get next available number with first/last deletion logic
   */
  private async getNextAvailableNumber(
    configuration: NumberFormatConfiguration,
    screenName: string,
    tabName?: string
  ): Promise<string> {
    try {
      const memoryKey = this.getMemoryKey(screenName, tabName);
      console.log('[getNextAvailableNumber] ========================================');
      console.log('[getNextAvailableNumber] Looking for next available number');
      console.log('[getNextAvailableNumber] Memory key:', memoryKey);

      // STEP 1: Check memory cache for current session
      const cachedSequence = this.generatedSequenceMemory.get(memoryKey);
      if (cachedSequence) {
        console.log(`[getNextAvailableNumber] ✅ Using memory cache: "${cachedSequence}"`);
        console.log('[getNextAvailableNumber] ========================================');
        return cachedSequence;
      }

      // STEP 2: Get all used sequences from database
      const usedSequences = await this.getUsedSequencesFromDatabase(configuration);
      console.log('[getNextAvailableNumber] Used sequences:', Array.from(usedSequences).sort((a, b) => a - b));

      // STEP 3: Get deleted sequences from memory
      const deletedSequences = this.deletedSequencesMemory.get(memoryKey) || new Set<number>();
      console.log('[getNextAvailableNumber] Deleted sequences:', Array.from(deletedSequences).sort((a, b) => a - b));

      const initialSequence = parseInt(configuration.sequenceNumber, 10) || 1;
      
      // If no records exist at all
      if (usedSequences.size === 0 && deletedSequences.size === 0) {
        console.log(`[getNextAvailableNumber] ℹ️ No existing records, using initial: "${initialSequence}"`);
        console.log('[getNextAvailableNumber] ========================================');
        return initialSequence.toString();
      }

      // STEP 4: Determine first and last sequences
      const allSequences = new Set([...usedSequences, ...deletedSequences]);
      if (allSequences.size === 0) {
        console.log(`[getNextAvailableNumber] ℹ️ No sequences found, using initial: "${initialSequence}"`);
        console.log('[getNextAvailableNumber] ========================================');
        return initialSequence.toString();
      }

      const sortedAll = Array.from(allSequences).sort((a, b) => a - b);
      const firstSequence = sortedAll[0];
      const lastSequence = sortedAll[sortedAll.length - 1];
      
      console.log('[getNextAvailableNumber] First sequence:', firstSequence);
      console.log('[getNextAvailableNumber] Last sequence:', lastSequence);

      // STEP 5: Check if first sequence is deleted and available
      if (deletedSequences.has(firstSequence)) {
        console.log(`[getNextAvailableNumber] 🔄 Reusing deleted FIRST sequence: "${firstSequence}"`);
        // Remove from deleted sequences since we're reusing it
        deletedSequences.delete(firstSequence);
        if (deletedSequences.size === 0) {
          this.deletedSequencesMemory.delete(memoryKey);
        } else {
          this.deletedSequencesMemory.set(memoryKey, deletedSequences);
        }
        console.log('[getNextAvailableNumber] ========================================');
        return firstSequence.toString();
      }

      // STEP 6: Check if last sequence is deleted and available
      if (deletedSequences.has(lastSequence)) {
        console.log(`[getNextAvailableNumber] 🔄 Reusing deleted LAST sequence: "${lastSequence}"`);
        // Remove from deleted sequences since we're reusing it
        deletedSequences.delete(lastSequence);
        if (deletedSequences.size === 0) {
          this.deletedSequencesMemory.delete(memoryKey);
        } else {
          this.deletedSequencesMemory.set(memoryKey, deletedSequences);
        }
        console.log('[getNextAvailableNumber] ========================================');
        return lastSequence.toString();
      }

      // STEP 7: If no first/last deleted sequences, find the highest used sequence
      if (usedSequences.size > 0) {
        const sortedUsed = Array.from(usedSequences).sort((a, b) => a - b);
        const highestUsed = sortedUsed[sortedUsed.length - 1];
        
        // Check if there are any gaps in used sequences
        for (let i = initialSequence; i < highestUsed; i++) {
          if (!usedSequences.has(i) && !deletedSequences.has(i)) {
            // This is a gap that was never used (not a deletion)
            console.log(`[getNextAvailableNumber] 🔄 Filling unused gap: "${i}"`);
            console.log('[getNextAvailableNumber] ========================================');
            return i.toString();
          }
        }
        
        // No gaps, use next number after highest used
        const nextNumber = highestUsed + 1;
        console.log(`[getNextAvailableNumber] 📈 Using next sequential number: "${nextNumber}"`);
        console.log('[getNextAvailableNumber] ========================================');
        return nextNumber.toString();
      }

      // STEP 8: If we have only deleted sequences but none are first/last
      // Find the smallest deleted sequence
      if (deletedSequences.size > 0) {
        const sortedDeleted = Array.from(deletedSequences).sort((a, b) => a - b);
        const smallestDeleted = sortedDeleted[0];
        console.log(`[getNextAvailableNumber] 🔄 Reusing smallest deleted sequence: "${smallestDeleted}"`);
        // Remove from deleted sequences
        deletedSequences.delete(smallestDeleted);
        if (deletedSequences.size === 0) {
          this.deletedSequencesMemory.delete(memoryKey);
        } else {
          this.deletedSequencesMemory.set(memoryKey, deletedSequences);
        }
        console.log('[getNextAvailableNumber] ========================================');
        return smallestDeleted.toString();
      }

      // STEP 9: Fallback - use initial sequence
      console.log(`[getNextAvailableNumber] ⚠️ Fallback to initial: "${initialSequence}"`);
      console.log('[getNextAvailableNumber] ========================================');
      return initialSequence.toString();

    } catch (error) {
      console.error('[getNextAvailableNumber] ❌ Error:', error);
      console.log('[getNextAvailableNumber] ========================================');
      return configuration.sequenceNumber;
    }
  }

  /**
   * Get used sequences from database
   */
  private async getUsedSequencesFromDatabase(
    configuration: NumberFormatConfiguration
  ): Promise<Set<number>> {
    const { prefix, financialYear, separator } = configuration;
    const usedSequences = new Set<number>();

    try {
      const { default: apiService } = await import('./ApiService');
      
      const invoiceResponse = await apiService.get('/invoices');
      const allInvoices = this.extractArrayFromResponse(invoiceResponse);
      
      const expectedPrefix = `${prefix}${separator}${financialYear}${separator}`;

      allInvoices.forEach((invoice: any) => {
        const invoiceNo = invoice?.invoiceNo;
        if (!invoiceNo || typeof invoiceNo !== 'string') return;

        if (invoiceNo.startsWith(expectedPrefix)) {
          const sequencePart = invoiceNo.substring(expectedPrefix.length);
          const sequenceNum = parseInt(sequencePart, 10);
          
          if (!isNaN(sequenceNum)) {
            usedSequences.add(sequenceNum);
          }
        }
      });

      return usedSequences;

    } catch (error) {
      console.warn('[getUsedSequencesFromDatabase] Failed to query invoices:', error);
      return new Set<number>();
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

  /**
   * Create a unique key for storing generated sequences in memory
   */
  private getMemoryKey(screenName: string, tabName?: string): string {
    const normalizedTabName = tabName !== null && tabName !== undefined ? String(tabName).trim() : 'default';
    return `${screenName}:${normalizedTabName}`;
  }

  /**
   * Clear the configuration cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update memory cache with new sequence
   */
  updateMemoryCache(screenName: string, sequenceNumber: string, tabName?: string | number): void {
    const normalizedTabName = this.normalizeTabName(tabName);
    const memoryKey = this.getMemoryKey(screenName, normalizedTabName);
    this.generatedSequenceMemory.set(memoryKey, sequenceNumber);
    const seqNum = parseInt(sequenceNumber, 10);
    if (!isNaN(seqNum)) {
      this.lastGeneratedSequence.set(memoryKey, seqNum);
    }
    console.log(`[InvoiceDocumentNumberService.updateMemoryCache] Updated cache for ${memoryKey}: ${sequenceNumber}`);
  }

  /**
   * Track a deleted sequence number
   */
  trackDeletedSequence(screenName: string, sequenceNumber: string, tabName?: string | number): void {
    const normalizedTabName = this.normalizeTabName(tabName);
    const memoryKey = this.getMemoryKey(screenName, normalizedTabName);
    const seqNum = parseInt(sequenceNumber, 10);
    
    if (!isNaN(seqNum)) {
      let deletedSequences = this.deletedSequencesMemory.get(memoryKey) || new Set<number>();
      deletedSequences.add(seqNum);
      this.deletedSequencesMemory.set(memoryKey, deletedSequences);
      console.log(`[InvoiceDocumentNumberService.trackDeletedSequence] Tracked deleted sequence ${seqNum} for ${memoryKey}`);
      
      // If this was the last generated sequence, update it
      const lastGen = this.lastGeneratedSequence.get(memoryKey);
      if (lastGen === seqNum) {
        // Find the next highest sequence that's not deleted
        const usedSequences = new Set<number>();
        // We need to get used sequences to find the new last
        // For now, just remove it from lastGenerated
        this.lastGeneratedSequence.delete(memoryKey);
      }
    }
  }

  /**
   * Clear memory cache
   */
  clearMemoryCache(screenName?: string, tabName?: string | number): void {
    if (screenName) {
      const normalizedTabName = this.normalizeTabName(tabName);
      const memoryKey = this.getMemoryKey(screenName, normalizedTabName);
      this.generatedSequenceMemory.delete(memoryKey);
      this.deletedSequencesMemory.delete(memoryKey);
      this.lastGeneratedSequence.delete(memoryKey);
      console.log(`[InvoiceDocumentNumberService.clearMemoryCache] Cleared cache for ${memoryKey}`);
    } else {
      this.generatedSequenceMemory.clear();
      this.deletedSequencesMemory.clear();
      this.lastGeneratedSequence.clear();
      console.log(`[InvoiceDocumentNumberService.clearMemoryCache] Cleared all memory cache`);
    }
  }

  /**
   * Get configuration from database
   */
  private async getConfiguration(screenName: string, tabName?: string): Promise<NumberFormatConfiguration | null> {
    const configurations = await this.getAllConfigurations();

    const match = configurations.find(config => {
      const screenNameMatch = config.screenName === screenName;
      const tabNameMatch = (config.tabName === null || config.tabName === undefined)
        ? (tabName === null || tabName === undefined)
        : String(config.tabName) === String(tabName);
      const activeFlagMatch = config.activeFlag === true;

      return screenNameMatch && tabNameMatch && activeFlagMatch;
    });

    if (match) {
      return match;
    }

    if (tabName !== null && tabName !== undefined) {
      const fallbackMatch = configurations.find(config =>
        config.screenName === screenName &&
        (config.tabName === null || config.tabName === undefined) &&
        config.activeFlag === true
      );

      if (fallbackMatch) {
        return fallbackMatch;
      }
    }

    return null;
  }

  /**
   * Get all number format configurations
   */
  private async getAllConfigurations(): Promise<NumberFormatConfiguration[]> {
    const cacheKey = 'all-configurations';
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (cached.length > 0) {
        return cached;
      }
    }

    try {
      const { default: apiService } = await import('./ApiService');
      const response = await apiService.get('/number-format-configurations?limit=1000&offset=0');

      let configurations = response.data || response || [];

      if (Array.isArray(configurations)) {
        // configurations is already an array
      } else if (configurations.data && Array.isArray(configurations.data)) {
        configurations = configurations.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        configurations = response.data.data;
      }

      this.cache.set(cacheKey, configurations);
      return configurations;
    } catch (error: any) {
      console.error('[InvoiceDocumentNumberService.getAllConfigurations] ❌ Failed to fetch configurations:', error);
      return [];
    }
  }

  /**
   * Generate fallback document number
   */
  private async generateFallbackDocumentNumber(screenName: string, tabName?: string): Promise<DocumentNumberResponse> {
    let prefix = 'INVC';
    let sequence = '001';

    if (tabName?.includes('Domestic') || tabName === '201') {
      prefix = 'DOM';
    } else if (tabName?.includes('Export') || tabName === '202') {
      prefix = 'EXP';
    } else if (tabName?.includes('Jobwork') || tabName === '203') {
      prefix = 'JWK';
    } else if (tabName?.includes('Sizing') || tabName === '204') {
      prefix = 'SIZ';
    } else if (tabName?.includes('Yarn') || tabName === '205') {
      prefix = 'YRN';
    }

    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const fy = `${currentYear % 100}-${nextYear % 100}`;
    const documentNumber = `${prefix}/${fy}/${sequence}`;

    return {
      documentNumber,
      configuration: {
        id: 0,
        screenName,
        tabName: String(tabName || 'INVC'),
        prefix,
        sequenceNumber: sequence,
        financialYear: fy,
        separator: '/',
        activeFlag: true
      } as NumberFormatConfiguration
    };
  }

  /**
   * Format the document number
   */
  private formatDocumentNumber(sequenceNumber: string, configuration: NumberFormatConfiguration): string {
    const { prefix, financialYear, separator } = configuration;
    return [prefix, financialYear, sequenceNumber]
      .filter(Boolean)
      .join(separator || '/');
  }
}

export const invoiceDocumentNumberService = InvoiceDocumentNumberService.getInstance();
export default invoiceDocumentNumberService;