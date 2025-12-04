import React, { useMemo } from "react";
import { InvoiceData } from "@/lib/invoice-types";
import { numberToWords, cn } from "@/lib/utils";
import { format } from "date-fns";

interface InvoicePreviewProps {
  data: InvoiceData;
}

export const InvoicePreview = React.forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ data }, ref) => {
    
    // Calculate totals
    const subTotal = data.items.reduce((acc, item) => acc + item.amount, 0);
    const discountAmount = data.discount; // Assuming fixed amount, not percent
    const taxableAmount = subTotal - discountAmount;
    
    const cgstAmount = (taxableAmount * data.cgstRate) / 100;
    const sgstAmount = (taxableAmount * data.sgstRate) / 100;
    const igstAmount = (taxableAmount * data.igstRate) / 100;
    
    const grandTotal = taxableAmount + cgstAmount + sgstAmount + igstAmount;
    const totalBalance = grandTotal - data.advance;

    return (
      <div className="w-full overflow-auto bg-gray-100 p-8 flex justify-center">
        <div 
          ref={ref}
          className="bg-white w-[210mm] min-h-[297mm] p-4 md:p-8 shadow-xl text-black font-serif relative print:shadow-none print:w-full print:p-0"
          style={{ fontSize: '14px' }}
        >
          {/* Main Border Container */}
          <div className="border-[3px] border-primary h-full flex flex-col">
            
            {/* Header Section */}
            <div className="border-b-2 border-primary pb-2 relative">
              <div className="flex justify-between text-[10px] px-2 pt-1 text-primary font-bold">
                <span>Subject to Shrigonda Jurisdiction</span>
                <span className="italic">|| Shree Mahaviray Namah ||</span>
                <div className="text-right">
                  <div>{data.sellerContact1}</div>
                  <div>{data.sellerContact2}</div>
                </div>
              </div>
              
              <div className="text-left px-2 text-[10px] text-primary font-bold">
                State : Maharashtra State Code : 27
              </div>

              <div className="text-center mt-1">
                <h1 className="text-3xl font-bold text-primary uppercase tracking-wide font-serif">
                  {data.sellerName}
                </h1>
                {data.sellerHindiName && (
                  <h2 className="text-xl font-bold text-primary mt-1 font-hindi">
                    {data.sellerHindiName}
                  </h2>
                )}
                
                <div className="flex justify-center mt-2">
                  <span className="bg-primary text-white px-4 py-1 font-bold text-sm rounded-sm uppercase tracking-wider">
                    {data.sellerSubtitle}
                  </span>
                </div>
                
                <div className="mt-2 font-bold text-primary text-sm space-y-1">
                  <div>
                    <span className="mr-4">PAN No: {data.sellerPan}</span>
                    <span>GSTIN: {data.sellerGst}</span>
                  </div>
                  <div>{data.sellerAddress}</div>
                </div>
              </div>
            </div>

            {/* Buyer & Invoice Info Grid */}
            <div className="grid grid-cols-12 border-b-2 border-primary">
              {/* Left Side: Buyer Details */}
              <div className="col-span-7 p-2 border-r-2 border-primary space-y-2">
                <div className="flex">
                  <span className="font-bold w-24 text-primary">Buyer Name :</span>
                  <span className="border-b border-dotted border-gray-400 flex-1">{data.buyerName}</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-24 text-primary">Address :</span>
                  <span className="border-b border-dotted border-gray-400 flex-1">{data.buyerAddress}</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-24 text-primary">By / Through :</span>
                  <span className="border-b border-dotted border-gray-400 flex-1">{data.buyerThrough}</span>
                </div>
                <div className="flex justify-between">
                  <div className="flex flex-1 mr-2">
                    <span className="font-bold w-24 text-primary">GSTIN No. :</span>
                    <span className="border-b border-dotted border-gray-400 flex-1">{data.buyerGst}</span>
                  </div>
                  <div className="flex flex-1">
                    <span className="font-bold w-24 text-primary">State Code :</span>
                    <span className="border-b border-dotted border-gray-400 flex-1">{data.buyerStateCode}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Invoice Meta */}
              <div className="col-span-5 p-2 flex flex-col justify-between">
                <div className="text-center mb-2">
                   <span className="text-primary font-bold text-lg border-b border-primary inline-block px-2">TAX INVOICE</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="font-bold w-24 text-primary">Invoice No. :</span>
                    <span className="font-bold text-lg">{data.invoiceNo}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold w-24 text-primary">Date :</span>
                    <span className="border-b border-dotted border-gray-400 flex-1">
                      {data.date ? format(new Date(data.date), "dd/MM/yyyy") : ""}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-bold w-24 text-primary">Vehicle No. :</span>
                    <span className="border-b border-dotted border-gray-400 flex-1">{data.vehicleNo}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="flex-1 flex flex-col">
              {/* Table Header */}
              <div className="grid grid-cols-12 text-center font-bold text-primary border-b-2 border-primary bg-[#fffdf0]">
                <div className="col-span-2 py-2 border-r border-primary flex items-center justify-center">HSN<br/>Code</div>
                <div className="col-span-5 py-2 border-r border-primary flex items-center justify-center">Description Of Goods</div>
                <div className="col-span-1 py-2 border-r border-primary flex items-center justify-center">Qty.</div>
                <div className="col-span-1 py-2 border-r border-primary flex items-center justify-center">Weight</div>
                <div className="col-span-1 py-2 border-r border-primary flex items-center justify-center">Rate</div>
                <div className="col-span-2 py-2 flex items-center justify-center">Amount</div>
              </div>

              {/* Table Rows */}
              <div className="flex-1 relative">
                 {/* Vertical Grid Lines - Absolute positioned to stretch full height */}
                 <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                    <div className="col-span-2 border-r border-primary h-full"></div>
                    <div className="col-span-5 border-r border-primary h-full"></div>
                    <div className="col-span-1 border-r border-primary h-full"></div>
                    <div className="col-span-1 border-r border-primary h-full"></div>
                    <div className="col-span-1 border-r border-primary h-full"></div>
                    <div className="col-span-2 h-full"></div>
                 </div>

                 {/* Data Rows */}
                 {data.items.map((item, index) => (
                   <div key={item.id} className="grid grid-cols-12 text-center relative z-10">
                     <div className="col-span-2 py-1 px-1">{item.hsnCode}</div>
                     <div className="col-span-5 py-1 px-2 text-left">{item.description}</div>
                     <div className="col-span-1 py-1 px-1">{item.qty}</div>
                     <div className="col-span-1 py-1 px-1">{item.weight?.toFixed(2)}</div>
                     <div className="col-span-1 py-1 px-1">{item.rate.toFixed(2)}</div>
                     <div className="col-span-2 py-1 px-2 font-bold text-right">{item.amount.toFixed(2)}</div>
                   </div>
                 ))}
                 
                 {/* Empty space filler */}
                 <div className="min-h-[100px]"></div>
              </div>
            </div>

            {/* Footer Totals Section */}
            <div className="border-t-2 border-primary grid grid-cols-12">
              
              {/* Left Side: Amount in Words */}
              <div className="col-span-7 p-2 border-r-2 border-primary flex flex-col">
                 <div className="text-primary font-bold mb-1">Rupees in words :</div>
                 <div className="font-serif italic text-lg leading-relaxed border-b border-gray-300 pb-1">
                   {numberToWords(grandTotal)}
                 </div>
              </div>

              {/* Right Side: Totals Calculation */}
              <div className="col-span-5">
                <div className="grid grid-cols-2 border-b border-primary">
                  <div className="p-1 pl-2 text-primary">Discount</div>
                  <div className="p-1 pr-2 text-right border-l border-primary">{discountAmount.toFixed(2)}</div>
                </div>
                <div className="grid grid-cols-2 border-b border-primary">
                  <div className="p-1 pl-2 text-primary">Total Amount</div>
                  <div className="p-1 pr-2 text-right border-l border-primary">{taxableAmount.toFixed(2)}</div>
                </div>
                <div className="grid grid-cols-2 border-b border-primary">
                  <div className="p-1 pl-2 text-primary">Add. CGST</div>
                  <div className="p-1 pr-2 text-right border-l border-primary flex justify-between">
                    <span className="text-xs text-gray-500">{data.cgstRate}%</span>
                    <span>{cgstAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b border-primary">
                  <div className="p-1 pl-2 text-primary">Add. SGST</div>
                  <div className="p-1 pr-2 text-right border-l border-primary flex justify-between">
                    <span className="text-xs text-gray-500">{data.sgstRate}%</span>
                    <span>{sgstAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b border-primary">
                  <div className="p-1 pl-2 text-primary">Add. IGST</div>
                  <div className="p-1 pr-2 text-right border-l border-primary flex justify-between">
                    <span className="text-xs text-gray-500">{data.igstRate}%</span>
                    <span>{igstAmount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-b border-primary bg-[#fffdf0]">
                  <div className="p-1 pl-2 text-primary font-bold">GRAND TOTAL</div>
                  <div className="p-1 pr-2 text-right border-l border-primary font-bold text-lg">{grandTotal.toFixed(2)}</div>
                </div>
                <div className="grid grid-cols-2 border-b border-primary">
                  <div className="p-1 pl-2 text-primary">ADVANCE</div>
                  <div className="p-1 pr-2 text-right border-l border-primary">{data.advance.toFixed(2)}</div>
                </div>
                <div className="grid grid-cols-2 bg-[#fffdf0]">
                  <div className="p-1 pl-2 text-primary font-bold">TOTAL BALANCE</div>
                  <div className="p-1 pr-2 text-right border-l border-primary font-bold text-lg">{totalBalance.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Bank & Signature Footer */}
            <div className="border-t-2 border-primary p-2 relative">
              <h3 className="text-primary font-bold uppercase text-xs mb-1">Bank Details</h3>
              <div className="flex justify-between">
                <div className="text-xs font-bold space-y-1 w-1/2">
                   <div className="flex"><span className="w-20 text-primary">Bank Name</span> <span>: {data.bankName}</span></div>
                   <div className="flex"><span className="w-20 text-primary">Bank A/c No.</span> <span>: {data.bankAccountNo}</span></div>
                   <div className="flex"><span className="w-20 text-primary">IFSC Code No.</span> <span>: {data.bankIfsc}</span></div>
                   <div className="flex"><span className="w-20 text-primary">Branch</span> <span>: {data.bankBranch}</span></div>
                </div>
                
                <div className="flex flex-col justify-end items-center w-1/2 text-right pb-4">
                   <div className="text-xs text-gray-500 mb-8">Receiver Signature & Stamp</div>
                </div>
              </div>

              {/* Bottom Bank Duplicate? No, Image shows Bank Details again on bottom left. 
                  Let's replicate the image exactly.
                  Actually the image shows "BANK DETAILS" header twice. One small, one slightly bigger.
                  It seems redundant but I will follow the image.
              */}
              
              <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between items-end">
                 <div className="text-xs font-bold space-y-1">
                   <h3 className="text-primary font-bold uppercase text-xs mb-1">Bank Details</h3>
                   <div className="flex"><span className="w-20 text-primary">Bank Name</span> <span>: {data.bankName}</span></div>
                   <div className="flex"><span className="w-20 text-primary">Bank A/c No.</span> <span>: {data.bankAccountNo}</span></div>
                   <div className="flex"><span className="w-20 text-primary">IFSC Code No.</span> <span>: {data.bankIfsc}</span></div>
                   <div className="flex"><span className="w-20 text-primary">Branch</span> <span>: {data.bankBranch}</span></div>
                 </div>
                 
                 <div className="text-center">
                    <div className="text-xs text-primary font-bold mb-8">For {data.sellerName}</div>
                    <div className="text-xs italic text-gray-600 text-right">Proprietor</div>
                 </div>
              </div>

            </div>
            
          </div>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = "InvoicePreview";
