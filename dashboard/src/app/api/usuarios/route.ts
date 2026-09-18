import { NextResponse } from 'next/server';
import { fetchTraccar } from '@/lib/traccar';

export async function GET() {
  try {
    const users = await fetchTraccar('/users?all=true'); // Usa la cookie del Admin
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newUser = await fetchTraccar('/users', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return NextResponse.json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
