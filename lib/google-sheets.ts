import { google } from 'googleapis';
import { unstable_cache } from 'next/cache';

export type OrderRecord = {
  orderId: string;
  customerId: string;
  paymentId: string;
  shippingId: string;
  regionId: string;
  productId: string;
  productLine: string;
  orderDate: string;
  orderStatus: string;
  quantity: number;
  discount: number;
  opex: number;
  returnCost: number;
  feedbackRating: number;
  feedbackSentiment: string;
  isReturned: boolean;
  deliveryStatus: string;
  customerAge: number;
};

function parseCommaNum(s: string): number {
  if (!s || s === 'N/A') return 0;
  return parseFloat(s.replace(',', '.')) || 0;
}

function extractProductLine(pid: string): string {
  const m = pid.match(/^(VTX-[A-Z]{2})/);
  return m ? m[1] : pid;
}

async function fetchSheetData(): Promise<OrderRecord[]> {
  try {
    const privateKey = (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? '';
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? '';
    if (!privateKey || !clientEmail || !spreadsheetId) {
      console.error('Missing Google Sheets credentials');
      return [];
    }

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Dashboard_Data!A1:Z10000',
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) return [];

    return rows.slice(1).map((row) => ({
      orderId: row[0] ?? '',
      customerId: row[1] ?? '',
      paymentId: row[2] ?? '',
      shippingId: row[3] ?? '',
      regionId: row[4] ?? '',
      productId: row[6] ?? '',
      productLine: extractProductLine(row[6] ?? ''),
      orderDate: row[7] ?? '',
      orderStatus: row[15] ?? '',
      quantity: parseCommaNum(row[17]),
      discount: parseCommaNum(row[18]),
      opex: parseCommaNum(row[19]),
      returnCost: parseCommaNum(row[20]),
      feedbackRating: parseCommaNum(row[21]),
      feedbackSentiment: row[22] ?? '',
      isReturned: (row[23] ?? '').toLowerCase() === 'true',
      deliveryStatus: row[24] ?? '',
      customerAge: parseCommaNum(row[25]),
    }));
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return [];
  }
}

export const getSheetData = unstable_cache(fetchSheetData, ['sheet-data'], { revalidate: 60 });
