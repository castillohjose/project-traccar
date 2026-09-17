import { NextResponse } from 'next/server';
import { fetchTraccar } from '@/lib/traccar';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uniqueId, name, groupId } = body;

    if (!uniqueId || !name) {
      return NextResponse.json({ error: 'uniqueId y name son requeridos' }, { status: 400 });
    }

    // 1. Verificar si el dispositivo ya existe en Traccar
    const existingDevices = await fetchTraccar(`/devices?uniqueId=${uniqueId}`);
    
    if (existingDevices && existingDevices.length > 0) {
      // Si ya existe, podemos optar por actualizar el nombre o simplemente devolver el existente
      return NextResponse.json({ 
        message: 'El dispositivo ya existe', 
        device: existingDevices[0] 
      });
    }

    // 2. Si no existe, lo creamos
    const newDevicePayload: any = {
      name: name,
      uniqueId: uniqueId,
    };

    if (groupId) {
      newDevicePayload.groupId = groupId;
    }

    const newDevice = await fetchTraccar('/devices', {
      method: 'POST',
      body: JSON.stringify(newDevicePayload)
    });

    return NextResponse.json({ 
      message: 'Dispositivo registrado exitosamente', 
      device: newDevice 
    });

  } catch (error) {
    console.error('Error registering device:', error);
    return NextResponse.json({ error: 'Failed to register device' }, { status: 500 });
  }
}
