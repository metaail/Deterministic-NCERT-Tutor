export function getGeminiUsage() { 
  return { isNearingLimit: false, limit: 1500, requests: 0, totalRequests: 0, totalTokens: 0, limitResetDate: new Date() }; 
}
export async function incrementGeminiUsage() {}
