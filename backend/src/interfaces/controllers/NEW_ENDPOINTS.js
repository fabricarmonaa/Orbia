// Nueva sección al final de adminController.js antes de resolveTenant

// ============ CLIENT MANAGEMENT ENDPOINTS ============

updateUser: async context => {
    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
    const tenant_id = await resolveTenant(context);
    const user_id = context.params.id;
    const payload = updateUserSchema.parse(context.body || {});

    const command = new UpdateUserCommand({ tenant_id, user_id, payload });
    const result = await commandBus.dispatch(command);

    context.res.writeHead(200, { 'Content-Type': 'application/json' });
    context.res.end(JSON.stringify(result));
},

    deactivateUser: async context => {
        await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
        const tenant_id = await resolveTenant(context);
        const user_id = context.params.id;

        const command = new DeactivateUserCommand({ tenant_id, user_id });
        const result = await commandBus.dispatch(command);

        context.res.writeHead(200, { 'Content-Type': 'application/json' });
        context.res.end(JSON.stringify(result));
    },

        getUserDetails: async context => {
            await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
            const tenant_id = await resolveTenant(context);
            const user_id = context.params.id;

            const query = new GetUserDetailsQuery({ tenant_id, user_id });
            const result = await queryBus.execute(query);

            context.res.writeHead(200, { 'Content-Type': 'application/json' });
            context.res.end(JSON.stringify(result));
        },

            // ============ PAYMENT MANAGEMENT ENDPOINTS ============

            registerPayment: async context => {
                await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
                const tenant_id = await resolveTenant(context);
                const payload = z.object({
                    user_id: z.string(),
                    amount: z.number(),
                    method_code: z.string(),
                    order_ids: z.array(z.string()).optional(),
                    note: z.string().optional()
                }).parse(context.body || {});

                const command = new RegisterPaymentCommand({ tenant_id, ...payload });
                const result = await commandBus.dispatch(command);

                context.res.writeHead(201, { 'Content-Type': 'application/json' });
                context.res.end(JSON.stringify(result));
            },

                // ============ CASH MANAGEMENT ENDPOINTS ============

                createCashMovement: async context => {
                    await requireAuth(context, ['ADMIN', 'SUPER_ADMIN']);
                    const tenant_id = await resolveTenant(context);
                    const payload = z.object({
                        type: z.enum(['INCOME', 'EXPENSE']),
                        category: z.string(),
                        method_code: z.string(),
                        amount: z.number(),
                        user_id: z.string().optional(),
                        note: z.string().optional()
                    }).parse(context.body || {});

                    const command = new CreateCashMovementCommand({ tenant_id, ...payload });
                    const result = await commandBus.dispatch(command);

                    context.res.writeHead(201, { 'Content-Type': 'application/json' });
                    context.res.end(JSON.stringify(result));
                },
