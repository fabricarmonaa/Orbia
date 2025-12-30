import { Command } from '../../../infrastructure/cqrs/Base.js';

export class CreateCashMovementCommand extends Command {
    constructor({ tenant_id, type, category, method_code, amount, user_id = null, note = '' }) {
        super();
        this.tenant_id = tenant_id;
        this.type = type; // 'INCOME' | 'EXPENSE'
        this.category = category;
        this.method_code = method_code;
        this.amount = amount;
        this.user_id = user_id;
        this.note = note;
    }
}
