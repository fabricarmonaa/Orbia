import { z } from 'zod';
import { aiService } from '../../domain/services/aiService.js';
import { requireAuth } from '../../infrastructure/http/authGuard.js';
import { aiCommandService } from '../../application/aiCommandService.js';

const commandSchema = z.object({
  command: z.string().optional(),
  audio_base64: z.string().optional()
});

export const aiProxyController = {
  handleVoiceCommand: async context => {
    try {
      await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);

      const parsed = commandSchema.parse(context.body || {});

      const response = await aiService.dispatchCommand(
        { ...parsed, tenant_id: context.user.tenant_id },
        context.user
      );

      const log = await aiCommandService.logPending({
        tenant_id: context.user.tenant_id,
        user_id: context.user.user_id,
        command_text: response.transcript || parsed.command || '',
        parsed_payload: response.structured
      });
      console.log('AI Proxy: Logged Pending', log.id);

      context.res.writeHead(200, { 'Content-Type': 'application/json' });
      context.res.end(JSON.stringify({
        status: 'PENDING',
        ai_command_id: log.id,
        summary: response.summary,
        payload: response.structured
      }));
    } catch (err) {
      console.error('[AI Proxy Error Caught]', err);
      // Pass through status code if present
      if (err.statusCode) throw err;

      const error = new Error('El servicio de IA no está disponible.');
      error.statusCode = 503;
      throw error;
    }
  },

  confirmCommand: async context => {
    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
    const result = await aiCommandService.confirm({
      tenant_id: context.user.tenant_id,
      command_id: context.params.id
    });
    context.res.writeHead(200, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ applied: true, result }));
  },

  rejectCommand: async context => {
    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
    await aiCommandService.reject({ tenant_id: context.user.tenant_id, command_id: context.params.id });
    context.res.writeHead(200, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify({ rejected: true }));
  }
};
