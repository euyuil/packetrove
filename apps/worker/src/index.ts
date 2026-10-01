import { createApp, type WorkerBindings } from './app';

const app = createApp();

export default { fetch: app.fetch } satisfies ExportedHandler<WorkerBindings>;
