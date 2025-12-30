import crypto from 'node:crypto';
import { trackingRepository } from '../../../domain/repositories/trackingRepository.js';
import { orderStatusHistoryRepository } from '../../../domain/repositories/orderStatusHistoryRepository.js';

export class GetTrackingInfoHandler {
    async handle(query) {
        const { token } = query.payload;
        const token_hash = crypto.createHash('sha256').update(token).digest('hex');
        const link = await trackingRepository.findByTokenHash(token_hash);

        if (!link) {
            const error = new Error('Invalid or expired tracking link');
            error.statusCode = 404;
            throw error;
        }

        const history = await orderStatusHistoryRepository.findByOrderId(link.order_id);

        return {
            order: {
                id: link.order_id,
                status: link.status_name,
                updated_at: link.order_updated_at,
                notes: link.user_notes
            },
            history: history.map(h => ({
                status: h.status_name,
                changed_at: h.changed_at,
                note: h.note_visible
            }))
        };
    }
}
