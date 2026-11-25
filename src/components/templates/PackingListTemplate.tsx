import React from 'react';
import { PackingListData } from './PackingListTemplate.types';

interface PackingListTemplateProps {
  data: PackingListData;
}

export const BrushedPackingListTemplate: React.FC<PackingListTemplateProps> = ({ data }) => {
  const {
    company,
    buyer,
    items,
    invoiceNo,
    invoiceDate,
    poNo,
    poDate,
    fabricQuality,
    packingListNo,
    lrNo,
    lrDate,
    truckNo,
    transportName,
    remarks
  } = data;

  const totalMeters = items.reduce((sum, i) => sum + i.meters, 0);
  const totalGrossWeight = items.reduce((sum, i) => sum + i.grossWeight, 0);
  const totalNetWeight = items.reduce((sum, i) => sum + i.netWeight, 0);

  const productDesc = (remarks && remarks.trim() !== '' && remarks.trim() !== '-') 
    ? remarks 
    : (fabricQuality || '-');

  return (
    <div className="max-w-[1200px] min-h-[980px] mx-auto bg-white text-black font-sans print:p-0 print:m-0 border border-black flex flex-col justify-between">
      <div>
        {/* Title: Company Name */}
        <div className="text-center py-1.5 border-b border-black">
          <h2 className="text-[22px] font-black uppercase tracking-tight">{company.name || 'COMPANY NAME'}</h2>
        </div>

        {/* Center Subheader: PACKING LIST */}
        <div className="text-center py-1 bg-gray-100 border-b border-black font-extrabold uppercase tracking-wider text-[15px]">
          PACKING LIST
        </div>

        {/* Grid Meta Information Table */}
        <table className="w-full border-collapse text-[18px] border-b border-black meta-table">
          <colgroup>
            <col style={{ width: '15%' }} />
            <col style={{ width: '48%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '19%' }} />
          </colgroup>
          <tbody>
            <tr className="border-b border-black">
              <td className="border-r border-black py-0.5 px-0.5 font-bold bg-[#f2f2f2]">Company Name</td>
              <td className="border-r border-black py-0.5 px-0.5 uppercase font-medium">{buyer.name}</td>
              <td className="border-r border-black py-0.5 px-0.5 font-bold bg-[#f2f2f2]">Packing List Date</td>
              <td className="py-0.5 px-0.5 font-medium">{data.orderDate}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black py-0.5 px-0.5 font-bold bg-[#f2f2f2]">PO No & Date</td>
              <td className="border-r border-black p-0 uppercase font-medium">
                <div className="grid grid-cols-12 w-full h-full text-left">
                  <span className="col-span-7 border-r border-black py-0.5 px-1">{poNo || '-'}</span>
                  <span className="col-span-5 py-0.5 px-1 text-left">{poDate || ''}</span>
                </div>
              </td>
              <td className="border-r border-black py-0.5 px-0.5 font-bold bg-[#f2f2f2]">No.of.Rolls</td>
              <td className="py-0.5 px-0.5 font-medium">{items.length}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black py-0.5 px-0.5 font-bold bg-[#f2f2f2]">Constructions</td>
              <td className="border-r border-black py-0.5 px-0.5 uppercase font-medium">{fabricQuality}</td>
              <td className="border-r border-black py-0.5 px-0.5 font-bold bg-[#f2f2f2]">Total Pass Mtrs</td>
              <td className="py-0.5 px-0.5 font-bold">{totalMeters.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black py-0.5 px-0.5 font-bold bg-[#f2f2f2]">Inv No & Date</td>
              <td className="border-r border-black p-0 uppercase font-medium">
                <div className="grid grid-cols-12 w-full h-full text-left">
                  <span className="col-span-7 border-r border-black py-0.5 px-1">{invoiceNo || '-'}</span>
                  <span className="col-span-5 py-0.5 px-1 text-left">{invoiceDate || ''}</span>
                </div>
              </td>
              <td className="border-r border-black py-0.5 px-0.5 font-bold bg-[#f2f2f2]">Total Gross Wt.in Kgs</td>
              <td className="py-0.5 px-0.5 font-medium">{totalGrossWeight.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black py-0.5 px-0.5 font-bold bg-[#f2f2f2]">Transporter Name</td>
              <td className="border-r border-black py-0.5 px-0.5 uppercase font-medium">{transportName || '-'}</td>
              <td className="border-r border-black py-0.5 px-0.5 font-bold bg-[#f2f2f2]">Total N. Wt.in Kgs</td>
              <td className="py-0.5 px-0.5 font-medium">{totalNetWeight.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black py-0.5 px-0.5 font-bold bg-[#f2f2f2]">GST NO</td>
              <td className="border-r border-black py-0.5 px-0.5 uppercase font-medium">{buyer.gst || '-'}</td>
              <td className="border-r border-black py-0.5 px-0.5 font-bold bg-[#f2f2f2]">Product Desc.</td>
              <td className="py-0.5 px-0.5 uppercase font-medium">{productDesc}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="border-r border-black py-0.5 px-0.5 font-bold bg-[#f2f2f2]">LR No & Date</td>
              <td className="border-r border-black p-0 uppercase font-medium">
                <div className="grid grid-cols-12 w-full h-full text-left">
                  <span className="col-span-7 border-r border-black py-0.5 px-1">{lrNo || '-'}</span>
                  <span className="col-span-5 py-0.5 px-1 text-left">{lrDate || ''}</span>
                </div>
              </td>
              <td className="border-r border-black py-0.5 px-0.5 font-bold bg-[#f2f2f2]">Note 1</td>
              <td className="py-0.5 px-0.5 font-medium">-</td>
            </tr>
            <tr>
              <td className="border-r border-black py-0.5 px-0.5 font-bold bg-[#f2f2f2]">Truck No</td>
              <td className="border-r border-black py-0.5 px-0.5 uppercase font-medium">{truckNo || '-'}</td>
              <td className="border-r border-black py-0.5 px-0.5 font-bold bg-[#f2f2f2]">Note 2</td>
              <td className="py-0.5 px-0.5 font-medium">-</td>
            </tr>
          </tbody>
        </table>

        {/* Items Table */}
        <table className="w-full border-collapse text-[11px] items-table">
          <thead>
            <tr className="bg-[#d9e1f2] border-b border-black">
              <th className="border-r border-black py-0.5 px-0.5 text-center font-bold w-[5%]">S.NO</th>
              <th className="border-r border-black py-0.5 px-0.5 text-center font-bold w-[8%]">HFPL ROLL NO</th>
              <th className="border-r border-black py-0.5 px-0.5 text-center font-bold w-[8%]">PIECE NO</th>
              <th className="border-r border-black py-0.5 px-0.5 text-center font-bold w-[8%]">PASS MTR</th>
              <th className="border-r border-black py-0.5 px-0.5 text-center font-bold w-[8%]">GROSS WT</th>
              <th className="border-r border-black py-0.5 px-0.5 text-center font-bold w-[8%]">NET WT</th>
              <th className="border-r border-black py-0.5 px-0.5 text-center font-bold w-[20%]">Ref.Inv.No</th>
              <th className="py-0.5 px-0.5 text-center font-bold w-[25%]">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-black">
                <td className="border-r border-black py-0.5 px-0.5 text-center">{item.sNo}</td>
                <td className="border-r border-black py-0.5 px-0.5 text-center uppercase">{item.rollNo}</td>
                <td className="border-r border-black py-0.5 px-0.5 text-center uppercase">{item.pieceNo}</td>
                <td className="border-r border-black py-0.5 px-0.5 text-center font-medium">{item.meters.toFixed(2)}</td>
                <td className="border-r border-black py-0.5 px-0.5 text-center">{item.grossWeight.toFixed(2)}</td>
                <td className="border-r border-black py-0.5 px-0.5 text-center">{item.netWeight.toFixed(2)}</td>
                <td className="border-r border-black py-0.5 px-0.5 text-center uppercase">{item.invoiceNo || '-'}</td>
                <td className="py-0.5 px-0.5 text-center uppercase">{item.remarks || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Signature Section anchored at bottom */}
      <div className="p-2 flex flex-col mt-auto pt-24 pb-6 print:pt-20 print:pb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center">
            <div className="w-3/4 pt-0.5 font-bold text-[10px] uppercase border-t border-gray-400">CHECKED BY</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-3/4 pt-0.5 font-bold text-[10px] uppercase border-t border-gray-400">VERIFIED BY</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-3/4 pt-0.5 font-bold text-[10px] uppercase border-t border-gray-400">APPROVED BY</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const WeavingPackingListTemplate: React.FC<PackingListTemplateProps> = ({ data }) => {
  const {
    company,
    buyer,
    items,
    invoiceNo,
    invoiceDate,
    poNo,
    poDate,
    poNumber,
    fabricCode,
    fabricQuality,
    lrNo,
    lrDate,
    orderNo,
    loomTypeSelvedge,
    glm,
    weave,
    fabricLotNo
  } = data;

  const totalMeters = items.reduce((sum, i) => sum + (i.meters || 0), 0);
  const totalGrossWeight = items.reduce((sum, i) => sum + (i.grossWeight || 0), 0);
  const totalNetWeight = items.reduce((sum, i) => sum + (i.netWeight || 0), 0);
  const calculatedGlm = totalMeters > 0 ? (totalNetWeight / totalMeters) : 0;
  const displayGlm = calculatedGlm > 0 
    ? calculatedGlm.toFixed(3) 
    : (glm != null && glm !== '' && !isNaN(Number(glm)) && Number(glm) > 0 ? Number(glm).toFixed(3) : (glm ? String(glm) : '0.428'));

  const totalPts4 = items.reduce((sum, i) => sum + (i.pts4 || 0), 0);
  const totalPts3 = items.reduce((sum, i) => sum + (i.pts3 || 0), 0);
  const totalPts2 = items.reduce((sum, i) => sum + (i.pts2 || 0), 0);
  const totalPts1 = items.reduce((sum, i) => sum + (i.pts1 || 0), 0);
  const totalPointsAll = items.reduce((sum, i) => sum + (i.totalPoints || 0), 0);
  const avgPointsPer100Mtr = totalMeters > 0 ? (totalPointsAll * 100) / totalMeters : 0;

  // Breakdown ranges calculations
  const r1Items = items.filter(i => (i.meters || 0) >= 100 && (i.meters || 0) < 250);
  const r2Items = items.filter(i => (i.meters || 0) >= 250 && (i.meters || 0) < 380);
  const r3Items = items.filter(i => (i.meters || 0) >= 380 && (i.meters || 0) < 420);
  const r4Items = items.filter(i => (i.meters || 0) >= 420);

  const calcMtrs = (arr: typeof items) => arr.reduce((sum, i) => sum + (i.meters || 0), 0);
  const calcPctMtrs = (mtrs: number) => totalMeters > 0 ? Math.round((mtrs / totalMeters) * 100) : 0;
  const calcPctRolls = (count: number) => items.length > 0 ? Math.round((count / items.length) * 100) : 0;

  const gradeCountA = items.filter(i => !i.grade || i.grade.toUpperCase().includes('A')).length;
  const gradeAPct = items.length > 0 ? Math.round((gradeCountA / items.length) * 100) : 100;
  const roll380Pct = items.length > 0 ? Math.round(((r3Items.length + r4Items.length) / items.length) * 100) : 55;

  // Light soft pink header background matching Excel palette (#f4e3e3)
  const headerBgClass = "bg-[#f4e3e3] text-black font-bold";
  // Light blue header background for Grand Total row (#d9e1f2)
  const grandTotalBgClass = "bg-[#d9e1f2] text-black font-bold";

  const buyerNameUpper = String(buyer?.name || '').trim().toUpperCase();
  const isIndoCount = buyerNameUpper.includes('INDO COUNT');

  return (
    <div className="max-w-[1200px] mx-auto bg-white text-black font-sans print:p-0 print:m-0 border border-black text-[9px]">
      {/* Top Banner Header */}
      <div className="border-b border-black bg-[#FFF9C4] py-1 text-center font-bold uppercase tracking-tight text-black">
        <div className="text-[13px]">{buyer.name || 'INDO COUNT INDUSTRIES LTD - BHILAD'}</div>
        <div className="text-[11px] font-bold tracking-wider mt-0.5">
          PACKING LIST CUM SELF INSPECTION ABSTRACT REPORT
        </div>
      </div>

      {/* Top Section Split: Left Metadata (46%) & Right GLM / Break-up Summary Table (54%) */}
      <div className="grid grid-cols-12 border-b border-black">
        {/* Left 46% Block */}
        <div className="col-span-6 border-r border-black">
          <table className="w-full border-collapse">
            <colgroup>
              <col style={{ width: '28%' }} />
              <col style={{ width: '72%' }} />
            </colgroup>
            <tbody>
              <tr className="border-b border-black">
                <td className={`border-r border-black py-0.5 px-1 text-left ${headerBgClass}`}>Company Name</td>
                <td className="py-0.5 px-1 text-left font-bold uppercase bg-[#fce4d6] text-black">
                  {company.name || 'HAYAGREEVAS FABRICS PRIVATE LIMITED'}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className={`border-r border-black py-0.5 px-1 text-left ${headerBgClass}`}>PO No &amp; Date</td>
                <td className="py-0.5 px-1">
                  <div className="grid grid-cols-12 w-full text-center">
                    <span className="col-span-5 font-bold border-r border-black px-1 text-left">{poNo || poNumber || '-'}</span>
                    {/* <span className={`col-span-3 ${headerBgClass} px-1 border-r border-black`}>PO Date</span> */}
                    <span className="col-span-4 font-bold px-1 text-center">{poDate || '-'}</span>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className={`border-r border-black py-0.5 px-1 text-left ${headerBgClass}`}>TC / Construct.</td>
                <td className="py-0.5 px-1 text-left font-bold uppercase bg-[#fce4d6] text-black">
                  {fabricQuality ? `${fabricQuality}` : fabricQuality}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className={`border-r border-black py-0.5 px-1 text-left ${headerBgClass}`}>Weave</td>
                <td className="py-0.5 px-1 text-left font-semibold uppercase">
                  {weave || 'PLAIN SATIN'}
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className={`border-r border-black py-0.5 px-1 text-left ${headerBgClass}`}>Invoice no</td>
                <td className="py-0.5 px-1">
                  <div className="grid grid-cols-12 w-full text-center">
                    <span className="col-span-5 font-bold border-r border-black px-1">{invoiceNo || '-'}</span>
                    <span className={`col-span-3 ${headerBgClass} px-1 border-r border-black`}>Inv. Date</span>
                    <span className="col-span-4 font-bold px-1">{invoiceDate || '-'}</span>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className={`border-r border-black py-0.5 px-1 text-left ${headerBgClass}`}>L.R No :</td>
                <td className="py-0.5 px-1">
                  <div className="grid grid-cols-12 w-full text-center">
                    <span className="col-span-5 font-bold border-r border-black px-1">{lrNo || '-'}</span>
                    <span className={`col-span-3 ${headerBgClass} px-1 border-r border-black`}>L.R. Date</span>
                    <span className="col-span-4  font-bold px-1">{lrDate || '-'}</span>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className={`border-r border-black py-0.5 px-1 text-left ${headerBgClass}`}>Fabric lot no</td>
                <td className="py-0.5 px-1 text-left font-semibold uppercase">
                  {fabricLotNo || orderNo || '-'}
                </td>
              </tr>
              <tr>
                <td className={`border-r border-black py-0.5 px-1 text-left ${headerBgClass}`}>Roll of No</td>
                <td className="py-0.5 px-1 text-left font-bold">
                  {items.length}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right 54% Block: Loom Type, GLM & Break-up Summary Table with SEPARATE ICIL Standard Column */}
        <div className="col-span-6 flex flex-col justify-between">
          <table className="w-full border-collapse text-center">
            <tbody>
              <tr className="border-b border-black">
                <td className={`border-r border-black py-0.5 px-1 w-[40%] ${headerBgClass}`}>Loom type &amp; Selvedge</td>
                <td className="border-r border-black py-0.5 px-1 font-bold bg-[#FFF9C4] w-[30%]">AIRJET</td>
                <td className="py-0.5 px-1 font-bold bg-[#FFF9C4] w-[30%]">LENO</td>
              </tr>
              <tr className="border-b border-black">
                <td className={`border-r border-black py-0.5 px-1 ${headerBgClass}`}>Fabric Weight (GLM)</td>
                <td className="border-r border-black py-0.5 px-1 font-bold text-[#008000] bg-[#FFF9C4]">
                  {displayGlm}
                </td>
                <td className="py-0.5 px-1 font-bold">Grams</td>
              </tr>
            </tbody>
          </table>

          {/* Break-up Summary Table: 6 Explicit Separate Columns */}
          <table className="w-full border-collapse text-center">
            <colgroup>
              <col style={{ width: '26%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '18%' }} /> {/* SEPARATE ICIL STANDARD COLUMN */}
            </colgroup>
            <thead>
              <tr className="border-b border-black">
                <th className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>Break-up</th>
                <th className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>Qty in Mtrs</th>
                <th className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>% of Mtrs</th>
                <th className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>No of Rolls</th>
                <th className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>% of Rolls</th>
                <th className={`py-0.5 px-0.5 ${headerBgClass}`}>ICIL Standard</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black">
                <td className="border-r border-black py-0.5 px-1 text-left font-medium">&gt;100 Mtrs - &lt;250 Mtrs</td>
                <td className="border-r border-black py-0.5">{calcMtrs(r1Items).toFixed(2)}</td>
                <td className="border-r border-black py-0.5">{calcPctMtrs(calcMtrs(r1Items))}%</td>
                <td className="border-r border-black py-0.5">{r1Items.length}</td>
                <td className="border-r border-black py-0.5 font-bold">{calcPctRolls(r1Items.length)}%</td>
                <td className="py-0.5 font-semibold">#DIV/0!</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black py-0.5 px-1 text-left font-medium">&gt;251 Mtrs - &lt;379 Mtrs</td>
                <td className="border-r border-black py-0.5">{calcMtrs(r2Items).toFixed(2)}</td>
                <td className="border-r border-black py-0.5">{calcPctMtrs(calcMtrs(r2Items))}%</td>
                <td className="border-r border-black py-0.5">{r2Items.length}</td>
                <td className="border-r border-black py-0.5 font-bold">{calcPctRolls(r2Items.length)}%</td>
                <td className="py-0.5 font-semibold">5 to 10%</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black py-0.5 px-1 text-left font-medium">&gt;Mtrs380 - &lt;420 Mtrs</td>
                <td className="border-r border-black py-0.5">{calcMtrs(r3Items).toFixed(2)}</td>
                <td className="border-r border-black py-0.5">{calcPctMtrs(calcMtrs(r3Items))}%</td>
                <td className="border-r border-black py-0.5">{r3Items.length}</td>
                <td className="border-r border-black py-0.5 font-bold">{calcPctRolls(r3Items.length)}%</td>
                <td className="py-0.5 font-semibold">90 to 95%</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black py-0.5 px-1 text-left font-medium">&gt; 421 Mtrs</td>
                <td className="border-r border-black py-0.5">{calcMtrs(r4Items).toFixed(2)}</td>
                <td className="border-r border-black py-0.5">{calcPctMtrs(calcMtrs(r4Items))}%</td>
                <td className="border-r border-black py-0.5">{r4Items.length}</td>
                <td className="border-r border-black py-0.5 font-bold">{calcPctRolls(r4Items.length)}%</td>
                <td className="py-0.5 font-semibold">5%</td>
              </tr>
              <tr>
                <td className={`border-r border-black py-0.5 px-1 text-left ${headerBgClass}`}>Total</td>
                <td className="border-r border-black py-0.5 bg-[#ff0000] text-white font-bold">{totalMeters.toFixed(2)}</td>
                <td className={`border-r border-black py-0.5 ${headerBgClass}`}>100%</td>
                <td className={`border-r border-black py-0.5 ${headerBgClass}`}>{items.length}</td>
                <td className={`border-r border-black py-0.5 ${headerBgClass}`}>100%</td>
                <td className={`py-0.5 ${headerBgClass}`}>100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Inspection Table with Grand Total Bar (Unified 17 Columns) */}
      <table className="w-full border-collapse border-b border-black text-center items-table">
        <colgroup>
          <col style={{ width: '3%' }} />   {/* 1. S.No */}
          <col style={{ width: '5.5%' }} /> {/* 2. Roll No */}
          <col style={{ width: '6.5%' }} /> {/* 3. Total Mtrs */}
          <col style={{ width: '4.5%' }} /> {/* 4. Loom No */}
          <col style={{ width: '7.5%' }} /> {/* 5. Supplier Piece/Ref. No */}
          <col style={{ width: '2.5%' }} /> {/* 6. Penalty 4 */}
          <col style={{ width: '2.5%' }} /> {/* 7. Penalty 3 */}
          <col style={{ width: '2.5%' }} /> {/* 8. Penalty 2 */}
          <col style={{ width: '2.5%' }} /> {/* 9. Penalty 1 */}
          <col style={{ width: '5%' }} />   {/* 10. Total Points */}
          <col style={{ width: '5.5%' }} /> {/* 11. P. Per 100 L mtrs */}
          <col style={{ width: '5%' }} />   {/* 12. Fabric Grade */}
          <col style={{ width: '6%' }} />   {/* 13. Warp lot no */}
          <col style={{ width: '6%' }} />   {/* 14. Weft lot no */}
          <col style={{ width: '6.5%' }} /> {/* 15. Net Weight (kg) */}
          <col style={{ width: '6.5%' }} /> {/* 16. Gross weight (kg) */}
          <col style={{ width: '22.5%' }} />{/* 17. Fabric defects & Penalty details */}
        </colgroup>
        <tbody>
          {/* Grand Total Row */}
          <tr className="border-b border-black font-bold">
            <td colSpan={2} className={`border-r border-black py-0.5 px-1 text-left ${grandTotalBgClass}`}>Grand total</td>
            <td colSpan={1} className="border-r border-black py-0.5 bg-[#ff0000] text-white font-bold">{totalMeters.toFixed(2)}</td>
            <td colSpan={1} className={`border-r border-black py-0.5 ${grandTotalBgClass}`}>NA</td>
            <td colSpan={1} className={`border-r border-black py-0.5 ${grandTotalBgClass}`}>NA</td>
            <td colSpan={1} className={`border-r border-black py-0.5 ${grandTotalBgClass}`}>{totalPts4}</td>
            <td colSpan={1} className={`border-r border-black py-0.5 ${grandTotalBgClass}`}>{totalPts3}</td>
            <td colSpan={1} className={`border-r border-black py-0.5 ${grandTotalBgClass}`}>{totalPts2}</td>
            <td colSpan={1} className={`border-r border-black py-0.5 ${grandTotalBgClass}`}>{totalPts1}</td>
            <td colSpan={1} className={`border-r border-black py-0.5 ${grandTotalBgClass}`}>{totalPointsAll}</td>
            <td colSpan={1} className={`border-r border-black py-0.5 ${grandTotalBgClass}`}>{Math.round(avgPointsPer100Mtr)}</td>
            <td colSpan={1} className={`border-r border-black py-0.5 ${grandTotalBgClass}`}>NA</td>
            <td colSpan={1} className={`border-r border-black py-0.5 ${grandTotalBgClass}`}>NA</td>
            <td colSpan={1} className={`border-r border-black py-0.5 ${grandTotalBgClass}`}>NA</td>
            <td colSpan={1} className={`border-r border-black py-0.5 ${grandTotalBgClass}`}>{totalNetWeight.toFixed(1)}</td>
            <td colSpan={1} className={`border-r border-black py-0.5 ${grandTotalBgClass}`}>{totalGrossWeight.toFixed(1)}</td>
            <td colSpan={1} className={`py-0.5 ${grandTotalBgClass}`}>NA</td>
          </tr>

          {/* Main Inspection Table Headers */}
          <tr className="border-b border-black">
            <th colSpan={1} rowSpan={2} className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>S.No</th>
            <th colSpan={1} rowSpan={2} className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>Roll No</th>
            <th colSpan={1} rowSpan={2} className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>Total Mtrs</th>
            <th colSpan={1} rowSpan={2} className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>Loom No</th>
            <th colSpan={1} rowSpan={2} className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>Supplier Piece/Ref. No</th>
            <th colSpan={4} rowSpan={1} className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>Penalty Points</th>
            <th colSpan={1} rowSpan={2} className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>Total Points</th>
            <th colSpan={1} rowSpan={2} className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>P. Per 100 L mtrs</th>
            <th colSpan={1} rowSpan={2} className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>Fabric Grade</th>
            <th colSpan={1} rowSpan={2} className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>Warp lot no</th>
            <th colSpan={1} rowSpan={2} className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>Weft lot no</th>
            <th colSpan={1} rowSpan={2} className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>Net Weight (kg)</th>
            <th colSpan={1} rowSpan={2} className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>Gross weight (kg)</th>
            <th colSpan={1} rowSpan={2} className={`py-0.5 px-0.5 ${headerBgClass}`}>Fabric defects &amp; Penalty point details</th>
          </tr>
          <tr className="border-b border-black">
            <th colSpan={1} className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>4</th>
            <th colSpan={1} className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>3</th>
            <th colSpan={1} className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>2</th>
            <th colSpan={1} className={`border-r border-black py-0.5 px-0.5 ${headerBgClass}`}>1</th>
          </tr>

          {/* Main Inspection Table Data Rows */}
          {items.map((item, idx) => {
            const mtr = item.meters || 0;
            const tp = item.totalPoints || 0;
            const pts100 = mtr > 0 ? (tp * 100) / mtr : 0;
            return (
              <tr key={idx} className="border-b border-black hover:bg-gray-50">
                <td className="border-r border-black py-0.5 px-0.5">{item.sNo}</td>
                <td className="border-r border-black py-0.5 px-0.5 uppercase font-medium">{item.rollNo}</td>
                <td className="border-r border-black py-0.5 px-0.5 font-semibold">{mtr.toFixed(2)}</td>
                <td className="border-r border-black py-0.5 px-0.5">{item.loomNo || '-'}</td>
                <td className="border-r border-black py-0.5 px-0.5 uppercase">{item.pieceNo || '-'}</td>
                <td className={`border-r border-black py-0.5 px-0.5 ${item.pts4 && item.pts4 > 0 ? 'bg-[#1f2937] text-white font-bold' : ''}`}>{item.pts4 || ''}</td>
                <td className="border-r border-black py-0.5 px-0.5">{item.pts3 || ''}</td>
                <td className="border-r border-black py-0.5 px-0.5">{item.pts2 || ''}</td>
                <td className="border-r border-black py-0.5 px-0.5">{item.pts1 || ''}</td>
                <td className="border-r border-black py-0.5 px-0.5 font-bold">{tp}</td>
                <td className="border-r border-black py-0.5 px-0.5 font-medium">{Math.round(pts100)}</td>
                <td className="border-r border-black py-0.5 px-0.5 font-bold">{item.grade || 'A'}</td>
                <td className="border-r border-black py-0.5 px-0.5 uppercase">{item.warpLotNo || '-'}</td>
                <td className="border-r border-black py-0.5 px-0.5 uppercase">{item.weftLotNo || '-'}</td>
                <td className="border-r border-black py-0.5 px-0.5">{item.netWeight ? Number(item.netWeight).toFixed(2) : (item.netWeight === 0 ? '0.00' : '-')}</td>
                <td className="border-r border-black py-0.5 px-0.5">{item.grossWeight ? Number(item.grossWeight).toFixed(2) : (item.grossWeight === 0 ? '0.00' : '-')}</td>
                <td className="py-0.5 px-0.5 text-left uppercase text-[8.5px]">{item.defectsDetail || item.remarks || ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Bottom Section */}
      {!isIndoCount ? (
        <div className="p-4 flex justify-between items-end min-h-[120px] text-[10px]">
          <div></div>
          <div className="text-center font-bold text-[9.5px]">
            <div className="h-16"></div>
            <div>Supplier authorized signatory</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 text-[9px] min-h-[220px]">
          {/* Left Half (50%) */}
          <div className="border-r border-black p-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold underline text-[9.5px]">Suppliers acknowledgement</span>
                <span className="border border-dashed border-black px-1 font-semibold text-[8px]">*PL - Packing list</span>
              </div>
              <div className="font-bold text-[8.5px] mb-0.5">
                This PL fabric rolls are 100% free from hanging &amp; Uncut threads
              </div>
              <div className="font-bold text-[8.5px] mb-1">
                There will not be any negative observations in EPI, PPI greay width &amp; Yarn count
              </div>
              <table className="w-full border-collapse mb-1 text-[8.5px] border border-black">
                <tbody>
                  <tr className="border-b border-black">
                    <td className="py-0.5 px-1 border-r border-black">1st line inspection report attached in rolls</td>
                    <td className="py-0.5 px-1 font-bold text-center border-r border-black w-[12%]">Yes</td>
                    <td className="py-0.5 px-1 font-bold text-center w-[18%]">Datas</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="py-0.5 px-1 border-r border-black">Is this PL contains 99% A Grade fabric rolls</td>
                    <td className="py-0.5 px-1 font-bold text-center border-r border-black">Yes</td>
                    <td className="py-0.5 px-1 font-bold text-center">{gradeAPct}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="py-0.5 px-1 border-r border-black">Is this PL contains 95% - 380 Mtrs + roll length</td>
                    <td className="py-0.5 px-1 font-bold text-center border-r border-black">No</td>
                    <td className="py-0.5 px-1 font-bold text-center">{roll380Pct}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="py-0.5 px-1 border-r border-black">Is this PL falls under Avg. 12 points / 100 LM</td>
                    <td className="py-0.5 px-1 font-bold text-center border-r border-black">Yes</td>
                    <td className="py-0.5 px-1 font-bold text-center">{Math.round(avgPointsPer100Mtr)}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-1 border-r border-black">Is this PL fabric gone under field random inspection</td>
                    <td className="py-0.5 px-1 font-bold text-center" colSpan={2}>No</td>
                  </tr>
                </tbody>
              </table>
              <div className="font-semibold text-[8px] mb-1">
                *If yes then attach the random inspection report
              </div>
              <p className="text-[7.5px] leading-tight mb-2">
                <span className="font-bold underline">Declaration:</span> If any inferior fabric quality found in grey or after processing as a fabris supplier we are whole responsible for total value loss right from Grey / Transportation, Dyeing / Colouring &amp; Printing.
              </p>
            </div>
            <div className="text-center font-bold text-[9.5px] pt-5 pb-1">
              Supplier authorized signatory
            </div>
          </div>

          {/* Right Half (50%) */}
          <div className="p-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-center items-center mb-1">
                <span className="font-bold underline text-[9.5px]">Commands</span> &nbsp;
                <span className="font-semibold text-[8.5px]">*RI - Random Inspection</span>
              </div>
            </div>
            <div className="text-center font-bold text-[9.5px] pt-1 pb-1">
              ICIL Plant Random Inspection Team
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PackingListTemplate: React.FC<PackingListTemplateProps> = ({ data }) => {
  if (data.isBrushChecked === 1 || data.isBrushChecked === true) {
    return <BrushedPackingListTemplate data={data} />;
  }

  return <WeavingPackingListTemplate data={data} />;
};
