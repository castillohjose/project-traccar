# Dispositivos

El módulo conserva el flujo `AppRoutes → DevicesRoutes → DevicesController → TraccarApiDevices`.
Todas las rutas requieren la cookie `JSESSIONID` obtenida al iniciar sesión en `POST /api/session`.

| Método | Ruta | Resultado |
| --- | --- | --- |
| POST | `/api/devices` | Crea un dispositivo (200) |
| GET | `/api/devices` | Lista dispositivos accesibles (200) |
| GET | `/api/devices/:id` | Consulta un dispositivo (200) |
| PUT | `/api/devices/:id` | Actualiza un dispositivo (200) |
| DELETE | `/api/devices/:id` | Elimina un dispositivo (204, sin cuerpo) |

Para crear y actualizar, `name` y `uniqueId` son textos obligatorios. El identificador de hardware se envía como texto para conservar ceros iniciales.

```json
{
  "name": "Vehículo 01",
  "uniqueId": "864201040000000",
  "groupId": 0,
  "phone": "",
  "model": "FMB920",
  "contact": "Operaciones",
  "category": "car",
  "disabled": false,
  "attributes": {}
}
```

PUT envía una representación del dispositivo, no un parche: incluye los campos opcionales que quieras conservar. El id de la ruta prevalece sobre cualquier id del cuerpo. Se omiten campos ajenos al modelo editable.

El listado acepta `all`, `userId`, `id`, `uniqueId`, `keyword`, `excludeAttributes`, `limit` y `offset`. `id` y `uniqueId` pueden repetirse: `/api/devices?id=7&id=8`. La disponibilidad de filtros depende de la versión de Traccar instalada; los permisos los verifica Traccar con la sesión del usuario.

Los datos inválidos devuelven 400; sin cookie, 401. Se conserva el código de error HTTP de Traccar sin exponer sus detalles internos. Una conexión fallida, timeout de 15 segundos o JSON inválido devuelve 502.

Referencia: [API oficial de Traccar](https://www.traccar.org/api-reference/).

Verificación local desde `backend`: `npm test` y `npx tsc --noEmit`. Las pruebas simulan Traccar y no modifican dispositivos reales.
