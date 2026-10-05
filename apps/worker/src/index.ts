import { createApp } from './app';
import { cleanupFeedback, type FeedbackBindings } from './feedback';

const app = createApp();

export default {
  fetch: app.fetch,
  async scheduled(_controller, env) {
    if (!env.FEEDBACK_DB) return;
    try { await cleanupFeedback(env.FEEDBACK_DB); }
    catch { console.error({ event: 'feedback_cleanup_failure', error_code: 'FEEDBACK_UNAVAILABLE' }); }
  },
} satisfies ExportedHandler<Cloudflare.Env & FeedbackBindings>;
