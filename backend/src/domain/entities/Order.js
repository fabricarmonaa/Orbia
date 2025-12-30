export class Order {
  constructor({ id = null, tenantId, userId, statusId, internalNotes = '', userNotes = '', branchId = null, items = [] }) {
    if (!tenantId) throw new Error('Order requires tenantId');
    if (!userId) throw new Error('Order requires userId');
    if (!statusId) throw new Error('Order requires statusId');
    if (!Array.isArray(items)) throw new Error('Order items must be an array');
    if (items.length === 0) throw new Error('Order must contain at least one item');

    items.forEach(item => {
      if (!item.sku) throw new Error('Order item missing sku');
      if (typeof item.quantity !== 'number' || item.quantity <= 0) throw new Error('Order item quantity must be > 0');
      if (typeof item.price !== 'number' || item.price <= 0) throw new Error('Order item price must be > 0');
    });

    this.id = id;
    this.tenantId = tenantId;
    this.userId = userId;
    this.statusId = statusId;
    this.internalNotes = internalNotes;
    this.userNotes = userNotes;
    this.branchId = branchId;
    this.items = items.map(item => ({
      sku: item.sku,
      description: item.description || '',
      quantity: item.quantity,
      price: item.price
    }));
  }

  static create(props) {
    return new Order(props);
  }

  static hydrate(raw) {
    return new Order({
      id: raw.id,
      tenantId: raw.tenant_id,
      userId: raw.user_id,
      statusId: raw.status_id,
      internalNotes: raw.internal_notes,
      userNotes: raw.user_notes,
      branchId: raw.branch_id,
      items: raw.items || []
    });
  }

  ensureTenant(tenantId) {
    if (!tenantId || tenantId !== this.tenantId) {
      const error = new Error('Cross-tenant order access forbidden');
      error.statusCode = 403;
      throw error;
    }
  }

  changeStatus(targetStatusId, canTransition) {
    if (!targetStatusId) throw new Error('Target status required');
    if (targetStatusId === this.statusId) return; // no-op

    const allowed = typeof canTransition === 'function' ? canTransition(this.statusId, targetStatusId) : true;
    if (!allowed) {
      const error = new Error('Invalid status transition');
      error.statusCode = 400;
      throw error;
    }

    this.statusId = targetStatusId;
  }
}
