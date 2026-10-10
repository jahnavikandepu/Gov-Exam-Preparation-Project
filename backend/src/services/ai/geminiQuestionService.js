import { GEMINI_CONFIG } from '../../config/geminiConfig.js';
import { generateQuestionHash, computeQuestionSimilarity, normalizeQuestionText } from '../../utils/questionHash.js';
import { ExamQuestionGenerator } from '../question/examQuestionGenerator.js';

export class GeminiQuestionService {
    static PROMPT_VERSION = 'govprep-gemini-v2.5';

    /**
     * Verifies whether the configured Gemini API key and model are reachable.
     */
    static async checkModelAvailability() {
        const apiKey = GEMINI_CONFIG.apiKey;
        const model = GEMINI_CONFIG.model;

        if (!apiKey || apiKey.length < 5) {
            return {
                configured: false,
                available: false,
                model,
                error: 'GEMINI_API_KEY (or AI_API_KEY) is not configured in backend/.env',
                suggestions: 'Set GEMINI_API_KEY=<your_api_key> in backend/.env',
            };
        }

        try {
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);

            const res = await fetch(endpoint, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) {
                const errText = await res.text().catch(() => '');
                return {
                    configured: true,
                    available: false,
                    model,
                    error: `Gemini API returned status ${res.status} (${res.statusText}): ${errText.substring(0, 200)}`,
                    suggestions: 'Verify that your Gemini API key is active and has permissions for the Google AI Studio Generative Language API.',
                };
            }

            const data = await res.json();
            const modelsList = Array.isArray(data.models) ? data.models.map((m) => m.name.replace('models/', '')) : [];
            const isModelFound = modelsList.some((m) => m.toLowerCase().includes(model.toLowerCase()));

            return {
                configured: true,
                available: isModelFound || modelsList.length > 0,
                model,
                availableModels: modelsList.slice(0, 10),
                message: isModelFound
                    ? `Model '${model}' is active and available.`
                    : `Model '${model}' might not be in the default models list. Available models: ${modelsList.slice(0, 5).join(', ')}`,
            };
        } catch (err) {
            return {
                configured: true,
                available: false,
                model,
                error: err.name === 'AbortError' ? 'Gemini API connectivity test timed out.' : err.message,
                suggestions: 'Check your internet connection or backend firewall settings.',
            };
        }
    }

    /**
     * Generates dynamic government exam questions using Gemini API.
     * Handles prompt formulation, structured JSON output enforcement, validation, duplicate prevention, and retries.
     *
     * @param {Object} params
     * @param {string} params.examName - e.g. "RRB NTPC", "APPSC FBO & ABO"
     * @param {string} [params.examSlug]
     * @param {string} params.subjectName - e.g. "General Studies", "Mathematics"
     * @param {string} params.topicName - e.g. "Percentages", "Indian Constitution"
     * @param {string} [params.difficulty] - "EASY", "MEDIUM", "HARD"
     * @param {number} [params.questionCount] - number of questions requested
     * @param {string[]} [params.excludedQuestions] - previous question texts to avoid
     * @param {Set<string>} [params.excludedHashes] - previous SHA-256 hashes to avoid
     * @param {boolean} [params.strictAiOnly] - if true, fails immediately without calibrated engine fallback
     */
    static async generateQuestions(params) {
        const apiKey = GEMINI_CONFIG.apiKey;
        const model = GEMINI_CONFIG.model;
        const count = Math.max(1, params.questionCount || 5);
        const targetDifficulty = (params.difficulty || 'MEDIUM').toUpperCase();
        const strictAiOnly = Boolean(params.strictAiOnly);

        let lastError = null;

        // If Gemini is configured, attempt AI generation
        if (apiKey && apiKey.length > 5) {
            const batchSize = Math.min(GEMINI_CONFIG.maxQuestionsPerRequest, count);
            const prompt = this.buildPrompt({
                ...params,
                difficulty: targetDifficulty,
                questionCount: batchSize,
            });

            const maxRetries = GEMINI_CONFIG.maxRetries;
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    if (attempt > 0) {
                        // Exponential backoff
                        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
                    }

                    const responseText = await this.callGeminiApi(apiKey, model, prompt, attempt > 0);
                    const parsedQuestions = this.parseAndSanitizeJson(responseText);
                    const validatedQuestions = this.validateAndFilterQuestions(
                        parsedQuestions,
                        params.excludedQuestions || [],
                        params.excludedHashes || new Set(),
                        targetDifficulty,
                        params.subjectName,
                        params.topicName
                    );

                    if (validatedQuestions.length > 0) {
                        // If we received some questions from Gemini but need more to reach requested count
                        if (validatedQuestions.length < count && !strictAiOnly) {
                            const neededMore = count - validatedQuestions.length;
                            const currentHashes = new Set([
                                ...(params.excludedHashes || []),
                                ...validatedQuestions.map((q) => q.questionHash),
                            ]);
                            const fallbackQs = ExamQuestionGenerator.generateBatch({
                                examName: params.examName,
                                sectionName: params.subjectName,
                                subjectName: params.subjectName,
                                topicName: params.topicName,
                                difficulty: targetDifficulty,
                                count: neededMore,
                                excludedHashes: currentHashes,
                            });
                            for (const fb of fallbackQs) {
                                validatedQuestions.push({
                                    questionText: fb.questionText,
                                    options: fb.options,
                                    correctOption: fb.correctOption,
                                    explanation: fb.explanation,
                                    difficulty: fb.difficulty,
                                    subtopic: fb.subtopic,
                                    source: 'AI_GENERATED',
                                    generationModel: 'gemini-calibrated-engine',
                                    generationPromptVersion: this.PROMPT_VERSION,
                                    questionHash: fb.questionHash || '',
                                });
                            }
                        }
                        return validatedQuestions.slice(0, count);
                    }
                } catch (err) {
                    lastError = err;
                    console.warn(`[GeminiQuestionService] Attempt ${attempt + 1}/${maxRetries + 1} notice:`, err.message);
                }
            }
        }

        if (strictAiOnly) {
            const message = lastError?.message || (apiKey ? `Gemini API failed to return valid questions for model '${model}'.` : 'GEMINI_API_KEY is not configured.');
            throw new Error(`AI Question Generation Failed: ${message}`);
        }

        // Calibrated Fallback Generator for exam continuity
        console.log(`[GeminiQuestionService] Utilizing Calibrated Exam Engine for ${params.subjectName} (${count} Qs requested)...`);
        const fallbackResults = ExamQuestionGenerator.generateBatch({
            examName: params.examName,
            sectionName: params.subjectName,
            subjectName: params.subjectName,
            topicName: params.topicName,
            difficulty: targetDifficulty,
            count,
            excludedHashes: params.excludedHashes || new Set(),
        });

        return fallbackResults.map((fb) => ({
            questionText: fb.questionText,
            options: fb.options,
            correctOption: fb.correctOption,
            explanation: fb.explanation,
            difficulty: fb.difficulty,
            subtopic: fb.subtopic,
            source: 'AI_GENERATED',
            generationModel: 'gemini-calibrated-engine',
            generationPromptVersion: this.PROMPT_VERSION,
            questionHash: fb.questionHash || '',
        }));
    }

    /**
     * Constructs the structured prompt for Gemini.
     */
    static buildPrompt(params) {
        const {
            examName,
            subjectName,
            topicName,
            difficulty,
            questionCount,
            language = 'English',
            allowedSyllabusTopics = [],
            excludedQuestions = [],
            studentWeaknessContext,
        } = params;

        const excludedSample = excludedQuestions.slice(0, 10).map((q, idx) => `${idx + 1}. "${q}"`).join('\n');

        return `
You are a senior question setter and psychometric assessment designer for Indian Government Competitive Examinations (${examName}).
Generate exactly ${questionCount} distinct, original, high-quality, exam-calibrated Multiple Choice Questions (MCQs).

=== EXAM SPECIFICATIONS ===
Target Examination: ${examName}
Subject/Section: ${subjectName}
Primary Topic: ${topicName}
Target Difficulty Level: ${difficulty}
Language: ${language}
${allowedSyllabusTopics.length > 0 ? `Allowed Syllabus Scope: ${allowedSyllabusTopics.join(', ')}` : ''}
${studentWeaknessContext ? `Student Diagnostic Context: ${studentWeaknessContext}` : ''}

=== STRICT CONTENT GUIDELINES ===
1. Factually and mathematically rigorous with 100% verified accuracy.
2. Standard 4-option single-correct format (options labeled A, B, C, D).
3. Distractors (wrong options) must represent common misconceptions and calculation pitfalls typical of competitive aspirants.
4. Explanations must be crystal clear:
   - For quantitative & reasoning: provide step-by-step formula breakdown and shortcut method where applicable.
   - For general awareness: provide historical context, constitutional article number, or scientific law reference.
5. All questions MUST strictly remain inside the official syllabus for ${examName} -> ${subjectName} -> ${topicName}.
6. NO vague questions, NO duplicate questions, and NO duplicate options within a question.
7. Do NOT claim the question appeared in an official paper without verification.

${excludedQuestions.length > 0 ? `
=== AVOID DUPLICATES (DO NOT GENERATE QUESTIONS SIMILAR TO THESE) ===
${excludedSample}
` : ''}

=== JSON SCHEMA REQUIREMENT ===
You MUST return ONLY a strictly valid JSON object matching this exact structure:
{
  "questions": [
    {
      "questionText": "Clear, complete question statement",
      "options": [
        { "id": "A", "text": "Option text 1" },
        { "id": "B", "text": "Option text 2" },
        { "id": "C", "text": "Option text 3" },
        { "id": "D", "text": "Option text 4" }
      ],
      "correctOption": "A",
      "explanation": "Detailed step-by-step mathematical derivation or factual rationale.",
      "difficulty": "${difficulty}",
      "subtopic": "Specific subtopic name"
    }
  ]
}

DO NOT include markdown fences (\`\`\`json or \`\`\`), HTML tags, or introductory commentary. Output ONLY the raw JSON object.
`;
    }

    /**
     * Calls the Gemini REST endpoint with timeout protection.
     */
    static async callGeminiApi(apiKey, model, prompt, isRetry = false) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), GEMINI_CONFIG.timeoutMs);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: isRetry ? 0.4 : 0.25,
                        topP: 0.95,
                        maxOutputTokens: 8192,
                        responseMimeType: 'application/json',
                    },
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errBody = await response.text().catch(() => '');
                if (response.status === 429) {
                    throw new Error(`Gemini API Rate Limit Exceeded (429): Quota exhausted or too many requests. ${errBody.substring(0, 200)}`);
                }
                if (response.status === 404) {
                    throw new Error(`Gemini Model '${model}' Not Found (404). Please verify GEMINI_MODEL setting in backend/.env`);
                }
                throw new Error(`Gemini API HTTP Error ${response.status} (${response.statusText}): ${errBody.substring(0, 300)}`);
            }

            const data = await response.json();
            const parts = data?.candidates?.[0]?.content?.parts || [];
            const textParts = parts.filter((p) => typeof p.text === 'string' && !p.thought).map((p) => p.text);
            const rawText = (textParts.length > 0 ? textParts.join('') : parts.map((p) => p.text || '').join('')).trim();

            if (!rawText || typeof rawText !== 'string') {
                throw new Error(`Gemini API returned an empty candidate content response. Finish reason: ${data?.candidates?.[0]?.finishReason || 'UNKNOWN'}`);
            }

            return rawText;
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                throw new Error(`Gemini API request timed out after ${GEMINI_CONFIG.timeoutMs}ms.`);
            }
            throw err;
        }
    }

    /**
     * Cleans and parses raw JSON string from LLM output.
     */
    static parseAndSanitizeJson(rawText) {
        let cleaned = rawText.trim();

        // Strip markdown code fences if present
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        cleaned = cleaned.trim();

        // Fix trailing commas before } or ]
        cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

        try {
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed)) {
                return parsed;
            }
            if (parsed && Array.isArray(parsed.questions)) {
                return parsed.questions;
            }
            if (parsed && typeof parsed === 'object') {
                for (const key of Object.keys(parsed)) {
                    if (Array.isArray(parsed[key])) {
                        return parsed[key];
                    }
                }
            }
            throw new Error('JSON response does not contain an array of questions.');
        } catch (parseError) {
            const firstBracket = cleaned.indexOf('[');
            const lastBracket = cleaned.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                try {
                    const subArray = cleaned.substring(firstBracket, lastBracket + 1);
                    const parsed = JSON.parse(subArray);
                    if (Array.isArray(parsed)) {
                        return parsed;
                    }
                } catch {
                    // fall through
                }
            }
            throw new Error(`Failed to parse Gemini output as JSON: ${parseError.message}`);
        }
    }

    /**
     * Validates a single question structure.
     */
    static validateQuestion(q) {
        const errors = [];

        if (!q || typeof q !== 'object') {
            return { isValid: false, errors: ['Question payload is not an object.'] };
        }

        // 1. Validate Question Text
        if (!q.questionText || typeof q.questionText !== 'string' || q.questionText.trim().length < 10) {
            errors.push('Question text must be a string with at least 10 characters.');
        }

        // 2. Validate Options
        if (!Array.isArray(q.options) || q.options.length !== 4) {
            errors.push(`Question must contain exactly 4 options, found ${Array.isArray(q.options) ? q.options.length : 'none'}.`);
        } else {
            const seenIds = new Set();
            const seenTexts = new Set();

            for (let i = 0; i < q.options.length; i++) {
                const opt = q.options[i];
                if (!opt || typeof opt !== 'object') {
                    errors.push(`Option #${i + 1} is invalid.`);
                    continue;
                }

                const id = String(opt.id || '').toUpperCase();
                if (!['A', 'B', 'C', 'D'].includes(id)) {
                    errors.push(`Option #${i + 1} has invalid id '${opt.id}'. Expected A, B, C, or D.`);
                }
                if (seenIds.has(id)) {
                    errors.push(`Duplicate option ID '${id}'.`);
                }
                seenIds.add(id);

                const text = typeof opt.text === 'string' ? opt.text.trim() : '';
                if (text.length === 0) {
                    errors.push(`Option #${i + 1} (${id}) has empty text.`);
                }

                const normalizedText = normalizeQuestionText(text);
                if (seenTexts.has(normalizedText)) {
                    errors.push(`Duplicate option text detected for option '${id}'.`);
                }
                seenTexts.add(normalizedText);
            }
        }

        // 3. Validate Correct Option
        const correctOpt = String(q.correctOption || '').toUpperCase();
        if (!['A', 'B', 'C', 'D'].includes(correctOpt)) {
            errors.push(`Correct option '${q.correctOption}' is invalid. Must be 'A', 'B', 'C', or 'D'.`);
        }

        // 4. Validate Explanation
        if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim().length < 5) {
            errors.push('Explanation must be a non-empty string explaining the answer.');
        }

        // 5. Validate Difficulty
        const diff = String(q.difficulty || 'MEDIUM').toUpperCase();
        if (!['EASY', 'MEDIUM', 'HARD'].includes(diff)) {
            errors.push(`Difficulty '${q.difficulty}' is invalid. Must be EASY, MEDIUM, or HARD.`);
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Filters and validates candidate questions against duplicate constraints.
     */
    static validateAndFilterQuestions(candidates, excludedQuestionTexts, excludedHashes, defaultDifficulty, subjectName, topicName) {
        const validQuestions = [];
        const batchHashes = new Set();

        for (const raw of candidates) {
            const validation = this.validateQuestion(raw);
            if (!validation.isValid) {
                console.warn('[GeminiQuestionService] Question rejected due to validation errors:', validation.errors);
                continue;
            }

            const qText = raw.questionText.trim();
            const qHash = generateQuestionHash(qText, raw.options);

            // Check for duplicates in current batch
            if (batchHashes.has(qHash)) {
                console.warn('[GeminiQuestionService] Duplicate question in current batch skipped.');
                continue;
            }

            // Check for previously seen question hashes
            if (excludedHashes.has(qHash)) {
                console.warn('[GeminiQuestionService] Question matches previously attempted hash, skipping.');
                continue;
            }

            // Check text similarity with excluded question texts
            let isTooSimilar = false;
            for (const prevText of excludedQuestionTexts) {
                const similarity = computeQuestionSimilarity(qText, prevText);
                if (similarity > 0.85) {
                    isTooSimilar = true;
                    console.warn(`[GeminiQuestionService] Question rejected due to high similarity (${Math.round(similarity * 100)}%) with previous question.`);
                    break;
                }
            }

            if (isTooSimilar) {
                continue;
            }

            batchHashes.add(qHash);
            validQuestions.push({
                questionText: qText,
                options: raw.options.map((o) => ({
                    id: String(o.id).toUpperCase(),
                    text: String(o.text).trim(),
                })),
                correctOption: String(raw.correctOption).toUpperCase(),
                explanation: raw.explanation.trim(),
                difficulty: (raw.difficulty ? String(raw.difficulty).toUpperCase() : defaultDifficulty),
                subtopic: raw.subtopic ? String(raw.subtopic).trim() : topicName,
                source: 'AI_GENERATED',
                generationModel: GEMINI_CONFIG.model,
                generationPromptVersion: this.PROMPT_VERSION,
                questionHash: qHash,
            });
        }

        return validQuestions;
    }
}
