export const geminiUsage = {
    requests: 0,
    limit: 20 // Tracking typical free tier limit constraints encountered in previous errors
};

export function incrementGeminiUsage() {
    geminiUsage.requests++;
}

export function getGeminiUsage() {
    return {
        requests: geminiUsage.requests,
        limit: geminiUsage.limit,
        isNearingLimit: geminiUsage.requests >= (geminiUsage.limit * 0.8)
    };
}
