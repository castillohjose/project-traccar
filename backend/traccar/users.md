# Usuarios de Traccar

El módulo conserva el flujo `AppRoutes → UsersRoutes → UsersController → TraccarApiUsers`.
Todas las rutas requieren la cookie `JSESSIONID`. Traccar determina si la sesión
es administrador, manager o usuario y aplica sus permisos.

| Método | Ruta | Uso |
| --- | --- | --- |
| POST | `/api/users` | Crear cuenta (200) |
| GET | `/api/users` | Listar cuentas accesibles (200) |
| GET | `/api/users/:id` | Consultar cuenta (200) |
| PUT | `/api/users/:id` | Actualizar cuenta completa (200) |
| DELETE | `/api/users/:id` | Eliminar cuenta (204) |

El listado acepta `userId`, `limit`, `offset` y `keyword`. Los filtros y el CRUD
pueden requerir una sesión administrativa o manager.

## Crear un vendedor

```json
{
  "name": "María Pérez",
  "email": "maria@example.com",
  "password": "contraseña-inicial",
  "phone": "+58 412 0000000",
  "readonly": true,
  "administrator": false,
  "deviceLimit": 0,
  "userLimit": 0,
  "deviceReadonly": true,
  "limitCommands": true,
  "disabled": false,
  "attributes": {
    "sellerId": "VEN-001"
  }
}
```

`name`, `email` y `password` son obligatorios al crear. En PUT, `name` y `email`
siguen siendo obligatorios, pero `password` se omite para conservarla. PUT es una
representación, no un parche: incluir los campos opcionales que deban conservarse.
El id de la ruta prevalece sobre cualquier id del cuerpo.

La API acepta también preferencias de mapa y restricciones soportadas por
Traccar: `map`, `latitude`, `longitude`, `zoom`, `coordinateFormat`,
`expirationTime`, `fixedEmail`, `poiLayer` y `attributes`. Los campos de rol y
límites solo surtirán efecto si la sesión tiene autoridad para modificarlos.

El backend nunca devuelve `password`, incluso si un upstream defectuoso lo
incluyera. La contraseña sí se transmite a Traccar al crearla o cambiarla y debe
enviarse únicamente por HTTPS en producción. El backend no genera contraseñas,
no envía invitaciones y no implementa recuperación de acceso.

## Relación con vendedores y rastreo

Un usuario es una cuenta de acceso; no es un GPS. Para rastrear a María:

1. Crear su usuario.
2. Crear o identificar su dispositivo.
3. Vincular el usuario al dispositivo mediante permisos (módulo aún no expuesto
   como ruta dedicada de usuarios).
4. Vincular el dispositivo con las geozonas de clientes.

Eliminar el usuario no equivale a borrar el dispositivo ni su historial. Antes
de eliminar cuentas, revisar las relaciones y la política de conservación.

Errores de validación: `{ "ok": false, "message": "Datos de entrada inválidos",
"errors": [{ "field": "email", "message": "email debe ser válido" }] }`.
Errores de Traccar conservan el código HTTP sin exponer detalles internos. Red,
timeout o JSON inválido devuelven 502.

Fuente: [API oficial de usuarios](https://www.traccar.org/api-reference/#tag/Users).
