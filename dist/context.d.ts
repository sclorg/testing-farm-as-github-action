import { context } from '@actions/github';
export declare class CustomContext {
    readonly repo: typeof context.repo;
    readonly issue: Pick<typeof context.issue, 'number'>;
    readonly sha: string | undefined;
    constructor();
    isRepoAvailable(): boolean;
    isIssueNumberAvailable(): boolean;
    isShaAvailable(): boolean;
    isInputAvailable(input: any): boolean;
}
