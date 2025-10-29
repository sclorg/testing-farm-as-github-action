import axios from 'axios';
import { z } from 'zod';
import { whoamiSchema } from './schema/testing-farm-api';
export function composeStatusDescription(infraError, tfSummary) {
    let description = infraError
        ? 'Build failed - Infra problems'
        : 'Build finished';
    return description + tfSummary;
}
export function getSummary(result) {
    const parsedResult = z
        .object({
        summary: z.string().min(1),
    })
        .safeParse(result);
    return parsedResult.success ? ` - ${parsedResult.data.summary}` : '';
}
/**
 * Call the Testing Farm whoami endpoint to get token information
 * @param apiUrl - Testing Farm API URL
 * @param apiKey - Testing Farm API key
 * @returns Whoami response containing token information including ranch (scope)
 */
export async function getWhoami(apiUrl, apiKey) {
    try {
        // Ensure the URL ends with a slash before appending whoami
        const baseUrl = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
        const url = new URL('whoami', baseUrl);
        const response = await axios.get(url.toString(), {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
        });
        return whoamiSchema.parse(response.data);
    }
    catch (error) {
        // Return null if whoami call fails to maintain backward compatibility
        return null;
    }
}
//# sourceMappingURL=util.js.map