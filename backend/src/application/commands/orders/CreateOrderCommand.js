
import { Command } from '../../../infrastructure/cqrs/Base.js';

export class CreateOrderCommand extends Command {
    constructor({ tenant_id, payload }) {
        super(payload);
        this.tenant_id = tenant_id;
    }
}
