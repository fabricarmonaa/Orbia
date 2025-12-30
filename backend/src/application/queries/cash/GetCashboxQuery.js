import { Query } from '../../../infrastructure/cqrs/Base.js';

export class GetCashboxQuery extends Query {
  constructor({ tenant_id, payload }) {
    super(payload);
    this.tenant_id = tenant_id;
  }
}
