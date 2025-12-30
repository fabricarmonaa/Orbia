import { Command } from '../../../infrastructure/cqrs/Base.js';

export class DeactivateUserCommand extends Command {
    constructor({ tenant_id, user_id }) {
        super();
        this.tenant_id = tenant_id;
        this.user_id = user_id;
    }
}
