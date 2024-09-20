import MetadataController from 'issue-metadata';
import { CustomContext } from './context';
import { Data, IssueMetadataObject, commentIdKey } from './schema/metadata';
export declare class Metadata {
    readonly issueNumber: number;
    readonly controller: MetadataController;
    readonly context: CustomContext;
    static readonly metadataKey = "testing-farm";
    commentID: IssueMetadataObject[typeof commentIdKey];
    data: Data[];
    lock: IssueMetadataObject['lock'];
    constructor(issueNumber: number, controller: MetadataController, context: CustomContext, metadata: IssueMetadataObject | undefined);
    setMetadata(data: Data[], lock?: IssueMetadataObject['lock']): Promise<void>;
    refresh(): Promise<void>;
    static getMetadata(issueNumber: number, context: CustomContext): Promise<Metadata>;
}
