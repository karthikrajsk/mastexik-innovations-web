/**
 * Tax Invoice Template Component
 * Reusable component for generating tax invoices with exact UI matching the HTML template
 */

import React from 'react';
import styles from './TaxInvoiceTemplate.module.css';
import { TaxInvoiceData } from './TaxInvoiceTemplate.types';

interface TaxInvoiceTemplateProps {
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
 * Format number without decimals
 */
const formatNumberNoDecimals = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
        return '-';
    }
    return value.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};

/**
 * Format date as DD/MM/YYYY
 */
const formatDate = (date: string | undefined | null): string => {
    if (!date) return '';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return date; // Return as-is if invalid date
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return date || '';
    }
};

export const TaxInvoiceTemplate: React.FC<TaxInvoiceTemplateProps> = ({ data }) => {
    const { company, invoice, buyer, consignee, items, additionalCharges, lessCharges, taxSummary, amountInWords, termsAndConditions, declaration, bankDetails } = data;

    // Calculate total quantity and amount from items
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

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
                    <div className={styles.companyName}>{company.name.toUpperCase()}</div>
                    <div className={styles.companyAddress}>{company.address}</div>
                    <div className={styles.companyAddress}>
                        {company.phone && `TEL : ${company.phone}`}
                    </div>
                    {company.division && (
                        <div className={styles.division}>{company.division.toUpperCase()}</div>
                    )}
                </div>
            </div>

            {/* CIN, GSTIN, PAN Row */}
            {/* <div className={styles.infoRow}>
                <div className={styles.infoCell} style={{ flex: 1.5 }}>
                    <strong>CIN:</strong> {company.cin || ''}
                </div>
                <div className={styles.infoCell} style={{ flex: 2, textAlign: 'center' }}>
                    <strong>GSTIN/UIN :</strong> {company.gstin || ''}
                </div>
                <div className={styles.infoCell} style={{ flex: 1, textAlign: 'right' }}>
                    <strong>PAN :</strong> {company.pan || ''}
                </div>
            </div> */}

            {/* IRN Row */}
            {/* <div className={styles.infoRow}>
                <div className={styles.infoCell} style={{ flex: 1 }}>
                    <strong>IRN :</strong> {invoice.irn || ''}
                </div>
            </div> */}

            {/* Ack No Row */}
            {/* <div className={styles.infoRow}>
                <div className={styles.infoCell} style={{ flex: 1 }}>
                    <strong>Ack No :</strong> {invoice.ackNo || ''}
                </div>
                <div className={styles.infoCell} style={{ flex: 1, textAlign: 'right', borderRight: 'none' }}>
                    <strong>Ack Date :</strong> {formatDate(invoice.ackDate)}
                </div>
            </div> */}

            {/* Eway Bill Row */}
            {/* <div className={styles.infoRow}>
                <div className={styles.infoCell} style={{ flex: 1 }}>
                    <strong>Eway Bill No :</strong> {invoice.ewayBillNo || ''}
                </div>
                <div className={styles.infoCell} style={{ flex: 1, textAlign: 'right', borderRight: 'none' }}>
                    <strong>Eway Bill Date :</strong> {formatDate(invoice.ewayBillDate)}
                </div>
            </div> */}

            {/* Tax Invoice Title */}
            <div className={styles.taxInvoiceTitle}>TAX INVOICE</div>

            {/* Invoice Details Section */}
            <div className={styles.invoiceDetails}>
                <div className={styles.leftSection}>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Invoice No.</span>
                        <span className={styles.detailValue}>: {invoice.invoiceNo}</span>
                        <span style={{ minWidth: '40px' }}>Date</span>
                        <span style={{ minWidth: '80px' }}>: {formatDate(invoice.invoiceDate)}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>SO No.</span>
                        <span className={styles.detailValue}>: {invoice.soNo || '-'}</span>
                        <span style={{ minWidth: '40px' }}>Date</span>
                        <span style={{ minWidth: '80px' }}>: {formatDate(invoice.soDate)}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>PO No.</span>
                        <span className={styles.detailValue}>: {invoice.poNo || '-'}</span>
                        <span style={{ minWidth: '40px' }}>Date</span>
                        <span style={{ minWidth: '80px' }}>: {formatDate(invoice.poDate)}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Payment Terms</span>
                        <span className={styles.detailValue}>: {invoice.paymentTerms || '-'}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Delivery Terms</span>
                        <span className={styles.detailValue}>: {invoice.deliveryTerms || '-'}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Delivery note</span>
                        <span className={styles.detailValue}>: {invoice.deliveryNote || ''}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Agent Name</span>
                        <span className={styles.detailValue}>: {invoice.agentName || '-'}</span>
                    </div>
                </div>
                <div className={styles.rightSection}>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Destination</span>
                        <span className={styles.detailValue}>: {invoice.destination || '-'}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Transport Name</span>
                        <span className={styles.detailValue}>: {invoice.transport || '-'}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>LR No.</span>
                        <span className={styles.detailValue}>: {invoice.lrNo || '-'}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>LR Date</span>
                        <span className={styles.detailValue}>: {formatDate(invoice.lrDate)}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Terms of Delivery</span>
                        <span className={styles.detailValue}>: {invoice.termsOfDelivery || '-'}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Vehicle no</span>
                        <span className={styles.detailValue}>: {invoice.vehicleNo || '-'}</span>
                    </div>
                </div>
            </div>

            {/* Buyer and Consignee Section */}
            <div className={styles.partySection}>
                <div className={styles.buyerSection}>
                    <div className={styles.sectionTitle} style={{ fontWeight: 'bold' }}>Buyer :</div>
                    <div className={styles.partyName}>{buyer.name}</div>
                    <div className={styles.partyAddress} dangerouslySetInnerHTML={{ __html: buyer.address.replace(/\n/g, '<br>') }} />
                    <div className={styles.gstRow}>
                        <strong>GST No :</strong> {buyer.gstNo || ''}
                    </div>
                    <div className={styles.gstRow}>
                        <strong>State</strong> : {buyer.state} {buyer.stateCode ? `- ${buyer.stateCode}` : ''}
                    </div>
                </div>
                <div className={styles.consigneeSection}>
                    <div className={styles.sectionTitle} style={{ fontWeight: 'bold' }}>Consignee :</div>
                    <div className={styles.partyName}>{consignee.name}</div>
                    <div className={styles.partyAddress} dangerouslySetInnerHTML={{ __html: consignee.address.replace(/\n/g, '<br>') }} />
                    <div className={styles.gstRow}>
                        <strong>GST No :</strong> {consignee.gstNo || ''}
                    </div>
                    <div className={styles.gstRow}>
                        <strong>State</strong> : {consignee.state} {consignee.stateCode ? `- ${consignee.stateCode}` : ''}
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th style={{ width: '4%' }}>Sr.</th>
                        <th style={{ width: '38%' }}>Description of Goods</th>
                        <th style={{ width: '8%' }}>HSN</th>
                        <th style={{ width: '8%' }}>No Of Bags</th>
                        <th style={{ width: '10%' }}>Quantity</th>
                        <th style={{ width: '6%' }}>UOM</th>
                        <th style={{ width: '10%' }}>Rate</th>
                        <th style={{ width: '16%' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={index}>
                            <td className={styles.textCenter}>{item.srNo}</td>
                            <td>{item.description}</td>
                            <td className={styles.textCenter}>{item.hsn}</td>
                            <td className={styles.textCenter}>{item.noOfBags ? formatNumberNoDecimals(item.noOfBags) : '-'}</td>
                            <td className={styles.textRight}>{formatNumber(item.quantity)}</td>
                            <td className={styles.textCenter}>{item.uom}</td>
                            <td className={styles.textRight}>{formatNumber(item.rate)}</td>
                            <td className={styles.textRight}>{formatNumber(item.amount)}</td>
                        </tr>
                    ))}
                    <tr className={styles.totalRow}>
                        <td colSpan={4} className={styles.textRight}>Total :</td>
                        <td className={styles.textRight}>{formatNumber(totalQuantity)}</td>
                        <td></td>
                        <td></td>
                        <td className={styles.textRight}>{formatNumber(totalAmount)}</td>
                    </tr>
                </tbody>
            </table>

            {/* Charges Section */}
            <div className={styles.chargesSection}>
                <div className={styles.additionalCharges}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Additional Charges :</div>
                    {additionalCharges && additionalCharges.length > 0 &&
                        additionalCharges.map((charge, index) => (
                            <div key={index} className={styles.summaryRow}>
                                <span>{charge.description}</span>
                                <span>:</span>
                                <span>{formatNumber(charge.amount)}</span>
                            </div>
                        ))
                    }
                </div>
                <div className={styles.lessCharges}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Less Charges :</div>
                    {lessCharges && lessCharges.length > 0 &&
                        lessCharges.map((charge, index) => (
                            <div key={index} className={styles.summaryRow}>
                                <span>{charge.description}</span>
                                <span>:</span>
                                <span>{formatNumber(charge.amount)}</span>
                            </div>
                        ))
                    }
                </div>
                <div className={styles.summaryCharges}>
                    <div className={styles.summaryRow}>
                        <span>Add</span>
                        <span>:</span>
                        <span>{formatNumber(taxSummary.add)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>Less</span>
                        <span>:</span>
                        <span>{formatNumber(taxSummary.less)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>Total</span>
                        <span>:</span>
                        <span>{formatNumber(taxSummary.total)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>IGST</span>
                        <span>:</span>
                        <span>{formatNumber(taxSummary.igst)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>CGST {taxSummary.cgstPercent ? `${taxSummary.cgstPercent}%` : ''}</span>
                        <span>:</span>
                        <span>{formatNumber(taxSummary.cgst)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>SGST {taxSummary.sgstPercent ? `${taxSummary.sgstPercent}%` : ''}</span>
                        <span>:</span>
                        <span>{formatNumber(taxSummary.sgst)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>TCS Amount</span>
                        <span>:</span>
                        <span>{formatNumber(taxSummary.tcsAmount)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>R/O</span>
                        <span>:</span>
                        <span>{formatNumber(taxSummary.roundOff)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>Cess Amount</span>
                        <span>:</span>
                        <span>{formatNumber(taxSummary.cessAmount)}</span>
                    </div>
                    <div className={`${styles.summaryRow} ${styles.summaryRowGrandTotal}`}>
                        <span>Grand Total</span>
                        <span>:</span>
                        <span>{formatNumber(taxSummary.grandTotal)}</span>
                    </div>
                </div>
            </div>

            {/* Amount in Words */}
            <div className={styles.amountWords}>
                <strong>Amount Chargeable (in words) :</strong> {amountInWords}
            </div>

            {/* Footer Section */}
            <div className={styles.footerSection}>
                <div className={styles.termsSection} style={{ padding: '5px 8px' }}>
                    <div style={{ fontWeight: 'bold' }}>Terms and Conditions :</div>
                    <div style={{ fontSize: '10px', marginBottom: '10px' }}>{termsAndConditions || 'TERMS AND CONDITIONS'}</div>
                    <div style={{ fontWeight: 'bold' }}>Declaration :</div>
                    <div style={{ fontSize: '10px' }} dangerouslySetInnerHTML={{ __html: (declaration || 'We declare that this invoice shows the actual price<br>of the goods described and that all particulars are<br>true and correct').replace(/\n/g, '<br>') }} />
                </div>
                <div className={styles.bankSection} style={{ padding: '5px 8px' }}>
                    <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Company's Bank Details :</div>
                    <div className={styles.bankDetailRow} style={{ display: 'flex', fontSize: '10px' }}>
                        <span style={{ minWidth: '110px' }}>Bank Name</span>
                        <span>: {bankDetails.bankName}</span>
                    </div>
                    <div className={styles.bankDetailRow} style={{ display: 'flex', fontSize: '10px' }}>
                        <span style={{ minWidth: '110px' }}>A/c No</span>
                        <span>: {bankDetails.accountNo}</span>
                    </div>
                    {bankDetails.branch && (
                        <div className={styles.bankDetailRow} style={{ display: 'flex', fontSize: '10px' }}>
                            <span style={{ minWidth: '110px' }}>Branch</span>
                            <span>: {bankDetails.branch}</span>
                        </div>
                    )}
                    {bankDetails.ifscCode && (
                        <div className={styles.bankDetailRow} style={{ display: 'flex', fontSize: '10px' }}>
                            <span style={{ minWidth: '110px' }}>IFSC Code</span>
                            <span>: {bankDetails.ifscCode}</span>
                        </div>
                    )}
                    {!bankDetails.branch && !bankDetails.ifscCode && bankDetails.branchAndIFSC && (
                        <div className={styles.bankDetailRow} style={{ display: 'flex', fontSize: '10px' }}>
                            <span style={{ minWidth: '110px' }}>Branch & IFSC Code</span>
                            <span>: {bankDetails.branchAndIFSC}</span>
                        </div>
                    )}
                    <div style={{ textAlign: 'right', marginTop: '10px', fontWeight: 'bold', fontSize: '11px' }}>
                        For {company.name.toUpperCase()}
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '30px', fontWeight: 'bold', fontSize: '11px' }}>
                        Authorised Signatory
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxInvoiceTemplate;

