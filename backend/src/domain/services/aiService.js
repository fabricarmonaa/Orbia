import { postJson } from '../../infrastructure/http/httpClient.js';

export const aiService = {
  dispatchCommand: async (payload, user) => {
    const response = await postJson(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/commands`, {
      tenant_id: payload.tenant_id,
      command: payload.command,
      audio_base64: payload.audio_base64,
      user_context: {
        user_id: user.user_id,
        role: user.role,
        session_id: user.session_id
      }
    });
    const summary = response.summary || `Acción: ${response.structured?.action || 'desconocida'}`;
    return { ...response, summary };
  }
};
