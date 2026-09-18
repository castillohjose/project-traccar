Aquí tienes la documentación técnica de la API REST de Traccar en formato Markdown, optimizada tanto para lectura humana como para ser procesada eficientemente por modelos de lenguaje o herramientas de desarrollo de software (como Codex).

---

```markdown
# Guía y Referencia Técnica de la API REST de Traccar

## 1. Introducción

La [API REST de Traccar](https://www.traccar.org/api-reference/) permite interactuar de forma programática con el servidor de seguimiento GPS [Traccar](https://www.traccar.org/). A través de sus endpoints, es posible gestionar usuarios, dispositivos, grupos, posiciones geográficas, geocercas, comandos y reportes.

* **URL base típica:** `https://tu-servidor-traccar.com/api`
* **Formato de datos:** `application/json` (para la mayoría de peticiones y respuestas).
* **Licencia del servidor:** Apache 2.0.

---

## 2. Autenticación

La API soporta dos esquemas principales de autenticación mediante cabeceras HTTP:

### Basic Auth
Consiste en enviar las credenciales codificadas en Base64 en la cabecera `Authorization`:
```http
Authorization: Basic dXN1YXJpbzBjb250cmFzZW5h

```

### ApiKey / Token de Sesión

Permite usar un token generado previamente mediante el endpoint `/session/token`:

```http
Authorization: Bearer <TU_SESSION_TOKEN>

```

> **Nota:** La sesión también puede iniciarse mediante un formato `application/x-www-form-urlencoded` enviado al endpoint `/session`, lo que creará una cookie de sesión en el navegador/cliente.

---

## 3. Endpoints Principales

A continuación se resumen los grupos de recursos más relevantes de la API.

### 3.1. Servidor (`/server`)

Permite consultar y actualizar la configuración global de la instancia de Traccar.

* **`GET /server`**
* **Descripción:** Obtiene la información básica y ajustes generales del servidor.
* **Respuesta de ejemplo (200 OK):**
```json
{
  "id": 1,
  "registration": true,
  "readonly": false,
  "deviceReadonly": false,
  "limitCommands": false,
  "map": "locationIq",
  "latitude": 0.0,
  "longitude": 0.0,
  "zoom": 2,
  "version": "6.x",
  "openIdEnabled": false,
  "attributes": {}
}

```




* **`PUT /server`** *(Admin)*
* **Descripción:** Actualiza la configuración global del servidor.



---

### 3.2. Sesión (`/session`)

Gestión del ciclo de vida de la sesión del usuario.

* **`GET /session`**
* **Parámetros de consulta:** `token` (opcional).
* **Descripción:** Comprueba si existe una sesión activa o valida un token. Devuelve los datos del usuario autenticado.


* **`POST /session`**
* **Content-Type:** `application/x-www-form-urlencoded`
* **Parámetros requeridos:**
* `email` *(string)*: Correo del usuario.
* `password` *(string)*: Contraseña del usuario.


* **Descripción:** Inicia sesión y establece la cookie correspondiente.


* **`DELETE /session`**
* **Descripción:** Cierra la sesión activa (devuelve HTTP 204 No Content).


* **`POST /session/token`**
* **Parámetros:** `expiration` *(date-time ISO 8601, opcional)*.
* **Descripción:** Genera un token de acceso reutilizable.



---

### 3.3. Dispositivos (`/devices`)

Administración de los rastreadores GPS y dispositivos vinculados.

* **`GET /devices`**
* **Parámetros de consulta:**
* `all` *(boolean, opcional)*: Si es `true`, obtiene todos los dispositivos (solo admins/managers).
* `userId` *(integer, opcional)*: Filtra por el ID de un usuario específico.
* `id` *(integer, opcional)*: Filtra por ID único interno del dispositivo.
* `uniqueId` *(string, opcional)*: Identificador de hardware o IMEI.
* `keyword` *(string, opcional)*: Búsqueda por texto (nombre, IMEI, teléfono, modelo).


* **Respuesta de ejemplo (200 OK):**
```json
[
  {
    "id": 10,
    "name": "Vehículo 01",
    "uniqueId": "864201040000000",
    "status": "online",
    "disabled": false,
    "lastUpdate": "2026-08-14T15:30:00Z",
    "positionId": 5012,
    "groupId": 2,
    "phone": "+123456789",
    "model": "Teltonika FMB920",
    "contact": "Juan Pérez",
    "category": "car",
    "attributes": {}
  }
]

```




* **`POST /devices`**
* **Descripción:** Registra un nuevo dispositivo.
* **Cuerpo requerido (`application/json`):**
```json
{
  "name": "Nuevo Vehículo",
  "uniqueId": "123456789012345",
  "groupId": 0,
  "phone": "",
  "model": "",
  "contact": "",
  "category": "default"
}

```




* **`GET /devices/{id}`**
* **Descripción:** Devuelve la información detallada de un dispositivo específico.


* **`PUT /devices/{id}`**
* **Descripción:** Actualiza los atributos de un dispositivo existente.


* **`DELETE /devices/{id}`**
* **Descripción:** Elimina un dispositivo.


* **`PUT /devices/{id}/accumulators`**
* **Descripción:** Ajusta los valores acumulados de odómetro o horas de motor.
* **Cuerpo:**
```json
{
  "deviceId": 10,
  "totalDistance": 150000.0,
  "hours": 120.5
}

```





---

### 3.4. Grupos (`/groups`)

Organización jerárquica de dispositivos.

* **`GET /groups`**
* **Descripción:** Lista los grupos a los que tiene acceso el usuario.


* **`POST /groups`**
* **Descripción:** Crea un nuevo grupo.
* **Cuerpo de ejemplo:**
```json
{
  "name": "Flota Norte",
  "groupId": 0,
  "attributes": {}
}

```





---

### 3.5. Usuarios (`/users`)

Gestión de la cuenta de usuario y permisos.

* **`GET /users`** *(Admin/Manager)*
* **Descripción:** Lista los usuarios registrados.


* **`POST /users`**
* **Descripción:** Registra un nuevo usuario en la plataforma.
* **Cuerpo de ejemplo:**
```json
{
  "name": "Usuario Demo",
  "email": "demo@ejemplo.com",
  "password": "contrasenaSegura123",
  "administrator": false,
  "deviceLimit": -1,
  "userLimit": 0,
  "attributes": {}
}

```





---

### 3.6. Compartir (`/share`)

Generación de enlaces temporales o accesos compartidos.

* **`POST /share/device`**
* **Content-Type:** `application/x-www-form-urlencoded`
* **Parámetros:** `deviceId` *(integer)*, `expiration` *(date-time ISO 8601)*.
* **Descripción:** Genera un token para compartir la ubicación en vivo de un dispositivo.



---

## 4. Estructura de Códigos de Respuesta HTTP

| Código | Significado | Descripción |
| --- | --- | --- |
| `200 OK` | Éxito | La solicitud se completó correctamente y devuelve datos en el cuerpo. |
| `204 No Content` | Éxito sin contenido | Acción realizada correctamente (ej. borrado o cierre de sesión). |
| `400 Bad Request` | Petición inválida | Datos faltantes, formato JSON incorrecto o parámetros no válidos. |
| `401 Unauthorized` | No autorizado | Falta la autenticación o las credenciales expiraron/son inválidas. |
| `403 Forbidden` | Prohibido | El usuario autenticado no tiene permisos para realizar esta acción. |
| `404 Not Found` | No encontrado | El recurso solicitado (dispositivo, usuario, grupo) no existe. |
| `500 Internal Error` | Error del servidor | Error interno de la plataforma Traccar. |

---

## 5. Mejores Prácticas

1. **Uso de Tokens de Sesión en lugar de Basic Auth permanente:** Para aplicaciones integradas o scripts, se recomienda utilizar el endpoint `/session/token` para crear un token de acceso con fecha de expiración delimitada en lugar de almacenar las credenciales en texto plano.
2. **Paginación y Filtros:** Al consultar grandes volúmenes de datos (`/devices`, `/users`), utiliza los parámetros `limit`, `offset` y filtros por palabras clave (`keyword`) para evitar sobrecargar la base de datos del servidor.
3. **Manejo de Fechas:** Asegúrate de enviar todas las fechas en formato ISO 8601 con zona horaria UTC (ejemplo: `2026-08-14T15:30:00Z`).
4. **Validación de Roles:** Si estás construyendo un panel multitenant o con jerarquías, valida siempre los roles (`administrator`, `deviceReadonly`, `readonly`) devueltos en la respuesta de `/session` antes de habilitar opciones en la interfaz de usuario.

---

## 6. Recursos Adicionales

* [Documentación Oficial de la API Traccar](https://www.traccar.org/api-reference/)
* [Servidores Demo de Traccar para Pruebas](https://www.traccar.org/demo-server/)
* [Sitio Web Oficial de Traccar](https://www.traccar.org/)

```

```