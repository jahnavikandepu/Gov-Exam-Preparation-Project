import dotenv from 'dotenv';
dotenv.config();
export const getGeminiApiKey = () => {
    const key = process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';
    return key.trim();
};
export const getGeminiModel = () => {
    const model = process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-3.5-flash-lite';
    return model.trim();
};
export const isGeminiConfigured = () => {
    const key = getGeminiApiKey();
    return Boolean(key && key.length > 5);
};
export const GEMINI_CONFIG = {
    get apiKey() {
        return getGeminiApiKey();
    },
    get model() {
        return getGeminiModel();
    },
    get isConfigured() {
        return isGeminiConfigured();
    },
    maxQuestionsPerRequest: parseInt(process.env.GEMINI_MAX_QUESTIONS_PER_BATCH || '10', 10),
    timeoutMs: parseInt(process.env.GEMINI_TIMEOUT_MS || '12000', 10),
    maxRetries: parseInt(process.env.GEMINI_MAX_RETRIES || '2', 10),
};
