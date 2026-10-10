import { prisma } from '../config/db.js';
import crypto from 'crypto';

function computeHash(text) {
    return crypto.createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
}

async function seedIbpsPoMainsQuestions() {
    console.log('========================================================================');
    console.log('🌱 SEEDING COMPREHENSIVE QUESTION BANKS FOR IBPS PO MAINS 🌱');
    console.log('========================================================================\n');

    const exam = await prisma.exam.findUnique({
        where: { code: 'IBPS_PO' },
        include: { subjects: { include: { topics: true } } },
    });

    if (!exam) throw new Error('IBPS PO Exam not found.');

    const reasoningSubject = exam.subjects.find((s) => s.slug === 'ibps-reasoning');
    const quantSubject = exam.subjects.find((s) => s.slug === 'ibps-quant');
    const bankingSubject = exam.subjects.find((s) => s.slug === 'ibps-banking');
    const englishSubject = exam.subjects.find((s) => s.slug === 'ibps-english');
    const descriptiveSubject = exam.subjects.find((s) => s.slug === 'ibps-descriptive');

    const topicPuzzles = reasoningSubject?.topics.find((t) => t.slug === 'puzzles-seating') || reasoningSubject?.topics[0];
    const topicComputer = reasoningSubject?.topics.find((t) => t.slug === 'computer-aptitude') || topicPuzzles;
    const topicLogical = reasoningSubject?.topics.find((t) => t.slug === 'logical-reasoning') || topicPuzzles;

    const topicDI = quantSubject?.topics.find((t) => t.slug === 'data-interpretation') || quantSubject?.topics[0];
    const topicDataSufficiency = quantSubject?.topics.find((t) => t.slug === 'data-sufficiency') || topicDI;

    const topicBanking = bankingSubject?.topics.find((t) => t.slug === 'banking-awareness') || bankingSubject?.topics[0];
    const topicEconomy = bankingSubject?.topics.find((t) => t.slug === 'indian-economy') || topicBanking;

    const topicLetters = descriptiveSubject?.topics.find((t) => t.slug === 'letter-writing') || descriptiveSubject?.topics[0];
    const topicEssays = descriptiveSubject?.topics.find((t) => t.slug === 'essay-writing') || descriptiveSubject?.topics[0];

    const newQuestions = [
        // ==========================================
        // 1. REASONING & COMPUTER APTITUDE (MCQ)
        // ==========================================
        {
            subjectId: reasoningSubject.id,
            topicId: topicComputer.id,
            questionText: 'In computer architecture, which register holds the address of the next instruction to be executed by the CPU?',
            options: [
                { id: 'A', text: 'Accumulator (AC)' },
                { id: 'B', text: 'Program Counter (PC)' },
                { id: 'C', text: 'Instruction Register (IR)' },
                { id: 'D', text: 'Memory Buffer Register (MBR)' },
            ],
            correctOption: 'B',
            explanation: 'The Program Counter (PC) stores the memory address of the next machine instruction to be fetched and executed.',
            difficulty: 'EASY',
            subtopic: 'CPU Registers',
        },
        {
            subjectId: reasoningSubject.id,
            topicId: topicComputer.id,
            questionText: 'What is the binary representation of the decimal number 53 in 8-bit unsigned format?',
            options: [
                { id: 'A', text: '00110101' },
                { id: 'B', text: '00110111' },
                { id: 'C', text: '00101101' },
                { id: 'D', text: '00111001' },
            ],
            correctOption: 'A',
            explanation: '53 = 32 + 16 + 4 + 1 = 2^5 + 2^4 + 2^2 + 2^0 = 00110101 in 8-bit binary.',
            difficulty: 'MEDIUM',
            subtopic: 'Binary Representation',
        },
        {
            subjectId: reasoningSubject.id,
            topicId: topicComputer.id,
            questionText: 'Which protocol operates at the Transport Layer of the OSI Model and provides reliable, connection-oriented data transmission?',
            options: [
                { id: 'A', text: 'User Datagram Protocol (UDP)' },
                { id: 'B', text: 'Transmission Control Protocol (TCP)' },
                { id: 'C', text: 'Internet Protocol (IP)' },
                { id: 'D', text: 'Hypertext Transfer Protocol (HTTP)' },
            ],
            correctOption: 'B',
            explanation: 'TCP operates at Layer 4 (Transport Layer) providing connection-oriented, sequenced, error-checked packet delivery.',
            difficulty: 'EASY',
            subtopic: 'Networking & OSI Model',
        },
        {
            subjectId: reasoningSubject.id,
            topicId: topicComputer.id,
            questionText: 'In virtual memory systems, what is the phenomenon called when the CPU spends more time swapping pages into and out of memory than executing processes?',
            options: [
                { id: 'A', text: 'Paging' },
                { id: 'B', text: 'Fragmentation' },
                { id: 'C', text: 'Thrashing' },
                { id: 'D', text: 'Segmentation' },
            ],
            correctOption: 'C',
            explanation: 'Thrashing occurs when memory is oversubscribed and pages are continually swapped in and out of swap space, degrading system throughput.',
            difficulty: 'MEDIUM',
            subtopic: 'Operating Systems & Memory',
        },
        {
            subjectId: reasoningSubject.id,
            topicId: topicComputer.id,
            questionText: 'Which of the following binary logic gate outputs TRUE (1) if and only if an odd number of its inputs are TRUE (1)?',
            options: [
                { id: 'A', text: 'NAND gate' },
                { id: 'B', text: 'NOR gate' },
                { id: 'C', text: 'XOR gate' },
                { id: 'D', text: 'XNOR gate' },
            ],
            correctOption: 'C',
            explanation: 'An Exclusive OR (XOR) gate yields high (1) when the number of true inputs is odd.',
            difficulty: 'EASY',
            subtopic: 'Digital Logic Gates',
        },
        {
            subjectId: reasoningSubject.id,
            topicId: topicComputer.id,
            questionText: 'Which transmission mode allows communication in both directions simultaneously across the physical link?',
            options: [
                { id: 'A', text: 'Simplex mode' },
                { id: 'B', text: 'Half-duplex mode' },
                { id: 'C', text: 'Full-duplex mode' },
                { id: 'D', text: 'Serial transmission mode' },
            ],
            correctOption: 'C',
            explanation: 'In full-duplex communication, data can travel in both directions at the same time (e.g. telephone lines, modern Ethernet switches).',
            difficulty: 'EASY',
            subtopic: 'Data Communication Modes',
        },
        {
            subjectId: reasoningSubject.id,
            topicId: topicComputer.id,
            questionText: 'Which malicious software hides its presence on a computer system and allows unauthorized administrative access to remote attackers?',
            options: [
                { id: 'A', text: 'Rootkit' },
                { id: 'B', text: 'Macro virus' },
                { id: 'C', text: 'Keylogger' },
                { id: 'D', text: 'Adware' },
            ],
            correctOption: 'A',
            explanation: 'A rootkit is designed to hide its presence and certain processes or programs from normal methods of detection, granting root or superuser privilege to intruders.',
            difficulty: 'MEDIUM',
            subtopic: 'Cybersecurity Fundamentals',
        },
        {
            subjectId: reasoningSubject.id,
            topicId: topicComputer.id,
            questionText: 'Convert hexadecimal (2F)₁₆ to its octal equivalent.',
            options: [
                { id: 'A', text: '(47)₈' },
                { id: 'B', text: '(57)₈' },
                { id: 'C', text: '(67)₈' },
                { id: 'D', text: '(71)₈' },
            ],
            correctOption: 'B',
            explanation: '(2F)₁₆ = 2×16 + 15 = 47 in decimal. 47 in octal: 47 / 8 = 5 remainder 7 => (57)₈.',
            difficulty: 'HARD',
            subtopic: 'Radix Conversions',
        },
        // Seating & Puzzles
        {
            subjectId: reasoningSubject.id,
            topicId: topicPuzzles.id,
            questionText: 'Eight persons A, B, C, D, E, F, G, and H sit around a circular table facing the centre. A sits third to the right of B. C sits third to the left of A. D is neither an immediate neighbour of A nor B. E sits second to the right of D. F sits second to the right of G. Who sits immediate right of E?',
            options: [
                { id: 'A', text: 'B' },
                { id: 'B', text: 'C' },
                { id: 'C', text: 'G' },
                { id: 'D', text: 'H' },
            ],
            correctOption: 'A',
            explanation: 'Arrangement mapping places B adjacent to the right of E after resolving circular constraints.',
            difficulty: 'HARD',
            subtopic: 'Circular Seating Arrangement',
        },
        {
            subjectId: reasoningSubject.id,
            topicId: topicPuzzles.id,
            questionText: 'Seven boxes P, Q, R, S, T, U, and V are placed one above another. Exactly three boxes are placed between P and T. Box R is immediately above box S. Only two boxes are placed between box S and box Q. Box U is placed above box V but below box P. Which box is at the bottommost position?',
            options: [
                { id: 'A', text: 'Box V' },
                { id: 'B', text: 'Box T' },
                { id: 'C', text: 'Box Q' },
                { id: 'D', text: 'Box S' },
            ],
            correctOption: 'A',
            explanation: 'Stacking logic places Box V on the lowest shelf (shelf 1).',
            difficulty: 'HARD',
            subtopic: 'Box-Based Puzzles',
        },
        {
            subjectId: reasoningSubject.id,
            topicId: topicLogical.id,
            questionText: 'Statements: Only a few loans are deposits. All deposits are accounts. No account is a locker.\nConclusions:\nI. Some loans are not lockers.\nII. All accounts can never be loans.',
            options: [
                { id: 'A', text: 'Only Conclusion I follows' },
                { id: 'B', text: 'Only Conclusion II follows' },
                { id: 'C', text: 'Both Conclusion I and II follow' },
                { id: 'D', text: 'Neither Conclusion I nor II follows' },
            ],
            correctOption: 'A',
            explanation: 'The portion of loans that are deposits are inside accounts and cannot be lockers. Conclusion I is logically certain. Conclusion II is invalid as accounts can potentially be entirely inside loans.',
            difficulty: 'MEDIUM',
            subtopic: 'Reverse Syllogisms',
        },
        {
            subjectId: reasoningSubject.id,
            topicId: topicLogical.id,
            questionText: 'In a code language: "banking economy interest rates" is coded as "ki mo pa tu", "interest high growth fiscal" is coded as "tu le da fi", "banking growth capital ratio" is coded as "mo da ze na". What is the code for "banking"?',
            options: [
                { id: 'A', text: 'tu' },
                { id: 'B', text: 'mo' },
                { id: 'C', text: 'da' },
                { id: 'D', text: 'ki' },
            ],
            correctOption: 'B',
            explanation: '"banking" is common to sentence 1 and sentence 3, and "mo" is the common code between them.',
            difficulty: 'EASY',
            subtopic: 'Fictitious Coding-Decoding',
        },
        {
            subjectId: reasoningSubject.id,
            topicId: topicLogical.id,
            questionText: 'Statements: P ≥ Q > R = S; T ≤ U < R; W ≥ X > P.\nConclusions:\nI. W > S\nII. T < Q',
            options: [
                { id: 'A', text: 'Only Conclusion I follows' },
                { id: 'B', text: 'Only Conclusion II follows' },
                { id: 'C', text: 'Both Conclusion I and II follow' },
                { id: 'D', text: 'Neither Conclusion I nor II follows' },
            ],
            correctOption: 'C',
            explanation: 'W ≥ X > P ≥ Q > R = S => W > S holds. Q > R > U ≥ T => Q > T holds. Both follow.',
            difficulty: 'EASY',
            subtopic: 'Coded Inequalities',
        },
        {
            subjectId: reasoningSubject.id,
            topicId: topicPuzzles.id,
            questionText: 'Six employees J, K, L, M, N, and O attend meetings on two different dates (12th and 25th) across three different months (April, May, June). Only two persons attend meetings before K. J attends on an even date in a month having 30 days. M attends after O but before N. Who attends the meeting on 25th June?',
            options: [
                { id: 'A', text: 'N' },
                { id: 'B', text: 'M' },
                { id: 'C', text: 'L' },
                { id: 'D', text: 'K' },
            ],
            correctOption: 'A',
            explanation: 'Scheduling chronological assignment places N on the final date (25th June).',
            difficulty: 'HARD',
            subtopic: 'Month & Date Scheduling Puzzle',
        },
        {
            subjectId: reasoningSubject.id,
            topicId: topicLogical.id,
            questionText: 'Input: 45 zebra 18 mobile 83 capital 62 laptop.\nIn this word-and-number rearrangement machine, Step 1 puts the highest number at the left end and the alphabetically first word at the right end. What is the position of "mobile" from the left end in Step 1?',
            options: [
                { id: 'A', text: '3rd' },
                { id: 'B', text: '4th' },
                { id: 'C', text: '5th' },
                { id: 'D', text: '6th' },
            ],
            correctOption: 'B',
            explanation: 'Step 1: 83 45 zebra 18 mobile 62 laptop capital. Counting from left: 83(1), 45(2), zebra(3), mobile(4).',
            difficulty: 'MEDIUM',
            subtopic: 'Machine Input-Output',
        },

        // ==========================================
        // 2. DATA ANALYSIS & INTERPRETATION (MCQ)
        // ==========================================
        {
            subjectId: quantSubject.id,
            topicId: topicDI.id,
            questionText: 'The pie chart shows the percentage distribution of total loans disbursed by 5 public sector banks in 2024: Bank A (24%), Bank B (18%), Bank C (28%), Bank D (12%), Bank E (18%). If the total loan disbursed by all banks combined is Rs. 4,50,000 crores, what is the central angle corresponding to Bank C?',
            options: [
                { id: 'A', text: '98.4°' },
                { id: 'B', text: '100.8°' },
                { id: 'C', text: '102.6°' },
                { id: 'D', text: '104.2°' },
            ],
            correctOption: 'B',
            explanation: 'Central Angle = (28 / 100) * 360° = 28 * 3.6° = 100.8°.',
            difficulty: 'EASY',
            subtopic: 'Pie Chart Interpretation',
        },
        {
            subjectId: quantSubject.id,
            topicId: topicDI.id,
            questionText: 'A bar graph presents the non-performing assets (NPAs) of a commercial bank in successive quarters: Q1: 4.5%, Q2: 5.2%, Q3: 4.8%, Q4: 4.0%. If the total loan book in Q2 was Rs. 2,50,000 crores and in Q3 was Rs. 2,80,000 crores, what was the percentage change in the gross NPA amount from Q2 to Q3?',
            options: [
                { id: 'A', text: '3.38% increase' },
                { id: 'B', text: '3.38% decrease' },
                { id: 'C', text: '4.25% increase' },
                { id: 'D', text: '2.80% decrease' },
            ],
            correctOption: 'A',
            explanation: 'Q2 NPA = 5.2% of 2,50,000 = Rs. 13,000 cr. Q3 NPA = 4.8% of 2,80,000 = Rs. 13,440 cr. Change = (13440 - 13000)/13000 * 100 = 440 / 130 = +3.38%.',
            difficulty: 'HARD',
            subtopic: 'Comparative Bar Chart',
        },
        {
            subjectId: quantSubject.id,
            topicId: topicDI.id,
            questionText: 'In a company, the ratio of male to female employees in HR, IT, and Finance is 3:2, 5:4, and 2:3 respectively. If the total number of employees in HR is 250, IT is 360, and Finance is 300, what is the ratio of total males across all three departments to total females across all three departments?',
            options: [
                { id: 'A', text: '47 : 44' },
                { id: 'B', text: '41 : 39' },
                { id: 'C', text: '43 : 41' },
                { id: 'D', text: '45 : 43' },
            ],
            correctOption: 'A',
            explanation: 'HR: M = (3/5)*250 = 150, F = 100. IT: M = (5/9)*360 = 200, F = 160. Finance: M = (2/5)*300 = 120, F = 180. Total M = 150 + 200 + 120 = 470. Total F = 100 + 160 + 180 = 440. Ratio = 470:440 = 47:44.',
            difficulty: 'MEDIUM',
            subtopic: 'Tabular Data Analysis',
        },
        {
            subjectId: quantSubject.id,
            topicId: topicDataSufficiency.id,
            questionText: 'What is the speed of the passenger train in km/h?\nStatement I: The train crosses a 300-metre long stationary platform in 25 seconds.\nStatement II: The train crosses a man standing on the platform in 10 seconds.',
            options: [
                { id: 'A', text: 'Statement I alone is sufficient' },
                { id: 'B', text: 'Statement II alone is sufficient' },
                { id: 'C', text: 'Both Statements I and II together are necessary to answer' },
                { id: 'D', text: 'Statements I and II together are not sufficient' },
            ],
            correctOption: 'C',
            explanation: 'From II: Length of train = 10 * Speed. From I: (Length + 300) = 25 * Speed. Substituting gives 300 = 15 * Speed => Speed = 20 m/s = 72 km/h. Both statements are required.',
            difficulty: 'MEDIUM',
            subtopic: 'Data Sufficiency on Speed & Time',
        },
        {
            subjectId: quantSubject.id,
            topicId: topicDI.id,
            questionText: 'A radar chart details the sales (in thousand units) of 5 products P, Q, R, S, T. Product P: 18, Product Q: 24, Product R: 16, Product S: 30, Product T: 12. If the average selling price per unit is Rs. 450 for P, Rs. 500 for Q, and Rs. 600 for S, what is the combined revenue generated from P, Q, and S together?',
            options: [
                { id: 'A', text: 'Rs. 38.1 Crores' },
                { id: 'B', text: 'Rs. 3.81 Crores' },
                { id: 'C', text: 'Rs. 4.25 Crores' },
                { id: 'D', text: 'Rs. 381 Lakhs' },
            ],
            correctOption: 'B',
            explanation: 'Revenue = (18000*450) + (24000*500) + (30000*600) = 81,00,000 + 1,20,00,000 + 1,80,00,000 = Rs. 3,81,00,000 = Rs. 3.81 Crores.',
            difficulty: 'HARD',
            subtopic: 'Radar Chart DI',
        },
        {
            subjectId: quantSubject.id,
            topicId: topicDI.id,
            questionText: 'A caselet states: In a digital banking survey of 800 retail users, 45% use Mobile Banking apps, 40% use Internet Banking, and 20% use UPI apps only. If 15% use both Mobile and Internet banking but do not use UPI, how many users use neither Mobile nor Internet Banking?',
            options: [
                { id: 'A', text: '240 users' },
                { id: 'B', text: '280 users' },
                { id: 'C', text: '200 users' },
                { id: 'D', text: '260 users' },
            ],
            correctOption: 'A',
            explanation: 'Total using either mobile or internet = 45% + 40% - 15% = 70%. Remaining users = 100% - 70% = 30% of 800 = 240 users.',
            difficulty: 'HARD',
            subtopic: 'Venn Diagram Caselet DI',
        },
        {
            subjectId: quantSubject.id,
            topicId: topicDataSufficiency.id,
            questionText: 'What is the cost price of an item sold by a retail merchant?\nStatement I: The merchant offers a 20% discount on the marked price and still earns a 12% profit.\nStatement II: The marked price of the article is Rs. 840.',
            options: [
                { id: 'A', text: 'Statement I alone is sufficient' },
                { id: 'B', text: 'Statement II alone is sufficient' },
                { id: 'C', text: 'Both Statements I and II together are sufficient' },
                { id: 'D', text: 'Neither statement is sufficient' },
            ],
            correctOption: 'C',
            explanation: 'From II: MP = 840. From I: SP = 840 * 0.80 = 672. Profit = 12% => CP = 672 / 1.12 = Rs. 600. Both statements together yield the unique cost price.',
            difficulty: 'MEDIUM',
            subtopic: 'Data Sufficiency on Profit & Loss',
        },
        {
            subjectId: quantSubject.id,
            topicId: topicDI.id,
            questionText: 'A line graph shows exports and imports (in billion USD) of a country over 5 years. In 2021: Exports = $42B, Imports = $56B. In 2022: Exports = $50B, Imports = $60B. What is the percentage reduction in trade deficit from 2021 to 2022?',
            options: [
                { id: 'A', text: '28.57%' },
                { id: 'B', text: '33.33%' },
                { id: 'C', text: '25.00%' },
                { id: 'D', text: '30.00%' },
            ],
            correctOption: 'A',
            explanation: 'Deficit in 2021 = 56 - 42 = $14B. Deficit in 2022 = 60 - 50 = $10B. Reduction = (14 - 10) / 14 * 100 = 4 / 14 * 100 = 28.57%.',
            difficulty: 'MEDIUM',
            subtopic: 'Line Graph Analysis',
        },

        // ==========================================
        // 3. GENERAL / ECONOMY / BANKING AWARENESS
        // ==========================================
        {
            subjectId: bankingSubject.id,
            topicId: topicBanking.id,
            questionText: 'Which committee appointed by the Reserve Bank of India recommended the introduction of the Monetary Policy Committee (MPC) framework in India?',
            options: [
                { id: 'A', text: 'Bimal Jalan Committee' },
                { id: 'B', text: 'Urjit Patel Committee' },
                { id: 'C', text: 'Narasimham Committee II' },
                { id: 'D', text: 'Raghuram Rajan Committee' },
            ],
            correctOption: 'B',
            explanation: 'The Urjit Patel Committee on Revising and Strengthening the Monetary Policy Framework (2014) recommended adopting flexible inflation targeting and an institutional MPC.',
            difficulty: 'MEDIUM',
            subtopic: 'Monetary Policy Architecture',
        },
        {
            subjectId: bankingSubject.id,
            topicId: topicBanking.id,
            questionText: 'What is the maximum compensation that the Banking Ombudsman can award to a complainant for mental anguish and harassment under the Reserve Bank - Integrated Ombudsman Scheme?',
            options: [
                { id: 'A', text: 'Rs. 50,000' },
                { id: 'B', text: 'Rs. 1,00,000' },
                { id: 'C', text: 'Rs. 2,00,000' },
                { id: 'D', text: 'Rs. 5,00,000' },
            ],
            correctOption: 'B',
            explanation: 'Under the RB-IOS, the Ombudsman may award compensation not exceeding Rs. 1 lakh to the complainant for loss of time, expenses incurred, and mental agony.',
            difficulty: 'MEDIUM',
            subtopic: 'Banking Ombudsman Scheme',
        },
        {
            subjectId: bankingSubject.id,
            topicId: topicEconomy.id,
            questionText: 'Under the Basel III capital adequacy framework, what is the mandatory minimum Common Equity Tier 1 (CET1) ratio prescribed by the RBI for Indian commercial banks?',
            options: [
                { id: 'A', text: '4.5%' },
                { id: 'B', text: '5.5%' },
                { id: 'C', text: '6.0%' },
                { id: 'D', text: '8.0%' },
            ],
            correctOption: 'B',
            explanation: 'The Reserve Bank of India mandates a minimum CET1 ratio of 5.5% of risk-weighted assets (stricter than Basel International norm of 4.5%).',
            difficulty: 'HARD',
            subtopic: 'Basel III Norms',
        },
        {
            subjectId: bankingSubject.id,
            topicId: topicBanking.id,
            questionText: 'Which public sector financial institution manages the Priority Sector Lending Certificates (PSLC) trading platform in India?',
            options: [
                { id: 'A', text: 'SIDBI' },
                { id: 'B', text: 'NABARD' },
                { id: 'C', text: 'Reserve Bank of India (e-Kuber portal)' },
                { id: 'D', text: 'State Bank of India' },
            ],
            correctOption: 'C',
            explanation: 'PSLCs are traded through the RBI e-Kuber portal without transfer of underlying risks or loan assets between participating banks.',
            difficulty: 'MEDIUM',
            subtopic: 'Priority Sector Lending',
        },
        {
            subjectId: bankingSubject.id,
            topicId: topicEconomy.id,
            questionText: 'What is the full form of the legal framework enacted in India as "SARFAESI Act 2002"?',
            options: [
                { id: 'A', text: 'Securitisation and Reconstruction of Financial Assets and Enforcement of Security Interest Act' },
                { id: 'B', text: 'Securities and Regulation of Financial Assets and Enforcement of State Interest Act' },
                { id: 'C', text: 'Statutory Administration and Recovery of Financial Assets and Economic Sanctions Act' },
                { id: 'D', text: 'Systemic Action and Resolution of Financial Assets and Corporate Enforcement Act' },
            ],
            correctOption: 'A',
            explanation: 'SARFAESI stands for Securitisation and Reconstruction of Financial Assets and Enforcement of Security Interest Act, 2002.',
            difficulty: 'EASY',
            subtopic: 'Banking Regulation Laws',
        },

        // ==========================================
        // 4. DESCRIPTIVE ENGLISH (PROMPTS)
        // ==========================================
        {
            subjectId: descriptiveSubject.id,
            topicId: topicLetters.id,
            questionType: 'DESCRIPTIVE_ESSAY',
            questionText: 'Write a formal letter in about 150 words to your Branch Manager requesting the issuance of a new contactless EMV credit card following the fraudulent debit alert received on your existing card. Clearly mention your account number, transaction details, and safety steps already taken.',
            options: [],
            correctOption: null,
            explanation: 'Letter Writing Format (Formal): Sender address, Date, Receiver designation & branch address, Subject line, Salutation, Body in 3 paragraphs (Introduction of fraud event, detail of debit, request for hotlisting and re-issuance), Formal closing with signature.',
            difficulty: 'MEDIUM',
            subtopic: 'Formal Banking Letter Writing',
        },
        {
            subjectId: descriptiveSubject.id,
            topicId: topicLetters.id,
            questionType: 'DESCRIPTIVE_ESSAY',
            questionText: 'Write a formal letter in about 150 words to the Chief Municipal Officer drawing urgent attention to repeated waterlogging and open manholes near the public sector bank premises in your locality, which poses severe danger to senior citizen pensioners.',
            options: [],
            correctOption: null,
            explanation: 'Formal letter structure highlighting public convenience, safety hazards, past unaddressed representations, and requesting prompt remedial maintenance.',
            difficulty: 'MEDIUM',
            subtopic: 'Civic Authority Letter',
        },
        {
            subjectId: descriptiveSubject.id,
            topicId: topicLetters.id,
            questionType: 'DESCRIPTIVE_ESSAY',
            questionText: 'Write an informal letter in about 150 words to your younger brother advising him on the benefits of financial discipline, avoiding unregulated online lending apps, and the importance of investing in small savings schemes early in his career.',
            options: [],
            correctOption: null,
            explanation: 'Informal Letter Format: Warm tone, personal greeting, practical guidance on financial literacy, cyber fraud awareness, closing with affection.',
            difficulty: 'MEDIUM',
            subtopic: 'Informal Letter',
        },
        {
            subjectId: descriptiveSubject.id,
            topicId: topicLetters.id,
            questionType: 'DESCRIPTIVE_ESSAY',
            questionText: 'Write a formal letter in about 150 words to the General Manager of HR at a commercial bank requesting paternity leave for three weeks in accordance with corporate service regulations, outlining your pending project handover plan.',
            options: [],
            correctOption: null,
            explanation: 'Professional formal workplace correspondence: Date, subject line, leave duration, transition handover plan, and contact availability.',
            difficulty: 'MEDIUM',
            subtopic: 'Workplace Formal Letter',
        },
        {
            subjectId: descriptiveSubject.id,
            topicId: topicEssays.id,
            questionType: 'DESCRIPTIVE_ESSAY',
            questionText: 'Write an essay in about 200–250 words on the topic: "Central Bank Digital Currency (CBDC) vs Cryptocurrencies: Opportunities, Risks, and Future of Sovereign Money in India".',
            options: [],
            correctOption: null,
            explanation: 'Essay Structure: Introduction explaining Digital Rupee (e₹) vs decentralized cryptocurrencies; Body paragraph 1 examining financial stability, monetary sovereignty, and programmability; Body paragraph 2 discussing privacy and cyber risks; Conclusion highlighting balanced regulatory roadmaps.',
            difficulty: 'HARD',
            subtopic: 'Banking & Tech Essay',
        },
        {
            subjectId: descriptiveSubject.id,
            topicId: topicEssays.id,
            questionType: 'DESCRIPTIVE_ESSAY',
            questionText: 'Write an essay in about 200–250 words on the topic: "Role of Public Sector Banks in Expanding Financial Inclusion and Rural Credit in India". Discuss schemes like PMJDY, KCC, and microfinance delivery mechanisms.',
            options: [],
            correctOption: null,
            explanation: 'Essay Structure: Define financial inclusion beyond zero-balance accounts; evaluate PMJDY, DBT, Kisan Credit Cards; challenges of regional branch density and NPA recovery; conclusion emphasizing digital last-mile banking.',
            difficulty: 'MEDIUM',
            subtopic: 'Financial Inclusion Essay',
        },
        {
            subjectId: descriptiveSubject.id,
            topicId: topicEssays.id,
            questionType: 'DESCRIPTIVE_ESSAY',
            questionText: 'Write an essay in about 200–250 words on the topic: "Artificial Intelligence and Machine Learning in Banking Fraud Prevention: Balancing Automation with Ethical Customer Privacy".',
            options: [],
            correctOption: null,
            explanation: 'Essay Structure: Rise of real-time transaction monitoring and anomaly detection; ethical dilemmas of automated account freezing and customer data privacy under DPDP Act; balanced conclusion on human-in-the-loop oversight.',
            difficulty: 'HARD',
            subtopic: 'Fintech & Ethics Essay',
        },
        {
            subjectId: descriptiveSubject.id,
            topicId: topicEssays.id,
            questionType: 'DESCRIPTIVE_ESSAY',
            questionText: 'Write an essay in about 200–250 words on the topic: "Green Financing and Sustainable Banking: Assessing the Banking Sector’s Commitment to Net-Zero Climate Targets".',
            options: [],
            correctOption: null,
            explanation: 'Essay Structure: Definition of ESG bonds and green credit; RBI guidance on climate risk disclosure; transition financing for renewable energy; concluding outlook on sustainable economic resilience.',
            difficulty: 'HARD',
            subtopic: 'Green Finance Essay',
        },
    ];

    let insertedCount = 0;
    for (const q of newQuestions) {
        const qHash = computeHash(q.questionText);
        const existing = await prisma.question.findFirst({
            where: {
                examId: exam.id,
                questionHash: qHash,
            },
        });

        if (!existing) {
            await prisma.question.create({
                data: {
                    examId: exam.id,
                    subjectId: q.subjectId,
                    topicId: q.topicId,
                    questionText: q.questionText,
                    questionType: q.questionType || 'OBJECTIVE_MCQ',
                    options: Array.isArray(q.options) ? JSON.stringify(q.options) : q.options,
                    correctOption: q.correctOption || (q.questionType === 'DESCRIPTIVE_ESSAY' ? 'DESCRIPTIVE' : 'A'),
                    explanation: q.explanation,
                    difficulty: q.difficulty || 'MEDIUM',
                    subtopic: q.subtopic || 'General',
                    status: 'PUBLISHED',
                    source: 'VERIFIED',
                    questionHash: qHash,
                },
            });
            insertedCount++;
        }
    }

    console.log(`✅ Seeded ${insertedCount} new authentic questions and descriptive prompts.`);
}

seedIbpsPoMainsQuestions()
    .catch((err) => {
        console.error('Seeding failed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
