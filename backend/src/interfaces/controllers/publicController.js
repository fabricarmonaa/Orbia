import { queryBus } from '../../infrastructure/cqrs/QueryBus.js';
import { GetTrackingInfoQuery } from '../../application/queries/tracking/GetTrackingInfoQuery.js';

export const publicController = {
    async getTracking(context) {
        const { token } = context.params;
        const result = await queryBus.execute(new GetTrackingInfoQuery({ token }));
        context.res.setHeader('Content-Type', 'application/json');
        context.res.statusCode = 200;
        context.res.end(JSON.stringify(result));
    }
};
