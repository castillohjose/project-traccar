import { NextResponse } from 'next/server';
import { fetchTraccar } from '@/lib/traccar';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const groupId = parseInt((await params).id);
    
    // 1. Obtener dispositivos que pertenecen a este grupo
    const allDevices = await fetchTraccar('/devices', { systemRequest: true });
    const deviceIds = allDevices
      .filter((d: any) => d.groupId === groupId)
      .map((d: any) => d.id);

    // 2. Obtener geocercas vinculadas a este grupo
    const groupGeofences = await fetchTraccar(`/geofences?groupId=${groupId}`, { systemRequest: true });
    const geofenceIds = Array.isArray(groupGeofences) ? groupGeofences.map((g: any) => g.id) : [];

    return NextResponse.json({ deviceIds, geofenceIds });
  } catch (error) {
    console.error('Error fetching group elements:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const groupId = parseInt((await params).id);
    const { deviceIds, geofenceIds } = await request.json();

    // ==========================================
    // 1. ACTUALIZAR DISPOSITIVOS
    // ==========================================
    const allDevices = await fetchTraccar('/devices', { systemRequest: true });
    for (const device of allDevices) {
      const shouldBeInGroup = deviceIds.includes(device.id);
      const isInGroup = device.groupId === groupId;

      if (shouldBeInGroup && !isInGroup) {
        // Mover a este grupo
        device.groupId = groupId;
        await fetchTraccar(`/devices/${device.id}`, {
          method: 'PUT',
          systemRequest: true,
          body: JSON.stringify(device)
        });
      } else if (!shouldBeInGroup && isInGroup) {
        // Sacar de este grupo (lo mandamos al default o root, groupId: 0 o null)
        device.groupId = 0; 
        await fetchTraccar(`/devices/${device.id}`, {
          method: 'PUT',
          systemRequest: true,
          body: JSON.stringify(device)
        });
      }
    }

    // ==========================================
    // 2. ACTUALIZAR GEOCERCAS
    // ==========================================
    const currentGeofences = await fetchTraccar(`/geofences?groupId=${groupId}`, { systemRequest: true });
    const currentGeofenceIds = Array.isArray(currentGeofences) ? currentGeofences.map((g: any) => g.id) : [];

    // Geocercas a agregar
    const toAdd = geofenceIds.filter((id: number) => !currentGeofenceIds.includes(id));
    for (const geofenceId of toAdd) {
      await fetchTraccar('/permissions', {
        method: 'POST',
        systemRequest: true,
        body: JSON.stringify({ groupId, geofenceId })
      });
    }

    // Geocercas a eliminar
    const toRemove = currentGeofenceIds.filter((id: number) => !geofenceIds.includes(id));
    for (const geofenceId of toRemove) {
      await fetchTraccar('/permissions', {
        method: 'DELETE',
        systemRequest: true,
        body: JSON.stringify({ groupId, geofenceId })
      });
    }

    // ==========================================
    // 3. AUTO-MAGIA DE USUARIOS
    // ==========================================
    // Si agregamos nuevas geocercas a este grupo, debemos asegurarnos de que 
    // los usuarios que tienen acceso a este grupo también tengan acceso directo a estas geocercas
    // (para que Traccar funcione nativamente sin puentes).
    
    // Obtenemos los usuarios que tienen acceso a este grupo
    const groupUsers = await fetchTraccar(`/users?groupId=${groupId}`, { systemRequest: true });
    if (Array.isArray(groupUsers)) {
      for (const user of groupUsers) {
        // Para cada usuario, extraemos sus geocercas actuales
        const userGeofences = await fetchTraccar(`/geofences?userId=${user.id}`, { systemRequest: true });
        const userGeofenceIds = Array.isArray(userGeofences) ? userGeofences.map((g: any) => g.id) : [];
        
        // Le damos acceso directo a las geocercas que acabamos de meter en el grupo y que el usuario no tiene
        const geofencesToGrant = toAdd.filter((id: number) => !userGeofenceIds.includes(id));
        for (const gfId of geofencesToGrant) {
          await fetchTraccar('/permissions', {
            method: 'POST',
            systemRequest: true,
            body: JSON.stringify({ userId: user.id, geofenceId: gfId })
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving group elements:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
