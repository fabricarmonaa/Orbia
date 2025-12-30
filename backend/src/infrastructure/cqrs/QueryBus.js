
export class QueryBus {
    constructor() {
        this.handlers = new Map();
    }

    register(queryName, handler) {
        if (this.handlers.has(queryName)) {
            throw new Error(`Query handler for ${queryName} is already registered`);
        }
        this.handlers.set(queryName, handler);
    }

    async execute(query) {
        const handler = this.handlers.get(query.constructor.name);
        if (!handler) {
            throw new Error(`No handler registered for query ${query.constructor.name}`);
        }
        return handler.handle(query);
    }
}

export const queryBus = new QueryBus();
