import { NextResponse } from 'next/server';
import { fetchTraccar } from '@/lib/traccar';

export async function POST(request: Request) {
  try {
    const { groupIds } = await request.json();
    if (!groupIds || !Array.isArray(groupIds)) {
      return NextResponse.json({ error: 'Invalid groupIds' }, { status: 400 });
    }

    const allGroups = await fetchTraccar('/groups?all=true');
    const exportData: any = {
      version: 1,
      timestamp: new Date().toISOString(),
      groups: []
    };

    for (const groupId of groupIds) {
      const group = allGroups.find((g: any) => g.id === groupId);
      if (!group) continue;

      // Buscar todos los dispositivos de este grupo
      const devices = await fetchTraccar(`/devices?all=true`);
      const groupDevices = Array.isArray(devices) ? devices.filter((d: any) => d.groupId === groupId) : [];

      // Buscar geocercas
      // Como las geocercas no retornan groupId en ?all=true, pedimos las del grupo especifico
      let groupGeofences = [];
      try {
        const geoReq = await fetchTraccar(`/geofences?groupId=${groupId}`);
        if (Array.isArray(geoReq)) groupGeofences = geoReq;
      } catch (e) {
        console.error(`Error fetching geofences for group ${groupId}`);
      }

      exportData.groups.push({
        name: group.name,
        attributes: group.attributes || {},
        devices: groupDevices.map((d: any) => ({
          name: d.name,
          uniqueId: d.uniqueId,
          phone: d.phone,
          model: d.model,
          contact: d.contact,
          category: d.category,
          attributes: d.attributes || {}
        })),
        geofences: groupGeofences.map((gf: any) => ({
          name: gf.name,
          description: gf.description,
          area: gf.area,
          attributes: gf.attributes || {}
        }))
      });
    }

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('[BACKUP EXPORT ERROR]', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
