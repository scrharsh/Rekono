import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:3000/v1';

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  showroom: { name: string; gstin: string; address: string; phone: string };
  customer: { name: string; phone?: string; gstin?: string };
  items: Array<{ name: string; hsnCode?: string; quantity: number; rate: number; amount: number; gstRate: number; gstAmount: number }>;
  summary: { taxableAmount: number; cgst: number; sgst: number; igst: number; totalAmount: number };
}

export const generateInvoiceNumber = async (showroomId: string): Promise<string> => {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_URL}/showrooms/${showroomId}/invoices/generate-number`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to generate invoice number');
  const data = await res.json();
  return data.invoiceNumber;
};

export const createInvoice = async (showroomId: string, saleId: string): Promise<InvoiceData> => {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_URL}/showrooms/${showroomId}/invoices`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ saleId }),
  });
  if (!res.ok) throw new Error('Failed to create invoice');
  const data = await res.json();
  return data.invoice;
};

export const getInvoice = async (showroomId: string, invoiceNumber: string): Promise<InvoiceData> => {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_URL}/showrooms/${showroomId}/invoices/${invoiceNumber}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Invoice not found');
  const data = await res.json();
  return data.invoice;
};

export const listInvoices = async (showroomId: string, page = 1): Promise<any> => {
  const token = await AsyncStorage.getItem('token');
  const res = await fetch(`${API_URL}/showrooms/${showroomId}/invoices?page=${page}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to list invoices');
  return res.json();
};

/** Format invoice as plain text for sharing */
export const formatInvoiceText = (inv: InvoiceData): string => {
  const lines = [
    `TAX INVOICE`,
    `Invoice No: ${inv.invoiceNumber}`,
    `Date: ${inv.date}`,
    ``,
    `From: ${inv.showroom.name}`,
    `GSTIN: ${inv.showroom.gstin}`,
    `${inv.showroom.address}`,
    ``,
    `To: ${inv.customer.name}`,
    inv.customer.phone ? `Phone: ${inv.customer.phone}` : '',
    inv.customer.gstin ? `GSTIN: ${inv.customer.gstin}` : '',
    ``,
    `Items:`,
    ...inv.items.map(it => `  ${it.name} × ${it.quantity} @ ₹${it.rate} = ₹${it.amount.toFixed(2)} (GST ${it.gstRate}%)`),
    ``,
    `Taxable Amount: ₹${inv.summary.taxableAmount.toFixed(2)}`,
    inv.summary.cgst > 0 ? `CGST: ₹${inv.summary.cgst.toFixed(2)}` : '',
    inv.summary.sgst > 0 ? `SGST: ₹${inv.summary.sgst.toFixed(2)}` : '',
    inv.summary.igst > 0 ? `IGST: ₹${inv.summary.igst.toFixed(2)}` : '',
    `Total: ₹${inv.summary.totalAmount.toFixed(2)}`,
    ``,
    `Thank you for your business!`,
  ].filter(Boolean);
  return lines.join('\n');
};
