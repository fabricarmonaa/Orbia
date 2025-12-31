
import { commandBus } from './infrastructure/cqrs/CommandBus.js';
import { queryBus } from './infrastructure/cqrs/QueryBus.js';

import { CreateUserCommand } from './application/commands/users/CreateUserCommand.js';
import { CreateUserHandler } from './application/commands/users/CreateUserHandler.js';
import { UpdateUserCommand } from './application/commands/users/UpdateUserCommand.js';
import { UpdateUserHandler } from './application/commands/users/UpdateUserHandler.js';
import { DeactivateUserCommand } from './application/commands/users/DeactivateUserCommand.js';
import { DeactivateUserHandler } from './application/commands/users/DeactivateUserHandler.js';
import { GetUsersQuery } from './application/queries/users/GetUsersQuery.js';
import { GetUsersHandler } from './application/queries/users/GetUsersHandler.js';
import { GetUserDetailsQuery } from './application/queries/users/GetUserDetailsQuery.js';
import { GetUserDetailsHandler } from './application/queries/users/GetUserDetailsHandler.js';

import { CreateOrderCommand } from './application/commands/orders/CreateOrderCommand.js';
import { CreateOrderHandler } from './application/commands/orders/CreateOrderHandler.js';
import { GetOrdersQuery } from './application/queries/orders/GetOrdersQuery.js';
import { GetOrdersHandler } from './application/queries/orders/GetOrdersHandler.js';
import { UpdateOrderStatusCommand } from './application/commands/orders/UpdateOrderStatusCommand.js';
import { UpdateOrderStatusHandler } from './application/commands/orders/UpdateOrderStatusHandler.js';

import { RegisterPaymentCommand } from './application/commands/payments/RegisterPaymentCommand.js';
import { RegisterPaymentHandler } from './application/commands/payments/RegisterPaymentHandler.js';
import { CreatePaymentCommand } from './application/commands/payments/CreatePaymentCommand.js';
import { CreatePaymentHandler } from './application/commands/payments/CreatePaymentHandler.js';
import { GetPaymentsQuery } from './application/queries/payments/GetPaymentsQuery.js';
import { GetPaymentsHandler } from './application/queries/payments/GetPaymentsHandler.js';

import { CreateCashMovementCommand } from './application/commands/cash/CreateCashMovementCommand.js';
import { CreateCashMovementHandler } from './application/commands/cash/CreateCashMovementHandler.js';
import { GetCashboxQuery } from './application/queries/cash/GetCashboxQuery.js';
import { GetCashboxHandler } from './application/queries/cash/GetCashboxHandler.js';

import { GenerateTrackingLinkCommand } from './application/commands/tracking/GenerateTrackingLinkCommand.js';
import { CreateTrackingLinkHandler } from './application/commands/tracking/CreateTrackingLinkHandler.js';
import { GetTrackingInfoQuery } from './application/queries/tracking/GetTrackingInfoQuery.js';
import { GetTrackingInfoHandler } from './application/queries/tracking/GetTrackingInfoHandler.js';

export function bootstrapCqrs() {
    // Users
    commandBus.register(CreateUserCommand.name, new CreateUserHandler());
    commandBus.register(UpdateUserCommand.name, new UpdateUserHandler());
    commandBus.register(DeactivateUserCommand.name, new DeactivateUserHandler());
    queryBus.register(GetUsersQuery.name, new GetUsersHandler());
    queryBus.register(GetUserDetailsQuery.name, new GetUserDetailsHandler());

    // Orders
    commandBus.register(CreateOrderCommand.name, new CreateOrderHandler());
    commandBus.register(UpdateOrderStatusCommand.name, new UpdateOrderStatusHandler());
    queryBus.register(GetOrdersQuery.name, new GetOrdersHandler());

    // Payments
    commandBus.register(RegisterPaymentCommand.name, new RegisterPaymentHandler());
    commandBus.register(CreatePaymentCommand.name, new CreatePaymentHandler());
    queryBus.register(GetPaymentsQuery.name, new GetPaymentsHandler());

    // Cash
    commandBus.register(CreateCashMovementCommand.name, new CreateCashMovementHandler());
    queryBus.register(GetCashboxQuery.name, new GetCashboxHandler());

    // Tracking
    commandBus.register(GenerateTrackingLinkCommand.name, new CreateTrackingLinkHandler());
    queryBus.register(GetTrackingInfoQuery.name, new GetTrackingInfoHandler());

    console.log('CQRS Handlers Registered');
}
