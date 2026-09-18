import { NextResponse } from 'next/server';
import { fetchTraccar } from '@/lib/traccar';
import { cookies } from 'next/headers';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const body = await request.json();
    
    // Safety check: Prevent editing oneself
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('traccar_session');
    
    if (authCookie && authCookie.value) {
      const response = await fetch(`${process.env.TRACCAR_API_URL || "http://localhost:8082/api"}/session`, {
        headers: { 'Cookie': `JSESSIONID=${authCookie.value}` }
      });
      if (response.ok) {
        const currentUser = await response.json();
        if (currentUser.id.toString() === id) {
          return NextResponse.json({ error: 'No puedes editar tus propios permisos.' }, { status: 403 });
        }
      }
    }

    const updatedUser = await fetchTraccar(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    
    // Safety check: Prevent deleting oneself
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('traccar_session');
    
    if (authCookie && authCookie.value) {
      const response = await fetch(`${process.env.TRACCAR_API_URL || "http://localhost:8082/api"}/session`, {
        headers: { 'Cookie': `JSESSIONID=${authCookie.value}` }
      });
      if (response.ok) {
        const currentUser = await response.json();
        if (currentUser.id.toString() === id) {
          return NextResponse.json({ error: 'No puedes eliminar tu propio usuario.' }, { status: 403 });
        }
      }
    }

    await fetchTraccar(`/users/${id}`, {
      method: 'DELETE'
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
