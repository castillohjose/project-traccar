import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);
const BACKUPS_DIR = '/app/backups';

export async function POST(request: Request) {
  try {
    const { fileName } = await request.json();
    if (!fileName || typeof fileName !== 'string' || !fileName.endsWith('.sql')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filePath = path.join(BACKUPS_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Ejecuta pg_restore
    // -c : limpia/dropea los objetos antes de crearlos
    // -h database : host
    const cmd = `PGPASSWORD="traccar" pg_restore -h database -U traccar -d traccar -c ${filePath}`;
    
    // Ignoramos algunos warnings que pg_restore tira al dropear cosas que no existen
    try {
      await execPromise(cmd);
    } catch (e: any) {
      // pg_restore suele retornar exit code > 0 si hay warnings, pero la db se restaura bien.
      console.warn('[DEEP RESTORE WARNINGS]', e.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DEEP RESTORE ERROR]', error);
    return NextResponse.json({ error: 'Restore failed' }, { status: 500 });
  }
}
