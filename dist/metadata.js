import { getInput } from '@actions/core';
import MetadataController from 'issue-metadata';
import { commentIdKey, issueMetadataObjectSchema, } from './schema/metadata';
export class Metadata {
    constructor(issueNumber, controller, context, metadata) {
        this.issueNumber = issueNumber;
        this.controller = controller;
        this.context = context;
        this.data = [];
        this.lock = 'false';
        if (!metadata) {
            this.commentID = undefined;
            return;
        }
        this.commentID = metadata[commentIdKey];
        this.data = metadata.data;
        this.lock = metadata.lock;
    }
    async setMetadata(data, lock = 'false') {
        if (this.commentID === undefined)
            return;
        this.data = data;
        this.lock = lock;
        await this.controller.setMetadata(this.issueNumber, {
            [commentIdKey]: this.commentID,
            lock,
            data: this.data,
        });
    }
    async refresh() {
        const parsedMetadata = issueMetadataObjectSchema.safeParse(await this.controller.getMetadata(this.issueNumber));
        const metadata = parsedMetadata.success
            ? parsedMetadata.data
            : { data: [], [commentIdKey]: undefined, lock: 'false' };
        this.commentID = metadata[commentIdKey];
        this.data = metadata.data;
        this.lock = metadata.lock;
    }
    static async getMetadata(issueNumber, context) {
        const controller = new MetadataController(Metadata.metadataKey, Object.assign(Object.assign({}, context.repo), { headers: {
                authorization: `Bearer ${getInput('github_token', { required: true })}`,
            } }));
        const metadataParsed = issueMetadataObjectSchema.safeParse(await controller.getMetadata(issueNumber));
        return new this(issueNumber, controller, context, metadataParsed.success ? metadataParsed.data : undefined);
    }
}
Metadata.metadataKey = 'testing-farm';
//# sourceMappingURL=metadata.js.map