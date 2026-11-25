// import React from 'react';
// import Barcode from 'react-barcode';

// interface BarcodeStickerProps {
//   barcode: string;
//   companyName?: string;
//   width?: string;
//   height?: string;
//   fabricQuality?: string;
//   fabricCode?: string;
//   grade?: string;
//   meter?: string | number;
//   yards?: string | number;
//   netWeight?: string | number;
//   avgWeight?: string | number;
//   grossWeight?: string | number;
//   showMeter?: boolean;
//   showYards?: boolean;
//   showNet?: boolean;
//   showAvg?: boolean;
//   showGross?: boolean;
//   showCompany?: boolean;
// }

// export const BarcodeSticker: React.FC<BarcodeStickerProps> = ({
//   barcode,
//   companyName,
//   width = "4in",
//   height = "2in",
//   fabricQuality,
//   fabricCode,
//   grade,
//   meter,
//   yards,
//   netWeight,
//   avgWeight,
//   grossWeight,
//   showMeter = true,
//   showYards = false,
//   showNet = true,
//   showAvg = false,
//   showGross = false,
//   showCompany = false
// }) => {
//   return (
//     <div
//       className="bg-white border border-gray-300 shadow-sm print:shadow-none print:border-none flex flex-col items-center p-2 box-border overflow-hidden"
//       style={{
//         width: width,
//         height: height,
//         minWidth: width,
//         minHeight: height,
//         maxWidth: width,
//         maxHeight: height,
//       }}
//     >
//       <div className="w-full h-4 flex items-center justify-center">
//         {showCompany && companyName && (
//           <div className="text-[10px] font-bold uppercase tracking-wider text-center">{companyName}</div>
//         )}
//       </div>

//       <div className="w-full flex flex-col items-center gap-0.5">
//         <Barcode
//           value={barcode}
//           width={1.2}
//           height={40}
//           displayValue={false}
//           margin={0}
//           background="transparent"
//         />

//         <div className="font-mono text-[15px] font-bold tracking-widest leading-none">{barcode}</div>

//         <div className="w-full flex justify-center gap-3 text-[10px] font-bold mt-1 border-t border-gray-100 pt-0.5 px-2">
//           {fabricCode && (
//             <div className="truncate">
//               Fabric Code: {fabricCode}
//             </div>
//           )}
//           {fabricQuality && fabricQuality !== fabricCode && (
//             <div className="truncate">
//               {fabricCode ? 'Quality: ' : 'Fabric Code: '}{fabricQuality}
//             </div>
//           )}

//         </div>
//       </div>

//       <div className="w-full grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 border-t pt-1">
//         {showMeter && (
//           <div className="flex items-center text-[11px] pl-8">
//             <span className="font-bold mr-1">Meter:</span> {meter || '--'}
//           </div>
//         )}
//         {showNet && (
//           <div className="flex items-center text-[11px] pl-16">
//             <span className="font-bold mr-1">Net Wt:</span> {netWeight || '--'}
//           </div>
//         )}


//       </div>
//       {grade ? (
//         <div className="w-full grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 border-t pt-1">
//           {showAvg && (
//             <div className="flex items-center text-[10px] pl-8">
//               <span className="font-bold mr-1">Avg Wt:</span> {avgWeight || '--'}
//             </div>
//           )}
//           {grade && (
//             <div className="flex items-end text-[10px] pl-12">
//               <span className="font-bold mr-1">Grade:</span> {grade || '--'}
//             </div>
//           )}
//         </div>
//       ) : <div className='w-full grid grid-cols-3 gap-x-1 gap-y-0.5 mt-1 border-t pt-1'>
//         {showYards && (
//           <div className="flex items-center text-[10px] pl-8">
//             <span className="font-bold mr-1">Yards:</span> {yards || '--'}
//           </div>
//         )}
//         {showGross && (
//           <div className="flex items-center text-[10px] pl-6">

//             <span className="font-bold mr-1">Gross Wt:</span> {grossWeight || '--'}

//           </div>
//         )}
//         {showAvg && (
//           <div className="flex items-center text-[10px] pl-4">
//             <span className="font-bold mr-1">Avg Wt:</span> {avgWeight || '--'}
//           </div>
//         )}
//         {grade && (
//           <div className="flex items-end text-[10px] pl-4">
//             <span className="font-bold mr-1">Grade:</span> {grade || '--'}
//           </div>
//         )}
//       </div>}

//       <style>{`
//         @page {
//           size: ${width} ${height} landscape;
//           margin: 0;
//         }
//         @media print {
//           body {
//             margin: 0;
//             padding: 0;
//           }
//         }
//       `}</style>
//     </div>
//   );
// };
import React, { useRef, useEffect } from 'react';
import Barcode from 'react-barcode';

interface BarcodeStickerProps {
  barcode: string;
  companyName?: string;
  width?: string;
  height?: string;
  fabricQuality?: string;
  fabricCode?: string;
  grade?: string;
  meter?: string | number;
  yards?: string | number;
  netWeight?: string | number;
  avgWeight?: string | number;
  grossWeight?: string | number;
  showMeter?: boolean;
  showYards?: boolean;
  showNet?: boolean;
  showAvg?: boolean;
  showGross?: boolean;
  showCompany?: boolean;
}

export const BarcodeSticker: React.FC<BarcodeStickerProps> = ({
  barcode,
  companyName,
  width = "4in",
  height = "2in",
  fabricQuality,
  fabricCode,
  grade,
  meter,
  yards,
  netWeight,
  avgWeight,
  grossWeight,
  showMeter = true,
  showYards = false,
  showNet = true,
  showAvg = false,
  showGross = false,
  showCompany = false
}) => {
  const formatAvgWeight = (val?: string | number) => {
    if (val == null || val === '') return '--';
    const n = Number(val);
    return Number.isFinite(n) ? n.toFixed(3) : String(val);
  };

  const barcodeWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barcodeWrapperRef.current) return;
    const svg = barcodeWrapperRef.current.querySelector('svg');
    if (svg) {
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '50');
      svg.style.width = '100%';
      svg.style.height = '50px';
      svg.style.display = 'block';
    }
  }, [barcode]);

  return (
    <div
      className="bg-white border border-gray-300 shadow-sm print:shadow-none print:border-none flex flex-col items-center p-2 box-border overflow-hidden"
    style={{
        width: '400px',
        minWidth: '400px',
        maxWidth: '400px',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div className="w-full h-4 flex items-center justify-center pb-2">
        {showCompany && companyName && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-center">{companyName}</div>
        )}
      </div>

      <div className="w-full flex flex-col items-center gap-0.5" style={{ overflow: 'hidden' }}>
        <div ref={barcodeWrapperRef} className="barcode-svg-wrapper" style={{ width: '100%', height: '50px', overflow: 'hidden', display: 'block' }}>
        <Barcode
          value={barcode}
          width={1.5}
          height={40}
          displayValue={false}
          margin={0}
          background="transparent"
        />
        </div>

        <div className="font-mono text-[11px] font-bold leading-none w-full text-center pt-2" style={{ overflowWrap: 'break-word', wordBreak: 'break-all', maxWidth: '100%' }}>{barcode}</div>

        {(fabricCode || fabricQuality) && (
          <div className="w-full text-[10px] font-bold mt-1 border-t border-gray-100 pt-0.5 pl-4 break-words">
            <span className="font-extrabold">Quality: </span>{' '}
            {[fabricCode, fabricQuality].filter(Boolean).join(' - ')}
          </div>
        )}
      </div>
      <div className="w-full grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 border-t pt-1">
        {showMeter && (
          <div className="flex items-center text-[11px] pl-4">
            <span className="font-bold mr-1">Meter:</span> {meter || '--'}
          </div>
        )}
        {showNet && (
          <div className="flex items-end justify-end text-[11px] pr-4">
            <span className="font-bold mr-1">Net Wt:</span> {netWeight || '--'}
          </div>
        )}
      </div>

      {grade ? (
        <div className="w-full grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 border-t pt-1">
          {showAvg && (
            <div className="flex items-center text-[11px] pl-4">
              <span className="font-bold mr-1">Avg Wt:</span> {formatAvgWeight(avgWeight)}
            </div>
          )}
          {grade && (
            <div className="flex items-end justify-end text-[11px] pr-4">
              <span className="font-bold mr-1">Grade:</span> {grade || '--'}
            </div>
          )}
        </div>
      ) : (
        <div className='w-full grid grid-cols-3 gap-x-1 gap-y-0.5 mt-1 border-t pt-1'>
          {showYards && (
            <div className="flex items-center text-[10px] pl-4">
              <span className="font-bold mr-1">Yards:</span> {yards || '--'}
            </div>
          )}
          {showGross && (
            <div className="flex items-end justify-end text-[10px] pr-4">
              <span className="font-bold mr-1">Gross Wt:</span> {grossWeight || '--'}
            </div>
          )}
          {showAvg && (
            <div className="flex items-center text-[11px] pl-4">
              <span className="font-bold mr-1">Avg Wt:</span> {formatAvgWeight(avgWeight)}
            </div>
          )}
          {grade && (
            <div className="flex items-end justify-end text-[11px] pr-4">
              <span className="font-bold mr-1">Grade:</span> {grade || '--'}
            </div>
          )}
        </div>
      )}

      <style>{`
        @page {
          size: ${width} ${height} landscape;
          margin: 0;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
        }
        .barcode-svg-wrapper svg {
          width: 100% !important;
          height: 50px !important;
          display: block !important;
        }
      `}</style>
    </div>
  );
};