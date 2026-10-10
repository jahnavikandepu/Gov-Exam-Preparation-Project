import crypto from 'crypto';
/**
 * Normalizes question text by lowercasing, stripping special punctuation, and removing excess whitespace.
 */
export function normalizeQuestionText(text) {
    if (!text)
        return '';
    return text
        .toLowerCase()
        .replace(/[^\w\s\d]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
/**
 * Generates a deterministic fingerprint hash for duplicate question detection.
 */
export function generateQuestionHash(questionText, options) {
    const normText = normalizeQuestionText(questionText);
    let payload = normText;
    if (Array.isArray(options) && options.length > 0) {
        const sortedOptionTexts = options
            .map((opt) => (typeof opt === 'string' ? opt : opt.text || ''))
            .map((t) => normalizeQuestionText(t))
            .sort()
            .join('|');
        payload += `::${sortedOptionTexts}`;
    }
    return crypto.createHash('sha256').update(payload).digest('hex');
}
/**
 * Checks simple text similarity ratio (0 to 1) based on word-set Jaccard index.
 */
export function computeQuestionSimilarity(textA, textB) {
    const wordsA = new Set(normalizeQuestionText(textA).split(' ').filter(Boolean));
    const wordsB = new Set(normalizeQuestionText(textB).split(' ').filter(Boolean));
    if (wordsA.size === 0 || wordsB.size === 0)
        return 0;
    let intersectionCount = 0;
    for (const word of wordsA) {
        if (wordsB.has(word)) {
            intersectionCount++;
        }
    }
    const unionCount = new Set([...wordsA, ...wordsB]).size;
    return unionCount === 0 ? 0 : intersectionCount / unionCount;
}
