import { NextResponse } from 'next/server';
import { fetchTraccar } from '@/lib/traccar';

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await request.json();
    const id = params.id;
    const payload = { id: Number(id), ...body };
    const updatedDevice = await fetchTraccar(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    return NextResponse.json(updatedDevice);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update device' }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const id = params.id;
    await fetchTraccar(`/devices/${id}`, {
      method: 'DELETE'
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete device' }, { status: 500 });
  }
}
