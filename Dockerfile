# Imagen base oficial de Node con versión fija (reproducible).
# "slim" = Debian mínimo: menos paquetes, menos superficie de ataque.
FROM node:22-slim

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Entorno de ejecución: producción (deshabilita /api/mocks)
ENV NODE_ENV=production
ENV PORT=8080

# 1) Copiamos SOLO los manifiestos de dependencias.
#    Así Docker cachea la capa de "npm ci" y no reinstala todo
#    cada vez que cambia una línea de código.
COPY package.json package-lock.json ./

# 2) Instalación reproducible (respeta package-lock.json) y sin dependencias de desarrollo
RUN npm ci --omit=dev && npm cache clean --force

# 3) Copiamos el código fuente (el .dockerignore deja afuera .env, node_modules, tests, etc.)
COPY src ./src

# 4) No correr como root: la imagen de Node trae el usuario sin privilegios "node"
RUN chown -R node:node /app
USER node

# Puerto en el que escucha la API
EXPOSE 8080

# MONGO_URL y JWT_SECRET NO van en la imagen: se pasan al ejecutar el contenedor
CMD ["node", "src/server.js"]
