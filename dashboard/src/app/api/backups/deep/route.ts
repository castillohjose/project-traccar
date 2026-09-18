import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);
const BACKUPS_DIR = '/app/backups';

export async function GET() {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return NextResponse.json({ files: [] });
    }
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort((a, b) => b.localeCompare(a)); // Mas recientes primero
    
    return NextResponse.json({ files });
  } catch (error) {
    console.error('[DEEP BACKUP LIST ERROR]', error);
    return NextResponse.json({ error: 'Failed to list backups' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `respaldo_profundo_${timestamp}.sql`;
    const filePath = path.join(BACKUPS_DIR, fileName);

    // Ejecuta pg_dump conectándose al contenedor de base de datos
    // -h database : nombre del servicio en docker-compose
    // -U traccar : usuario
    // -F c : formato custom (comprimido, ideal para pg_restore)
    const cmd = `PGPASSWORD="traccar" pg_dump -h database -U traccar -d traccar -F c -f ${filePath}`;
    
    await execPromise(cmd);
    
    return NextResponse.json({ success: true, file: fileName });
  } catch (error) {
    console.error('[DEEP BACKUP CREATE ERROR]', error);
    return NextResponse.json({ error: 'Backup creation failed' }, { status: 500 });
  }
}
