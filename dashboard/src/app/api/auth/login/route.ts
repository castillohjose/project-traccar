import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const TRACCAR_API_URL = process.env.TRACCAR_API_URL || "http://localhost:8082/api";

async function ensureRobotUserExists(jsessionId: string) {
  const configPath = '/app/backups/system-config.json';
  
  try {
    // 1. Obtener todos los usuarios
    const usersReq = await fetch(`${TRACCAR_API_URL}/users`, {
      headers: { 'Cookie': `JSESSIONID=${jsessionId}` }
    });
    if (!usersReq.ok) return;
    const users = await usersReq.json();
    
    let robotUser = users.find((u: any) => u.email === 'robot@sistema.com');
    
    // Si existe pero no tenemos la clave local, o no existe
    let needsCreation = !robotUser;
    let needsPasswordReset = false;

    if (!fs.existsSync(configPath) && robotUser) {
      needsPasswordReset = true;
    }

    if (needsCreation || needsPasswordReset) {
      const randomPassword = crypto.randomBytes(16).toString('hex');
      
      if (needsCreation) {
        // Crear usuario robot
        const createReq = await fetch(`${TRACCAR_API_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `JSESSIONID=${jsessionId}`
          },
          body: JSON.stringify({
            name: "Sistema Bot",
            email: "robot@sistema.com",
            password: randomPassword,
            administrator: true,
            readonly: false
          })
        });
        if (!createReq.ok) {
          console.error('[ROBOT] Failed to create robot user');
          return;
        }
        robotUser = await createReq.json();
      } else if (needsPasswordReset) {
        // Actualizar clave
        robotUser.password = randomPassword;
        await fetch(`${TRACCAR_API_URL}/users/${robotUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `JSESSIONID=${jsessionId}`
          },
          body: JSON.stringify(robotUser)
        });
      }

      // Guardar credenciales
      fs.writeFileSync(configPath, JSON.stringify({
        TRACCAR_API_USER: "robot@sistema.com",
        TRACCAR_API_PASS: randomPassword
      }, null, 2));
      console.log('[ROBOT] Credenciales del robot guardadas localmente.');
    }
  } catch (error) {
    console.error('[ROBOT] Error en sincronización del robot:', error);
  }
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 });
    }

    const params = new URLSearchParams();
    params.append('email', email);
    params.append('password', password);

    const response = await fetch(`${TRACCAR_API_URL}/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString(),
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const userData = await response.json();

    const setCookieHeader = response.headers.get('set-cookie');
    let jsessionId = '';
    if (setCookieHeader) {
       const match = setCookieHeader.match(/JSESSIONID=([^;]+)/);
       if (match) jsessionId = match[1];
    }

    // Auto-configurar Robot si el usuario es Admin
    if (userData.administrator && jsessionId) {
      await ensureRobotUserExists(jsessionId);
    }

    const cookieStore = await cookies();
    cookieStore.set('traccar_session', jsessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 semana
    });

    const mappedUser = {
      id: userData.id.toString(),
      name: userData.name,
      email: userData.email,
      role: userData.administrator ? 'admin' : 'normal',
      readonly: userData.readonly || false
    };

    return NextResponse.json({ user: mappedUser });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
