# Headnet

[![Unstable release](https://github.com/rickli-cloud/headnet/actions/workflows/unstable.yaml/badge.svg)](https://github.com/rickli-cloud/headnet/actions/workflows/unstable.yaml)

A web-ui for [Headscale](https://github.com/juanfont/headscale) with a focus on easy ACL management thru 3D network visualization

## Deploy

Headnet comes packaged in different ways ready to deploy

### Docker

Distroless docker container running deno

#### Tags

- `latest` Latest stable release
- `x.x.x` Release images
- `x.x.x-pre` Pre-release images (potentially unstable)
- `unstable` Built on every push to main

#### Docker run

```sh
docker run -d -p 3000:3000 ghcr.io/rickli-cloud/headnet:latest
```

#### Docker compose

Save this as `docker-compose.yaml`:

```yaml
version: '3.9'
name: headnet
services:
  headnet:
    image: ghcr.io/rickli-cloud/headnet:${HEADNET_VERSION:-latest}
    container_name: headnet
    pull_policy: always
    restart: always
    ports:
      - 0.0.0.0:3000:3000/tcp
    environment:
      PUBLIC_MOCK_ENABLED: 'true' # Demo mode enabled
```

Start it up:

```sh
docker compose up -d
```

### Static / Node

For all [releases](https://github.com/rickli-cloud/headnet/releases) there are zip archives provided for each build target

> The node server **is not capable of TLS** and is best used in combination with a reverse proxy. This does not pose a big security risk (assuming the internal network is somewhat secure) as no sensitive data is directly transmitted to this server.

## Environment configuration

> [!NOTE]  
> When using the static build target the environment can be configured on buildtime or by modifying the `/_app/env.js` file.
> Example to enable mocking:
>
> ```js
> export const env = { PUBLIC_MOCK_ENABLED: 'true' };
> ```

### Base path

> Only affective during buildtime

```sh
# linux
export BASE_PATH="/admin"
# windows
$env:BASE_PATH="/admin"
```

### Build target

> Only affective during buildtime

With the help of SvelteKit adapters it is possible to target different environments. For now this includes:

- `node` Ready to serve requests running node or deno
- `static` Can be served using almost any webserver capable of serving static files (single page application)
- `auto` Let SvelteKit figure it out

```sh
# linux
export BUILD_TARGET="node"
# windows
$env:BUILD_TARGET="node"
```

### Development proxy

> Only affective during development

To circumvent CORS issues vite provides a dev proxy leading to your headscale instance. To enable this you have to define your headscale host as a environment variable

```sh
# linux
export HEADSCALE_HOST="https://headscale.example.com"
# windows
$env:HEADSCALE_HOST="https://headscale.example.com"
```

### Mocking

Mock the whole API with the help of a service worker. This enables "demo mode"

```sh
# linux
export PUBLIC_MOCK_ENABLED="false"
# windows
$env:PUBLIC_MOCK_ENABLED="false"
```

## Install dependencies

Dependencies are required for building or developing

```sh
deno install
```

## Building

Create a production build:

```sh
deno task build
```

> [!TIP]  
> You can use docker for building if you do not want to / cant install deno:
>
> ```sh
> docker run -it --rm --workdir /app -v ${PWD}:/app:rw --entrypoint /bin/sh denoland/deno:latest
> ```

## Developing

Start a development server:

```sh
deno task dev
```

## Stack

Some of the major projects used:

- [Deno 2](https://deno.com/)
- [Svelte 5](https://svelte.dev/)
- [Shadcn](https://www.shadcn-svelte.com/)
- [3d-force-graph](https://github.com/vasturiano/3d-force-graph)
- [json-ast-comments](https://github.com/2betop/json-ast-comments)
- [openapi-typescript](https://openapi-ts.dev/)
- [mock service worker](https://mswjs.io/)

> [!NOTE]  
> Deno provides additional functionality such as automatic types for third party modules. NodeJS does not support this and will not work with this project during development / building.
