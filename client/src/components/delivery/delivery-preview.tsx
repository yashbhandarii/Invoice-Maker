import React from "react";
import { DeliveryChallanData } from "@/lib/invoice-types";
import { format } from "date-fns";
import { User, MapPin, Truck, Hash } from "lucide-react";

interface DeliveryPreviewProps {
    data: DeliveryChallanData;
}

export const DeliveryPreview = React.forwardRef<HTMLDivElement, DeliveryPreviewProps>(
    ({ data }, ref) => {

        return (
            <div className="w-full overflow-auto bg-gray-100 p-8 flex justify-center print:bg-white print:p-0 print:overflow-hidden">
                <style type="text/css" media="print">
                    {`
            @page { 
              size: A4; 
              margin: 0; 
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          `}
                </style>
                <div
                    ref={ref}
                    className="bg-white w-[210mm] h-[297mm] shadow-xl text-black font-sans relative print:shadow-none print:w-[210mm] print:h-[297mm] overflow-hidden flex flex-col transform scale-[0.45] sm:scale-75 md:scale-100 origin-top mb-[-140mm] sm:mb-[-70mm] md:mb-0"
                    style={{ fontSize: '12px' }}
                >
                    {/* Header Geometric Shapes */}
                    <div className="absolute top-0 left-0 w-full h-32 overflow-hidden pointer-events-none">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600 transform -translate-x-16 -translate-y-32 rotate-45 opacity-90"></div>
                        <div className="absolute top-0 left-16 w-64 h-64 bg-slate-300 transform -translate-x-16 -translate-y-32 rotate-45 opacity-60"></div>
                        <div className="absolute top-0 left-32 w-48 h-48 bg-blue-800 transform -translate-x-16 -translate-y-24 rotate-45 opacity-80"></div>
                    </div>

                    {/* Content Container */}
                    <div className="p-8 pb-4 relative z-10 flex-1 flex flex-col h-full">

                        {/* Top Header Section */}
                        <div className="flex justify-end mb-4 pt-4">
                            <div className="text-right">
                                <h1 className="text-3xl font-black uppercase text-gray-900 tracking-wider">Delivery Challan</h1>
                                <div className="text-sm font-semibold mt-1">Challan No: {data.challanNo}</div>
                                <div className="text-sm font-semibold">Date: {data.date ? format(new Date(data.date), "dd/MM/yyyy") : " / / "}</div>
                            </div>
                        </div>

                        {/* Company / Sender Information */}
                        <div className="relative mb-8 mt-2">
                            {/* Stylized Background */}
                            <div className="absolute inset-0 bg-gray-100 transform -skew-x-12 rounded-lg border-l-4 border-blue-600"></div>

                            <div className="relative py-4 px-8 text-center">
                                <h2 className="text-2xl font-bold uppercase text-gray-800 tracking-wide">{data.companyName}</h2>
                                <div className="text-xs text-gray-600 font-medium mt-1 uppercase tracking-wide">
                                    {data.companyAddress}
                                </div>
                                <div className="flex justify-center gap-4 text-xs font-bold mt-2 text-gray-700">
                                    {data.companyGst && <span>GST NO: {data.companyGst}</span>}
                                    {data.companyContact && <span>| CONTACT NO: {data.companyContact}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Details Section (Buyer & Transport) */}
                        <div className="grid grid-cols-2 gap-8 mb-6">

                            {/* Buyer Details */}
                            <div className="flex gap-3">
                                <div className="mt-1">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                        <User size={16} />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-sm uppercase text-gray-800 mb-1 border-b border-gray-300 pb-1">Buyer Details</h3>
                                    <div className="grid grid-cols-[100px_1fr] gap-y-1 text-sm">
                                        <span className="font-bold text-gray-700">Buyer Name:</span>
                                        <span className="font-medium">{data.clientName}</span>

                                        <span className="font-bold text-gray-700">Address:</span>
                                        <span className="font-medium">{data.clientAddress}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Transport Details */}
                            <div className="flex gap-3">
                                <div className="mt-1">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                        <Truck size={16} />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-sm uppercase text-gray-800 mb-1 border-b border-gray-300 pb-1">Transport Details</h3>
                                    <div className="grid grid-cols-[100px_1fr] gap-y-1 text-sm">
                                        <span className="font-bold text-gray-700">Driver Name:</span>
                                        <span className="font-medium">{data.driverName}</span>

                                        {data.driverMobile && (
                                            <>
                                                <span className="font-bold text-gray-700">Mobile No:</span>
                                                <span className="font-medium">{data.driverMobile}</span>
                                            </>
                                        )}

                                        <span className="font-bold text-gray-700">Vehicle No:</span>
                                        <span className="font-medium">{data.vehicleNo}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Goods Table */}
                        <div className="mb-2">
                            <div className="bg-gray-300 text-center font-bold text-sm py-1 border border-gray-400 border-b-0 uppercase">
                                Description of Goods
                            </div>
                            <table className="w-full border-collapse border border-gray-400 text-sm">
                                <thead>
                                    <tr className="bg-gray-200">
                                        <th className="border border-gray-400 p-2 w-12">Sr. No.</th>
                                        <th className="border border-gray-400 p-2 text-left">Description of Goods</th>
                                        <th className="border border-gray-400 p-2 w-20">No. of Bags</th>
                                        <th className="border border-gray-400 p-2 w-24">Weight (Kg)</th>
                                        <th className="border border-gray-400 p-2 w-28">Total Freight (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="border border-gray-400 p-8 text-center italic text-gray-500">No items</td>
                                        </tr>
                                    ) : (
                                        data.items.filter(item => item.description || item.bags > 0 || item.weight > 0 || item.totalFreight > 0).map((item, index) => (
                                            <tr key={index}>
                                                <td className="border border-gray-400 p-2 text-center font-medium">{index + 1}</td>
                                                <td className="border border-gray-400 p-2 font-medium">{item.description}</td>
                                                <td className="border border-gray-400 p-2 text-center font-medium">{item.bags || ""}</td>
                                                <td className="border border-gray-400 p-2 text-center font-medium">{item.weight || ""}</td>
                                                <td className="border border-gray-400 p-2 text-center font-medium">
                                                    {data.hideFreight ? "No Freight" : (item.totalFreight || "")}
                                                </td>
                                            </tr>
                                        ))
                                    )}

                                </tbody>
                            </table>
                        </div>

                        {/* Freight Summary & Notes/Declaration */}
                        <div className="flex flex-col mb-auto">
                            {!data.hideFreight && (
                                <div className="flex justify-end mb-6">
                                    <div className="w-80 border border-gray-400 text-sm">
                                        <div className="bg-gray-200 text-center font-bold py-1 border-b border-gray-400">FREIGHT SUMMARY</div>
                                        <div className="p-2 space-y-1">
                                            <div className="flex justify-between">
                                                <span>Total Freight (₹) :</span>
                                                <span className="font-bold">{data.totalFreightSum?.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Less: Given Freight (₹) :</span>
                                                <span className="font-bold">{data.totalGivenFreightSum?.toFixed(2)}</span>
                                            </div>
                                            {data.expenseAmount > 0 && (
                                                <div className="flex justify-between text-red-600 print:text-black">
                                                    <span>Less: {data.expenseReason || "Expense"} (₹) :</span>
                                                    <span className="font-bold">{data.expenseAmount?.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between border-t border-gray-400 pt-1 mt-1 font-bold text-base">
                                                <span>Remaining Freight (₹) :</span>
                                                <span>{data.totalRemainingFreightSum?.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mb-4 flex items-start gap-2">
                                <h4 className="font-bold uppercase text-sm whitespace-nowrap">Note:</h4>
                                <div className="text-sm flex-1">{data.notes}</div>
                            </div>

                            <div className="mb-4">
                                <h4 className="font-bold uppercase mb-1 text-sm">Declaration</h4>
                                <p className="text-sm text-gray-700">
                                    I hereby declare that the above-mentioned goods are transported as per the details mentioned above.
                                </p>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="flex justify-between items-end mt-4 mb-8 px-4">
                            <div className="text-center">
                                <div className="border-t border-gray-800 w-40 pt-1 font-bold text-sm">Sender Signature</div>
                            </div>
                            <div className="text-center">
                                <div className="border-t border-gray-800 w-40 pt-1 font-bold text-sm">Driver Signature</div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Geometric Footer */}
                    <div className="absolute bottom-0 left-0 w-full h-12 bg-blue-600">
                        <div className="absolute top-0 right-32 w-16 h-16 bg-white transform rotate-45 translate-y-8"></div>
                    </div>
                </div>
            </div>
        );
    }
);

DeliveryPreview.displayName = "DeliveryPreview";
