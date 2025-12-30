import { Query } from '../../../infrastructure/cqrs/Base.js';

export class GetUserDetailsQuery extends Query {
    constructor({ tenant_id, user_id }) {
        super();
        this.tenant_id = tenant_id;
        this.user_id = user_id;
    }
}
