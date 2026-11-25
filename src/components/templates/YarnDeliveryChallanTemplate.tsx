import React from 'react';
import { YarnDeliveryChallanData } from './YarnDeliveryChallanTemplate.types';

interface YarnDeliveryChallanTemplateProps {
  data: YarnDeliveryChallanData;
  isYarnChallan?: boolean;
}

export const YarnDeliveryChallanTemplate: React.FC<YarnDeliveryChallanTemplateProps> = ({ data, isYarnChallan = false }) => {
  const { company, erpCompany, vendor, dcDetails, items } = data;

  return (
    <div className="max-w-[1200px] mx-auto bg-white p-6 text-black font-sans print:p-2">
      {/* Main Single Block Container */}
      <div className="border-2 border-black">
        {/* Header - Letterhead style for Yarn Challan */}
        <div className="text-center p-4 border-b-2 border-black">
          {isYarnChallan && erpCompany ? (
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-black uppercase tracking-tight">{erpCompany.name}</h1>
              <p className="text-xs">{erpCompany.address}</p>
              <p className="text-xs">{erpCompany.cityPincode}, {erpCompany.stateCode}</p>
              <p className="text-xs font-bold uppercase mt-1">GST: {erpCompany.gst}</p>
            </div>
          ) : (
            <h1 className="text-2xl font-bold tracking-wider uppercase">YARN DELIVERY CHALLAN</h1>
          )}
        </div>

        {/* YARN CHALLAN TITLE BAR */}
        {isYarnChallan && (
          <div className="border-b border-black p-2 bg-gray-50 text-center">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em]">YARN DELIVERY CHALLAN</h2>
          </div>
        )}

        {/* Info Section - Buyer and Consignee */}
        <div className="border-b border-black grid grid-cols-2">
          <div className="flex flex-col gap-1 p-2 border-r border-black">
            <div className="flex">
              <span className="text-xs font-bold underline mb-1">{isYarnChallan ? 'BUYER' : 'COMPANY'}</span>
            </div>
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
              <span className="text-xs font-bold underline mb-1">{isYarnChallan ? 'CONSIGNEE' : 'DELIVERY TO'}</span>
            </div>
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
              <span className="text-xs "> {vendor.gst}</span>
            </div> 
            <div className="flex">
              <span className="text-xs">{vendor.country}</span>
            </div>
          </div>
        </div>

        {/* DC Details Section */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-2 border-b border-black">
          <div className="flex">
            <span className="font-bold text-xs w-36">DC No:</span>
            <span className="text-xs">{dcDetails.dcNoCardNo}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-xs w-36">Vehicle No:</span>
            <span className="text-xs">{dcDetails.vehicleNo}</span>
          </div>
          <div className="flex">
            <span className="font-bold text-xs w-36">DC Date:</span>
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
                {!isYarnChallan && <th className="border border-black p-1 text-left font-bold">{data.planNoLabel || 'Plan No'}</th>}
                <th className="border border-black p-1 text-left font-bold">Yarn Name</th>
                <th className="border border-black p-1 text-left font-bold">Mill Name</th>
                <th className="border border-black p-1 text-left font-bold">No of Bags</th>
                <th className="border border-black p-1 text-left font-bold">No of cones</th>
                {isYarnChallan && <th className="border border-black p-1 text-left font-bold">Kgs/Bag</th>}
                <th className="border border-black p-1 text-left font-bold">Net Wt</th>
                <th className="border border-black p-1 text-left font-bold">Gross Wt</th>
                <th className="border border-black p-1 text-left font-bold">Lot No</th>
                <th className="border border-black p-1 text-left font-bold">Location</th>
              </tr>
            </thead>
            <tbody>
              {items && items.length > 0 ? (
                items.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-black p-1">{item.sNo}</td>
                    {!isYarnChallan && <td className="border border-black p-1">{item.sizingPlanNo}</td>}
                    <td className="border border-black p-1">{item.yarnName}</td>
                    <td className="border border-black p-1">{item.millName}</td>
                    <td className="border border-black p-1">{item.noOfBags}</td>
                    <td className="border border-black p-1">{item.noOfCones}</td>
                    {isYarnChallan && <td className="border border-black p-1">{item.kgsPerBag || '-'}</td>}
                    <td className="border border-black p-1">{item.netWt}</td>
                    <td className="border border-black p-1">{item.grossWt}</td>
                    <td className="border border-black p-1">{item.lotNo}</td>
                    <td className="border border-black p-1">{item.location}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isYarnChallan ? 10 : 10} className="border border-black p-2 text-center">
                    No items available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        
         <div className=" pt-2 font-bold text-xs mb-10 pl-[42rem] ">
  For {isYarnChallan ? (erpCompany?.name || 'Company Name') : company.name}
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
