import { getSheetData } from '@/lib/google-sheets';

export async function GET() {
  const data = await getSheetData();
  return Response.json(data);
}
