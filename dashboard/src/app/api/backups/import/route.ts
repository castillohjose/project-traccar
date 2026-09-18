import { NextResponse } from 'next/server';
import { fetchTraccar, ensureGroupExists } from '@/lib/traccar';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.version || !Array.isArray(data.groups)) {
      return NextResponse.json({ error: 'Invalid backup format' }, { status: 400 });
    }

    const allDevices = await fetchTraccar('/devices?all=true');
    const allGeofences = await fetchTraccar('/geofences?all=true');

    for (const group of data.groups) {
      if (!group.name) continue;

      // 1. Asegurar que el grupo existe
      const groupId = await ensureGroupExists(group.name, false);
      if (!groupId) continue; // Si falla, saltamos el grupo

      // 2. Procesar Dispositivos
      if (Array.isArray(group.devices)) {
        for (const device of group.devices) {
          if (!device.uniqueId) continue;
          
          let existingDevice = Array.isArray(allDevices) ? allDevices.find((d: any) => d.uniqueId === device.uniqueId) : null;
          let deviceId = existingDevice?.id;

          if (!deviceId) {
            // Crear el dispositivo si no existe
            const newDevice = await fetchTraccar('/devices', {
              method: 'POST',
              body: JSON.stringify({
                name: device.name,
                uniqueId: device.uniqueId,
                groupId: groupId,
                phone: device.phone,
                model: device.model,
                contact: device.contact,
                category: device.category,
                attributes: device.attributes || {}
              })
            });
            if (newDevice && newDevice.id) {
              deviceId = newDevice.id;
            }
          }

          // Si existe, asegurarse de que esté vinculado al grupo (Traccar lo hace automáticamente si el groupId está en el POST original,
          // pero si ya existía en otro grupo, lo sobreescribimos o vinculamos)
          if (deviceId && existingDevice) {
            // Actualizar su grupo principal
            await fetchTraccar(`/devices/${deviceId}`, {
              method: 'PUT',
              body: JSON.stringify({ ...existingDevice, groupId: groupId })
            });
          }
        }
      }

      // 3. Procesar Geocercas
      if (Array.isArray(group.geofences)) {
        for (const gf of group.geofences) {
          if (!gf.name || !gf.area) continue;

          let existingGf = Array.isArray(allGeofences) ? allGeofences.find((g: any) => g.name === gf.name) : null;
          let geofenceId = existingGf?.id;

          if (!geofenceId) {
            // Crear geocerca si no existe
            const newGf = await fetchTraccar('/geofences', {
              method: 'POST',
              body: JSON.stringify({
                name: gf.name,
                description: gf.description,
                area: gf.area,
                attributes: gf.attributes || {}
              })
            });
            if (newGf && newGf.id) {
              geofenceId = newGf.id;
            }
          }

          // Vincular geocerca al grupo
          if (geofenceId) {
            try {
              await fetchTraccar('/permissions', {
                method: 'POST',
                body: JSON.stringify({ groupId: groupId, geofenceId: geofenceId })
              });
            } catch (permError) {
              // Puede fallar silenciosamente si ya estaba vinculada (400 Bad Request)
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[BACKUP IMPORT ERROR]', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
