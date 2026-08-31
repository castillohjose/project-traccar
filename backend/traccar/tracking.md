# Rastreo de vendedores y permanencia en clientes

Este módulo agrega controladores, rutas y servicios para consultar posiciones y
visitas, además de extender geozonas con vínculos a dispositivos.
Todas las rutas están bajo /api y requieren la cookie JSESSIONID.

## Preparación

1. Crear un dispositivo por celular/GPS del vendedor mediante POST /api/devices.
   El identificador uniqueId debe coincidir con el configurado en Traccar Client
   o en el GPS; el equipo debe enviar posiciones a este servidor.
2. Crear cada cliente mediante POST /api/geofences con nombre y ubicación.
3. Vincular el dispositivo 1 con el cliente/geozona 7:
   POST /api/geofences/7/devices/1.
4. Para dejar de monitorizar ese vínculo directo:
   DELETE /api/geofences/7/devices/1.
   No se borra el dispositivo, la geozona ni el historial. Un vínculo a través
   de grupos puede seguir activo.

Ambas operaciones envían { "deviceId": 1, "geofenceId": 7 } a /permissions de
Traccar y devuelven 204. La sesión debe tener permisos; no se usa una cuenta
administrativa alternativa. Vincular un usuario a una geozona da acceso,
pero no sustituye esta asociación dispositivo–geozona.

La identidad comercial del vendedor sigue perteneciendo a tu aplicación.
Puedes guardar sellerId en attributes del dispositivo como referencia;
esto no crea usuarios, no garantiza unicidad ni guarda historial de asignaciones.
Si un celular cambia de vendedor, el reporte sigue identificado por deviceId.
Este cambio no implementa una base de datos de vendedores ni el CRUD de usuarios.

## Posiciones para el mapa

GET /api/positions

Devuelve las últimas posiciones conocidas de los dispositivos accesibles.
No significa que estén conectados ahora: revisar fixTime, valid y la información
de estado de GET /api/devices. Relacionar position.deviceId con device.id para
obtener el nombre del vendedor/dispositivo.

Para consultar recorrido de un equipo:

GET /api/positions?deviceId=1&from=2026-08-31T00:00:00Z&to=2026-09-01T00:00:00Z

deviceId requiere from y to. No se admite deviceId solo en esta ruta.
El endpoint es una consulta HTTP, no un canal en tiempo real; el mapa y un
WebSocket quedan fuera de este cambio. Traccar recomienda WebSocket para
actualizaciones continuas en lugar de polling frecuente.

## Reporte de permanencias/visitas

GET /api/visits?deviceId=1&geofenceId=7&from=2026-08-31T00:00:00Z&to=2026-09-01T00:00:00Z&minimumDurationSeconds=300

- deviceId obligatorio, repetible para varios vendedores.
- geofenceId opcional, filtra un cliente.
- from y to obligatorios, ISO 8601 con zona horaria. Para usar + en el offset,
  codificarlo como %2B. El máximo por consulta es 31 días.
- minimumDurationSeconds: entero no negativo, por defecto 300 (cinco minutos).
  Es un umbral de consulta; no se guarda ni modifica la configuración de Traccar.

Ejemplo:

```json
{
  "minimumDurationSeconds": 300,
  "visits": [{
    "deviceId": 1,
    "geofenceId": 7,
    "arrival": "2026-08-31T12:00:00Z",
    "departure": "2026-08-31T12:08:00Z",
    "durationSeconds": 480,
    "meetsMinimumDuration": true,
    "status": "complete"
  }]
}
```

El servicio consulta /reports/events de Traccar, ordena los eventos y empareja
geofenceEnter/geofenceExit por dispositivo y geozona. Devuelve tanto visitas
que cumplen el mínimo como pasos más breves; no elimina los intervalos cortos.
Relacionar geofenceId con GET /api/geofences para mostrar el nombre del cliente.
Los nombres disponibles son los actuales, no una copia histórica.

Si no hay entrada dentro del período: missing_entry, arrival null.
Si no hay salida: missing_exit, departure null.
En ambos casos durationSeconds y meetsMinimumDuration son null, no cero/false.
missing_exit no demuestra que el vendedor siga dentro ahora. Puede faltar el
evento o estar fuera del rango. Entradas repetidas con ids distintos se marcan
como intervalos incompletos, sin inventar una salida. Eventos con el mismo id
se deduplican.

Limitaciones: se requieren eventos guardados por Traccar. Vincular ahora no
reconstruye visitas pasadas. Si el equipo estuvo dentro durante todo el rango
sin eventos, no aparece una visita. Un reporte vacío no prueba ausencia de
visitas: revisar conectividad, cobertura del período y configuración.
La frecuencia/precisión del GPS y pérdidas de señal afectan los resultados.
Cumplir el mínimo demuestra permanencia inferida, no atención comercial ni venta.
El sistema no hace check-in manual ni registra evidencia comercial.

## Operación y seguridad

No se han creado vínculos ni modificado equipos reales al implementar esto.
Antes de usarlo con vendedores, comunicar el seguimiento, limitar accesos y
acordar horarios de rastreo; no confundir cuentas de acceso con equipos GPS.

400: consulta inválida. 401: falta sesión. Se conservan errores HTTP de Traccar
sin detalles internos. Fallos de red, timeout de 15 segundos, JSON/estructura
inválida: 502. No se convierte un error en un reporte vacío.

Pruebas: npm test. Tipos: npx tsc --noEmit, desde backend.
Las pruebas simulan Traccar; falta validar con un equipo real enviando posiciones.

Fuentes: [API](https://www.traccar.org/api-reference/),
[Geozonas](https://www.traccar.org/geofences/),
[Traccar Client](https://www.traccar.org/client/).
