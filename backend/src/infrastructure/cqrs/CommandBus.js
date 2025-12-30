
export class CommandBus {
  constructor() {
    this.handlers = new Map();
  }

  register(commandName, handler) {
    if (this.handlers.has(commandName)) {
      throw new Error(`Command handler for ${commandName} is already registered`);
    }
    this.handlers.set(commandName, handler);
  }

  async dispatch(command) {
    const handler = this.handlers.get(command.constructor.name);
    if (!handler) {
      throw new Error(`No handler registered for command ${command.constructor.name}`);
    }
    return handler.handle(command);
  }
}

export const commandBus = new CommandBus();
