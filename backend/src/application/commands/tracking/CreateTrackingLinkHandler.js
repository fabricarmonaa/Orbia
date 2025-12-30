import crypto from 'node:crypto';
import { trackingRepository } from '../../../domain/repositories/trackingRepository.js';

export class CreateTrackingLinkHandler {
    async handle(command) {
        const { tenant_id, payload } = command;
        const { order_id, expires_in_hours = 168 } = payload;

        const token = crypto.randomBytes(32).toString('hex');
        const token_hash = crypto.createHash('sha256').update(token).digest('hex');

        const expires_at = new Date(Date.now() + expires_in_hours * 3600 * 1000);

        await trackingRepository.create({
            tenant_id,
            order_id,
            token_hash,
            expires_at
        });

        return { token };
    }
}
