import { createApp } from './app';
import type { FeedbackBindings } from './feedback';

const app = createApp();

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Cloudflare.Env & FeedbackBindings>;
