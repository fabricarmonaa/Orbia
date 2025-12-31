import * as Base from '../../../infrastructure/cqrs/Base.js';

export class CreatePaymentCommand extends Base.Command {
    constructor({ tenant_id, payload }) {
        super(payload);
        this.tenant_id = tenant_id;
    }
}
