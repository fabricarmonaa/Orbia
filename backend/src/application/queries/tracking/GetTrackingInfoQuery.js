import { Query } from '../../../infrastructure/cqrs/Base.js';

export class GetTrackingInfoQuery extends Query {
    constructor(payload) {
        super(payload);
    }
}
