
import { Query } from '../../../infrastructure/cqrs/Base.js';

export class GetOrdersQuery extends Query {
    constructor({ tenant_id, filters, page, limit }) {
        super({ filters, page, limit });
        this.tenant_id = tenant_id;
    }
}
