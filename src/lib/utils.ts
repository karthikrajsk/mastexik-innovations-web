
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as XLSX from 'xlsx';
import pako from 'pako';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toReportSlug(reportName: string, identifier?: number | string) {
  const base = (reportName ?? '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const nameSegment = base !== '' ? base : 'report';
  if (identifier === undefined || identifier === null || identifier === '') {
    return nameSegment;
  }
  const idSegment = identifier.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (idSegment === '') {
    return nameSegment;
  }
  return `${nameSegment}-${idSegment}`;
}



const crcTable = (() => {
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
})();

function createZip(files: { path: string, content: string }[]) {
  const zipParts: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let currentOffset = 0;
  
  const textEncoder = new TextEncoder();
  
  const crc32 = (arr: Uint8Array) => {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < arr.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ arr[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  };

  files.forEach(file => {
    const filenameBytes = textEncoder.encode(file.path);
    const contentBytes = textEncoder.encode(file.content);
    const compressedBytes = pako.deflateRaw(contentBytes);
    
    const uncompressedSize = contentBytes.length;
    const compressedSize = compressedBytes.length;
    const fileCrc = crc32(contentBytes);
    
    const lfh = new Uint8Array(30 + filenameBytes.length);
    lfh.set([0x50, 0x4b, 0x03, 0x04]);
    lfh.set([20, 0], 4);
    lfh.set([0, 0], 6);
    lfh.set([8, 0], 8);
    lfh.set([0, 0, 0, 0], 10);
    
    const view = new DataView(lfh.buffer, lfh.byteOffset, lfh.byteLength);
    view.setUint32(14, fileCrc, true);
    view.setUint32(18, compressedSize, true);
    view.setUint32(22, uncompressedSize, true);
    view.setUint16(26, filenameBytes.length, true);
    view.setUint16(28, 0, true);
    
    lfh.set(filenameBytes, 30);
    
    zipParts.push(lfh);
    zipParts.push(compressedBytes);
    
    const cdfh = new Uint8Array(46 + filenameBytes.length);
    cdfh.set([0x50, 0x4b, 0x01, 0x02]);
    cdfh.set([20, 0], 4);
    cdfh.set([20, 0], 6);
    cdfh.set([0, 0], 8);
    cdfh.set([8, 0], 10);
    cdfh.set([0, 0, 0, 0], 12);
    
    const cdfhView = new DataView(cdfh.buffer, cdfh.byteOffset, cdfh.byteLength);
    cdfhView.setUint32(16, fileCrc, true);
    cdfhView.setUint32(20, compressedSize, true);
    cdfhView.setUint32(24, uncompressedSize, true);
    cdfhView.setUint16(28, filenameBytes.length, true);
    cdfhView.setUint16(30, 0, true);
    cdfhView.setUint16(32, 0, true);
    cdfhView.setUint16(34, 0, true);
    cdfhView.setUint16(36, 0, true);
    cdfhView.setUint32(38, 0, true);
    cdfhView.setUint32(42, currentOffset, true);
    
    cdfh.set(filenameBytes, 46);
    centralDirectory.push(cdfh);
    
    currentOffset += lfh.length + compressedBytes.length;
  });
  
  const centralDirSize = centralDirectory.reduce((acc, curr) => acc + curr.length, 0);
  
  const eocd = new Uint8Array(22);
  eocd.set([0x50, 0x4b, 0x05, 0x06]);
  eocd.set([0, 0], 4);
  eocd.set([0, 0], 6);
  const eocdView = new DataView(eocd.buffer, eocd.byteOffset, eocd.byteLength);
  eocdView.setUint16(8, files.length, true);
  eocdView.setUint16(10, files.length, true);
  eocdView.setUint32(12, centralDirSize, true);
  eocdView.setUint32(16, currentOffset, true);
  eocdView.setUint16(20, 0, true);
  
  const totalLength = currentOffset + centralDirSize + eocd.length;
  const result = new Uint8Array(totalLength);
  
  let offset = 0;
  zipParts.forEach(part => {
    result.set(part, offset);
    offset += part.length;
  });
  centralDirectory.forEach(part => {
    result.set(part, offset);
    offset += part.length;
  });
  result.set(eocd, offset);
  
  return result;
}

const logoModules = import.meta.glob<{ default: string }>('@/assets/Images/*.{png,jpg,jpeg,svg,webp}', { eager: true });
const logoAssetUrls = Object.values(logoModules)
  .map((mod) => (typeof mod === 'string' ? mod : mod?.default))
  .filter(Boolean);
const bundledLogo = logoAssetUrls[0] || '';

const isSalaryReportFile = (fileName: string) => {
  return String(fileName ?? '').toLowerCase().includes('salary');
};

const formatSalaryReportAmount = (val: any) => {
  if (val === undefined || val === null || val === '') return '';
  if (typeof val === 'string' && val.includes(',')) return val;
  const num = Number(val);
  if (isNaN(num)) return val;
  return Math.round(num).toLocaleString('en-IN');
};

export function formatNumberWithCommas(val: any): string {
  if (val === undefined || val === null || val === '') return '';
  if (typeof val === 'string' && val.includes(',')) return val;
  const num = Number(val);
  if (isNaN(num)) return String(val);
  if (num % 1 === 0) {
    return num.toLocaleString('en-IN');
  }
  return num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

export function isNumericFormattedColumn(headerName: any, accessorKey?: any): boolean {
  const h = String(headerName ?? '').toLowerCase().trim();
  const a = String(accessorKey ?? '').toLowerCase().trim();
  const combined = `${h} ${a}`;

  if (!combined.trim()) return false;

  const blacklistRegex = /\b(id|code|phone|mobile|date|dt|month|year|sno|s\.no|sl\.no|slno|dcno|dc_no|status|type|no|num|number|piece|roll|beam)\b/i;
  const numericOverrideRegex = /\b(weight|wt|meters|meter||metre |mtrs|mtr|qty|quantity|amount|rate|cost|total|balance|stock|glm|pass|gross|net)\b/i;

  if (blacklistRegex.test(h) && !numericOverrideRegex.test(h)) {
    return false;
  }

  return (
    combined.includes("weight") ||
    combined.includes("wt") ||
    combined.includes("meter") ||
    combined.includes("metre") ||
    combined.includes("mtr") ||
    combined.includes("qty") ||
    combined.includes("quantity") ||
    combined.includes("amount") ||
    combined.includes("rate") ||
    combined.includes("cost") ||
    combined.includes("price") ||
    combined.includes("total") ||
    combined.includes("balance") ||
    combined.includes("stock") ||
    combined.includes("gross") ||
    combined.includes("net") ||
    combined.includes("glm") ||
    combined.includes("pass") ||
    combined.includes("rec") ||
    combined.includes("recv") ||
    combined.includes("issued") ||
    combined.includes("consumed") ||
    combined.includes("bags") ||
    combined.includes("pieces") ||
    combined.includes("doff") ||
    combined.includes("cut") ||
    combined.includes("avg") ||
    combined.includes("count") ||
    combined.includes("yards")
  );
}

export function getGrandTotalVal(grandTotal: Record<string, any> | undefined, headerKey: string): any {
  if (!grandTotal) return 0;
  if (grandTotal[headerKey] !== undefined) return grandTotal[headerKey];
  const normKey = String(headerKey ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const k of Object.keys(grandTotal)) {
    if (String(k ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') === normKey) {
      return grandTotal[k];
    }
  }
  return 0;
}

const salaryReportExcludeHeaders = [
  'S.No', 
  'Working hours / Day', 
  'Actual Present days', 
  'Days to be Present', 
  'Additional weekly-off Days for weavers', 
  'OT Hours Worked'
];

export function exportToExcel(data: any[], fileName: string, options?: { 
  headers?: string[];
  includeSerialNo?: boolean;
  grandTotal?: Record<string, number>;
  totalColumnKeys?: string[];
  headerGroups?: any[][];
}) {
  if (typeof window === 'undefined') return;

  const { headers, includeSerialNo = false, grandTotal, totalColumnKeys, headerGroups } = options || {};
  
  let exportData = [...data];
  let safeHeaders = headers;
  
  // If no headers provided, use object keys
  if (!safeHeaders || safeHeaders.length === 0) {
    safeHeaders = Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : [];
  }
  
  // Normalize headers for comparison and filter out existing S.No/serialNo if includeSerialNo is true
  let filteredHeaders = safeHeaders;
  if (includeSerialNo) {
    filteredHeaders = safeHeaders.filter(header => 
      !['s.no', 'serialno'].includes(String(header ?? '').toLowerCase())
    );
    exportData = exportData.map(row => {
      const newRow = { ...row };
      // Remove all variations of serial number columns
      Object.keys(newRow).forEach(key => {
        if (['s.no', 'serialno'].includes(String(key ?? '').toLowerCase())) {
          delete newRow[key];
        }
      });
      return newRow;
    });
  }

  // Add S.No column if requested and not already present in filteredHeaders
  if (includeSerialNo && !filteredHeaders.includes('S.No')) {
    safeHeaders = ['S.No', ...filteredHeaders];
    exportData = exportData.map((row, index) => ({
      'S.No': index + 1,
      ...row
    }));
  } else {
    safeHeaders = filteredHeaders;
  }
  
  // Determine effective total column keys
  const effectiveTotalKeys = (totalColumnKeys && totalColumnKeys.length > 0) 
    ? totalColumnKeys 
    : (grandTotal ? Object.keys(grandTotal) : []);

  // Add Grand Total row if provided
  let grandTotalRow: any = null;
  let labelColumnIndex = -1;
  if (grandTotal) {
    grandTotalRow = {};
    
    // Find the index of the first total column
    const firstTotalColumnIndex = effectiveTotalKeys.length > 0 
      ? safeHeaders.findIndex(header => 
          effectiveTotalKeys.some(tk => String(tk ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') === String(header ?? '').toLowerCase().replace(/[^a-z0-9]/g, ''))
        )
      : -1;
    
    // Determine which column should contain 'GRAND TOTAL' label
    labelColumnIndex = 0; // Default to first column (S.No)
    if (firstTotalColumnIndex > 0) {
      labelColumnIndex = firstTotalColumnIndex - 1; // Column before first total column
    }
    
    safeHeaders.forEach((header, index) => {
      const isTotalCol = effectiveTotalKeys.some(tk => String(tk ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') === String(header ?? '').toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (index === labelColumnIndex) {
        grandTotalRow[header] = 'GRAND TOTAL';
      } else if (isTotalCol) {
        grandTotalRow[header] = getGrandTotalVal(grandTotal, header);
      } else {
        grandTotalRow[header] = '';
      }
    });
  }
  
  // Generate sheetData XML and merges
  let sheetDataXml = '';
  let rowIdx = 1;
  const merges: string[] = [];

  const escapeXml = (str: any) => {
    if (str == null) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const getColLetter = (colIdx: number) => {
    let temp = colIdx;
    let letter = "";
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  };

  // Write Company Header rows at top of Excel sheet
  const totalCols = safeHeaders.length;
  const lastColLetter = getColLetter(Math.max(0, totalCols - 1));

  let unitHeaderName = "Unit A";
  let unitAddressStr = "SF.No : 193, P.Vadugapalayam, Pollachi Road, Palladam - 641 664. Tirupur District.";
  try {
    const storedPayload = localStorage.getItem('authPayload');
    if (storedPayload) {
      const parsed = JSON.parse(storedPayload);
      const roleStr = String(parsed?.user?.role || '').toLowerCase();
      if (roleStr.includes('brushing')) {
        unitHeaderName = "Unit C";
        unitAddressStr = "264/4, Kallangadu thottam, Panikkampatti, Palladam - 641 664. Tirupur District.";
      }
    }
  } catch (e) {
    // fallback
  }

  sheetDataXml += `<row r="${rowIdx}">`;
  sheetDataXml += `<c r="A${rowIdx}" s="1" t="inlineStr"><is><t>HFPL Factory Address : ${unitHeaderName} - M/s. Hayagreevas Fabrics Private Limited</t></is></c>`;
  for (let c = 1; c < totalCols; c++) {
    sheetDataXml += `<c r="${getColLetter(c)}${rowIdx}" s="1"/>`;
  }
  sheetDataXml += `</row>`;
  merges.push(`A${rowIdx}:${lastColLetter}${rowIdx}`);
  rowIdx++;

  sheetDataXml += `<row r="${rowIdx}">`;
  sheetDataXml += `<c r="A${rowIdx}" s="2" t="inlineStr"><is><t>${escapeXml(unitAddressStr)} GST No : 33AACCH7673P1Z0</t></is></c>`;
  for (let c = 1; c < totalCols; c++) {
    sheetDataXml += `<c r="${getColLetter(c)}${rowIdx}" s="2"/>`;
  }
  sheetDataXml += `</row>`;
  merges.push(`A${rowIdx}:${lastColLetter}${rowIdx}`);
  rowIdx++;

  sheetDataXml += `<row r="${rowIdx}">`;
  sheetDataXml += `<c r="A${rowIdx}" s="1" t="inlineStr"><is><t>${escapeXml(fileName)}</t></is></c>`;
  for (let c = 1; c < totalCols; c++) {
    sheetDataXml += `<c r="${getColLetter(c)}${rowIdx}" s="1"/>`;
  }
  sheetDataXml += `</row>`;
  merges.push(`A${rowIdx}:${lastColLetter}${rowIdx}`);
  rowIdx++;

  sheetDataXml += `<row r="${rowIdx}"></row>`;
  rowIdx++;

  const headerRowIdx = rowIdx;
  if (headerGroups && headerGroups.length > 0) {
    // Multi-level header approach
    headerGroups.forEach(group => {
      sheetDataXml += `<row r="${rowIdx}">`;
      let colIdx = 0;
      group.forEach(col => {
        const startRef = `${getColLetter(colIdx)}${rowIdx}`;
        sheetDataXml += `<c r="${startRef}" s="1" t="inlineStr"><is><t>${escapeXml(col.Header)}</t></is></c>`;
        
        if (col.colSpan > 1 || col.rowSpan > 1) {
          const endRef = `${getColLetter(colIdx + col.colSpan - 1)}${rowIdx + col.rowSpan - 1}`;
          merges.push(`${startRef}:${endRef}`);
        }
        
        for (let i = 1; i < col.colSpan; i++) {
          colIdx++;
          const spanRef = `${getColLetter(colIdx)}${rowIdx}`;
          sheetDataXml += `<c r="${spanRef}" s="1"/>`;
        }
        colIdx++;
      });
      sheetDataXml += `</row>`;
      rowIdx++;
    });
  } else {
    // Normal single header row
    sheetDataXml += `<row r="${rowIdx}">`;
    safeHeaders.forEach((header, colIdx) => {
      const ref = `${getColLetter(colIdx)}${rowIdx}`;
      sheetDataXml += `<c r="${ref}" s="1" t="inlineStr"><is><t>${escapeXml(header)}</t></is></c>`;
    });
    sheetDataXml += `</row>`;
    rowIdx++;
  }

  const firstDataRowIdx = rowIdx;
  const dataRowsCount = exportData.length;
  const lastDataRowIdx = dataRowsCount > 0 ? firstDataRowIdx + dataRowsCount - 1 : firstDataRowIdx;

  // Write data rows
  exportData.forEach(item => {
    sheetDataXml += `<row r="${rowIdx}">`;
    safeHeaders.forEach((header, colIdx) => {
      const ref = `${getColLetter(colIdx)}${rowIdx}`;
      let val = item[header];
      const isTotalCol = effectiveTotalKeys.some(tk => String(tk ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') === String(header ?? '').toLowerCase().replace(/[^a-z0-9]/g, ''));
      
      let isNumeric = false;
      let numVal = 0;

      if (val !== undefined && val !== null && val !== '') {
        if (typeof val === 'number') {
          isNumeric = true;
          numVal = val;
        } else if (typeof val === 'string') {
          const cleanStr = val.replace(/,/g, '').trim();
          if (cleanStr !== '' && !isNaN(Number(cleanStr)) && isFinite(Number(cleanStr))) {
            // Check it's not a serial no or code with leading zero unless decimal
            const isCodeWithLeadingZero = val.length > 1 && val.startsWith('0') && !val.startsWith('0.');
            if (!isCodeWithLeadingZero && (isTotalCol || isNumericFormattedColumn(header, header))) {
              isNumeric = true;
              numVal = Number(cleanStr);
            }
          }
        }
      }

      if (val === undefined || val === null || val === '') {
        sheetDataXml += `<c r="${ref}" s="2"/>`;
      } else if (isNumeric) {
        sheetDataXml += `<c r="${ref}" s="2"><v>${numVal}</v></c>`;
      } else {
        if (isSalaryReportFile(fileName) && !salaryReportExcludeHeaders.includes(header)) {
          val = formatSalaryReportAmount(val);
        }
        sheetDataXml += `<c r="${ref}" s="2" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>`;
      }
    });
    sheetDataXml += `</row>`;
    rowIdx++;
  });

  // Write grandTotalRow if present
  if (grandTotalRow) {
    sheetDataXml += `<row r="${rowIdx}">`;
    safeHeaders.forEach((header, colIdx) => {
      const ref = `${getColLetter(colIdx)}${rowIdx}`;
      let val = grandTotalRow[header];
      if (isSalaryReportFile(fileName) && !salaryReportExcludeHeaders.includes(header) && val !== 'GRAND TOTAL') {
        val = formatSalaryReportAmount(val);
      } else if (val !== 'GRAND TOTAL' && val !== undefined && val !== null && val !== '') {
        val = formatNumberWithCommas(val);
      }
      const isTotalCol = effectiveTotalKeys.some(tk => String(tk ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') === String(header ?? '').toLowerCase().replace(/[^a-z0-9]/g, ''));
      const isGrand = colIdx === labelColumnIndex || isTotalCol;
      const styleId = isGrand ? "3" : "2";
      
      if (isTotalCol && dataRowsCount > 0) {
        const colLetter = getColLetter(colIdx);
        const formula = `SUBTOTAL(109,${colLetter}${firstDataRowIdx}:${colLetter}${lastDataRowIdx})`;
        const rawNum = getGrandTotalVal(grandTotal, header);
        let numVal = typeof rawNum === 'number' ? rawNum : parseFloat(String(rawNum).replace(/,/g, ''));
        if (isNaN(numVal)) numVal = 0;
        sheetDataXml += `<c r="${ref}" s="${styleId}"><f>${formula}</f><v>${numVal}</v></c>`;
      } else if (val === undefined || val === null || val === '') {
        sheetDataXml += `<c r="${ref}" s="${styleId}"/>`;
      } else {
        sheetDataXml += `<c r="${ref}" s="${styleId}" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>`;
      }
    });
    sheetDataXml += `</row>`;
    rowIdx++;
  }

  let autoFilterXml = "";
  if (dataRowsCount > 0) {
    const autoFilterRef = `A${headerRowIdx}:${lastColLetter}${lastDataRowIdx}`;
    autoFilterXml = `<autoFilter ref="${autoFilterRef}"/>`;
  }

  const relsContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookRelsContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const contentTypesContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const workbookContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Sheet1" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const stylesContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><name val="Calibri"/><family val="2"/><sz val="11"/><color rgb="FF000000"/></font>
    <font><name val="Calibri"/><family val="2"/><sz val="11"/><color rgb="FFFFFFFF"/><bold/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E40AF"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border/>
    <border>
      <left style="thin"><color rgb="FFA0A0A0"/></left>
      <right style="thin"><color rgb="FFA0A0A0"/></right>
      <top style="thin"><color rgb="FFA0A0A0"/></top>
      <bottom style="thin"><color rgb="FFA0A0A0"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="1" applyFill="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>`;

  let mergeCellsXml = "";
  if (merges.length > 0) {
    mergeCellsXml = `<mergeCells count="${merges.length}">`;
    merges.forEach(m => {
      mergeCellsXml += `<mergeCell ref="${m}"/>`;
    });
    mergeCellsXml += `</mergeCells>`;
  }

  const sheet1Content = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0">
      <showGridLines val="1"/>
    </sheetView>
  </sheetViews>
  <sheetData>
    ${sheetDataXml}
  </sheetData>
  ${autoFilterXml}
  ${mergeCellsXml}
</worksheet>`;

  const files = [
    { path: '_rels/.rels', content: relsContent },
    { path: 'xl/_rels/workbook.xml.rels', content: workbookRelsContent },
    { path: '[Content_Types].xml', content: contentTypesContent },
    { path: 'xl/workbook.xml', content: workbookContent },
    { path: 'xl/styles.xml', content: stylesContent },
    { path: 'xl/worksheets/sheet1.xml', content: sheet1Content }
  ];

  const zipData = createZip(files);
  const blob = new Blob([zipData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ExcelTemplateDropdownConfig {
  header: string;
  values: string[];
}

export interface ExcelTemplateOptions {
  headers: string[];
  fileName: string;
  sheetName?: string;
  maxRows?: number;
  dropdowns?: ExcelTemplateDropdownConfig[];
  textColumns?: string[];
}

export function generateExcelTemplate({
  headers,
  fileName,
  sheetName = "Template",
  maxRows = 200,
  dropdowns = [],
  textColumns = [],
}: ExcelTemplateOptions) {
  if (typeof window === "undefined") {
    return;
  }
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);
  if (headers.length > 0 && maxRows > 0) {
    const placeholderRows = Array.from({ length: maxRows }, () => new Array(headers.length).fill(""));
    XLSX.utils.sheet_add_aoa(worksheet, placeholderRows, { origin: { r: 1, c: 0 } });
    const lastColumn = XLSX.utils.encode_col(headers.length - 1);
    (worksheet as any)["!ref"] = `A1:${lastColumn}${maxRows + 1}`;
  }
  const normalizedTextColumns = new Set(textColumns.map((column) => column?.toString().trim().toLowerCase()));
  if (normalizedTextColumns.size > 0) {
    const cols = headers.map((header) => {
      if (normalizedTextColumns.has(header?.toString().trim().toLowerCase())) {
        return { z: "@", wch: 20 };
      }
      return undefined;
    });
    if (cols.some((col) => col)) {
      (worksheet as any)["!cols"] = cols;
    }
  }
  const dropdownSheetName = "Lists";
  const dataValidations: any[] = [];
  let dropdownSheet: XLSX.WorkSheet | null = null;
  if (dropdowns.length > 0) {
    dropdownSheet = XLSX.utils.aoa_to_sheet([]);
    dropdowns.forEach((dropdown, idx) => {
      const columnData = [dropdown.header, ...dropdown.values];
      const columnMatrix = columnData.map((value) => [value]);
      XLSX.utils.sheet_add_aoa(dropdownSheet as XLSX.WorkSheet, columnMatrix, { origin: { r: 0, c: idx } });
    });
    dropdownSheet["!hidden"] = true;
  }
  dropdowns.forEach((dropdown, idx) => {
    const headerIndex = headers.findIndex((header) => header === dropdown.header);
    if (headerIndex === -1 || dropdown.values.length === 0) {
      return;
    }
    const templateColumn = XLSX.utils.encode_col(headerIndex);
    const startRow = 2;
    const endRow = maxRows + 1;
    const sqref = `${templateColumn}${startRow}:${templateColumn}${endRow}`;
    let formula1 = "";
    if (dropdownSheet) {
      const optionsColumn = XLSX.utils.encode_col(idx);
      const optionsEndRow = dropdown.values.length + 1;
      formula1 = `=${dropdownSheetName}!$${optionsColumn}$2:$${optionsColumn}$${optionsEndRow}`;
    } else {
      const literal = dropdown.values
        .map((value) => (value ?? "").toString().replace(/"/g, '""'))
        .join(",");
      formula1 = `="${literal}"`;
    }
    dataValidations.push({
      type: "list",
      allowBlank: 1,
      sqref,
      formula1
    });
  });
  if (dataValidations.length > 0) {
    (worksheet as any)["!dataValidation"] = dataValidations;
  }
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  if (dropdownSheet) {
    XLSX.utils.book_append_sheet(workbook, dropdownSheet, dropdownSheetName);
  }
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export async function readExcelFile<T = Record<string, any>>(file: File | Blob, options?: { sheetIndex?: number }) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[options?.sheetIndex ?? 0];
  if (!sheetName) {
    return [] as T[];
  }
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    return [] as T[];
  }
  return XLSX.utils.sheet_to_json<T>(worksheet, { defval: "" });
}

export function exportToPdf(headers: string[], data: any[], fileName: string, options?: {
  includeSerialNo?: boolean;
  grandTotal?: Record<string, number>;
  totalColumnKeys?: string[];
  headerGroups?: any[][];
}) {
  if (typeof window === "undefined") {
    return;
  }
  
  const { includeSerialNo = false, grandTotal, totalColumnKeys, headerGroups } = options || {};
  let safeHeaders = headers.length > 0 ? headers : (Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : []);
  let exportData = [...data];
  
  // Normalize headers for comparison and filter out existing S.No/serialNo if includeSerialNo is true
  let filteredHeaders = safeHeaders;
  if (includeSerialNo) {
    filteredHeaders = safeHeaders.filter(header => 
      !['s.no', 'serialno'].includes(String(header ?? '').toLowerCase())
    );
    exportData = exportData.map(row => {
      const newRow = { ...row };
      // Remove all variations of serial number columns
      Object.keys(newRow).forEach(key => {
        if (['s.no', 'serialno'].includes(String(key ?? '').toLowerCase())) {
          delete newRow[key];
        }
      });
      return newRow;
    });
  }

  // Add S.No column if requested and not already present in filteredHeaders
  if (includeSerialNo && !filteredHeaders.includes('S.No')) {
    safeHeaders = ['S.No', ...filteredHeaders];
    exportData = exportData.map((row, index) => ({
      'S.No': index + 1,
      ...row
    }));
  } else {
    safeHeaders = filteredHeaders;
  }
  
  const escapeCell = (value: any) => {
    const text = value === null || value === undefined ? "" : value.toString();
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  
  let tableHead = "";
  if (headerGroups && headerGroups.length > 0) {
    tableHead = headerGroups.map(group => 
      `<tr>${group.map(col => `<th colspan="${col.colSpan || 1}" rowspan="${col.rowSpan || 1}">${escapeCell(col.Header)}</th>`).join("")}</tr>`
    ).join("");
  } else {
    tableHead = `<tr>${safeHeaders.map((header) => `<th>${escapeCell(header)}</th>`).join("")}</tr>`;
  }
  
  let tableBody = exportData.map((row) => {
    return `<tr>${safeHeaders.map((header) => {
      let val = row?.[header];
      if (isSalaryReportFile(fileName) && !salaryReportExcludeHeaders.includes(header)) {
        val = formatSalaryReportAmount(val);
      } else if (typeof val === 'number') {
        val = formatNumberWithCommas(val);
      }
      const isNum = typeof val === 'number' || (typeof val === 'string' && /^\d+(,\d+)*(\.\d+)?$/.test(val.trim()));
      return `<td style="text-align: ${isNum ? 'right' : 'left'};">${escapeCell(val)}</td>`;
    }).join("")}</tr>`;
  }).join("");
  
  // Add Grand Total row if provided
  if (grandTotal && totalColumnKeys) {
    const grandTotalRow: any = {};
    
    // Find index of the first total column
    const firstTotalColumnIndex = totalColumnKeys.length > 0 
      ? safeHeaders.findIndex(header => 
          totalColumnKeys.some(tk => String(tk ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') === String(header ?? '').toLowerCase().replace(/[^a-z0-9]/g, ''))
        )
      : -1;
    
    // Determine which column should contain 'GRAND TOTAL' label
    let labelColumnIndex = 0; // Default to first column (S.No)
    if (firstTotalColumnIndex > 0) {
      labelColumnIndex = firstTotalColumnIndex - 1; // Column before first total column
    }
    
    safeHeaders.forEach((header, index) => {
      const isTotalCol = totalColumnKeys.some(tk => String(tk ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') === String(header ?? '').toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (index === labelColumnIndex) {
        grandTotalRow[header] = 'GRAND TOTAL';
      } else if (isTotalCol) {
        grandTotalRow[header] = getGrandTotalVal(grandTotal, header);
      } else {
        grandTotalRow[header] = '';
      }
    });
    
    tableBody += `<tr><td colspan="${safeHeaders.length}" style="border-top: 2px solid #000000;"></td></tr>`;
    tableBody += `<tr>${safeHeaders.map((header, index) => {
      let value = grandTotalRow[header];
      if (isSalaryReportFile(fileName) && !salaryReportExcludeHeaders.includes(header) && value !== 'GRAND TOTAL') {
        value = formatSalaryReportAmount(value);
      } else if (value !== 'GRAND TOTAL' && value !== undefined && value !== null && value !== '') {
        value = formatNumberWithCommas(value);
      }
      return `<td style="font-weight: bold; background-color: #fef3c7; border: 1px solid #000000; text-align: ${value === 'GRAND TOTAL' ? 'left' : 'right'};">${escapeCell(value)}</td>`;
    }).join("")}</tr>`;
  }
  
  const logoUrl = bundledLogo 
    ? (bundledLogo.startsWith('http') || bundledLogo.startsWith('data:') ? bundledLogo : `${window.location.origin}${bundledLogo.startsWith('/') ? '' : '/'}${bundledLogo}`)
    : `${window.location.origin}/assets/Images/logo.png`;

  const companyHeaderHtml = `
    <div style="position: relative; width: 100%; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #1e40af;">
      <div style="position: absolute; top: 0; right: 0;">
        <img src="${logoUrl}" alt="Company Logo" style="height: 48px; max-width: 180px; object-fit: contain;" onError="this.style.display='none'" />
      </div>
      <div style="text-align: center; font-family: Arial, sans-serif; color: #1e293b;">
        <div style="font-size: 11px; font-weight: bold; color: #1d4ed8; text-transform: uppercase;">HFPL Factory Address :</div>
        <div style="font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 2px;">M/s. Hayagreevas Fabrics Private Limited</div>
        <div style="font-size: 10px; color: #334155; margin-top: 2px;">264/4, Kallangadu thottam, Panikkampatti, Palladam - 641 664. Tirupur District.</div>
        <div style="font-size: 10px; font-weight: bold; color: #0f172a; margin-top: 2px;">GST No : 33AACCH7673P1Z0</div>
      </div>
    </div>
  `;

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeCell(fileName)}</title><style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
      h1 { font-size: 18px; margin-bottom: 16px; text-align: center; font-weight: bold; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #000000; padding: 6px 8px; font-size: 11px; text-align: left; white-space: nowrap; }
      th { background-color: #1e40af; color: #ffffff; font-weight: bold; white-space: normal; text-align: center; }
      @media print {
        @page { size: landscape; margin: 6mm; }
        body { zoom: 42%; padding: 0; }
        h1 { margin-top: 0; }
        th, td { padding: 4px 6px; }
      }
    </style></head><body>${companyHeaderHtml}<h1>${escapeCell(fileName)}</h1><table>${tableHead}${tableBody}</table></body></html>`;
  const printWindow = window.open("", "", "width=1024,height=768");
  if (!printWindow) {
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function formatDate(date?: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(date?: Date | string | null): string {
  if (!date) return '';
  if (typeof date === 'string') {
    const trimmed = date.trim();
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (match) {
      const [, year, month, day, hoursStr, minutesStr] = match;
      let hours = parseInt(hoursStr, 10);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const formattedHours = hours.toString().padStart(2, '0');
      return `${day}/${month}/${year} ${formattedHours}:${minutesStr} ${ampm}`;
    }
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const formattedHours = hours.toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
}