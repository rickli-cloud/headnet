# Configuration

## Environment variables

| Key                  | Default                 | Description                                                                                                                 | Production | Buildtime | Development |
| -------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------- | --------- | ----------- |
| HEADNET_MOCK_ENABLED | `false`                 | Mock the whole API with the help of a service worker. This enables "demo mode"                                              | ✔️         | ✔️        | ✔️          |
| BASE_PATH            | `/admin`                | Base http path                                                                                                              | ❌         | ✔️        | ✔️          |
| BUILD_TARGET         | `static`                | Sveltekit build target. See `svelte.config.js`                                                                              | ❌         | ✔️        | ✔️          |
| HMR_ENABLED          | `true`                  | Hot module reload                                                                                                           | ❌         | ❌        | ✔️          |
| HEADSCALE_HOST       | `http://localhost:8080` | To circumvent CORS issues vite can provide a dev proxy leading to your headscale instance. Inactive when mocking is enabled | ❌         | ❌        | ✔️          |
