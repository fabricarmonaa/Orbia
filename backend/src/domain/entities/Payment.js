export class Payment {
  constructor({ id = null, tenantId, userId, methodCode, amount, note = '' }) {
    if (!tenantId) throw new Error('Payment requires tenantId');
    if (!userId) throw new Error('Payment requires userId');
    if (!methodCode) throw new Error('Payment requires methodCode');
    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    this.id = id;
    this.tenantId = tenantId;
    this.userId = userId;
    this.methodCode = methodCode;
    this.amount = amount;
    this.note = note;
  }

  static create(props) {
    return new Payment(props);
  }
}
