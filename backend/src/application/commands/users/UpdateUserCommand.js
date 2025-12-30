import { Command } from '../../../infrastructure/cqrs/Base.js';

export class UpdateUserCommand extends Command {
    constructor({ tenant_id, user_id, payload }) {
        super();
        this.tenant_id = tenant_id;
        this.user_id = user_id;
        this.payload = payload; // { first_name, last_name, email, phone, extra_fields }
    }
}
