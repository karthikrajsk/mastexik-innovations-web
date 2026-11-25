import React from 'react';
import styles from './BrushedTaxInvoiceTemplate.module.css';
import { TaxInvoiceData } from './TaxInvoiceTemplate.types';

interface BrushedTaxInvoiceTemplateProps {
    data: TaxInvoiceData;
}

/**
 * Format number with Indian number system (commas)
 */
const formatNumber = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
        return '-';
    }
    return value.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

/**
 * Format date as DD-MMM-YY or DD/MM/YYYY
 */
const formatDate = (date: string | undefined | null): string => {
    if (!date) return '';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return date;
        const day = d.getDate().toString().padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[d.getMonth()];
        const year = d.getFullYear().toString().substring(2);
        return `${day}-${month}-${year}`;
    } catch {
        return date || '';
    }
};

export const BrushedTaxInvoiceTemplate: React.FC<BrushedTaxInvoiceTemplateProps> = ({ data }) => {
    const { company, invoice, buyer, consignee, items, taxSummary, amountInWords } = data;

    // Calculate total quantity and amount from items
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

    // Dynamic Brushing unit details resolved from company context
    const dispatchFromAddress = company.dispatchAddress || company.address;
    const dispatchGstin = company.dispatchGstin || company.gstin || '';
    const dispatchCity = company.dispatchCity || '';
    const dispatchState = company.dispatchState || 'Tamil Nadu';
    const dispatchStateCode = company.dispatchStateCode || '33';

    const companyHeaderName = company.name;
    const companyHeaderAddress = company.address;
    const companyHeaderPhone = company.phone || '';
    const companyHeaderGstin = company.gstin || '';
    const companyState = company.state || 'Tamil Nadu';
    const companyStateCode = company.stateCode || '33';

    // Format tax details for bottom table
    const igstRate = taxSummary.igst ? `${(taxSummary.igst / (taxSummary.total || 1) * 100).toFixed(0)}%` : '';
    const cgstRate = taxSummary.cgst ? `${(taxSummary.cgst / (taxSummary.total || 1) * 100).toFixed(1)}%` : '';
    const sgstRate = taxSummary.sgst ? `${(taxSummary.sgst / (taxSummary.total || 1) * 100).toFixed(1)}%` : '';

    return (
        <div className={styles.invoiceContainer}>
            {/* Header */}
            <div className={styles.header}>
                {company.logoUrl && (
                    <div className={styles.logoContainer}>
                        <img src={company.logoUrl} alt="Company Logo" className={styles.logo} />
                    </div>
                )}
                <div className={styles.companyInfoContainer}>
                    <div className={styles.companyName}>{companyHeaderName}</div>
                    <div className={styles.companyAddress} style={{ whiteSpace: 'pre-line' }}>{companyHeaderAddress}</div>
                    {companyHeaderPhone && (
                        <div className={styles.companyAddress}>
                            Phone : {companyHeaderPhone}
                        </div>
                    )}
                    {companyHeaderGstin && (
                        <div className={styles.companyAddress}>
                            GSTIN/UIN: {companyHeaderGstin}
                        </div>
                    )}
                    <div className={styles.companyAddress}>
                        State Name : {companyState}{companyStateCode ? `, Code : ${companyStateCode}` : ''}
                    </div>
                </div>
            </div>

            {/* Tax Invoice Title */}
            <div className={styles.taxInvoiceTitle}>Tax Invoice</div>

            {/* Main Details Grid */}
            <div className={styles.mainGrid}>
                {/* Left Column (stacked parties) */}
                <div className={styles.leftColumn}>
                    {/* Buyer (Bill to) */}
                    <div className={styles.partySection}>
                        <div className={styles.sectionTitle}>Buyer (Bill to)</div>
                        <div className={styles.partyName}>{buyer.name.toUpperCase()}</div>
                        <div className={styles.partyAddress} dangerouslySetInnerHTML={{ __html: buyer.address.replace(/\n/g, '<br>') }} />
                        {buyer.gstNo && (
                            <div className={styles.gstRow}>
                                <strong>GSTIN/UIN :</strong> {buyer.gstNo}
                            </div>
                        )}
                        <div className={styles.gstRow}>
                            <strong>State Name :</strong> {buyer.state || 'Tamil Nadu'}{buyer.stateCode ? `, Code : ${buyer.stateCode}` : ''}
                        </div>
                    </div>

                    {/* Dispatch From */}
                    <div className={styles.partySection}>
                        <div className={styles.sectionTitle}>Dispatch From</div>
                        <div className={styles.partyName}>{companyHeaderName}</div>
                        <div className={styles.partyAddress} style={{ whiteSpace: 'pre-line' }}>{dispatchFromAddress}</div>
                        {dispatchGstin && (
                            <div className={styles.gstRow}>
                                <strong>GSTIN/UIN :</strong> {dispatchGstin}
                            </div>
                        )}
                        <div className={styles.gstRow}>
                            <strong>State Name :</strong> {dispatchState}{dispatchStateCode ? `, Code : ${dispatchStateCode}` : ''}
                        </div>
                        {dispatchCity && (
                            <div className={styles.gstRow}>
                                <strong>Place :</strong> {dispatchCity}
                            </div>
                        )}
                    </div>

                    {/* Consignee (Ship to) */}
                    <div className={styles.partySection}>
                        <div className={styles.sectionTitle}>Consignee (Ship to)</div>
                        <div className={styles.partyName}>{consignee.name.toUpperCase()}</div>
                        <div className={styles.partyAddress} dangerouslySetInnerHTML={{ __html: consignee.address.replace(/\n/g, '<br>') }} />
                        {consignee.gstNo && (
                            <div className={styles.gstRow}>
                                <strong>GSTIN/UIN :</strong> {consignee.gstNo}
                            </div>
                        )}
                        <div className={styles.gstRow}>
                            <strong>State Name :</strong> {consignee.state || 'Tamil Nadu'}{consignee.stateCode ? `, Code : ${consignee.stateCode}` : ''}
                        </div>
                    </div>
                </div>

                {/* Right Column (stacked invoice details metadata) */}
                <div className={styles.rightColumn}>
                    {/* Row 1 */}
                    <div className={styles.metaRow}>
                        <div className={styles.metaCell}>
                            <span className={styles.metaLabel}>Invoice No.</span>
                            <span className={styles.metaValue}>{invoice.invoiceNo}</span>
                        </div>
                        <div className={styles.metaCell}>
                            <span className={styles.metaLabel}>Dated</span>
                            <span className={styles.metaValue}>{formatDate(invoice.invoiceDate)}</span>
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className={styles.metaRow}>
                        <div className={styles.metaCell}>
                            <span className={styles.metaLabel}>Delivery Note</span>
                            <span className={styles.metaValue}>{invoice.deliveryNote || ''}</span>
                        </div>
                        <div className={styles.metaCell}>
                            <span className={styles.metaLabel}>Mode/Terms of Payment</span>
                            <span className={styles.metaValue}>{invoice.paymentTerms || '-'}</span>
                        </div>
                    </div>

                    {/* Row 3 */}
                    <div className={styles.metaRow}>
                        <div className={styles.metaCell}>
                            <span className={styles.metaLabel}>Reference No. & Date.</span>
                            <span className={styles.metaValue}>
                                {invoice.soNo ? `${invoice.soNo} dt. ${formatDate(invoice.invoiceDate)}` : '-'}
                            </span>
                        </div>
                        <div className={styles.metaCell}>
                            <span className={styles.metaLabel}>Other References</span>
                            <span className={styles.metaValue}>{invoice.comments || '-'}</span>
                        </div>
                    </div>

                    {/* Row 4 */}
                    <div className={styles.metaRow}>
                        <div className={styles.metaCell}>
                            <span className={styles.metaLabel}>Buyer's Order No.</span>
                            <span className={styles.metaValue}>{invoice.poNo || '-'}</span>
                        </div>
                        <div className={styles.metaCell}>
                            <span className={styles.metaLabel}>Dated</span>
                            <span className={styles.metaValue}>{formatDate(invoice.poDate)}</span>
                        </div>
                    </div>

                    {/* Row 5 */}
                    <div className={styles.metaRow}>
                        <div className={styles.metaCell}>
                            <span className={styles.metaLabel}>Dispatch Doc No.</span>
                            <span className={styles.metaValue}>{invoice.invoiceNo}</span>
                        </div>
                        <div className={styles.metaCell}>
                            <span className={styles.metaLabel}>Delivery Note Date</span>
                            <span className={styles.metaValue}>{formatDate(invoice.deliveryNoteDate) || '-'}</span>
                        </div>
                    </div>

                    {/* Row 6 */}
                    <div className={styles.metaRow}>
                        <div className={styles.metaCell}>
                            <span className={styles.metaLabel}>Dispatched through</span>
                            <span className={styles.metaValue}>{invoice.transport || '-'}</span>
                        </div>
                        <div className={styles.metaCell}>
                            <span className={styles.metaLabel}>Destination</span>
                            <span className={styles.metaValue}>{invoice.destination || '-'}</span>
                        </div>
                    </div>

                    {/* Row 7 */}
                    <div className={styles.metaRow}>
                        <div className={styles.metaCell}>
                            <span className={styles.metaLabel}>Bill of Lading/LR-RR No.</span>
                            <span className={styles.metaValue}>
                                {invoice.lrNo ? `${invoice.lrNo} dt. ${formatDate(invoice.lrDate)}` : '-'}
                            </span>
                        </div>
                        <div className={styles.metaCell}>
                            <span className={styles.metaLabel}>Motor Vehicle No.</span>
                            <span className={styles.metaValue}>{invoice.vehicleNo || '-'}</span>
                        </div>
                    </div>

                    {/* Row 8 */}
                    <div className={styles.metaRow} style={{ flex: 1 }}>
                        <div className={styles.metaCell}>
                            <span className={styles.metaLabel}>Terms of Delivery</span>
                            <span className={styles.metaValue}>{invoice.deliveryTerms || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className={styles.itemsTable}>
                <thead>
                    <tr>
                        <th style={{ width: '5%' }}>Sl No.</th>
                        <th style={{ width: '45%' }}>Description of Goods</th>
                        <th style={{ width: '10%' }}>HSN/SAC</th>
                        <th style={{ width: '12%' }}>Quantity</th>
                        <th style={{ width: '8%' }}>Rate</th>
                        <th style={{ width: '8%' }}>per</th>
                        <th style={{ width: '12%' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Item row */}
                    <tr className={styles.itemRow}>
                        <td className={styles.textCenter} style={{ borderBottom: 'none' }}>1</td>
                        <td style={{ borderBottom: 'none' }}>
                            {items.map((item, idx) => (
                                <div key={idx} style={{ marginBottom: '8px' }}>
                                    <div style={{ fontWeight: 'bold' }}>{item.description}</div>
                                    <div style={{ fontSize: '9px', color: '#555', paddingLeft: '5px' }}>
                                        {item.noOfBags && `No.of.Rolls : ${item.noOfBags}`}
                                    </div>
                                </div>
                            ))}
                            
                            {/* GST rows inside description if IGST/CGST is present */}
                            {taxSummary.igst !== undefined && taxSummary.igst > 0 && (
                                <div style={{ marginTop: '20px', fontWeight: 'bold', fontStyle: 'italic', textAlign: 'right', paddingRight: '10px' }}>
                                    IGST-OUTPUT-{taxSummary.cgstPercent ? `${taxSummary.cgstPercent * 2}%` : '5%'}
                                </div>
                            )}
                            {taxSummary.cgst !== undefined && taxSummary.cgst > 0 && (
                                <div style={{ marginTop: '20px', fontWeight: 'bold', fontStyle: 'italic', textAlign: 'right', paddingRight: '10px' }}>
                                    CGST-OUTPUT-{taxSummary.cgstPercent ? `${taxSummary.cgstPercent}%` : ''}
                                    <br />
                                    SGST-OUTPUT-{taxSummary.sgstPercent ? `${taxSummary.sgstPercent}%` : ''}
                                </div>
                            )}
                            {taxSummary.roundOff !== undefined && Math.abs(taxSummary.roundOff) > 0 && (
                                <div style={{ marginTop: '10px', textAlign: 'right', paddingRight: '10px', fontWeight: 'normal' }}>
                                    Less: Rounded Off
                                </div>
                            )}
                        </td>
                        <td className={styles.textCenter} style={{ borderBottom: 'none' }}>
                            {items[0]?.hsn || '-'}
                        </td>
                        <td className={styles.textRight} style={{ borderBottom: 'none', fontWeight: 'bold' }}>
                            {formatNumber(totalQuantity)} Mtr
                        </td>
                        <td className={styles.textRight} style={{ borderBottom: 'none' }}>
                            {formatNumber(items[0]?.rate)}
                        </td>
                        <td className={styles.textCenter} style={{ borderBottom: 'none' }}>
                            Mtr
                        </td>
                        <td className={styles.textRight} style={{ borderBottom: 'none', fontWeight: 'bold' }}>
                            {formatNumber(totalAmount)}
                            
                            {/* GST values matching output styles */}
                            {taxSummary.igst !== undefined && taxSummary.igst > 0 && (
                                <div style={{ marginTop: '20px', fontWeight: 'bold' }}>
                                    {formatNumber(taxSummary.igst)}
                                </div>
                            )}
                            {taxSummary.cgst !== undefined && taxSummary.cgst > 0 && (
                                <div style={{ marginTop: '20px', fontWeight: 'bold' }}>
                                    {formatNumber(taxSummary.cgst)}
                                    <br />
                                    {formatNumber(taxSummary.sgst)}
                                </div>
                            )}
                            {taxSummary.roundOff !== undefined && Math.abs(taxSummary.roundOff) > 0 && (
                                <div style={{ marginTop: '10px', fontWeight: 'normal' }}>
                                    {taxSummary.roundOff < 0 ? `(-)${Math.abs(taxSummary.roundOff).toFixed(2)}` : `${taxSummary.roundOff.toFixed(2)}`}
                                </div>
                            )}
                        </td>
                    </tr>

                    {/* Total Row */}
                    <tr className={styles.totalRow}>
                        <td colSpan={2} className={styles.textRight}>Total :</td>
                        <td className={styles.textCenter}></td>
                        <td className={styles.textRight}>{formatNumber(totalQuantity)} Mtr</td>
                        <td className={styles.textRight}></td>
                        <td className={styles.textCenter}></td>
                        <td className={styles.textRight}>₹ {formatNumber(taxSummary.grandTotal)}</td>
                    </tr>
                </tbody>
            </table>

            {/* Amount chargeable in words */}
            <div className={styles.amountChargeable}>
                <strong>Amount Chargeable (in words) :</strong><br />
                {amountInWords}
            </div>

            {/* Tax summary table container */}
            <div className={styles.taxTableContainer}>
                <table className={styles.taxTable}>
                    <thead>
                        {taxSummary.igst !== undefined && taxSummary.igst > 0 ? (
                            <tr>
                                <th rowSpan={2}>HSN/SAC</th>
                                <th rowSpan={2}>Taxable Value</th>
                                <th colSpan={2}>Integrated Tax</th>
                                <th rowSpan={2}>Total Tax Amount</th>
                            </tr>
                        ) : (
                            <tr>
                                <th rowSpan={2}>HSN/SAC</th>
                                <th rowSpan={2}>Taxable Value</th>
                                <th colSpan={2}>Central Tax</th>
                                <th colSpan={2}>State Tax</th>
                                <th rowSpan={2}>Total Tax Amount</th>
                            </tr>
                        )}
                        {taxSummary.igst !== undefined && taxSummary.igst > 0 ? (
                            <tr>
                                <th>Rate</th>
                                <th>Amount</th>
                            </tr>
                        ) : (
                            <tr>
                                <th>Rate</th>
                                <th>Amount</th>
                                <th>Rate</th>
                                <th>Amount</th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        <tr>
                            <td className={styles.textCenter}>{items[0]?.hsn || '-'}</td>
                            <td className={styles.textRight}>{formatNumber(totalAmount)}</td>
                            {taxSummary.igst !== undefined && taxSummary.igst > 0 ? (
                                <>
                                    <td className={styles.textCenter}>{igstRate || '5%'}</td>
                                    <td className={styles.textRight}>{formatNumber(taxSummary.igst)}</td>
                                </>
                            ) : (
                                <>
                                    <td className={styles.textCenter}>{cgstRate || '2.5%'}</td>
                                    <td className={styles.textRight}>{formatNumber(taxSummary.cgst)}</td>
                                    <td className={styles.textCenter}>{sgstRate || '2.5%'}</td>
                                    <td className={styles.textRight}>{formatNumber(taxSummary.sgst)}</td>
                                </>
                            )}
                            <td className={styles.textRight} style={{ fontWeight: 'bold' }}>
                                {formatNumber(taxSummary.igst || (Number(taxSummary.cgst || 0) + Number(taxSummary.sgst || 0)))}
                            </td>
                        </tr>
                        <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                            <td className={styles.textRight}>Total :</td>
                            <td className={styles.textRight}>{formatNumber(totalAmount)}</td>
                            {taxSummary.igst !== undefined && taxSummary.igst > 0 ? (
                                <>
                                    <td></td>
                                    <td className={styles.textRight}>{formatNumber(taxSummary.igst)}</td>
                                </>
                            ) : (
                                <>
                                    <td></td>
                                    <td className={styles.textRight}>{formatNumber(taxSummary.cgst)}</td>
                                    <td></td>
                                    <td className={styles.textRight}>{formatNumber(taxSummary.sgst)}</td>
                                </>
                            )}
                            <td className={styles.textRight}>
                                {formatNumber(taxSummary.igst || (Number(taxSummary.cgst || 0) + Number(taxSummary.sgst || 0)))}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Tax amount in words */}
            <div className={styles.taxAmountWords}>
                <strong>Tax Amount (in words) :</strong><br />
                {amountInWords.replace("INR", "INR").split("only")[0]} (Tax amount only)
            </div>

            {/* Footer declaration and signature block */}
            <div className={styles.footerContainer}>
                <div className={styles.declarationBlock}>
                    <strong>Declaration :</strong><br />
                    We declare that this invoice shows the actual price
                    of the goods described and that all particulars are
                    true and correct.
                    <br /><br />
                    <span style={{ fontSize: '8px', color: '#666' }}>This is a Computer Generated Invoice</span>
                </div>
                <div className={styles.signBlock}>
                    <div className={styles.companyFor}>
                        for {company.name.toUpperCase()}
                    </div>
                    <div className={styles.preparedByRow}>
                        <span>Prepared by</span>
                        <span>Verified by</span>
                        <span>Authorised Signatory</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrushedTaxInvoiceTemplate;
