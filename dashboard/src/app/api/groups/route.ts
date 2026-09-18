import { NextResponse } from 'next/server';
import { fetchTraccar } from '@/lib/traccar';

export async function GET() {
  try {
    const groups = await fetchTraccar('/groups?all=true');
    return NextResponse.json(groups);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newGroup = await fetchTraccar('/groups', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return NextResponse.json(newGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
