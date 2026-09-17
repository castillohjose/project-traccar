import { NextResponse } from 'next/server';
import { fetchTraccar } from '@/lib/traccar';

export async function GET() {
  try {
    const geofences = await fetchTraccar('/geofences');
    return NextResponse.json(geofences);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch geofences' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newGeofence = await fetchTraccar('/geofences', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return NextResponse.json(newGeofence);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create geofence' }, { status: 500 });
  }
}
