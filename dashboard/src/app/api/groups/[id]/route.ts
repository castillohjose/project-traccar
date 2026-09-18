import { NextResponse } from 'next/server';
import { fetchTraccar } from '@/lib/traccar';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const body = await request.json();
    
    const updatedGroup = await fetchTraccar(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    await fetchTraccar(`/groups/${id}`, {
      method: 'DELETE'
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
