export class CashMovement {
  constructor({ id = null, tenantId, type, methodCode, amount, category, userId = null, note = '' }) {
    if (!tenantId) throw new Error('Cash movement requires tenantId');
    if (!['INCOME', 'EXPENSE'].includes(type)) throw new Error('Invalid cash movement type');
    if (!methodCode) throw new Error('Cash movement requires methodCode');
    if (typeof amount !== 'number' || amount <= 0) throw new Error('Cash movement amount must be greater than zero');
    if (!category) throw new Error('Cash movement requires category');

    this.id = id;
    this.tenantId = tenantId;
    this.type = type;
    this.methodCode = methodCode;
    this.amount = amount;
    this.category = category;
    this.userId = userId;
    this.note = note;
  }

  static create(props) {
    return new CashMovement(props);
  }
}
