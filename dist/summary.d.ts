import { Data } from './schema/metadata';
export declare class Summary {
    data: Data[];
    newData: Data;
    /**
     * Summary constructor
     * @param data - Array holding all results from all the testing farm jobs
     * @param newData - The latest result from the current testing farm job
     */
    constructor(data: Data[], newData: Data);
    updateData(data: Data): void;
    refreshData(data: Data[]): void;
    getTableHeader(): {
        data: string;
        header: boolean;
    }[];
    getStatusIcon(status: string, outcome: string | undefined, infraError: boolean): string;
    getTime(seconds: number): string;
    getTableRow(data: Data): string[];
    getTableSummary(): string;
    setJobSummary(): Promise<void>;
    static isResultPresent(data: Data[], name: string): {
        presence: boolean;
        index?: number;
    };
}
