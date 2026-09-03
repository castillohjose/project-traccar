# Geozonas: clientes como referencias para vendedores

Estructura: AppRoutes → GeofencesRoutes → GeofencesController → TraccarApiGeofences.
El módulo usa la cookie JSESSIONID de la sesión actual, igual que dispositivos.
No utiliza credenciales administrativas ni cambia la sesión al filtrar por usuario.

## Crear una referencia de cliente

POST /api/geofences

```json
{
  "name": "Abastos El Centro",
  "description": "Av. Principal, local 12",
  "latitude": 10.4806,
  "longitude": -66.9036,
  "radius": 50,
  "attributes": {
    "clientId": "CLI-001",
    "phone": "0212-555-0100"
  }
}
```

name es el nombre visible del cliente. latitude y longitude son números en grados;
radius es obligatorio, positivo y está expresado en metros. No se asigna un radio
automáticamente. Se envía a Traccar como area: CIRCLE (10.4806 -66.9036, 50).
En este formato de Traccar el orden es latitud longitud, no el de GeoJSON.
La respuesta 200 conserva el objeto de Traccar con id, name y area.

También se admite el formato nativo:

```json
{
  "name": "Abastos El Centro",
  "area": "CIRCLE (10.4806 -66.9036, 50)",
  "description": "Av. Principal, local 12",
  "calendarId": 0,
  "attributes": { "clientId": "CLI-001" }
}
```

No mezclar area con latitude, longitude o radius. La geometría del area nativo
es validada por Traccar. description, calendarId y attributes son opcionales.
clientId es metadata de la integración: no crea un cliente en otro sistema ni
garantiza unicidad. El id de geozona lo genera Traccar.

## Rutas

| Método | Ruta | Resultado |
| --- | --- | --- |
| POST | /api/geofences | Crear (200) |
| GET | /api/geofences | Listar accesibles a la sesión (200) |
| GET | /api/geofences/:id | Consultar (200) |
| PUT | /api/geofences/:id | Actualizar (200) |
| DELETE | /api/geofences/:id | Borrar para todos los usuarios (204) |
| POST | /api/geofences/:id/users/:userId | Vincular usuario/vendedor (204) |
| DELETE | /api/geofences/:id/users/:userId | Quitar vínculo directo, sin borrar (204) |

PUT exige name y ubicación (area o coordenadas/radio). Envía una representación
completa, no un parche: incluir los opcionales que se quieran conservar.
El id de la ruta prevalece sobre el del cuerpo.

## Asignar referencias a vendedores

Se asume que cada vendedor corresponde a un usuario existente de Traccar.
Si el vendedor es una entidad externa, primero debe definirse su correspondencia
con userId; un deviceId no es un userId.

1. Crear la referencia y guardar su id (por ejemplo 7).
2. Desde una sesión autorizada, POST /api/geofences/7/users/3 para vincularla al
   vendedor cuyo usuario es 3. Se envía a POST /permissions:
   { "userId": 3, "geofenceId": 7 }.
3. Con la sesión del vendedor, GET /api/geofences devuelve las referencias
   accesibles. Un administrador/gestor autorizado puede consultar
   GET /api/geofences?userId=3.
4. Para quitar el vínculo directo: DELETE /api/geofences/7/users/3.

Traccar decide quién puede asignar o consultar referencias ajenas. Los permisos
de acceso no equivalen a asignación comercial exclusiva: varios usuarios pueden
compartir una geozona, el creador puede conservar acceso y un administrador puede
ver más información. Quitar un vínculo no garantiza revocar accesos por otras vías.
Crear y vincular son operaciones separadas: si falla la segunda, la referencia
permanece creada. Estas rutas no vinculan geozonas a dispositivos ni configuran
alertas de entrada/salida.

El listado acepta all, userId, deviceId, groupId, refresh, limit, offset y keyword.
Los filtros disponibles dependen de la versión de Traccar instalada.

## Consumo desde el mapa

Este cambio implementa el backend; no añade una pantalla de mapa.
El frontend debe consumir el listado, usar name como etiqueta (texto, no HTML)
y representar area. Para los clientes circulares puede colocar un marcador en
el centro y dibujar el radio si se necesita. La API conserva el formato de
Traccar; no devuelve GeoJSON ni campos latitude/longitude separados.

## Errores y pruebas

400 por entrada inválida, 401 sin cookie. Se conservan los códigos HTTP de Traccar
sin exponer trazas internas. Red, timeout de 15 segundos o JSON inválido: 502.
DELETE y vínculos exitosos devuelven 204 sin cuerpo.

Desde backend: npm test y npx tsc --noEmit.
Las pruebas simulan Traccar; no crean referencias ni conceden permisos reales.

Fuentes oficiales:
- [API de geocercas](https://www.traccar.org/api-reference/#tag/Geofences/operation/postGeofences)
- [Formato circular](https://github.com/traccar/traccar/blob/master/src/main/java/org/traccar/geofence/GeofenceCircle.java)
- [Permisos de Traccar](https://github.com/traccar/traccar/blob/master/src/main/java/org/traccar/api/resource/PermissionsResource.java)
