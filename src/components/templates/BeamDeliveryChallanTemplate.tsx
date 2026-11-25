import React from 'react';
import { YarnDeliveryChallanData } from './YarnDeliveryChallanTemplate.types';

interface BeamDeliveryChallanTemplateProps {
  data: YarnDeliveryChallanData & { beamItems?: any[] };
}

export const BeamDeliveryChallanTemplate: React.FC<BeamDeliveryChallanTemplateProps> = ({ data }) => {
  const { company, vendor, dcDetails, items, beamItems } = data;
  const displayItems = beamItems || items;

  return (
    <div className="max-w-[1200px] mx-auto bg-white p-6 text-black font-sans print:p-2">
      {/* Main Single Block Container */}
      <div className="border-2 border-black">
        {/* Header */}
        <div className="text-center p-2 border-b-2 border-black">
          <h1 className="text-2xl font-bold tracking-wider uppercase">BEAM DELIVERY CHALLAN</h1>
        </div>

        {/* Info Section - Combined into one block */}
        <div className="grid grid-cols-2 border-b border-black">
          <div className="flex flex-col gap-1 border-r border-black p-2">
            <div className="flex">
              <span className="text-xs font-bold">{company.name}</span>
            </div>
            <div className="flex">
              <span className="text-xs">{company.address}</span>
            </div>
            <div className="flex">
              <span className="text-xs">{company.cityPincode}</span>
            </div>
            <div className="flex">
              <span className="text-xs">{company.stateCode}</span>
            </div>
            <div className="flex">
                 <span className="text-xs w-10">GST </span>
              <span className="text-xs">{company.gst}</span>
            </div>
            <div className="flex">
              <span className="text-xs">{company.country}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 p-2">
            <div className="flex">
              <span className="text-xs font-bold">{vendor.name}</span>
            </div>
            <div className="flex">
              <span className="text-xs">{vendor.address}</span>
            </div>
            <div className="flex">
              <span className="text-xs">{vendor.cityPincode}</span>
            </div>
            <div className="flex">
              <span className="text-xs">{vendor.stateCode}</span>
            </div>
            <div className="flex">
                 <span className="text-xs w-10">GST </span>
              <span className="text-xs">{vendor.gst}</span>
            </div>
            <div className="flex">
              <span className="text-xs">{vendor.country}</span>
            </div>
          </div>
        </div>

        {/* DC Details Section - Integrated into same block flow */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-2 border-b border-black">
          <div className="flex">
            <span className="font-bold text-xs w-36">Beam Outward No:</span>
            <span className="text-xs">{dcDetails.dcNoCardNo}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-xs w-36">Vehicle No:</span>
            <span className="text-xs">{dcDetails.vehicleNo}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-xs w-36">Outward Date:</span>
            <span className="text-xs">{dcDetails.dcDate}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-xs w-36">Remarks:</span>
            <span className="text-xs">{dcDetails.remarks}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-xs w-36">Transport Name:</span>
            <span className="text-xs">{dcDetails.transportName}</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-white">
                <th className="border border-black p-1 text-left font-bold">S.No</th>
                <th className="border border-black p-1 text-left font-bold">Plan No</th>
                <th className="border border-black p-1 text-left font-bold">Yarn Name</th>
                <th className="border border-black p-1 text-left font-bold">Mill Name</th>
                <th className="border border-black p-1 text-left font-bold">Sized Beam No</th>
                <th className="border border-black p-1 text-left font-bold">Beam Meters</th>
                <th className="border border-black p-1 text-left font-bold">Width</th>
                <th className="border border-black p-1 text-left font-bold">Expected Fabric Meter</th>
                <th className="border border-black p-1 text-left font-bold">Total Ends</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((item, index) => (
                <tr key={index}>
                  <td className="border border-black p-1">{item.sNo}</td>
                  <td className="border border-black p-1">{item.sizingPlanNo}</td>
                  <td className="border border-black p-1">{item.yarnName}</td>
                  <td className="border border-black p-1">{item.millName}</td>

                  <td className="border border-black p-1">{item.sizedBeamNo || item.noOfBags || '-'}</td>
                  <td className="border border-black p-1">{item.beamMeters || item.noOfCones || '-'}</td>
                  <td className="border border-black p-1">{item.width || item.netWt || '-'}</td>
                  <td className="border border-black p-1">{item.expectedFabricMeter || item.grossWt || '-'}</td>
                  <td className="border border-black p-1">{item.totalEnds || item.flangeNo || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className=" pt-2 font-bold text-xs mb-10 pl-[42rem] ">
            For {company.name}
          </div>
        </div>

        {/* Footer Section */}
        <div className="grid grid-cols-3 gap-6 mt-12 p-4">
          <div className="text-center">
            <div className="pt-1 font-bold text-xs uppercase">Reciever's</div>
          </div>
          <div className="text-center">
            <div className="pt-1 font-bold text-xs uppercase">Checked By</div>
          </div>
          <div className="text-center">
            <div className="pt-1 font-bold text-xs uppercase">Approved By</div>
          </div>
        </div>
      </div>
    </div>
  );
};
