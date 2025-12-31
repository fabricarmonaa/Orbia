import { Command } from '../../../infrastructure/cqrs/Base.js';

export class UpdateOrderStatusCommand extends Command {
  constructor({ tenant_id, order_id, status_code }) {
    super({ order_id, status_code });
    this.tenant_id = tenant_id;
  }
}
