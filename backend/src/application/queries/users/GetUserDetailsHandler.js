import { usersReadRepository } from '../../../domain/repositories/usersReadRepository.js';
import { ordersReadRepository } from '../../../domain/repositories/ordersReadRepository.js';
import { paymentsReadRepository } from '../../../domain/repositories/paymentsReadRepository.js';
import { userExtraFieldsRepository } from '../../../domain/repositories/userExtraFieldsRepository.js';

export class GetUserDetailsHandler {
    async handle(query) {
        const { tenant_id, user_id } = query;

        // Get user from read model
        const user = await usersReadRepository.findById(user_id);

        if (!user || user.tenant_id !== tenant_id) {
            throw new Error('User not found or access denied');
        }

        // Get user's orders
        const orders = await ordersReadRepository.findByUser({ tenant_id, user_id });

        // Get user's payments
        const payments = await paymentsReadRepository.findByUser({ tenant_id, user_id });

        // Get extra fields
        const extraFields = await userExtraFieldsRepository.findByUserId(user_id);

        return {
            user: {
                ...user,
                extra_fields: extraFields.reduce((acc, field) => {
                    acc[field.field_name] = field.field_value;
                    return acc;
                }, {})
            },
            orders,
            payments,
            stats: {
                total_orders: orders.length,
                total_paid: payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
                balance: user.balance || 0
            }
        };
    }
}
