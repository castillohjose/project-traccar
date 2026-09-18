import { NextResponse } from 'next/server';
import { fetchTraccar } from '@/lib/traccar';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = parseInt((await params).id);
    
    // Grupos a los que tiene acceso este usuario
    const userGroups = await fetchTraccar(`/groups?userId=${userId}`);
    const groupIds = Array.isArray(userGroups) ? userGroups.map((g: any) => g.id) : [];

    return NextResponse.json({ groupIds });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = parseInt((await params).id);
    const { groupIds } = await request.json();

    // ==========================================
    // 1. ASIGNAR USUARIO A LOS GRUPOS
    // ==========================================
    const currentGroups = await fetchTraccar(`/groups?userId=${userId}`);
    const currentGroupIds = Array.isArray(currentGroups) ? currentGroups.map((g: any) => g.id) : [];

    const toAddG = groupIds.filter((id: number) => !currentGroupIds.includes(id));
    for (const groupId of toAddG) {
      await fetchTraccar('/permissions', {
        method: 'POST',
        body: JSON.stringify({ userId, groupId })
      });
    }

    const toRemoveG = currentGroupIds.filter((id: number) => !groupIds.includes(id));
    for (const groupId of toRemoveG) {
      await fetchTraccar('/permissions', {
        method: 'DELETE',
        body: JSON.stringify({ userId, groupId })
      });
    }

    // ==========================================
    // 2. MAGIA PROFUNDA: ASIGNAR GEOCERCAS DIRECTAMENTE
    // Traccar no hereda geocercas por grupo nativamente.
    // Nosotros buscaremos todas las geocercas dentro de los grupos que tiene el usuario,
    // y se las asignaremos directamente al usuario.
    // ==========================================
    
    // Recolectar todas las geocercas que deberían pertenecerle al usuario (basado en sus grupos)
    const allExpectedGeofenceIds = new Set<number>();
    
    // Obtenemos los detalles de los grupos usando systemRequest para saltarnos restricciones y ver todo el contenido
    for (const groupId of groupIds) {
      const groupGeofences = await fetchTraccar(`/geofences?groupId=${groupId}`, { systemRequest: true });
      if (Array.isArray(groupGeofences)) {
        groupGeofences.forEach((g: any) => allExpectedGeofenceIds.add(g.id));
      }
    }

    // Geocercas actuales del usuario
    const currentUserGeofences = await fetchTraccar(`/geofences?userId=${userId}`);
    const currentUserGeofenceIds = Array.isArray(currentUserGeofences) ? currentUserGeofences.map((g: any) => g.id) : [];

    // Calcular diferencias
    const expectedArray = Array.from(allExpectedGeofenceIds);
    const toAddGF = expectedArray.filter(id => !currentUserGeofenceIds.includes(id));
    
    // OJO: Solo quitamos las geocercas que YA NO ESTÁN en ninguna de sus carpetas.
    const toRemoveGF = currentUserGeofenceIds.filter(id => !expectedArray.includes(id));

    // Ejecutar vinculación de geocercas
    for (const geofenceId of toAddGF) {
      await fetchTraccar('/permissions', {
        method: 'POST',
        // Usamos systemRequest porque el admin que hace la petición podría no ser el dueño directo de la geocerca
        systemRequest: true, 
        body: JSON.stringify({ userId, geofenceId })
      });
    }

    // Ejecutar desvinculación
    for (const geofenceId of toRemoveGF) {
      await fetchTraccar('/permissions', {
        method: 'DELETE',
        systemRequest: true,
        body: JSON.stringify({ userId, geofenceId })
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving user permissions:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
