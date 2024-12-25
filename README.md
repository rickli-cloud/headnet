# Headnet

[![Unstable release](https://github.com/rickli-cloud/headnet/actions/workflows/unstable.yaml/badge.svg)](https://github.com/rickli-cloud/headnet/actions/workflows/unstable.yaml)

Admin web-ui for [@juanfont/headscale](https://github.com/juanfont/headscale) with a focus on easy ACL management thru 3D network visualization

- [Features](#features)
- [Deployment Options](#deployment-options)
  - [Docker](#docker)
  - [Static / Node](#static--node)
  - [Desktop Application](#desktop-application)
- [Configuration](#configuration)
- [Development](#development)
- [Building](#building)
- [Technology Stack](#technology-stack)

## Features

- **Interactive 3D Network Visualization**: Visualize your network topology in 3D for intuitive management.
- **Simplified ACL Management**: Easily manage Access Control Lists, Groups and more with a user-friendly interface.

## Deployment Options

> [!NOTE]  
> The Node server does not support TLS and is best used behind a reverse proxy.

### Docker

Headnet is available as a distroless Docker container running Deno.
l
**Tags:**

- `latest`: Latest stable release
- `x.x.x`: Specific release versions
- `x.x.x-pre`: Pre-release versions (potentially unstable)
- `unstable`: Built on every push to the main branch

**Using Docker Run:**

```sh
docker run -d -p 3000:3000 ghcr.io/rickli-cloud/headnet:latest
```

**Using Docker Compose:**

Create a `docker-compose.yaml` file:

```yaml
version: '3.9'
services:
  headnet:
    image: ghcr.io/rickli-cloud/headnet:${HEADNET_VERSION:-latest}
    container_name: headnet
    restart: always
    ports:
      - 3000:3000
    environment:
      PUBLIC_MOCK_ENABLED: 'true' # Enable demo mode (requires a build with MSW included!)
```

Start the service:

```sh
docker compose up -d
```

### Static / Node

Pre-built zip archives for various build targets are available in the [releases](https://github.com/rickli-cloud/headnet/releases).

### Desktop Application

Standalone executables and installers for different platforms are provided in the [releases](https://github.com/rickli-cloud/headnet/releases).

> These applications include special client integrations to bypass any CORS restrictions. This allows it to work with any Headscale instance without additional configuration.

## Configuration

Environment variables can be configured at build time or by modifying the `/_app/env.js` file in static builds.

### Example to Enable Mocking

```js
export const env = { PUBLIC_MOCK_ENABLED: 'true' };
```

### Base Path

> Only affective during development & buildtime

```sh
# Linux
export BASE_PATH="/admin"

# Windows
$env:BASE_PATH="/admin"
```

### Build Target

> Only affective during buildtime

- `node`: For Node.js or Deno servers
- `static`: For static file servers
- `auto`: Let SvelteKit decide

```sh
# Linux
export BUILD_TARGET="node"

# Windows
$env:BUILD_TARGET="node"
```

### Development Proxy

> Only affective during development

To circumvent CORS issues vite provides a dev proxy leading to your headscale instance.

```sh
# Linux
export HEADSCALE_HOST="https://headscale.example.com"

# Windows
$env:HEADSCALE_HOST="https://headscale.example.com"
```

### Mocking

Mock the whole API with the help of a service worker. This enables "demo mode"

```sh
# Linux
export PUBLIC_MOCK_ENABLED="false"

# Windows
$env:PUBLIC_MOCK_ENABLED="false"
```

> [!IMPORTANT]  
> This only works if the build includes the required service worker. To keep the size down it is **not included** in the production releases.

## Development

**Install Dependencies:**

```sh
deno install
```

**Starting Development Server:**

```sh
deno task dev
```

## Building

> [!TIP]  
> This can be done in Docker:
>
> ```sh
> docker run -it --rm --workdir /app -v ${PWD}:/app:rw --entrypoint /bin/sh denoland/deno:latest
> ```

**Install Dependencies:**

```sh
deno install
```

**For Node or Static builds:**

```sh
deno task build
```

**For Tauri builds:**

Ensure the following configuration:

- `BASE_PATH = "/"`
- `BUILD_TARGET = "static"`

Then run:

```sh
deno task tauri build
```

## Technology Stack

Headnet is built using the following technologies:

- [Deno 2](https://deno.com/)
- [Tauri 2](https://v2.tauri.app/)
- [Svelte 5](https://svelte.dev/)
- [shadcn](https://www.shadcn-svelte.com/)
- [3d-force-graph](https://github.com/vasturiano/3d-force-graph)
- [json-ast-comments](https://github.com/2betop/json-ast-comments)
- [openapi-typescript](https://openapi-ts.dev/)
- [Mock Service Worker](https://mswjs.io/)

> **Note:** Deno provides additional functionality, such as automatic types for third-party modules. Node.js does not support this and will not work
