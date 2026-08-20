import { NextResponse } from 'next/server';
import { fetchTraccar } from '@/lib/traccar';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // If query params exist, fetch route history
    if (deviceId && from && to) {
      const positions = await fetchTraccar(`/positions?deviceId=${deviceId}&from=${from}&to=${to}`);
      return NextResponse.json(positions);
    }
    
    // Otherwise fetch latest positions (requires Accept: application/json or it might send websocket stream but API defaults to JSON usually, let's just use /positions)
    // Actually Traccar /positions without params gives latest positions for all devices.
    const latestPositions = await fetchTraccar('/positions');
    return NextResponse.json(latestPositions);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
  }
}
