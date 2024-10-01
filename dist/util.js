import { z } from 'zod';
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
//# sourceMappingURL=util.js.map