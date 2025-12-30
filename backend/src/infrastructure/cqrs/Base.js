
export class Command {
    constructor(payload) {
        this.payload = payload;
        this.occurredAt = new Date();
    }
}

export class Query {
    constructor(payload) {
        this.payload = payload;
    }
}
