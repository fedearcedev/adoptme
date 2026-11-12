# AdoptMe API — Entrega Final Backend III

API REST de adopción de mascotas (usuarios, mascotas, adopciones y sesiones) construida con **Node.js, Express y MongoDB**. Proyecto final del curso **Backend III** de Coderhouse.

## 🐳 Imagen en Docker Hub

**https://hub.docker.com/r/superusuario32/adoptme**

```bash
docker pull superusuario32/adoptme:1.0.0
```

---

## Índice

- [Qué incluye esta entrega](#qué-incluye-esta-entrega)
- [Stack](#stack)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Variables de entorno](#variables-de-entorno)
- [Ejecutar con Docker](#ejecutar-con-docker)
- [Construir y publicar la imagen](#construir-y-publicar-la-imagen)
- [Ejecutar sin Docker](#ejecutar-sin-docker)
- [Documentación con Swagger](#documentación-con-swagger)
- [Tests](#tests)
- [Endpoints](#endpoints)
- [Mocks (Entrega N°1)](#mocks-entrega-n1)
- [Decisiones técnicas y de seguridad](#decisiones-técnicas-y-de-seguridad)

---

## Qué incluye esta entrega

| Consigna | Dónde está |
|---|---|
| Documentar con Swagger el módulo de Users | `src/docs/Users/Users.yaml` · servido en `/api/docs` |
| Tests funcionales de todos los endpoints de `adoption.router.js` | `test/adoption.router.test.js` (12 tests: éxito y error) |
| Dockerfile para generar la imagen del proyecto | `Dockerfile` + `.dockerignore` |
| Imagen subida a Docker Hub y link en el README | Sección [Imagen en Docker Hub](#-imagen-en-docker-hub) |
| Mocks de la Entrega N°1 (`/api/mocks`) | `src/routes/mocks.router.js` · `src/utils/mocking.js` |

## Stack

- Node.js 22 · Express 4
- MongoDB · Mongoose 8
- bcrypt · JSON Web Token · cookie-parser · multer
- @faker-js/faker (datos de prueba)
- swagger-jsdoc + swagger-ui-express (documentación)
- Mocha · Chai · Supertest · mongodb-memory-server (tests)
- Docker

## Estructura del proyecto

```
src/
├── app.js                 # Configura Express (sin escuchar puerto: la usan los tests)
├── server.js              # Conecta a MongoDB y levanta el servidor
├── config/config.js       # Lee variables de entorno
├── controllers/           # Lógica de cada endpoint
├── dao/ · repository/     # Acceso a datos por capas
├── docs/                  # Swagger: swagger.js + Users/Users.yaml
├── middlewares/           # Manejo centralizado de errores
├── routes/                # users, pets, adoptions, sessions, mocks
└── utils/                 # bcrypt, multer, generación de mocks
test/
├── helpers/db.js          # Base de test aislada (MongoDB en memoria)
├── adoption.router.test.js
└── mocks.router.test.js
Dockerfile · .dockerignore · docker-compose.yml · .env.example
```

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `MONGO_URL` | Sí | Cadena de conexión a MongoDB |
| `JWT_SECRET` | Sí (en producción) | Secreto para firmar los tokens |
| `PORT` | No (8080) | Puerto de la API |
| `NODE_ENV` | No | `production` deshabilita las rutas de mocks |
| `MONGO_URL_TEST` | No | Base para tests; si falta, se usa MongoDB en memoria |

Copiá `.env.example` como `.env` y completalo. El `.env` está en `.gitignore` y en `.dockerignore`: **nunca** se sube al repo ni queda dentro de la imagen.

## Ejecutar con Docker

### Opción A: imagen de Docker Hub + tu MongoDB (Atlas)

```bash
docker pull superusuario32/adoptme:1.0.0

docker run -d --name adoptme -p 8080:8080 \
  -e MONGO_URL="mongodb+srv://USUARIO:PASSWORD@cluster0.xxxxx.mongodb.net/adoptme" \
  -e JWT_SECRET="un-secreto-largo" \
  superusuario32/adoptme:1.0.0
```

O con tu archivo `.env`:

```bash
docker run -d --name adoptme -p 8080:8080 --env-file .env superusuario32/adoptme:1.0.0
```

Abrí **http://localhost:8080/api/docs** para ver y probar la API.

> Si tu MongoDB corre en tu propia máquina (no en Atlas), dentro del contenedor `localhost` es el contenedor. Usá `mongodb://host.docker.internal:27017/adoptme` (en Linux agregá `--add-host=host.docker.internal:host-gateway`).

### Opción B: API + MongoDB con Docker Compose (sin cuenta de Atlas)

```bash
docker compose up -d        # levanta mongo + api
docker compose logs -f api  # ver logs
docker compose down         # detener
```

Compose levanta la API en modo `development`, así que las rutas `/api/mocks` están disponibles para cargar datos de prueba.

### Comandos útiles

```bash
docker ps                   # contenedores en ejecución
docker logs -f adoptme      # logs de la API
docker stop adoptme && docker rm adoptme
```

## Construir y publicar la imagen

```bash
# 1. Construir la imagen desde la raíz del proyecto
docker build -t superusuario32/adoptme:1.0.0 .

# 2. Probarla localmente
docker run --rm -p 8080:8080 --env-file .env superusuario32/adoptme:1.0.0

# 3. Iniciar sesión en Docker Hub (te pide el token; no lo escribas en el comando)
docker login -u superusuario32

# 4. Etiquetar también como latest y subir
docker tag superusuario32/adoptme:1.0.0 superusuario32/adoptme:latest
docker push superusuario32/adoptme:1.0.0
docker push superusuario32/adoptme:latest
```

Verificá en Docker Hub que el repositorio sea **público** (Settings → Visibility).

**Qué hace el Dockerfile, paso a paso:**

1. Parte de `node:22-slim` (versión fija y liviana).
2. Copia solo `package.json` y `package-lock.json` y ejecuta `npm ci --omit=dev`: instalación reproducible, idéntica al lockfile y sin dependencias de desarrollo. Al estar en una capa separada, Docker la cachea y no reinstala todo por cada cambio de código.
3. Copia `src/`.
4. Define `NODE_ENV=production` y `PORT=8080`.
5. Corre como el usuario sin privilegios `node`, no como root.
6. Expone el puerto 8080 y arranca con `node src/server.js`.

Los secretos (`MONGO_URL`, `JWT_SECRET`) **no** están en la imagen: se pasan con `-e` o `--env-file` al ejecutar.

## Ejecutar sin Docker

Requisitos: Node.js 20 o superior y una base MongoDB.

```bash
npm install
cp .env.example .env   # completá MONGO_URL y JWT_SECRET
npm run dev            # con nodemon
# o
npm start
```

## Documentación con Swagger

Con la API corriendo: **http://localhost:8080/api/docs**

El módulo **Users** está documentado en `src/docs/Users/Users.yaml` con:

- Los 4 endpoints (`GET /api/users`, `GET`, `PUT` y `DELETE /api/users/{uid}`).
- Parámetros, cuerpo de la petición y respuestas de éxito y error (200, 400, 404, 500).
- Esquemas reutilizables (`User`, `UpdateUser`, `Error`, `SuccessMessage`).

Desde la interfaz podés probar cada endpoint con "Try it out".

## Tests

```bash
npm test
```

Los tests usan **una base aislada**: por defecto levantan un MongoDB en memoria (`mongodb-memory-server`) que se borra al terminar, así que nunca tocan tu base real. La primera ejecución descarga el binario de MongoDB y puede tardar un poco. Si preferís usar tu propia base de test, definí `MONGO_URL_TEST`.

### Cobertura del router de adopciones (`/api/adoptions`)

| Endpoint | Caso | Esperado |
|---|---|---|
| `GET /` | Sin adopciones | 200 · array vacío |
| `GET /` | Con adopciones | 200 · array con todas |
| `GET /:aid` | Id existente | 200 · la adopción |
| `GET /:aid` | Id inexistente | 404 · `Adoption not found` |
| `GET /:aid` | Id mal formado | 400 · `Invalid adoption id` |
| `POST /:uid/:pid` | Adopción válida | 200 · crea la adopción, marca la mascota como adoptada con dueño y la agrega al usuario |
| `POST /:uid/:pid` | Mascota ya adoptada | 400 · no crea otra adopción ni cambia el dueño |
| `POST /:uid/:pid` | Usuario inexistente | 404 · `user Not found` |
| `POST /:uid/:pid` | Mascota inexistente | 404 · `Pet not found` |
| `POST /:uid/:pid` | Id de usuario mal formado | 400 · `Invalid user id` |
| `POST /:uid/:pid` | Id de mascota mal formado | 400 · `Invalid pet id` |
| `POST /:uid` | Falta el id de mascota | 404 |

Además, `test/mocks.router.test.js` verifica los endpoints de mocks de la Entrega N°1.

Resultado esperado:

```
16 passing
```

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/users` | Lista usuarios (sin contraseña) |
| GET · PUT · DELETE | `/api/users/:uid` | Ver, actualizar o eliminar un usuario |
| GET · POST | `/api/pets` | Listar o crear mascotas |
| POST | `/api/pets/withimage` | Crear mascota con imagen (multipart) |
| PUT · DELETE | `/api/pets/:pid` | Actualizar o eliminar una mascota |
| GET | `/api/adoptions` | Lista adopciones |
| GET | `/api/adoptions/:aid` | Ver una adopción |
| POST | `/api/adoptions/:uid/:pid` | El usuario `uid` adopta la mascota `pid` |
| POST | `/api/sessions/register` · `/login` | Registro y login (cookie con JWT) |
| GET | `/api/sessions/current` | Usuario de la sesión actual |
| GET | `/api/mocks/mockingpets` | Mascotas generadas (no se guardan) |
| GET | `/api/mocks/mockingusers` | 50 usuarios generados (no se guardan) |
| POST | `/api/mocks/generateData` | Genera e inserta usuarios y mascotas |
| GET | `/api/docs` | Documentación Swagger |

## Mocks (Entrega N°1)

Router `mocks.router.js` montado en `/api/mocks`:

- **`GET /api/mocks/mockingpets`**: genera 100 mascotas (cantidad opcional con `?quantity=`).
- **`GET /api/mocks/mockingusers`**: genera 50 usuarios con el formato que devolvería Mongo (`_id` y `__v`), contraseña `coder123` encriptada con bcrypt, `role` aleatorio entre `user` y `admin` y `pets: []`.
- **`POST /api/mocks/generateData`**: recibe en el **body (JSON)** las cantidades `users` y `pets`, genera los registros y los inserta en la base:

```bash
curl -X POST http://localhost:8080/api/mocks/generateData \
  -H "Content-Type: application/json" \
  -d '{"users": 10, "pets": 20}'
# → {"status":"success","payload":{"usersInserted":10,"petsInserted":20}}
```

Después se verifican con `GET /api/users` y `GET /api/pets`. Valores negativos, decimales, texto o mayores a 1000 devuelven **400**.

## Decisiones técnicas y de seguridad

- **`app.js` separado de `server.js`:** los tests importan la app con Supertest sin abrir un puerto ni conectarse a la base real.
- **Base de test aislada:** los tests nunca escriben en la base de desarrollo.
- **Errores controlados:** un id mal formado devuelve 400 en lugar de colgar la petición o tirar un 500; un middleware centraliza los errores inesperados sin exponer stack traces.
- **bcrypt una sola vez:** los 50 usuarios mock comparten `coder123`, así que el hash se calcula una vez y se reutiliza (bcrypt es lento a propósito).
- **Mocks deshabilitados en producción:** con `NODE_ENV=production` (el valor por defecto de la imagen Docker) las rutas `/api/mocks` responden 404, para que nadie pueda llenar la base con datos falsos.
- **Sin contraseñas en las respuestas:** `/api/users` nunca devuelve el hash.
- **`PUT /api/users/:uid` no permite cambiar `role` ni `password`.**
- **Secretos fuera del código y de la imagen:** `JWT_SECRET` y `MONGO_URL` salen de variables de entorno; `.env` está en `.gitignore` y `.dockerignore`.
- **Contenedor sin root:** la API corre con el usuario `node`.
- **Emails de mocks en `example.com`:** dominio reservado para ejemplos; nunca se usan datos de personas reales.

---

Proyecto académico — Backend III, Coderhouse.
