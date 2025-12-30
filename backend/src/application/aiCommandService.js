import { aiCommandLogsRepository } from '../domain/repositories/aiCommandLogsRepository.js';
import { commandBus } from '../infrastructure/cqrs/CommandBus.js';
import { CreateUserCommand } from './commands/users/CreateUserCommand.js';
import { CreateOrderCommand } from './commands/orders/CreateOrderCommand.js';
import { usersRepository } from '../domain/repositories/usersRepository.js';

export const aiCommandService = {
  async logPending({ tenant_id, user_id, command_text, parsed_payload }) {
    console.log('Service: logPending called', { tenant_id });
    if (!aiCommandLogsRepository) console.error('FATAL: aiCommandLogsRepository is undefined');

    return aiCommandLogsRepository.insert({
      tenant_id,
      user_id,
      command_text,
      parsed_payload,
      status: 'PENDING'
    });
  },

  async confirm({ tenant_id, command_id }) {
    const log = await aiCommandLogsRepository.findById(command_id, tenant_id);

    if (!log) {
      throw Object.assign(new Error('Command not found'), { statusCode: 404 });
    }

    if (log.status !== 'PENDING') {
      throw Object.assign(new Error('Command already processed'), { statusCode: 400 });
    }

    const { action, data } = log.parsed_payload;
    let result = null;

    try {
      // Execute the appropriate command based on action
      if (action === 'CREATE_ORDER') {
        // First, ensure user exists by DNI
        const user = await usersRepository.findByDniWithinTenant(tenant_id, data.user_dni);

        if (!user) {
          throw Object.assign(
            new Error(`User with DNI ${data.user_dni} not found. Create user first.`),
            { statusCode: 400 }
          );
        }

        // Build CreateOrderCommand payload
        const orderPayload = {
          user_id: user.id,
          status_code: data.status_code || 'PENDING',
          items: data.items || [],
          internal_notes: data.internal_notes || '',
          user_notes: data.user_notes || ''
        };

        const command = new CreateOrderCommand({ tenant_id, payload: orderPayload });
        result = await commandBus.dispatch(command);

        // Register payment if provided
        if (data.payment && data.payment.amount > 0) {
          try {
            const { CreatePaymentCommand } = await import('./commands/payments/CreatePaymentCommand.js');
            const paymentCmd = new CreatePaymentCommand({
              tenant_id,
              payload: {
                user_id: user.id,
                order_id: result.id,
                amount: data.payment.amount,
                method_code: data.payment.method_code
              }
            });
            await commandBus.dispatch(paymentCmd);
            result.payment_registered = true;
          } catch (paymentErr) {
            console.error('Failed to register AI payment:', paymentErr);
            result.payment_error = paymentErr.message;
          }
        }

      } else if (action === 'CREATE_USER') {
        const command = new CreateUserCommand({ tenant_id, payload: data });
        result = await commandBus.dispatch(command);

      } else {
        throw Object.assign(new Error(`Unsupported action: ${action}`), { statusCode: 400 });
      }

      // Mark as APPLIED
      await aiCommandLogsRepository.updateStatus(command_id, tenant_id, 'APPLIED');

      return { success: true, result };

    } catch (error) {
      // Mark as REJECTED on error
      await aiCommandLogsRepository.updateStatus(command_id, tenant_id, 'REJECTED');
      throw error;
    }
  },

  async reject({ tenant_id, command_id }) {
    const log = await aiCommandLogsRepository.findById(command_id, tenant_id);

    if (!log) {
      throw Object.assign(new Error('Command not found'), { statusCode: 404 });
    }

    await aiCommandLogsRepository.updateStatus(command_id, tenant_id, 'REJECTED');
  }
};
