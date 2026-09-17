import { NextResponse } from 'next/server';
import { fetchTraccar } from '@/lib/traccar';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const body = await request.json();
    const updatedGeofence = await fetchTraccar(`/geofences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    return NextResponse.json(updatedGeofence);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update geofence' }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    await fetchTraccar(`/geofences/${id}`, {
      method: 'DELETE'
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete geofence' }, { status: 500 });
  }
}
