# Proyecto de inicio de Nestjs con Postgres

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">

## Descripción

Este proyecto tiene como objetivo proporcionar un punto de partida para el desarrollo de aplicaciones utilizando NestJS. Incluye la configuración necesaria para conectar a una base de datos PostgreSQL, así como los archivos mínimos requeridos para la autenticación y otras configuraciones esenciales. Opcionalmente, se puede desplegar la base de datos utilizando Docker.

## Requisitos

- Node.js versión 18 o superior
- Gestor de paquetes: pnpm

## Instalaciones Preliminares

1. Instalar Node en la [version 18 o superior](https://nodejs.org/en/download/package-manager)
2. Instalar el [gestor de paquete de pnpm](https://pnpm.io/installation)

3. Instalar [Git](https://www.git-scm.com/downloads)
4. Instalar el CLI de Nestjs de forma global usando npm

   ```bash
   npm i -g @nestjs/cli
   ```

   - **Nota**: En Windows, se deben usar permisos de administrador, y en Linux, anteponer el comando **sudo** para instalar globalmente.

### Instalaciones requeridas para usar Docker

1.  Instalar [Docker Desktop](https://www.docker.com/get-started/)

2.  Registrarse e iniciar el programa

3.  Precargar la imagen de postgres
    ```bash
      docker pull postgres:14.3
    ```

## Instalación en Entorno Local

1. Clonar repositorio

   ```bash
   git clone <url-del-repositorio>
   ```

2. Acceder al proyecto e instalar las dependencias con pnpm

   ```bash
   pnpm install
   ```

3. Copiar el archivo .env.example

   ```bash
     cp .env.example .env
   ```

4. Establecer las variables de entorno tanto de la app como de la base de datos

## Generar migraciones en desarrollo

1. Ejecuta el comando `pnpm start:dev` para crear o actualizar el folder "dist".
2. Actualiza las entidades o crea nuevas.
3. Ejecuta el comando `npm run migration:generate --name=your_migration_name` para generar la nueva migración.
4. Ejecuta el comando `npm run migration:run` para aplicar la migración generada.

## Migraciones en producción

Es importante establecer la variable de entorno en DB_MIGRATIONS_RUN en true para que se ejecuten de forma automatica
al iniciar el proceso

## Revertir migraciones

Para revertir una migración, es crucial que el servicio de la aplicación esté detenido.

1. Ejecuta el comando `pnpm start:dev` para crear o actualizar el folder "dist".
2. Ejecuta el comando `npm run migration:revert` tantas veces como sea necesario para revertir las migraciones deseadas.
3. Elimina las migraciones revertidas.

## Correr la aplicación

Para poder iniciar la aplicaicón es necesario que las credenciales de la base de datos estén establecidas.

Los comando para deplegarla son los siguientes:

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

Si se hizo la instalación de docker entonces se puede iniciar la base de datos usando el siguiente comando:

```bash
# development
docker-compose -up -d

```

Nota: El comando anterior debe ejecutarse antes de correr la aplicación o lanzará un error de conexion.

## Test

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

---

## Instalaciones adicionales y otras configuraciones

- [Table Plus](https://tableplus.com/) o [PgAdmin](https://www.pgadmin.org/download/)

## Extensiones de VSCode

- [Material Icon Theme](https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme)
- [Paste JSON as Code](https://marketplace.visualstudio.com/items?itemName=quicktype.quicktype)
- [Auto Close Tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-close-tag)
- [Better DockerFile Syntax](https://marketplace.visualstudio.com/items?itemName=jeff-hykin.better-dockerfile-syntax)
- [DotENV](https://marketplace.visualstudio.com/items?itemName=mikestead.dotenv)

- [Thunder Client](https://marketplace.visualstudio.com/items?itemName=rangav.vscode-thunder-client)

- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

- [Pretty TypeScript Errors](https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors)

Cambiar íconos de Angular por íconos de Nest -> Abrir: settings.json

```
"material-icon-theme.activeIconPack": "nest",
```
