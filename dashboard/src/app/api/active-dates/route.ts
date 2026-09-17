import { NextResponse } from 'next/server';
import { fetchTraccar } from '@/lib/traccar';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');
  
  if (!deviceId) {
    return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
  }

  // Por defecto, consultaremos un año hacia atrás hasta hoy, o 6 meses.
  // Traccar Summary API con daily=true es ideal para esto.
  const today = new Date();
  const to = new Date(today);
  to.setDate(to.getDate() + 1); // Hasta mañana para asegurar el día completo
  
  const from = new Date(today);
  from.setMonth(from.getMonth() - 6); // 6 meses de historial
  
  try {
    const url = `/reports/summary?deviceId=${deviceId}&from=${from.toISOString()}&to=${to.toISOString()}&daily=true`;
    const summaryData = await fetchTraccar(url);
    
    // summaryData es un array de objetos por cada día con actividad.
    // Ejemplo: [{ startTime: "2026-08-18T...", ... }]
    const activeDates: string[] = [];
    
    if (Array.isArray(summaryData)) {
      summaryData.forEach((day: any) => {
        if (day.startTime) {
          // Extraemos "YYYY-MM-DD"
          const dateStr = day.startTime.split('T')[0];
          activeDates.push(dateStr);
        }
      });
    }

    return NextResponse.json(activeDates);
  } catch (error) {
    console.error('Error fetching active dates:', error);
    return NextResponse.json({ error: 'Failed to fetch active dates' }, { status: 500 });
  }
}
