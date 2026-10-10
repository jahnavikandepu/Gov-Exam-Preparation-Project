import { prisma } from '../../config/db.js';
import { GEMINI_CONFIG } from '../../config/geminiConfig.js';
import { GeminiQuestionService } from './geminiQuestionService.js';
import { generateQuestionHash } from '../../utils/questionHash.js';
export class AIService {
    /**
     * Generates or updates AI performance analysis for a student attempt.
     * Feeds official backend metrics and historical trends into Gemini.
     * If Gemini fails or is offline, falls back gracefully to a robust deterministic engine.
     */
    static async analyzeStudentPerformance(userId, attemptId) {
        // 1. Fetch user context & target exam
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, targetExam: true },
        });
        const studentName = user?.name || 'Aspirant';
        const targetExam = user?.targetExam || 'Competitive Exam';
        // 2. Fetch specific attempt or latest attempt
        let attempt = null;
        if (attemptId) {
            attempt = await prisma.testAttempt.findUnique({
                where: { id: attemptId },
                include: {
                    test: { include: { exam: true, stage: true } },
                    answers: {
                        include: {
                            question: {
                                include: { topic: true, subject: true },
                            },
                        },
                    },
                },
            });
        }
        else {
            attempt = await prisma.testAttempt.findFirst({
                where: { userId, isCompleted: true },
                orderBy: { createdAt: 'desc' },
                include: {
                    test: { include: { exam: true, stage: true } },
                    answers: {
                        include: {
                            question: {
                                include: { topic: true, subject: true },
                            },
                        },
                    },
                },
            });
        }
        // 3. Fetch all previous attempts to calculate true historical trend
        const allAttempts = await prisma.testAttempt.findMany({
            where: { userId, isCompleted: true },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                score: true,
                totalMarks: true,
                accuracy: true,
                createdAt: true,
                subjectBreakdown: true,
            },
        });
        if (!attempt && allAttempts.length === 0) {
            return {
                id: null,
                attemptId: null,
                hasAttempts: false,
                testTitle: 'No Tests Attempted',
                attemptNumber: 0,
                score: 0,
                totalMarks: 0,
                accuracy: 0,
                timeSpentSeconds: 0,
                overallAssessment: {
                    level: 'INITIAL_STATE',
                    summary: 'No mock tests or exams completed yet. Complete your first mock test or topic test to unlock AI diagnostic evaluation.',
                },
                strengths: [],
                weaknesses: [],
                trends: [],
                recommendations: [],
                nextPractice: {
                    subjects: [],
                    topics: [],
                    difficulty: ['EASY', 'MEDIUM'],
                    questionCount: 15,
                    reason: 'Complete your first examination or topic test to establish your baseline diagnostic performance.',
                },
                generatedAt: new Date().toISOString(),
                source: 'INITIAL_STATE',
            };
        }
        const currentAttemptIndex = attempt ? allAttempts.findIndex((a) => a.id === attempt.id) : -1;
        const attemptNumber = currentAttemptIndex >= 0 ? currentAttemptIndex + 1 : Math.max(1, allAttempts.length);
        const previousAttempts = currentAttemptIndex > 0 ? allAttempts.slice(0, currentAttemptIndex) : [];
        // 4. Fetch student topic performances from DB
        const performances = await prisma.studentTopicPerformance.findMany({
            where: { userId },
            include: { topic: { include: { subject: true } } },
            orderBy: { weaknessScore: 'desc' },
        });
        // 5. Structure detailed attempt metrics
        const attemptScore = attempt?.score ?? 0;
        const attemptTotalMarks = attempt?.totalMarks ?? 100;
        const attemptAccuracy = attempt?.accuracy ?? (attempt?.attemptedQuestions ? Math.round((attempt.correctAnswers / attempt.attemptedQuestions) * 100) : 0);
        const testTitle = attempt?.test?.title || 'Mock Examination';
        // Subject breakdown
        const subjectStats = {};
        const topicStats = {};
        const difficultyStats = {
            EASY: { total: 0, correct: 0, accuracy: 0 },
            MEDIUM: { total: 0, correct: 0, accuracy: 0 },
            HARD: { total: 0, correct: 0, accuracy: 0 },
        };
        if (attempt && attempt.answers && attempt.answers.length > 0) {
            for (const ans of attempt.answers) {
                const q = ans.question;
                if (!q)
                    continue;
                const subName = q.subject?.name || 'General';
                const topName = q.topic?.name || 'General Topic';
                const diff = (q.difficulty || 'MEDIUM').toUpperCase();
                if (!subjectStats[subName]) {
                    subjectStats[subName] = { total: 0, correct: 0, wrong: 0, skipped: 0, accuracy: 0 };
                }
                subjectStats[subName].total += 1;
                if (!topicStats[topName]) {
                    topicStats[topName] = { subject: subName, total: 0, correct: 0, wrong: 0, skipped: 0, accuracy: 0 };
                }
                topicStats[topName].total += 1;
                if (!difficultyStats[diff]) {
                    difficultyStats[diff] = { total: 0, correct: 0, accuracy: 0 };
                }
                difficultyStats[diff].total += 1;
                if (ans.status === 'ANSWERED' || ans.status === 'ANSWERED_AND_MARKED') {
                    if (ans.isCorrect) {
                        subjectStats[subName].correct += 1;
                        topicStats[topName].correct += 1;
                        difficultyStats[diff].correct += 1;
                    }
                    else {
                        subjectStats[subName].wrong += 1;
                        topicStats[topName].wrong += 1;
                    }
                }
                else {
                    subjectStats[subName].skipped += 1;
                    topicStats[topName].skipped += 1;
                }
            }
            for (const s of Object.values(subjectStats)) {
                const attempted = s.correct + s.wrong;
                s.accuracy = attempted > 0 ? Math.round((s.correct / attempted) * 100) : 0;
            }
            for (const t of Object.values(topicStats)) {
                const attempted = t.correct + t.wrong;
                t.accuracy = attempted > 0 ? Math.round((t.correct / attempted) * 100) : 0;
            }
            for (const d of Object.values(difficultyStats)) {
                d.accuracy = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
            }
        }
        const topicSummary = performances.map((p) => ({
            topic: p.topic.name,
            subject: p.topic.subject.name,
            accuracy: p.accuracy,
            recentAccuracy: p.recentAccuracy,
            attempts: p.questionsAttempted,
            avgTimeSeconds: p.avgTimeSeconds,
            trend: p.trend,
            weaknessScore: p.weaknessScore,
        }));
        const structuredPayload = {
            studentName,
            targetExam,
            testTitle,
            attemptNumber,
            score: attemptScore,
            totalMarks: attemptTotalMarks,
            accuracy: attemptAccuracy,
            totalQuestions: attempt?.totalQuestions || 0,
            correct: attempt?.correctAnswers || 0,
            incorrect: attempt?.incorrectAnswers || 0,
            skipped: attempt?.skippedQuestions || 0,
            durationSeconds: attempt?.durationSeconds || 0,
            subjectBreakdown: subjectStats,
            topicBreakdown: topicStats,
            difficultyBreakdown: difficultyStats,
            historicalAttempts: previousAttempts.map((p, idx) => ({
                attemptNumber: idx + 1,
                score: p.score,
                totalMarks: p.totalMarks,
                accuracy: p.accuracy,
                date: p.createdAt.toISOString().split('T')[0],
            })),
            allTopicPerformance: topicSummary.slice(0, 15),
        };
        const apiKey = GEMINI_CONFIG.apiKey;
        const model = GEMINI_CONFIG.model || 'gemini-1.5-flash';
        // 6. Call Gemini if configured
        if (apiKey && apiKey.trim() !== '') {
            try {
                const prompt = `
You are an expert government exam diagnostic mentor evaluating a student's official test performance in ${targetExam}.
Analyze this strictly verified backend performance data:

${JSON.stringify(structuredPayload, null, 2)}

Requirements:
1. Overall Assessment: Assign level ("EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT" | "CRITICAL_ATTENTION") and write a clear, motivating 2-sentence diagnostic summary.
2. Strengths: Identify 2-4 strongest topics with topic name, subject, exact accuracy, and why it is strong.
3. Weaknesses: Identify weak topics (accuracy < 60% or high error rate) with priority ("HIGH" | "MEDIUM" | "LOW"), exact accuracy %, clear diagnostic reason, and specific recommendation.
4. Trends: Compare current attempt with historical attempts if available. If no prior attempts exist, set trend to "INSUFFICIENT_DATA" with message "First attempt recorded. Historical trends will unlock with subsequent mock tests."
5. Recommendations: 3-5 concrete high-impact study/revision actions.
6. NextPractice: Recommend 1-3 subjects, 2-4 target topics, recommended difficulty levels, question count (15-25), and clear rationale.

Respond strictly in valid JSON matching this schema:
{
  "overallAssessment": {
    "level": "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT" | "CRITICAL_ATTENTION",
    "summary": "String"
  },
  "strengths": [
    {
      "subject": "String",
      "topic": "String",
      "accuracy": 85,
      "reason": "String"
    }
  ],
  "weaknesses": [
    {
      "subject": "String",
      "topic": "String",
      "accuracy": 37.5,
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "reason": "String",
      "recommendation": "String"
    }
  ],
  "trends": [
    {
      "subject": "String",
      "trend": "IMPROVING" | "DECLINING" | "STABLE" | "INSUFFICIENT_DATA",
      "description": "String"
    }
  ],
  "recommendations": [
    {
      "topic": "String",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "action": "String"
    }
  ],
  "nextPractice": {
    "subjects": ["String"],
    "topics": ["String"],
    "difficulty": ["EASY", "MEDIUM"],
    "questionCount": 20,
    "reason": "String"
  }
}
Do not include markdown codeblocks, prefix, or suffix. Output pure JSON only.
`;
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.2,
                            responseMimeType: 'application/json',
                        },
                    }),
                });
                if (response.ok) {
                    const data = await response.json();
                    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (rawText) {
                        const parsed = JSON.parse(rawText);
                        if (parsed.overallAssessment && parsed.strengths && parsed.weaknesses) {
                            const fullReport = {
                                attemptId: attempt?.id || null,
                                testTitle,
                                attemptNumber,
                                score: attemptScore,
                                totalMarks: attemptTotalMarks,
                                accuracy: attemptAccuracy,
                                timeSpentSeconds: attempt?.durationSeconds || 0,
                                overallAssessment: parsed.overallAssessment,
                                strengths: parsed.strengths || [],
                                weaknesses: parsed.weaknesses || [],
                                trends: parsed.trends || [],
                                recommendations: parsed.recommendations || [],
                                nextPractice: parsed.nextPractice || {
                                    subjects: ['Quantitative Aptitude'],
                                    topics: ['Percentages'],
                                    difficulty: ['MEDIUM'],
                                    questionCount: 15,
                                    reason: 'Targeted topic refinement',
                                },
                                generatedAt: new Date().toISOString(),
                                source: 'GEMINI',
                            };
                            await this.persistAnalysisReport(userId, attempt?.id, fullReport, rawText);
                            return fullReport;
                        }
                    }
                }
            }
            catch (geminiError) {
                console.warn('Gemini API call encountered an error. Falling back to deterministic analysis engine.', geminiError);
            }
        }
        // 7. Deterministic Analysis Engine (Guaranteed zero-crash fallback)
        const deterministicReport = this.generateDeterministicAnalysis(studentName, targetExam, testTitle, attemptNumber, attemptScore, attemptTotalMarks, attemptAccuracy, attempt?.durationSeconds || 0, subjectStats, topicStats, topicSummary, previousAttempts);
        await this.persistAnalysisReport(userId, attempt?.id, deterministicReport, JSON.stringify(deterministicReport));
        return deterministicReport;
    }
    /**
     * Retrieves the latest or specific attempt analysis report for a student.
     */
    static async getAnalysisReport(userId, attemptId) {
        let analysis = null;
        if (attemptId) {
            analysis = await prisma.aIAnalysis.findFirst({
                where: { userId, attemptId },
                include: { attempt: { include: { test: true } } },
                orderBy: { createdAt: 'desc' },
            });
        }
        else {
            analysis = await prisma.aIAnalysis.findFirst({
                where: { userId },
                include: { attempt: { include: { test: true } } },
                orderBy: { createdAt: 'desc' },
            });
        }
        if (analysis && analysis.rawAIResponse) {
            try {
                const parsed = JSON.parse(analysis.rawAIResponse);
                if (parsed.overallAssessment) {
                    return {
                        id: analysis.id,
                        ...parsed,
                        idFromDb: analysis.id,
                    };
                }
            }
            catch (err) {
                // Fall through to reconstruction
            }
        }
        if (analysis) {
            // Reconstruct from DB columns if raw response is standard format
            const weakTopics = JSON.parse(analysis.weakTopics || '[]');
            const priorityTopics = JSON.parse(analysis.priorityTopics || '[]');
            return {
                id: analysis.id,
                attemptId: analysis.attemptId,
                testTitle: analysis.attempt?.test?.title || 'Mock Examination',
                score: analysis.attempt?.score ?? 0,
                totalMarks: analysis.attempt?.totalMarks ?? 100,
                accuracy: analysis.attempt?.accuracy ?? 65,
                timeSpentSeconds: analysis.attempt?.durationSeconds || 0,
                overallAssessment: {
                    level: (analysis.attempt?.accuracy || 65) >= 75 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
                    summary: analysis.summary,
                },
                strengths: [
                    {
                        subject: 'Core Subject',
                        topic: 'Mastered Topics',
                        accuracy: 85,
                        reason: 'High accuracy maintained across previous drills.',
                    },
                ],
                weaknesses: weakTopics.map((t) => ({
                    subject: 'Target Area',
                    topic: t,
                    accuracy: 45,
                    priority: priorityTopics.includes(t) ? 'HIGH' : 'MEDIUM',
                    reason: 'Accuracy is currently below cutoff benchmarks.',
                    recommendation: `Revise foundational rules and practice targeted 15-question sets for ${t}.`,
                })),
                trends: [
                    {
                        subject: 'Overall Progress',
                        trend: 'IMPROVING',
                        description: 'Topic accuracy is trending upwards with consistent mock attempts.',
                    },
                ],
                recommendations: [
                    {
                        topic: priorityTopics[0] || 'Core Revision',
                        priority: 'HIGH',
                        action: analysis.practiceStrategy,
                    },
                ],
                nextPractice: {
                    subjects: ['Quantitative Aptitude'],
                    topics: priorityTopics.length > 0 ? priorityTopics : weakTopics.slice(0, 2),
                    difficulty: [analysis.recommendedDifficulty || 'MEDIUM'],
                    questionCount: analysis.recommendedQuestionCount || 15,
                    reason: analysis.reason,
                },
                generatedAt: analysis.createdAt.toISOString(),
                source: 'DETERMINISTIC_ENGINE',
            };
        }
        // If no analysis exists at all, run fresh evaluation
        return await this.analyzeStudentPerformance(userId, attemptId);
    }
    /**
     * Retrieves list of historical AI analysis reports for the student attempt switcher.
     */
    static async getAnalysisHistory(userId) {
        const records = await prisma.aIAnalysis.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                attempt: {
                    include: { test: true },
                },
            },
        });
        return records.map((r, index) => {
            let level = 'NEEDS_IMPROVEMENT';
            try {
                if (r.rawAIResponse) {
                    const parsed = JSON.parse(r.rawAIResponse);
                    if (parsed.overallAssessment?.level) {
                        level = parsed.overallAssessment.level;
                    }
                }
            }
            catch (e) {
                // Ignored
            }
            return {
                id: r.id,
                attemptId: r.attemptId,
                testTitle: r.attempt?.test?.title || `Mock Test ${records.length - index}`,
                score: r.attempt?.score ?? 0,
                totalMarks: r.attempt?.totalMarks ?? 100,
                accuracy: r.attempt?.accuracy ?? 0,
                overallLevel: level,
                createdAt: r.createdAt.toISOString(),
            };
        });
    }
    /**
     * Deterministic rule-based analytical engine for structured reports.
     */
    static generateDeterministicAnalysis(studentName, targetExam, testTitle, attemptNumber, score, totalMarks, accuracy, durationSeconds, subjectStats, topicStats, topicSummary, previousAttempts) {
        // 1. Overall assessment level
        let level = 'NEEDS_IMPROVEMENT';
        if (accuracy >= 80)
            level = 'EXCELLENT';
        else if (accuracy >= 65)
            level = 'GOOD';
        else if (accuracy >= 45)
            level = 'NEEDS_IMPROVEMENT';
        else
            level = 'CRITICAL_ATTENTION';
        // 2. Strengths & Weaknesses
        const strengths = [];
        const weaknesses = [];
        const sortedTopics = Object.entries(topicStats).map(([name, data]) => ({
            topic: name,
            ...data,
        }));
        if (sortedTopics.length > 0) {
            for (const t of sortedTopics) {
                if (t.accuracy >= 70) {
                    strengths.push({
                        subject: t.subject,
                        topic: t.topic,
                        accuracy: t.accuracy,
                        reason: `Strong accuracy (${t.accuracy}%) with ${t.correct} correct out of ${t.total} questions.`,
                    });
                }
                else if (t.accuracy < 55) {
                    weaknesses.push({
                        subject: t.subject,
                        topic: t.topic,
                        accuracy: t.accuracy,
                        priority: t.accuracy < 40 ? 'HIGH' : 'MEDIUM',
                        reason: `Accuracy is ${t.accuracy}% (${t.wrong} incorrect, ${t.skipped} skipped). High negative mark risk.`,
                        recommendation: `Review core formulas and complete a 15-question focused drill on ${t.topic}.`,
                    });
                }
            }
        }
        else {
            // Fallback from topic summary
            for (const p of topicSummary) {
                if (p.accuracy >= 70) {
                    strengths.push({
                        subject: p.subject,
                        topic: p.topic,
                        accuracy: p.accuracy,
                        reason: `Solid historical performance with ${p.accuracy}% accuracy.`,
                    });
                }
                else if (p.weaknessScore >= 55 || p.accuracy < 55) {
                    weaknesses.push({
                        subject: p.subject,
                        topic: p.topic,
                        accuracy: p.accuracy,
                        priority: p.weaknessScore >= 65 ? 'HIGH' : 'MEDIUM',
                        reason: `Weakness score is ${p.weaknessScore}/100 with frequent errors.`,
                        recommendation: `Focused concept practice required for ${p.topic}.`,
                    });
                }
            }
        }
        if (strengths.length === 0) {
            strengths.push({
                subject: 'General Knowledge',
                topic: 'Current Affairs & Awareness',
                accuracy: 75,
                reason: 'Good baseline recall in general awareness questions.',
            });
        }
        if (weaknesses.length === 0) {
            weaknesses.push({
                subject: 'Quantitative Aptitude',
                topic: 'Time & Work',
                accuracy: 50,
                priority: 'MEDIUM',
                reason: 'Moderate error rate under timed conditions.',
                recommendation: 'Practice shortcut techniques to decrease time taken per problem.',
            });
        }
        // 3. Historical Trends
        const trends = [];
        if (previousAttempts.length === 0) {
            trends.push({
                subject: 'All Subjects',
                trend: 'INSUFFICIENT_DATA',
                description: 'First attempt recorded. Historical trends will be evaluated across subsequent mock tests.',
            });
        }
        else {
            const lastAcc = previousAttempts[previousAttempts.length - 1].accuracy;
            const diff = accuracy - lastAcc;
            let trendStatus = 'STABLE';
            let trendDesc = `Accuracy remained steady around ${accuracy}%.`;
            if (diff >= 3) {
                trendStatus = 'IMPROVING';
                trendDesc = `Overall accuracy improved by +${Math.round(diff)}% (from ${lastAcc}% to ${accuracy}%).`;
            }
            else if (diff <= -3) {
                trendStatus = 'DECLINING';
                trendDesc = `Overall accuracy dropped by ${Math.round(Math.abs(diff))}% compared to your previous attempt (${lastAcc}%).`;
            }
            trends.push({
                subject: 'Overall Examination',
                trend: trendStatus,
                description: trendDesc,
            });
            for (const [sub, stats] of Object.entries(subjectStats)) {
                trends.push({
                    subject: sub,
                    trend: stats.accuracy >= 65 ? 'IMPROVING' : 'DECLINING',
                    description: `${sub} scored ${stats.accuracy}% accuracy in this test attempt.`,
                });
            }
        }
        // 4. Actionable Recommendations
        const recommendations = weaknesses.slice(0, 3).map((w) => ({
            topic: w.topic,
            priority: w.priority,
            action: w.recommendation,
        }));
        if (recommendations.length === 0) {
            recommendations.push({
                topic: 'Speed & Accuracy',
                priority: 'MEDIUM',
                action: 'Maintain consistent daily sectional mock test practice to preserve speed.',
            });
        }
        // 5. Next Best Practice
        const weakTopicNames = weaknesses.map((w) => w.topic);
        const nextPractice = {
            subjects: weaknesses.length > 0 ? [weaknesses[0].subject] : ['Quantitative Aptitude'],
            topics: weakTopicNames.length > 0 ? weakTopicNames.slice(0, 3) : ['Percentages', 'Time & Work'],
            difficulty: accuracy < 50 ? ['EASY', 'MEDIUM'] : ['MEDIUM', 'HARD'],
            questionCount: 15,
            reason: `These topics represent your lowest recent accuracy. Practicing targeted drills will rapidly raise your overall score.`,
        };
        // 6. Summary
        const summary = level === 'EXCELLENT'
            ? `Outstanding performance by ${studentName} on ${testTitle}, scoring ${score}/${totalMarks} (${accuracy}% accuracy). Keep up the high standard in advanced drills.`
            : level === 'GOOD'
                ? `Solid performance on ${testTitle} with ${accuracy}% accuracy. Targeted revision in ${weakTopicNames.slice(0, 2).join(' and ')} will push your score into the top percentile.`
                : `Performance on ${testTitle} shows potential, but accuracy dipped to ${accuracy}%. Immediate intervention recommended in ${weakTopicNames.slice(0, 2).join(' & ')} to eliminate negative marking.`;
        return {
            testTitle,
            attemptNumber,
            score,
            totalMarks,
            accuracy,
            timeSpentSeconds: durationSeconds,
            overallAssessment: {
                level,
                summary,
            },
            strengths,
            weaknesses,
            trends,
            recommendations,
            nextPractice,
            generatedAt: new Date().toISOString(),
            source: 'DETERMINISTIC_ENGINE',
        };
    }
    /**
     * Helper to persist analysis results in database.
     */
    static async persistAnalysisReport(userId, attemptId, data, rawText) {
        try {
            const weakTopicList = data.weaknesses.map((w) => w.topic);
            const priorityTopicList = data.weaknesses.filter((w) => w.priority === 'HIGH').map((w) => w.topic);
            // Create new AIAnalysis record for this attempt (preserves historical reports)
            await prisma.aIAnalysis.create({
                data: {
                    userId,
                    attemptId: attemptId || null,
                    summary: data.overallAssessment.summary,
                    weakTopics: JSON.stringify(weakTopicList),
                    priorityTopics: JSON.stringify(priorityTopicList.length > 0 ? priorityTopicList : weakTopicList.slice(0, 2)),
                    recommendedDifficulty: data.nextPractice.difficulty[0] || 'MEDIUM',
                    recommendedQuestionCount: data.nextPractice.questionCount || 15,
                    practiceStrategy: data.recommendations.map((r) => `[${r.priority}] ${r.topic}: ${r.action}`).join('\n'),
                    reason: data.nextPractice.reason,
                    rawAIResponse: rawText,
                },
            });
            // Also update or create Recommendation record for adaptive quick actions
            await prisma.recommendation.updateMany({
                where: { userId, status: 'PENDING' },
                data: { status: 'DISMISSED' },
            });
            await prisma.recommendation.create({
                data: {
                    userId,
                    attemptId: attemptId || null,
                    title: `Focus: ${data.nextPractice.topics.slice(0, 2).join(' & ')}`,
                    subjectName: data.nextPractice.subjects[0] || 'Quantitative Aptitude',
                    topicNames: JSON.stringify(data.nextPractice.topics),
                    difficulty: data.nextPractice.difficulty[0] || 'MEDIUM',
                    questionCount: data.nextPractice.questionCount || 15,
                    estimatedTime: `${data.nextPractice.questionCount || 15} mins`,
                    reason: data.nextPractice.reason,
                    status: 'PENDING',
                },
            });
        }
        catch (err) {
            console.error('Error saving AI analysis to DB:', err);
        }
    }
    /**
     * Generates dynamic, personalized government-exam questions for a student test or practice session.
     * Hybrid system: blends Gemini AI generated questions with verified database question bank.
     * Fallback guaranteed: if Gemini fails or is unconfigured, seamlessly serves verified bank questions.
     */
    static async generateDynamicQuestions(userId, params) {
        const totalCount = Math.min(30, Math.max(1, params.questionCount || 10));
        const aiRatio = typeof params.aiRatio === 'number' ? Math.max(0, Math.min(1, params.aiRatio)) : 0.6;
        const targetAiCount = Math.round(totalCount * aiRatio);
        const targetBankCount = totalCount - targetAiCount;
        // 1. Fetch user context & target exam
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, targetExam: true },
        });
        // 2. Resolve Exam
        let exam = null;
        if (params.examId) {
            exam = await prisma.exam.findUnique({ where: { id: params.examId }, include: { subjects: { include: { topics: true } } } });
        }
        else if (params.examSlug) {
            exam = await prisma.exam.findUnique({ where: { slug: params.examSlug }, include: { subjects: { include: { topics: true } } } });
        }
        else if (user?.targetExam) {
            exam = await prisma.exam.findFirst({
                where: { name: { contains: user.targetExam, mode: 'insensitive' } },
                include: { subjects: { include: { topics: true } } },
            });
        }
        if (!exam) {
            exam = await prisma.exam.findFirst({
                include: { subjects: { include: { topics: true } } },
            });
        }
        if (!exam) {
            throw new Error('No exam found in system database to generate questions for.');
        }
        // 3. Resolve Subject and Topic(s)
        let selectedSubject = null;
        let selectedTopic = null;
        let targetTopicNames = [];
        // All available topics for this exam
        const allTopics = exam.subjects.flatMap((s) => s.topics);
        if (params.topicId) {
            selectedTopic = allTopics.find((t) => t.id === params.topicId);
            if (selectedTopic) {
                selectedSubject = exam.subjects.find((s) => s.id === selectedTopic.subjectId);
                targetTopicNames = [selectedTopic.name];
            }
        }
        else if (params.subjectId) {
            selectedSubject = exam.subjects.find((s) => s.id === params.subjectId);
            if (selectedSubject && selectedSubject.topics.length > 0) {
                selectedTopic = selectedSubject.topics[0];
                targetTopicNames = selectedSubject.topics.map((t) => t.name);
            }
        }
        // If no topic selected, use student's adaptive weak topics
        if (!selectedTopic || targetTopicNames.length === 0) {
            const weakPerfs = await prisma.studentTopicPerformance.findMany({
                where: { userId, examId: exam.id },
                include: { topic: { include: { subject: true } } },
                orderBy: { weaknessScore: 'desc' },
                take: 3,
            });
            if (weakPerfs.length > 0) {
                selectedTopic = weakPerfs[0].topic;
                selectedSubject = exam.subjects.find((s) => s.id === weakPerfs[0].topic.subjectId) || weakPerfs[0].topic.subject;
                targetTopicNames = weakPerfs.map((p) => p.topic.name);
            }
            else if (allTopics.length > 0) {
                selectedTopic = allTopics[0];
                selectedSubject = exam.subjects.find((s) => s.id === selectedTopic.subjectId);
                targetTopicNames = [selectedTopic.name];
            }
        }
        const subjectName = selectedSubject?.name || 'General';
        const topicName = selectedTopic?.name || targetTopicNames[0] || 'Core Concepts';
        const difficulty = params.difficulty || 'MEDIUM';
        // 4. Fetch Seen Question IDs for this student to prevent repetition
        const seenHistories = await prisma.questionHistory.findMany({
            where: { userId },
            select: { questionId: true },
        });
        const seenQuestionIds = new Set(seenHistories.map((h) => h.questionId));
        // 5. Query Question Bank
        const bankQueryWhere = {
            examId: exam.id,
            id: { notIn: Array.from(seenQuestionIds) },
        };
        if (selectedSubject) {
            bankQueryWhere.subjectId = selectedSubject.id;
        }
        if (selectedTopic) {
            bankQueryWhere.topicId = selectedTopic.id;
        }
        let bankQuestions = await prisma.question.findMany({
            where: bankQueryWhere,
            include: { topic: true, subject: true },
            take: targetBankCount * 2,
        });
        if (bankQuestions.length < targetBankCount) {
            const fallbackQuestions = await prisma.question.findMany({
                where: { examId: exam.id },
                include: { topic: true, subject: true },
                take: targetBankCount,
            });
            bankQuestions = [...bankQuestions, ...fallbackQuestions].slice(0, targetBankCount);
        }
        else {
            bankQuestions = bankQuestions.slice(0, targetBankCount);
        }
        // 6. Generate AI Questions via Gemini
        let aiQuestions = [];
        if (targetAiCount > 0) {
            try {
                aiQuestions = await GeminiQuestionService.generateQuestions({
                    examName: exam.name,
                    subjectName,
                    topicName,
                    difficulty: difficulty || 'MEDIUM',
                    questionCount: targetAiCount,
                });
            }
            catch (geminiError) {
                console.warn('Gemini dynamic question generation failed, falling back to verified bank questions:', geminiError);
            }
        }
        // If Gemini produced fewer questions than requested, fill remainder from bank
        const shortfall = targetAiCount - aiQuestions.length;
        if (shortfall > 0) {
            const extraBankQuestions = await prisma.question.findMany({
                where: {
                    examId: exam.id,
                    id: { notIn: [...Array.from(seenQuestionIds), ...bankQuestions.map((b) => b.id)] },
                },
                include: { topic: true, subject: true },
                take: shortfall,
            });
            bankQuestions = [...bankQuestions, ...extraBankQuestions];
        }
        // 7. Store new AI generated questions in database
        const generatedDbQuestions = [];
        for (const aiQ of aiQuestions) {
            const questionHash = generateQuestionHash(aiQ.questionText, aiQ.options.map((o) => o.text));
            let matchedTopic = selectedTopic;
            let matchedSubject = selectedSubject;
            try {
                const savedQ = await prisma.question.create({
                    data: {
                        examId: exam.id,
                        subjectId: matchedSubject.id,
                        topicId: matchedTopic.id,
                        questionText: aiQ.questionText,
                        questionHash,
                        options: JSON.stringify(aiQ.options),
                        correctOption: aiQ.correctOption,
                        explanation: aiQ.explanation,
                        difficulty: aiQ.difficulty || difficulty,
                        source: 'AI_GENERATED',
                        status: 'PUBLISHED',
                    },
                    include: { topic: true, subject: true },
                });
                generatedDbQuestions.push(savedQ);
            }
            catch (saveErr) {
                const existingQ = await prisma.question.findFirst({
                    where: { questionHash },
                    include: { topic: true, subject: true },
                });
                if (existingQ) {
                    generatedDbQuestions.push(existingQ);
                }
            }
        }
        // 8. Combine AI & Bank Questions
        const combinedQuestions = [...generatedDbQuestions, ...bankQuestions].slice(0, totalCount);
        // 9. Persist PracticeSession
        const practiceSession = await prisma.practiceSession.create({
            data: {
                userId,
                title: `${exam.name} - Dynamic ${subjectName} Practice`,
                subjectName,
                targetTopics: JSON.stringify(targetTopicNames),
                difficulty,
                questionCount: combinedQuestions.length,
                estimatedMinutes: Math.ceil(combinedQuestions.length * 1.2),
                reason: `Personalized dynamic practice generated from your latest weak topic diagnostics for ${exam.name}.`,
                status: 'GENERATED',
            },
        });
        // Link questions to session
        for (let i = 0; i < combinedQuestions.length; i++) {
            const q = combinedQuestions[i];
            await prisma.practiceSessionQuestion.create({
                data: {
                    practiceSessionId: practiceSession.id,
                    questionId: q.id,
                    order: i + 1,
                },
            });
        }
        const formattedQuestions = combinedQuestions.map((q) => {
            let parsedOptions = [];
            try {
                parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
            }
            catch (e) {
                parsedOptions = [];
            }
            return {
                id: q.id,
                sectionId: q.subjectId,
                sectionName: q.subject?.name || 'General',
                topicId: q.topicId,
                topicName: q.topic?.name || 'General Topic',
                questionText: q.questionText,
                options: parsedOptions,
                difficulty: q.difficulty,
                examName: exam.name,
                subject: q.subject?.name || 'General',
                source: q.isAiGenerated ? 'AI_GENERATED' : 'VERIFIED_BANK',
                correctOption: params.includeSolutions ? q.correctOption : undefined,
                explanation: params.includeSolutions ? q.explanation : undefined,
            };
        });
        return {
            practiceSessionId: practiceSession.id,
            session: {
                id: practiceSession.id,
                title: practiceSession.title,
                subjectName: practiceSession.subjectName || subjectName,
                targetTopics: targetTopicNames,
                difficulty: practiceSession.difficulty,
                questionCount: practiceSession.questionCount,
                estimatedMinutes: practiceSession.estimatedMinutes,
                reason: practiceSession.reason,
                aiGeneratedCount: generatedDbQuestions.length,
                verifiedBankCount: bankQuestions.length,
            },
            questions: formattedQuestions,
        };
    }
}
