# Headnet

[![Unstable release](https://github.com/rickli-cloud/headnet/actions/workflows/unstable.yaml/badge.svg)](https://github.com/rickli-cloud/headnet/actions/workflows/unstable.yaml)

Admin web-ui for [@juanfont/headscale](https://github.com/juanfont/headscale) with a focus on easy ACL management thru 3D network visualization

- [Features](#features)
- [Deployment options](#deployment-options)
  - [Docker](#docker)
  - [Static server](#static-server)
  - [Desktop application](#desktop-application)
- [Configuration](#configuration)
  - [Passing environment variables](#passing-environment-variables)
  - [Base path](#base-path)
  - [Development proxy](#development-proxy)
  - [Mocking](#mocking)
- [Development](#development)
- [Building](#building)
- [Technology Stack](#technology-stack)

## Features

- **Interactive 3D Network Visualization**: Visualize your network topology in 3D for intuitive management.
- **Simplified ACL Management**: Easily manage Access Control Lists, Groups and more with a user-friendly interface.

## Deployment Options

> [!NOTE]  
> The provided server does not support TLS and is best used behind a reverse proxy.

### Docker

Headnet is available as a distroless Docker container a [basic golang webserver](https://github.com/rickli-cloud/headnet/blob/main/server.go).

#### Tags

- `latest`: Latest stable release
- `x.x.x`: Specific release versions
- `x.x.x-pre`: Pre-release versions (potentially unstable)
- `unstable`: Built on every push to the main branch

#### Using Docker Run

```sh
docker run -d -p 3000:3000 ghcr.io/rickli-cloud/headnet:unstable
```

#### Using Docker Compose

Create a `docker-compose.yaml` file:

```yaml
version: '3.9'
services:
  headnet:
    image: ghcr.io/rickli-cloud/headnet:${HEADNET_VERSION:-unstable}
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

### Static server

You can download a zip archive [for each release](https://github.com/rickli-cloud/headnet/releases) containing almost everything needed to deploy headnet on a static webserver like Nginx or Apache.

### Desktop Application

Standalone executables and installers for different platforms are provided [for each release](https://github.com/rickli-cloud/headnet/releases).

> These applications include special client integrations to bypass any CORS restrictions. This allows it to work with any Headscale instance without additional configuration.

## Configuration

### Passing environment variables

Environment variables can be configured in different ways depending on the deployment method.

> Some variables might only be affective during development or at buildtime!

#### Docker / Go server

Reads environment variables starting with `PUBLIC_` and serves them automatically on `/admin/_app/env.js`.

#### Static files

Configure environment at buildtime or modify the `/_app/env.js` file. Example to Enable Mocking:

```js
export const env = { PUBLIC_MOCK_ENABLED: 'true' };
```

#### Desktop application (tauri)

Unfortunately you **can not** configure anything after buildtime.

### Mocking

Mock the whole API with the help of a service worker. This enables "demo mode"

```sh
# Linux
export PUBLIC_MOCK_ENABLED="false"

# Windows
$env:PUBLIC_MOCK_ENABLED="false"
```

> [!IMPORTANT]  
> This only works if the build includes the required service worker.
> To keep the size down it is **not included** in the production releases.  
> Create the service worker with: `deno task msw:init`

### Base Path

> Only affective during development & buildtime

```sh
# Linux
export BASE_PATH="/admin"

# Windows
$env:BASE_PATH="/admin"
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

### Static

```sh
deno task build
```

### Tauri

Ensure the following configuration:

- `BASE_PATH = "/"`

Then run:

```sh
deno task tauri build
```

### Docker image

> The docker image does not build the svelte app, only bundles the static files into a small server.

```sh
docker build . -t headnet:custom
```

## Technology Stack

Headnet is built using the following technologies:

- [3d-force-graph](https://github.com/vasturiano/3d-force-graph)
- [deno 2](https://github.com/denoland/deno)
- [json-ast-comments](https://github.com/2betop/json-ast-comments)
- [mock service worker](https://github.com/mswjs/msw)
- [monaco editor](https://github.com/microsoft/monaco-editor)
- [openapi-typescript](https://github.com/openapi-ts/openapi-typescript)
- [shadcn svelte](https://github.com/huntabyte/shadcn-svelte)
- [svelte 5](https://github.com/sveltejs/svelte)
- [tauri 2](https://github.com/tauri-apps/tauri)

> [!NOTE]  
> Deno provides additional functionality, such as automatic types for third-party modules. Node.js does not support this and will not work
