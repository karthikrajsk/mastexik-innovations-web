export interface CompanyInvoiceSetting {
  id?: number;
  invoiceTypeId: number;
  prefix: string;
  financialYear: string;
  sequenceNumber: string;
  preview: string;
}

interface InvoiceNumberParts {
  segments: string[];
  seqValue: number;
  digits: number;
  financialYear: string | null;
}

interface ExistingInvoiceRecord {
  invoiceTypeId?: number | string | null;
  invoiceType?: {
    id?: number | string | null;
  };
  invoiceNo?: string | null;
  companyId?: number | string | null;
  company_id?: number | string | null;
  company?: {
    id?: number | string | null;
    companyId?: number | string | null;
  };
}

export interface GenerateInvoiceNumberParams {
  invoiceTypeId?: number | null;
  invoiceSettings: CompanyInvoiceSetting[];
  invoices?: ExistingInvoiceRecord[] | null;
  companyId?: number | string | null;
  companyCode?: string | null;
}

export interface GenerateInvoiceNumberResult {
  invoiceTypeId: number;
  invoiceNo: string;
  sequenceUsed: number;
  nextSequence: number;
  nextSequenceFormatted: string;
  nextPreview: string;
}

const DEFAULT_SEQUENCE_DIGITS = 3;

const toNumericId = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isNaN(numeric) ? null : numeric;
};

class InvoiceNumberService {
  // src/services/InvoiceNumberService.ts:51

generateInvoiceNumber(params: GenerateInvoiceNumberParams): GenerateInvoiceNumberResult | null {
  const invoiceTypeId = toNumericId(params.invoiceTypeId);
  if (!invoiceTypeId) return null;
  const resolvedCompanyId = toNumericId(params.companyId);
  const companyCode = params.companyCode;

  const setting = this.resolveSetting(params.invoiceSettings, invoiceTypeId, companyCode);
  if (!setting) {
    console.warn(`[InvoiceGen] No setting found for invoiceTypeId: ${invoiceTypeId}`);
    return null;
  }

  const sequenceFromSetting = this.parseSequenceValue(setting.sequenceNumber) ?? 1;
  const digitsFromSetting = Math.max(String(setting.sequenceNumber || '').length || 0, DEFAULT_SEQUENCE_DIGITS);
  const previewContext = this.resolvePreview(setting, sequenceFromSetting, digitsFromSetting);
  const parts = previewContext.parts;
  
  const baseSequence = parts?.seqValue ?? sequenceFromSetting;
  const invoices = Array.isArray(params.invoices) ? params.invoices : [];
  
  // LOG: Initial state from settings
  console.log(`[InvoiceGen] Starting generation for type: ${invoiceTypeId}`);
  console.log(`[InvoiceGen] Base sequence from settings: ${baseSequence}`);

  const highestExistingSequence = this.findHighestSequence(
    invoices,
    invoiceTypeId,
    parts?.financialYear,
    resolvedCompanyId,
    companyCode
  );
  
  // LOG: Comparison logic
  console.log(`[InvoiceGen] Highest existing sequence found: ${highestExistingSequence}`);

  let sequenceToUse = baseSequence || 1;
  if (highestExistingSequence >= sequenceToUse) {
    sequenceToUse = highestExistingSequence + 1;
    console.log(`[InvoiceGen] Sequence bumped to: ${sequenceToUse}`);
  } else {
    console.log(`[InvoiceGen] Using base sequence: ${sequenceToUse}`);
  }

  const invoiceNo = parts
    ? this.rebuildInvoiceNumber(parts, sequenceToUse)
    : previewContext.preview;

  // LOG: Final Result
  console.log(`[InvoiceGen] Final Generated Invoice No: ${invoiceNo}`);

  return {
    invoiceTypeId,
    invoiceNo,
    sequenceUsed: sequenceToUse,
    nextSequence: sequenceToUse + 1,
    nextSequenceFormatted: this.formatSequence(sequenceToUse + 1, parts?.digits ?? digitsFromSetting),
    nextPreview: parts ? this.rebuildInvoiceNumber(parts, sequenceToUse + 1) : previewContext.preview
  };
}

  // generateInvoiceNumber(params: GenerateInvoiceNumberParams): GenerateInvoiceNumberResult | null {
  //   const invoiceTypeId = toNumericId(params.invoiceTypeId);
  //   if (!invoiceTypeId) {
  //     return null;
  //   }

  //   const setting = this.resolveSetting(params.invoiceSettings, invoiceTypeId);
  //   if (!setting) {
  //     return null;
  //   }

  //   const sequenceFromSetting = this.parseSequenceValue(setting.sequenceNumber) ?? 1;
  //   const digitsFromSetting = Math.max(String(setting.sequenceNumber || '').length || 0, DEFAULT_SEQUENCE_DIGITS);
  //   const previewContext = this.resolvePreview(setting, sequenceFromSetting, digitsFromSetting);
  //   const parts = previewContext.parts;
  //   const digits = parts?.digits ?? digitsFromSetting;
  //   const baseSequence = parts?.seqValue ?? sequenceFromSetting;
  //   const invoices = Array.isArray(params.invoices) ? params.invoices : [];
  //   const highestExistingSequence = this.findHighestSequence(invoices, invoiceTypeId, parts?.financialYear);

  //   let sequenceToUse = baseSequence || 1;
  //   if (highestExistingSequence >= sequenceToUse) {
  //     sequenceToUse = highestExistingSequence + 1;
  //   }

  //   const invoiceNo = parts
  //     ? this.rebuildInvoiceNumber(parts, sequenceToUse)
  //     : previewContext.preview;

  //   const nextSequence = sequenceToUse + 1;
  //   const nextPreview = parts
  //     ? this.rebuildInvoiceNumber(parts, nextSequence)
  //     : previewContext.preview;

  //   return {
  //     invoiceTypeId,
  //     invoiceNo,
  //     sequenceUsed: sequenceToUse,
  //     nextSequence,
  //     nextSequenceFormatted: this.formatSequence(nextSequence, digits),
  //     nextPreview
  //   };
  // }

  

  private resolveSetting(settings: CompanyInvoiceSetting[], invoiceTypeId: number, companyCode?: string | null): CompanyInvoiceSetting | null {
    if (!Array.isArray(settings)) {
      return null;
    }
    for (const entry of settings) {
      const entryId = toNumericId(entry?.invoiceTypeId);
      if (entryId && entryId === invoiceTypeId) {
        if (companyCode) {
          let prefix = entry.prefix || '';
          const token = `${companyCode}/`;
          if (prefix.startsWith(token)) {
            prefix = prefix.slice(token.length);
          } else if (prefix === companyCode) {
            prefix = '';
          }
          return {
            ...entry,
            prefix
          };
        }
        return entry;
      }
    }
    return null;
  }

  private resolvePreview(setting: CompanyInvoiceSetting, sequenceValue: number, digits: number) {
    const candidates = [setting.preview, this.buildPreview(setting, sequenceValue, digits)];
    for (const candidate of candidates) {
      const normalized = (candidate || '').toString().trim();
      if (!normalized) {
        continue;
      }
      const parsed = this.parseInvoiceNumberParts(normalized);
      if (parsed) {
        return { preview: normalized, parts: parsed };
      }
    }
    const fallback = this.buildPreview(setting, sequenceValue, digits);
    return { preview: fallback, parts: this.parseInvoiceNumberParts(fallback) };
  }

  private buildPreview(setting: CompanyInvoiceSetting, sequenceValue: number, digits: number): string {
    const parts = [
      (setting.prefix || '').toString().trim(),
      (setting.financialYear || '').toString().trim(),
      this.formatSequence(sequenceValue, digits)
    ].filter(Boolean);
    return parts.join('/');
  }

  private parseInvoiceNumberParts(value?: string | null): InvoiceNumberParts | null {
    if (!value) {
      return null;
    }
    const segments = value.split('/').map(segment => segment.trim()).filter(Boolean);
    if (!segments.length) {
      return null;
    }
    const seqToken = segments[segments.length - 1];
    const seqValue = Number(seqToken);
    if (Number.isNaN(seqValue)) {
      return null;
    }
    const financialYear = segments.length >= 2 ? segments[segments.length - 2] : null;
    return {
      segments,
      seqValue,
      digits: seqToken.length,
      financialYear
    };
  }

  private rebuildInvoiceNumber(parts: InvoiceNumberParts, nextSequence: number): string {
    const updated = parts.segments.slice();
    const targetIndex = updated.length - 1;
    updated[targetIndex] = this.formatSequence(nextSequence, parts.digits);
    return updated.join('/');
  }

  // src/services/InvoiceNumberService.ts:163

  private extractRecordCompanyId(record: ExistingInvoiceRecord): number | null {
    if (!record) return null;
    const candidates = [
      record.companyId,
      record.company_id,
      record.company?.id,
      record.company?.companyId
    ];
    for (const candidate of candidates) {
      const numeric = toNumericId(candidate);
      if (numeric !== null) {
        return numeric;
      }
    }
    return null;
  }

  private findHighestSequence(
    invoices: ExistingInvoiceRecord[],
    invoiceTypeId: number,
    financialYear?: string | null,
    companyId?: number | null,
    companyCode?: string | null
  ): number {
    if (!Array.isArray(invoices)) return 0;
    
    console.log(`[InvoiceGen] Scanning ${invoices.length} invoices for highest sequence...`);
    let highest = 0;

    invoices.forEach((invoice) => {
      const recordTypeId = toNumericId(invoice?.invoiceTypeId) ?? toNumericId(invoice?.invoiceType?.id);
      if (!recordTypeId || recordTypeId !== invoiceTypeId) return;

      if (companyId != null) {
        const recordCompanyId = this.extractRecordCompanyId(invoice);
        if (recordCompanyId === null || recordCompanyId !== companyId) {
          return;
        }
      }

      let invoiceNo = invoice?.invoiceNo ?? '';
      if (companyCode && invoiceNo) {
        const token = `${companyCode}/`;
        if (invoiceNo.startsWith(token)) {
          invoiceNo = invoiceNo.slice(token.length);
        }
      }

      const parts = this.parseInvoiceNumberParts(invoiceNo);
      if (!parts) return;

      if (financialYear && parts.financialYear && parts.financialYear !== financialYear) return;

      if (parts.seqValue > highest) {
        highest = parts.seqValue;
      }
    });

    return highest;
  }

  private formatSequence(value: number, digits: number): string {
    const width = Math.max(digits, DEFAULT_SEQUENCE_DIGITS);
    const normalized = Math.max(0, Math.floor(value));
    return String(normalized).padStart(width, '0');
  }

  private parseSequenceValue(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      return Math.max(0, Math.floor(numeric));
    }
    const cleaned = String(value).replace(/[^0-9]/g, '');
    if (!cleaned) {
      return null;
    }
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
  }
}

const invoiceNumberService = new InvoiceNumberService();

export default invoiceNumberService;
