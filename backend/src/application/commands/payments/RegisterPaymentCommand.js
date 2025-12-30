import { Command } from '../../../infrastructure/cqrs/Base.js';

export class RegisterPaymentCommand extends Command {
    constructor({ tenant_id, user_id, amount, method_code, order_ids = [], note = '' }) {
        super();
        this.tenant_id = tenant_id;
        this.user_id = user_id;
        this.amount = amount;
        this.method_code = method_code;
        this.order_ids = order_ids;
        this.note = note;
    }
}
