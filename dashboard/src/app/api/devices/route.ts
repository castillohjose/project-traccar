import { NextResponse } from 'next/server';
import { fetchTraccar } from '@/lib/traccar';

export async function GET() {
  try {
    const devices = await fetchTraccar('/devices');
    return NextResponse.json(devices);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newDevice = await fetchTraccar('/devices', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return NextResponse.json(newDevice);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create device' }, { status: 500 });
  }
}
