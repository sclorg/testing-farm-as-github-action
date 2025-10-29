import { type Whoami } from './schema/testing-farm-api';
export declare function composeStatusDescription(infraError: boolean, tfSummary: string): string;
export declare function getSummary(result: unknown): string;
/**
 * Call the Testing Farm whoami endpoint to get token information
 * @param apiUrl - Testing Farm API URL
 * @param apiKey - Testing Farm API key
 * @returns Whoami response containing token information including ranch (scope)
 */
export declare function getWhoami(apiUrl: string, apiKey: string): Promise<Whoami | null>;
