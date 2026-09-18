import { NextResponse } from 'next/server';
import { fetchTraccar, ensureGroupExists } from '@/lib/traccar';

export async function GET() {
  try {
    const geofences = await fetchTraccar('/geofences?all=true');
    return NextResponse.json(geofences);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch geofences' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newGeofence = await fetchTraccar('/geofences', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    // Auto-vincular la nueva geocerca al Grupo dinámicamente
    // Así todos los usuarios que tengan acceso al Grupo la verán automáticamente
    if (newGeofence && newGeofence.id) {
      try {
        // En una ruta autenticada, usamos el proxy con la cookie del usuario
        // pero necesitamos asegurar que el grupo Clientes exista. 
        // Como el usuario que crea geocercas es admin, puede crear grupos.
        const groupId = await ensureGroupExists("Clientes", false) || 1;
        
        await fetchTraccar('/permissions', {
          method: 'POST',
          body: JSON.stringify({ groupId: groupId, geofenceId: newGeofence.id })
        });
        console.log(`[PROXY] Geocerca ${newGeofence.id} vinculada al Grupo ${groupId} automáticamente`);
      } catch (permError) {
        console.error(`[PROXY] Error al vincular geocerca al grupo:`, permError);
      }
    }

    return NextResponse.json(newGeofence);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create geofence' }, { status: 500 });
  }
}
