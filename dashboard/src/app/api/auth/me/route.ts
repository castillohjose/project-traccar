import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const TRACCAR_API_URL = process.env.TRACCAR_API_URL || "http://localhost:8082/api";

export async function GET() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('traccar_session');

  if (!authCookie || !authCookie.value) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const response = await fetch(`${TRACCAR_API_URL}/session`, {
      method: 'GET',
      headers: {
        'Cookie': `JSESSIONID=${authCookie.value}`,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      // Invalid session cookie
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const userData = await response.json();

    const mappedUser = {
      id: userData.id.toString(),
      name: userData.name,
      email: userData.email,
      role: userData.administrator ? 'admin' : 'normal',
      readonly: userData.readonly || false
    };

    return NextResponse.json({ user: mappedUser });

  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
