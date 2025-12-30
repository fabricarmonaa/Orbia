import { Command } from '../../../infrastructure/cqrs/Base.js';

export class CreatePaymentCommand extends Command {
    constructor({ tenant_id, payload }) {
        super();
        this.tenant_id = tenant_id;
        this.payload = payload;
    }
}
