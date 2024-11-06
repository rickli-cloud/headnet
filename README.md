# Headnet

A web-ui for [Headscale](https://github.com/juanfont/headscale) with a focus on easy ACL management thru 3D network visualization.

## Developing

To circumvent CORS issues vite provides a dev proxy leading to your headscale instance. To enable this you have to define your headscale host as a environment variable.

```sh
# linux
export HEADSCALE_HOST="https://headscale.example.com"

# windows
$env:HEADSCALE_HOST="https://headscale.example.com"
```

Once you've installed dependencies with `deno install`, start a development server:

```sh
deno task dev
```

## Building

To create a production version of your app:

```sh
deno task build
```

You can preview the production build with `deno task preview`.

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
