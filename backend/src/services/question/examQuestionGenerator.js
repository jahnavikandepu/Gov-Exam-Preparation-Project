import { generateQuestionHash } from '../../utils/questionHash.js';
export class ExamQuestionGenerator {
    /**
     * Generates a batch of unique, syllabus-aligned questions using calibrated question factories.
     */
    static generateBatch(params) {
        const { examName, sectionName, subjectName, topicName = 'General', difficulty = 'MEDIUM', count = 5, excludedHashes = new Set(), } = params;
        const results = [];
        const localHashes = new Set();
        const subNameLower = `${subjectName} ${sectionName}`.toLowerCase();
        let generatorFn;
        if (subNameLower.includes('general studies') && subNameLower.includes('mental')) {
            // APPSC Part A or composite GS + Mental Ability
            generatorFn = (s, d) => {
                const branch = s % 4;
                if (branch === 0)
                    return this.generateAPPSCQuestion(s, d, topicName, examName);
                if (branch === 1)
                    return this.generateReasoningQuestion(s, d, topicName, examName);
                if (branch === 2)
                    return this.generateGeneralAwarenessQuestion(s, d, topicName, examName);
                return this.generateMathQuestion(s, d, topicName, examName);
            };
        }
        else if (subNameLower.includes('science') && subNameLower.includes('math')) {
            // APPSC Part B (General Science & Mathematics)
            generatorFn = (s, d) => {
                const branch = s % 2;
                if (branch === 0)
                    return this.generateScienceQuestion(s, d, topicName, examName);
                return this.generateMathQuestion(s, d, topicName, examName);
            };
        }
        else if (subNameLower.includes('math') ||
            subNameLower.includes('quant') ||
            subNameLower.includes('arithmetic') ||
            subNameLower.includes('numerical')) {
            generatorFn = (s, d) => this.generateMathQuestion(s, d, topicName, examName);
        }
        else if (subNameLower.includes('reason') ||
            subNameLower.includes('intelligence') ||
            subNameLower.includes('mental')) {
            generatorFn = (s, d) => this.generateReasoningQuestion(s, d, topicName, examName);
        }
        else if (subNameLower.includes('science') ||
            subNameLower.includes('physics') ||
            subNameLower.includes('chemistry') ||
            subNameLower.includes('environment')) {
            generatorFn = (s, d) => this.generateScienceQuestion(s, d, topicName, examName);
        }
        else if (subNameLower.includes('english')) {
            generatorFn = (s, d) => this.generateEnglishQuestion(s, d, topicName, examName);
        }
        else if (subNameLower.includes('technical') || subNameLower.includes('computer')) {
            generatorFn = (s, d) => this.generateTechnicalQuestion(s, d, topicName, examName);
        }
        else if (subNameLower.includes('bank') || subNameLower.includes('economy') || subNameLower.includes('financial')) {
            generatorFn = (s, d) => this.generateBankingEconomyQuestion(s, d, topicName, examName);
        }
        else if (examName.toLowerCase().includes('appsc')) {
            generatorFn = (s, d) => this.generateAPPSCQuestion(s, d, topicName, examName);
        }
        else {
            generatorFn = (s, d) => this.generateGeneralAwarenessQuestion(s, d, topicName, examName);
        }
        let attempts = 0;
        const maxAttempts = Math.max(5000, count * 300);
        while (results.length < count && attempts < maxAttempts) {
            attempts++;
            const randomSeed = Math.floor(Math.random() * 20000000) + attempts * 223 + results.length * 1031;
            let qDiff = difficulty;
            if (count > 3) {
                const rand = Math.random();
                if (rand < 0.3)
                    qDiff = 'EASY';
                else if (rand < 0.8)
                    qDiff = 'MEDIUM';
                else
                    qDiff = 'HARD';
            }
            const q = generatorFn(randomSeed, qDiff);
            const hash = generateQuestionHash(q.questionText, q.options);
            if (!excludedHashes.has(hash) && !localHashes.has(hash)) {
                localHashes.add(hash);
                q.questionHash = hash;
                results.push(q);
            }
        }
        return results;
    }
    // =========================================================================
    // 1. MATHEMATICS & QUANTITATIVE APTITUDE
    // =========================================================================
    static generateMathQuestion(seed, diff, topicName, examName) {
        const type = seed % 12;
        if (type === 0) {
            // Percentages
            const p1 = 5 + (seed % 30) * 3;
            const reduction = Math.round((p1 / (100 + p1)) * 100 * 100) / 100;
            return {
                questionText: `If the market price of an essential commodity increases by ${p1}%, by what percentage must a household reduce its consumption so that total expenditure remains unchanged?`,
                options: [
                    { id: 'A', text: `${reduction}%` },
                    { id: 'B', text: `${Math.round((reduction + 2.5) * 100) / 100}%` },
                    { id: 'C', text: `${Math.round((reduction - 2.2) * 100) / 100}%` },
                    { id: 'D', text: `${p1}%` },
                ],
                correctOption: 'A',
                explanation: `Consumption reduction formula = [R / (100 + R)] * 100 = [${p1} / (100 + ${p1})] * 100 = ${reduction}%.`,
                difficulty: diff,
                subtopic: 'Percentages',
            };
        }
        else if (type === 1) {
            // Profit & Loss
            const cp = 200 + (seed % 150) * 15;
            const profitPct = 8 + (seed % 15) * 3;
            const discPct = 5 + ((seed >> 2) % 10) * 3;
            const sp = Math.round(cp * (1 + profitPct / 100));
            const mp = Math.round(sp / (1 - discPct / 100));
            return {
                questionText: `A trader buys an item for ₹${cp}. At what marked price (MP) should he list it so that after granting a trade discount of ${discPct}%, he still secures a net profit of ${profitPct}%?`,
                options: [
                    { id: 'A', text: `₹${mp + 45}` },
                    { id: 'B', text: `₹${mp}` },
                    { id: 'C', text: `₹${mp - 40}` },
                    { id: 'D', text: `₹${Math.round(cp * 1.4)}` },
                ],
                correctOption: 'B',
                explanation: `SP = CP * (100 + ${profitPct})/100 = ₹${sp}.\nMP = SP / (1 - ${discPct}/100) = ₹${mp}.`,
                difficulty: diff,
                subtopic: 'Profit & Loss',
            };
        }
        else if (type === 2) {
            // Simple and Compound Interest
            const p = 2500 + (seed % 100) * 500;
            const r = 3 + (seed % 12) * 1.5;
            const t = 2;
            const diffAmount = Math.round((p * Math.pow(r / 100, 2)) * 100) / 100;
            return {
                questionText: `What is the absolute difference between the Compound Interest (compounded annually) and Simple Interest on a principal sum of ₹${p} for ${t} years at an interest rate of ${r}% per annum?`,
                options: [
                    { id: 'A', text: `₹${diffAmount}` },
                    { id: 'B', text: `₹${Math.round((diffAmount + 15) * 100) / 100}` },
                    { id: 'C', text: `₹${Math.round((diffAmount * 1.5) * 100) / 100}` },
                    { id: 'D', text: `₹${Math.round((diffAmount - 8) * 100) / 100}` },
                ],
                correctOption: 'A',
                explanation: `Difference for 2 years = P * (R / 100)² = ${p} * (${r} / 100)² = ₹${diffAmount}.`,
                difficulty: diff,
                subtopic: 'Simple & Compound Interest',
            };
        }
        else if (type === 3) {
            // Time and Work
            const a = 6 + (seed % 25) * 2;
            const b = 9 + ((seed >> 2) % 20) * 3;
            const days = Math.round(((a * b) / (a + b)) * 100) / 100;
            return {
                questionText: `Worker A can complete a task in ${a} days, while worker B can complete the same task in ${b} days. If both work together, in how many days will the task be completed?`,
                options: [
                    { id: 'A', text: `${Math.round((days + 1.5) * 100) / 100} days` },
                    { id: 'B', text: `${days} days` },
                    { id: 'C', text: `${Math.round((days - 1.2) * 100) / 100} days` },
                    { id: 'D', text: `${(a + b) / 2} days` },
                ],
                correctOption: 'B',
                explanation: `Combined rate = (1/${a}) + (1/${b}) = (${a + b}) / (${a * b}). Total days = (${a} * ${b}) / (${a} + ${b}) = ${days} days.`,
                difficulty: diff,
                subtopic: 'Time & Work',
            };
        }
        else if (type === 4) {
            // Time, Speed & Distance
            const speedKmph = 36 + (seed % 15) * 18;
            const speedMps = (speedKmph * 5) / 18;
            const lenTrain = 100 + (seed % 25) * 30;
            const lenPlat = 150 + ((seed >> 3) % 20) * 40;
            const time = Math.round(((lenTrain + lenPlat) / speedMps) * 10) / 10;
            return {
                questionText: `A train of length ${lenTrain} meters traveling at a uniform speed of ${speedKmph} km/h passes a railway platform of length ${lenPlat} meters. What is the time taken to cross the platform completely?`,
                options: [
                    { id: 'A', text: `${time} seconds` },
                    { id: 'B', text: `${Math.round((time + 5) * 10) / 10} seconds` },
                    { id: 'C', text: `${Math.round((time - 4) * 10) / 10} seconds` },
                    { id: 'D', text: `${Math.round((lenTrain / speedMps) * 10) / 10} seconds` },
                ],
                correctOption: 'A',
                explanation: `Speed in m/s = ${speedKmph} * (5/18) = ${speedMps} m/s. Total distance = ${lenTrain} + ${lenPlat} = ${lenTrain + lenPlat} m. Time = ${lenTrain + lenPlat} / ${speedMps} = ${time} seconds.`,
                difficulty: diff,
                subtopic: 'Speed, Time & Distance',
            };
        }
        else if (type === 5) {
            // Ratio & Proportion
            const r1 = 2 + (seed % 8);
            const r2 = 3 + ((seed >> 2) % 9);
            const multiplier = 30 + (seed % 50) * 15;
            const total = (r1 + r2) * multiplier;
            const val1 = r1 * multiplier;
            const val2 = r2 * multiplier;
            return {
                questionText: `A sum of ₹${total} is distributed between two partners X and Y in the ratio ${r1} : ${r2}. How much amount does partner Y receive?`,
                options: [
                    { id: 'A', text: `₹${val1}` },
                    { id: 'B', text: `₹${val2}` },
                    { id: 'C', text: `₹${val2 + 100}` },
                    { id: 'D', text: `₹${val1 - 50}` },
                ],
                correctOption: 'B',
                explanation: `Sum of ratio parts = ${r1} + ${r2} = ${r1 + r2}. Value of 1 part = ${total} / ${r1 + r2} = ₹${multiplier}. Partner Y share = ${r2} * ${multiplier} = ₹${val2}.`,
                difficulty: diff,
                subtopic: 'Ratio & Proportion',
            };
        }
        else if (type === 6) {
            // Averages
            const n = 4 + (seed % 12);
            const baseAvg = 30 + (seed % 40);
            const newScore = baseAvg + n * 4;
            const newAvg = baseAvg + 4;
            return {
                questionText: `The average score of a batsman in ${n} innings is ${baseAvg}. In the next (${n + 1}th) inning, he scores ${newScore} runs. What is his new average score?`,
                options: [
                    { id: 'A', text: `${newAvg}` },
                    { id: 'B', text: `${newAvg + 2}` },
                    { id: 'C', text: `${baseAvg}` },
                    { id: 'D', text: `${newAvg - 3}` },
                ],
                correctOption: 'A',
                explanation: `Total runs in ${n} innings = ${n} * ${baseAvg} = ${n * baseAvg}. After new score: Total = ${n * baseAvg} + ${newScore} = ${n * baseAvg + newScore}. New Average = ${n * baseAvg + newScore} / ${n + 1} = ${newAvg}.`,
                difficulty: diff,
                subtopic: 'Averages',
            };
        }
        else if (type === 7) {
            // Mensuration / Geometry
            const radius = 7 * (1 + (seed % 20));
            const area = Math.round((22 / 7) * radius * radius);
            const circum = Math.round(2 * (22 / 7) * radius);
            return {
                questionText: `A circular plot has a radius of ${radius} meters. What is the total area of the plot (taking π = 22/7)?`,
                options: [
                    { id: 'A', text: `${area} m²` },
                    { id: 'B', text: `${circum} m²` },
                    { id: 'C', text: `${area + 44} m²` },
                    { id: 'D', text: `${Math.round(area * 1.15)} m²` },
                ],
                correctOption: 'A',
                explanation: `Area of circle = π * r² = (22/7) * ${radius} * ${radius} = ${area} m².`,
                difficulty: diff,
                subtopic: 'Mensuration (2D/3D)',
            };
        }
        else if (type === 8) {
            // Mixture and Alligation
            const p1 = 15 + (seed % 20) * 5;
            const p2 = 45 + ((seed >> 2) % 20) * 5;
            const meanPrice = p1 + Math.round((p2 - p1) * 0.4);
            const ratioA = p2 - meanPrice;
            const ratioB = meanPrice - p1;
            return {
                questionText: `In what proportion must a merchant mix two varieties of grain worth ₹${p1}/kg and ₹${p2}/kg so that the mixture is worth ₹${meanPrice}/kg?`,
                options: [
                    { id: 'A', text: `${ratioA} : ${ratioB}` },
                    { id: 'B', text: `${ratioB} : ${ratioA}` },
                    { id: 'C', text: `1 : 2` },
                    { id: 'D', text: `3 : 4` },
                ],
                correctOption: 'A',
                explanation: `By Rule of Alligation: (Quantity of Cheaper) / (Quantity of Dearer) = (${p2} - ${meanPrice}) / (${meanPrice} - ${p1}) = ${ratioA} : ${ratioB}.`,
                difficulty: diff,
                subtopic: 'Mixtures & Alligations',
            };
        }
        else if (type === 9) {
            // Quadratic & Algebra
            const r1 = 2 + (seed % 15);
            const r2 = 3 + ((seed >> 3) % 15);
            const bCoeff = -(r1 + r2);
            const cCoeff = r1 * r2;
            return {
                questionText: `Find the roots of the quadratic equation x² ${bCoeff < 0 ? bCoeff : '+' + bCoeff}x + ${cCoeff} = 0.`,
                options: [
                    { id: 'A', text: `x = ${r1}, x = ${r2}` },
                    { id: 'B', text: `x = -${r1}, x = -${r2}` },
                    { id: 'C', text: `x = ${r1 + 1}, x = ${r2 - 1}` },
                    { id: 'D', text: `x = 0, x = ${cCoeff}` },
                ],
                correctOption: 'A',
                explanation: `Factoring equation: (x - ${r1})(x - ${r2}) = 0, yielding roots x = ${r1} and x = ${r2}.`,
                difficulty: diff,
                subtopic: 'Algebra & Equations',
            };
        }
        else if (type === 10) {
            // Pipes & Cisterns
            const pipeA = 4 + (seed % 12) * 2;
            const pipeB = 8 + ((seed >> 2) % 12) * 2;
            const timeHours = Math.round(((pipeA * pipeB) / (pipeA + pipeB)) * 100) / 100;
            return {
                questionText: `Pipe A can fill an empty reservoir in ${pipeA} hours, while Pipe B can fill it in ${pipeB} hours. If both pipes are opened simultaneously into the empty reservoir, how many hours will it take to fill it completely?`,
                options: [
                    { id: 'A', text: `${timeHours} hours` },
                    { id: 'B', text: `${Math.round((timeHours + 2.4) * 100) / 100} hours` },
                    { id: 'C', text: `${(pipeA + pipeB) / 2} hours` },
                    { id: 'D', text: `${Math.round((timeHours * 1.5) * 100) / 100} hours` },
                ],
                correctOption: 'A',
                explanation: `Combined filling rate per hour = (1/${pipeA}) + (1/${pipeB}) = (${pipeA + pipeB}) / (${pipeA * pipeB}). Total time = ${timeHours} hours.`,
                difficulty: diff,
                subtopic: 'Pipes & Cisterns',
            };
        }
        else {
            // Boats & Streams
            const boatSpeed = 10 + (seed % 15) * 2;
            const streamSpeed = 2 + ((seed >> 2) % 6);
            const downSpeed = boatSpeed + streamSpeed;
            const upSpeed = boatSpeed - streamSpeed;
            const dist = downSpeed * 3;
            const timeUp = Math.round((dist / upSpeed) * 10) / 10;
            return {
                questionText: `A boat has a speed of ${boatSpeed} km/h in still water. If the speed of the river current is ${streamSpeed} km/h, how much time will the boat take to travel a distance of ${dist} km upstream?`,
                options: [
                    { id: 'A', text: `${timeUp} hours` },
                    { id: 'B', text: `3.0 hours` },
                    { id: 'C', text: `${Math.round((timeUp + 1.8) * 10) / 10} hours` },
                    { id: 'D', text: `${Math.round((dist / boatSpeed) * 10) / 10} hours` },
                ],
                correctOption: 'A',
                explanation: `Upstream speed = Boat Speed - Stream Speed = ${boatSpeed} - ${streamSpeed} = ${upSpeed} km/h. Time = ${dist} / ${upSpeed} = ${timeUp} hours.`,
                difficulty: diff,
                subtopic: 'Boats & Streams',
            };
        }
    }
    // =========================================================================
    // 2. GENERAL INTELLIGENCE & REASONING
    // =========================================================================
    static generateReasoningQuestion(seed, diff, topicName, examName) {
        const type = seed % 8;
        if (type === 0) {
            // Geometric / Arithmetic Series
            const start = 2 + (seed % 30);
            const step = 2 + ((seed >> 2) % 8);
            const s0 = start;
            const s1 = s0 * step;
            const s2 = s1 * step;
            const s3 = s2 * step;
            const s4 = s3 * step;
            const next = s4 * step;
            return {
                questionText: `Find the missing term that logically completes the geometric series:\n${s0}, ${s1}, ${s2}, ${s3}, ${s4}, ?`,
                options: [
                    { id: 'A', text: `${next}` },
                    { id: 'B', text: `${next * 2}` },
                    { id: 'C', text: `${next - 20}` },
                    { id: 'D', text: `${s4 + step * 10}` },
                ],
                correctOption: 'A',
                explanation: `Each consecutive term is multiplied by constant ratio of ${step} (i.e. ${s4} * ${step} = ${next}).`,
                difficulty: diff,
                subtopic: 'Number & Letter Series',
            };
        }
        else if (type === 1) {
            // Direction Sense
            const d1 = 6 + (seed % 30) * 2;
            const d2 = 4 + ((seed >> 2) % 25) * 2;
            return {
                questionText: `A delivery executive travels ${d1} km towards North, turns right and travels ${d2} km. He then turns right again and travels ${d1} km. How far and in which direction is he now from his original starting point?`,
                options: [
                    { id: 'A', text: `${d2} km East` },
                    { id: 'B', text: `${d2} km West` },
                    { id: 'C', text: `${d1 + d2} km North` },
                    { id: 'D', text: `${d1} km South` },
                ],
                correctOption: 'A',
                explanation: `North and South legs of ${d1} km cancel each other out. Net displacement is ${d2} km in East direction.`,
                difficulty: diff,
                subtopic: 'Direction Sense',
            };
        }
        else if (type === 2) {
            // Syllogism
            const pairs = [
                ['Laptops', 'Electronic Devices', 'Computers'],
                ['Oceans', 'Water Bodies', 'Hydrosphere'],
                ['Trees', 'Plants', 'Organisms'],
                ['Metals', 'Conductors', 'Elements'],
                ['Birds', 'Vertebrates', 'Animals'],
                ['Apples', 'Fruits', 'Food Items'],
                ['Roses', 'Flowers', 'Flora'],
                ['Cars', 'Vehicles', 'Machines'],
                ['Diamonds', 'Minerals', 'Solids'],
                ['Novels', 'Books', 'Publications'],
            ];
            const p = pairs[seed % pairs.length];
            return {
                questionText: `Statements:\n1. All ${p[0]} are ${p[1]}.\n2. All ${p[1]} are ${p[2]}.\n\nConclusions:\nI. All ${p[0]} are ${p[2]}.\nII. Some ${p[2]} are ${p[0]}.`,
                options: [
                    { id: 'A', text: 'Only Conclusion I follows' },
                    { id: 'B', text: 'Only Conclusion II follows' },
                    { id: 'C', text: 'Neither I nor II follows' },
                    { id: 'D', text: 'Both Conclusions I and II follow' },
                ],
                correctOption: 'D',
                explanation: `Since ${p[0]} ⊆ ${p[1]} ⊆ ${p[2]}, all ${p[0]} are ${p[2]} (I holds), and some ${p[2]} are ${p[0]} (II holds). Both follow.`,
                difficulty: diff,
                subtopic: 'Syllogism',
            };
        }
        else if (type === 3) {
            // Blood Relations
            const relations = [
                { intro: 'Pointing to a gentleman, Sneha says: "His mother is the only daughter of my mother."', ans: 'Son', wrong: 'Brother' },
                { intro: 'Pointing to a girl in a photograph, Rohit says: "Her mother\'s only brother is my father."', ans: 'Cousin', wrong: 'Sister' },
                { intro: 'Introducing a boy, a woman said: "His father is the only son of my father-in-law."', ans: 'Son', wrong: 'Nephew' },
                { intro: 'Looking at a portrait, a man said: "Brothers and sisters I have none, but that man\'s father is my father\'s son."', ans: 'His Son', wrong: 'Himself' },
                { intro: 'Pointing to a woman in a park, Anish says: "She is the daughter-in-law of the grandmother of my father\'s only son."', ans: 'Mother', wrong: 'Aunt' },
                { intro: 'A man introduces a woman saying: "Her mother is the only daughter of my mother-in-law."', ans: 'Daughter', wrong: 'Niece' },
            ];
            const rel = relations[seed % relations.length];
            return {
                questionText: `${rel.intro} How is the person in discussion related to the speaker?`,
                options: [
                    { id: 'A', text: rel.ans },
                    { id: 'B', text: rel.wrong },
                    { id: 'C', text: 'Uncle' },
                    { id: 'D', text: 'Father' },
                ],
                correctOption: 'A',
                explanation: `Deduction: The statement directly maps to the speaker's ${rel.ans}.`,
                difficulty: diff,
                subtopic: 'Blood Relations',
            };
        }
        else if (type === 4) {
            // Coding Decoding
            const words = [
                { word: 'ROSE', code: 'TQVI', target: 'MINT', ans: 'OKPV' },
                { word: 'LEMON', code: 'OGPRQ', target: 'WATER', ans: 'ZDWHT' },
                { word: 'EARTH', code: 'GCTVJ', target: 'SOLAR', ans: 'UQNCX' },
                { word: 'TRAIN', code: 'VTCPP', target: 'PLANE', ans: 'RNCPE' },
                { word: 'CLOUD', code: 'ENQWF', target: 'RIVER', ans: 'TKXGT' },
                { word: 'BRAIN', code: 'DTCKP', target: 'SMART', ans: 'UOCTV' },
                { word: 'LIGHT', code: 'NKIJV', target: 'POWER', ans: 'RQYGT' },
            ];
            const w = words[seed % words.length];
            return {
                questionText: `In a certain cipher code language, if "${w.word}" is encoded as "${w.code}", how will "${w.target}" be encoded in that same cipher rule?`,
                options: [
                    { id: 'A', text: w.ans },
                    { id: 'B', text: w.ans.split('').reverse().join('') },
                    { id: 'C', text: 'XKZMT' },
                    { id: 'D', text: 'ABCDQ' },
                ],
                correctOption: 'A',
                explanation: `Each alphabet in the word is shifted forward by +2 positions in alphabetical rank (e.g. ${w.target} -> ${w.ans}).`,
                difficulty: diff,
                subtopic: 'Coding-Decoding',
            };
        }
        else if (type === 5) {
            // Analogies
            const analogies = [
                { a: 'Architect', b: 'Building', c: 'Sculptor', ans: 'Statue', wrong: 'Chisel' },
                { a: 'Ohm', b: 'Resistance', c: 'Pascal', ans: 'Pressure', wrong: 'Energy' },
                { a: 'Barometer', b: 'Atmospheric Pressure', c: 'Hygrometer', ans: 'Humidity', wrong: 'Wind Speed' },
                { a: 'Cardiology', b: 'Heart', c: 'Nephrology', ans: 'Kidney', wrong: 'Brain' },
                { a: 'Currency', b: 'Yen', c: 'Capital', ans: 'Tokyo', wrong: 'Japan' },
                { a: 'Ammeter', b: 'Current', c: 'Voltmeter', ans: 'Potential Difference', wrong: 'Power' },
                { a: 'Ornithology', b: 'Birds', c: 'Mycology', ans: 'Fungi', wrong: 'Insects' },
                { a: 'Entomology', b: 'Insects', c: 'Ichthyology', ans: 'Fishes', wrong: 'Reptiles' },
                { a: 'India', b: 'Rupee', c: 'United Kingdom', ans: 'Pound Sterling', wrong: 'Euro' },
            ];
            const an = analogies[seed % analogies.length];
            return {
                questionText: `Select the word pair that demonstrates the same relationship as:\n${an.a} : ${an.b} :: ${an.c} : ?`,
                options: [
                    { id: 'A', text: an.ans },
                    { id: 'B', text: an.wrong },
                    { id: 'C', text: 'Laboratory' },
                    { id: 'D', text: 'Instrument' },
                ],
                correctOption: 'A',
                explanation: `${an.a} relates to ${an.b} as ${an.c} directly corresponds to ${an.ans}.`,
                difficulty: diff,
                subtopic: 'Analogies & Classification',
            };
        }
        else if (type === 6) {
            // Seating Arrangement / Order Ranking
            const totalPersons = 20 + (seed % 60);
            const rankTop = 4 + (seed % 20);
            const rankBottom = totalPersons - rankTop + 1;
            return {
                questionText: `In a merit list of ${totalPersons} candidates, Arjun ranks ${rankTop}th from the top. What is Arjun's rank from the bottom of the list?`,
                options: [
                    { id: 'A', text: `${rankBottom}th` },
                    { id: 'B', text: `${rankBottom - 1}th` },
                    { id: 'C', text: `${rankBottom + 1}th` },
                    { id: 'D', text: `${totalPersons - rankTop}th` },
                ],
                correctOption: 'A',
                explanation: `Formula: Rank from bottom = (Total Candidates - Rank from Top) + 1 = (${totalPersons} - ${rankTop}) + 1 = ${rankBottom}th.`,
                difficulty: diff,
                subtopic: 'Ranking & Order',
            };
        }
        else {
            // Venn Diagrams & Logic
            const vennPairs = [
                {
                    items: '"Mammals", "Whales", and "Birds"',
                    ans: 'One circle completely inside another circle, with the third circle entirely separate',
                    exp: 'All Whales are Mammals (Whale circle inside Mammals circle). Birds are distinct non-mammalian organisms (separate circle).'
                },
                {
                    items: '"Professors", "Authors", and "Females"',
                    ans: 'Three mutually intersecting circles overlapping at the center',
                    exp: 'A person can simultaneously be a professor, an author, and female (intersection of all three).'
                },
                {
                    items: '"Reptiles", "Snakes", and "Lizards"',
                    ans: 'Two separate non-overlapping circles enclosed within one larger circle',
                    exp: 'Both Snakes and Lizards are distinct groups belonging completely inside the Reptiles group.'
                },
                {
                    items: '"Vegetables", "Potatoes", and "Cabbage"',
                    ans: 'Two separate circles completely inside a third outer circle',
                    exp: 'Potatoes and Cabbage are disjoint vegetables completely enclosed within Vegetables.'
                }
            ];
            const vp = vennPairs[seed % vennPairs.length];
            return {
                questionText: `Which geometric representation correctly portrays the logical relationship between: ${vp.items}?`,
                options: [
                    { id: 'A', text: vp.ans },
                    { id: 'B', text: 'Three mutually intersecting circles' },
                    { id: 'C', text: 'Three concentric nested circles' },
                    { id: 'D', text: 'Three completely disjoint separated circles' },
                ],
                correctOption: 'A',
                explanation: vp.exp,
                difficulty: diff,
                subtopic: 'Venn Diagrams',
            };
        }
    }
    // =========================================================================
    // 3. GENERAL AWARENESS, POLITY, HISTORY & CURRENT AFFAIRS
    // =========================================================================
    static generateGeneralAwarenessQuestion(seed, diff, topicName, examName) {
        const polityArticles = [
            { art: 'Article 14', topic: 'Equality before Law and Equal Protection of the Laws' },
            { art: 'Article 15', topic: 'Prohibition of Discrimination on Grounds of Religion, Race, Caste, Sex or Place of Birth' },
            { art: 'Article 16', topic: 'Equality of Opportunity in Matters of Public Employment' },
            { art: 'Article 17', topic: 'Abolition of Untouchability' },
            { art: 'Article 18', topic: 'Abolition of Titles except Military and Academic' },
            { art: 'Article 19(1)(a)', topic: 'Freedom of Speech and Expression' },
            { art: 'Article 20', topic: 'Protection in Respect of Conviction for Offences (Double Jeopardy)' },
            { art: 'Article 21', topic: 'Protection of Life and Personal Liberty' },
            { art: 'Article 21A', topic: 'Right to Free and Compulsory Elementary Education' },
            { art: 'Article 23', topic: 'Prohibition of Traffic in Human Beings and Forced Labour' },
            { art: 'Article 24', topic: 'Prohibition of Employment of Children in Factories and Hazardous Work' },
            { art: 'Article 25', topic: 'Freedom of Conscience and Free Profession, Practice and Propagation of Religion' },
            { art: 'Article 29', topic: 'Protection of Interests of Minorities' },
            { art: 'Article 30', topic: 'Right of Minorities to Establish and Administer Educational Institutions' },
            { art: 'Article 32', topic: 'Right to Constitutional Remedies (Writ Jurisdiction of Supreme Court)' },
            { art: 'Article 39A', topic: 'Equal Justice and Free Legal Aid' },
            { art: 'Article 40', topic: 'Organization of Village Panchayats' },
            { art: 'Article 44', topic: 'Uniform Civil Code for citizens across India' },
            { art: 'Article 45', topic: 'Early Childhood Care and Education to children below six years' },
            { art: 'Article 48A', topic: 'Protection and Improvement of Environment and Safeguarding of Forests and Wildlife' },
            { art: 'Article 50', topic: 'Separation of Judiciary from Executive' },
            { art: 'Article 51', topic: 'Promotion of International Peace and Security' },
            { art: 'Article 51A', topic: 'Fundamental Duties of Indian Citizens' },
            { art: 'Article 52', topic: 'The President of India' },
            { art: 'Article 61', topic: 'Procedure for Impeachment of the President' },
            { art: 'Article 72', topic: 'Pardoning Powers of the President of India' },
            { art: 'Article 74', topic: 'Council of Ministers to aid and advise the President' },
            { art: 'Article 76', topic: 'Office of the Attorney General for India' },
            { art: 'Article 108', topic: 'Joint Sitting of Both Houses of Parliament in Certain Cases' },
            { art: 'Article 110', topic: 'Definition and Procedure for Money Bills' },
            { art: 'Article 112', topic: 'Annual Financial Statement (Union Budget)' },
            { art: 'Article 123', topic: 'Power of President to promulgate Ordinances during recess of Parliament' },
            { art: 'Article 124', topic: 'Establishment and Constitution of Supreme Court of India' },
            { art: 'Article 148', topic: 'Comptroller and Auditor General of India (CAG)' },
            { art: 'Article 153', topic: 'Governors of States' },
            { art: 'Article 165', topic: 'Advocate General for the State' },
            { art: 'Article 213', topic: 'Power of Governor to promulgate Ordinances' },
            { art: 'Article 226', topic: 'Power of High Courts to issue Writs' },
            { art: 'Article 280', topic: 'Constitution and recommendations of the Finance Commission' },
            { art: 'Article 300A', topic: 'Right to Property as a Constitutional/Legal Right' },
            { art: 'Article 312', topic: 'All-India Services' },
            { art: 'Article 324', topic: 'Superintendence, direction, and control of Election Commission of India' },
            { art: 'Article 338', topic: 'National Commission for Scheduled Castes' },
            { art: 'Article 338A', topic: 'National Commission for Scheduled Tribes' },
            { art: 'Article 352', topic: 'Proclamation of National Emergency' },
            { art: 'Article 356', topic: 'President\'s Rule (State Constitutional Emergency)' },
            { art: 'Article 360', topic: 'Proclamation of Financial Emergency' },
            { art: 'Article 368', topic: 'Power of Parliament to amend the Constitution and procedure thereof' }
        ];
        const historyEvents = [
            { event: 'Battle of Plassey', year: '1757', fact: 'British East India Company under Robert Clive defeated Nawab Siraj-ud-Daulah' },
            { event: 'Third Battle of Panipat', year: '1761', fact: 'Ahmad Shah Durrani defeated the Maratha Empire forces led by Sadashivrao Bhau' },
            { event: 'Battle of Buxar', year: '1764', fact: 'British forces led by Hector Munro defeated combined forces of Mir Qasim, Shuja-ud-Daula, and Shah Alam II' },
            { event: 'Treaty of Allahabad', year: '1765', fact: 'Granted Diwani rights of Bengal, Bihar, and Orissa to the East India Company' },
            { event: 'Regulating Act of 1773', year: '1773', fact: 'Elevated Governor of Bengal to Governor-General of Bengal (Warren Hastings)' },
            { event: 'Permanent Settlement of Bengal', year: '1793', fact: 'Introduced by Lord Cornwallis fixing land revenue collection with Zamindars' },
            { event: 'First War of Indian Independence (Sepoy Mutiny)', year: '1857', fact: 'Began at Meerut on May 10, 1857 and led to dissolution of the East India Company' },
            { event: 'Government of India Act (Crown Rule)', year: '1858', fact: 'Transferred governance of India from the Company to the British Crown' },
            { event: 'Establishment of the Indian National Congress', year: '1885', fact: 'Founded in Bombay by A.O. Hume with W.C. Bonnerjee as first President' },
            { event: 'Partition of Bengal by Lord Curzon', year: '1905', fact: 'Sparked the nationwide Swadeshi and Boycott Movement' },
            { event: 'Formation of the All-India Muslim League at Dacca', year: '1906', fact: 'Founded under the leadership of Nawab Salimullah and Aga Khan' },
            { event: 'Surat Split of Congress', year: '1907', fact: 'Congress split into Moderates and Extremists presided by Rash Behari Ghosh' },
            { event: 'Morley-Minto Reforms (Indian Councils Act)', year: '1909', fact: 'Introduced separate electorates for Muslims in legislative councils' },
            { event: 'Ghadar Movement founded in San Francisco', year: '1913', fact: 'Founded by Lala Har Dayal and Sohan Singh Bhakna' },
            { event: 'Lucknow Pact signed between INC and Muslim League', year: '1916', fact: 'Reunited moderates and extremists and agreed on joint political demands' },
            { event: 'Home Rule League Movement launched', year: '1916', fact: 'Launched independently by Bal Gangadhar Tilak and Annie Besant' },
            { event: 'Champaran Satyagraha in Bihar', year: '1917', fact: 'Mahatma Gandhi\'s first satyagraha in India against the Tinkathia indigo system' },
            { event: 'Kheda Satyagraha and Ahmedabad Mill Strike', year: '1918', fact: 'Gandhiji led peasant revenue protest and cotton workers\' hunger strike' },
            { event: 'Jallianwala Bagh Massacre', year: '1919', fact: 'General Dyer ordered troops to fire on unarmed gathering in Amritsar' },
            { event: 'Montagu-Chelmsford Reforms (Government of India Act)', year: '1919', fact: 'Introduced Dyarchy in provincial governments' },
            { event: 'Non-Cooperation Movement launched by Gandhiji', year: '1920', fact: 'Launched following the Rowlatt Act and Khilafat issue, called off after Chauri Chaura' },
            { event: 'Chauri Chaura Incident in Gorakhpur', year: '1922', fact: 'Violent clash resulting in burning of police station, prompting Gandhi to suspend Non-Cooperation' },
            { event: 'Kakori Train Action (Conspiracy)', year: '1925', fact: 'HRA revolutionaries including Ram Prasad Bismil and Ashfaqullah Khan stopped the 8-Down train' },
            { event: 'Simon Commission arrived in India', year: '1928', fact: 'All-British commission boycotted nationwide leading to Lala Lajpat Rai\'s martyrdom' },
            { event: 'Lahore Session of INC (Poorna Swaraj Declaration)', year: '1929', fact: 'Presided by Jawaharlal Nehru, adopting complete independence as the national goal' },
            { event: 'Civil Disobedience Movement and Dandi March', year: '1930', fact: 'Gandhiji marched 240 miles from Sabarmati to Dandi to break the Salt Law' },
            { event: 'First Round Table Conference in London', year: '1930', fact: 'Held without INC representation to discuss constitutional reforms' },
            { event: 'Gandhi-Irwin Pact signed', year: '1931', fact: 'Agreement paving way for Congress participation in the Second Round Table Conference' },
            { event: 'Poona Pact signed between Dr. B.R. Ambedkar and Gandhiji', year: '1932', fact: 'Agreed on reserved seats for Depressed Classes in general provincial legislatures' },
            { event: 'Government of India Act passed', year: '1935', fact: 'Provided for establishment of an All-India Federation and Provincial Autonomy' },
            { event: 'August Offer announced by Viceroy Linlithgow', year: '1940', fact: 'Proposed expansion of Governor-General\'s council and Dominion status after the war' },
            { event: 'Cripps Mission arrived in India', year: '1942', fact: 'Headed by Sir Stafford Cripps, rejected by Congress as "a post-dated cheque on a failing bank"' },
            { event: 'Quit India Movement ("Do or Die" call)', year: '1942', fact: 'Launched at Bombay Gowalia Tank Maidan by Mahatma Gandhi' },
            { event: 'Cabinet Mission arrived in India', year: '1946', fact: 'Formulated plan for the Constituent Assembly and interim government' },
            { event: 'Mountbatten Plan (June 3 Plan) announced', year: '1947', fact: 'Outlined the partition of British India into India and Pakistan' }
        ];
        const geographyParks = [
            { park: 'Jim Corbett National Park', state: 'Uttarakhand', sig: 'India\'s first national park established in 1936' },
            { park: 'Kaziranga National Park', state: 'Assam', sig: 'Famous for the Great One-horned Rhinoceros' },
            { park: 'Gir National Park', state: 'Gujarat', sig: 'Sole home of the Asiatic Lion (Panthera leo leo)' },
            { park: 'Sundarbans National Park', state: 'West Bengal', sig: 'Largest tidal halophytic mangrove forest and Royal Bengal Tiger habitat' },
            { park: 'Kanha National Park', state: 'Madhya Pradesh', sig: 'Renowned for Barasingha (Swamp Deer) and Bengal Tigers' },
            { park: 'Keoladeo Ghana National Park (Bharatpur)', state: 'Rajasthan', sig: 'UNESCO site famous for winter migratory avifauna' },
            { park: 'Periyar National Park', state: 'Kerala', sig: 'Elephant and tiger reserve situated around Periyar Lake' },
            { park: 'Hemis National Park', state: 'Ladakh', sig: 'Largest national park in India, renowned for Snow Leopards' },
            { park: 'Manas National Park', state: 'Assam', sig: 'UNESCO World Heritage Site famous for Pygmy Hog and Golden Langur' },
            { park: 'Bandipur National Park', state: 'Karnataka', sig: 'Part of the Nilgiri Biosphere Reserve' },
            { park: 'Ranthambore National Park', state: 'Rajasthan', sig: 'Famous royal tiger reserve situated near Sawai Madhopur' },
            { park: 'Dudhwa National Park', state: 'Uttar Pradesh', sig: 'Located in Terai belt along Indo-Nepal border' },
            { park: 'Simlipal National Park', state: 'Odisha', sig: 'Mayurbhanj biosphere reserve famous for Sal forests and tigers' },
            { park: 'Great Himalayan National Park', state: 'Himachal Pradesh', sig: 'UNESCO site home to Western Tragopan and Snow Leopard' },
            { park: 'Valley of Flowers National Park', state: 'Uttarakhand', sig: 'UNESCO site famous for endemic alpine meadows' },
            { park: 'Khangchendzonga National Park', state: 'Sikkim', sig: 'India\'s first Mixed UNESCO World Heritage Site' },
            { park: 'Silent Valley National Park', state: 'Kerala', sig: 'Famous for Lion-tailed Macaque and evergreen rainforests' },
            { park: 'Desert National Park', state: 'Rajasthan', sig: 'Largest desert habitat protecting Great Indian Bustard' },
            { park: 'Namdapha National Park', state: 'Arunachal Pradesh', sig: 'Famous for harbouring all four big cat species (Tiger, Leopard, Snow Leopard, Clouded Leopard)' }
        ];
        const type = seed % 4;
        if (type === 0) {
            // Polity Article Question
            const p = polityArticles[seed % polityArticles.length];
            return {
                questionText: `Which Article of the Constitution of India deals with **"${p.topic}"**?`,
                options: [
                    { id: 'A', text: p.art },
                    { id: 'B', text: `Article ${(seed % 30) + 150}` },
                    { id: 'C', text: `Article ${(seed % 20) + 80}` },
                    { id: 'D', text: `Article ${(seed % 15) + 330}` },
                ],
                correctOption: 'A',
                explanation: `${p.art} of the Constitution specifically provides for "${p.topic}".`,
                difficulty: diff,
                subtopic: 'Indian Polity & Constitution',
            };
        }
        else if (type === 1) {
            // Modern History Timeline Question
            const h = historyEvents[seed % historyEvents.length];
            return {
                questionText: `In which historic year did the landmark event **"${h.event}"** take place in India?`,
                options: [
                    { id: 'A', text: h.year },
                    { id: 'B', text: `${parseInt(h.year) - 5}` },
                    { id: 'C', text: `${parseInt(h.year) + 4}` },
                    { id: 'D', text: `${parseInt(h.year) - 10}` },
                ],
                correctOption: 'A',
                explanation: `The "${h.event}" took place in ${h.year}. Significance: ${h.fact}.`,
                difficulty: diff,
                subtopic: 'Modern Indian History',
            };
        }
        else if (type === 2) {
            // Geography & National Parks Question
            const g = geographyParks[seed % geographyParks.length];
            return {
                questionText: `In which Indian State or Union Territory is the **"${g.park}"** located?`,
                options: [
                    { id: 'A', text: g.state },
                    { id: 'B', text: 'Karnataka' },
                    { id: 'C', text: 'Odisha' },
                    { id: 'D', text: 'Himachal Pradesh' },
                ],
                correctOption: 'A',
                explanation: `${g.park} is situated in ${g.state}. Note: ${g.sig}.`,
                difficulty: diff,
                subtopic: 'Geography & National Parks',
            };
        }
        else {
            const staticGK = [
                {
                    q: 'Where is the permanent headquarters of the International Court of Justice (ICJ) located?',
                    options: ['The Hague, Netherlands', 'Geneva, Switzerland', 'New York, USA', 'Vienna, Austria'],
                    ans: 'A',
                    exp: 'The International Court of Justice is seated at the Peace Palace in The Hague, Netherlands.',
                    sub: 'International Organizations'
                },
                {
                    q: 'What is the primary objective of the Ramsar Convention signed in Iran in 1971?',
                    options: ['Conservation and sustainable utilization of Wetlands', 'Phasing out Ozone-depleting substances', 'Regulation of Transboundary hazardous waste', 'Preservation of Marine Corals exclusively'],
                    ans: 'A',
                    exp: 'The Ramsar Convention is an international treaty dedicated to the conservation and ecological sustainability of wetlands.',
                    sub: 'Environment & Ecology'
                },
                {
                    q: 'Who was the Governor-General of India when the Indian Railways commenced its maiden passenger train operation between Bombay (Bori Bunder) and Thane in 1853?',
                    options: ['Lord Dalhousie', 'Lord Canning', 'Lord William Bentinck', 'Lord Curzon'],
                    ans: 'A',
                    exp: 'Lord Dalhousie (1848–1856) introduced passenger railways (April 16, 1853), electric telegraph lines, and postal reforms in India.',
                    sub: 'Indian Railways History'
                },
                {
                    q: 'Which classical dance form of India originated in the state of Kerala and is characterized by elaborate makeup and dramatic story-play costumes?',
                    options: ['Kathakali', 'Bharatanatyam', 'Kathak', 'Kuchipudi'],
                    ans: 'A',
                    exp: 'Kathakali is a major classical dance-drama originating in Kerala, distinguished by stylized makeup (Chutti) and costumes.',
                    sub: 'Indian Art & Culture'
                },
                {
                    q: 'Which strait separates India and Sri Lanka in the Indian Ocean?',
                    options: ['Palk Strait', 'Malacca Strait', 'Strait of Hormuz', 'Gibraltar Strait'],
                    ans: 'A',
                    exp: 'The Palk Strait connects the Bay of Bengal with Palk Bay and separates Tamil Nadu (India) from Sri Lanka.',
                    sub: 'Physical Geography'
                },
                {
                    q: 'Under which Schedule of the Indian Constitution are the 22 officially recognized languages listed?',
                    options: ['Eighth Schedule', 'Seventh Schedule', 'Eleventh Schedule', 'Tenth Schedule'],
                    ans: 'A',
                    exp: 'The Eighth Schedule of the Constitution of India lists the 22 official languages of the Republic of India.',
                    sub: 'Indian Polity'
                },
                {
                    q: 'Who was the author of the historic Sanskrit literary masterpiece "Arthashastra", outlining statecraft, economic policy, and military strategy?',
                    options: ['Kautilya (Chanakya)', 'Megasthenes', 'Kalidasa', 'Banabhatta'],
                    ans: 'A',
                    exp: 'Kautilya (also known as Chanakya or Vishnugupta), royal advisor of Chandragupta Maurya, authored the Arthashastra.',
                    sub: 'Ancient Indian History'
                },
                {
                    q: 'Which layer of Earth\'s atmosphere contains the Ozone Layer that absorbs harmful solar ultraviolet (UV) radiation?',
                    options: ['Stratosphere', 'Troposphere', 'Mesosphere', 'Thermosphere'],
                    ans: 'A',
                    exp: 'The Stratosphere (between ~15 km and 50 km altitude) contains the peak concentration of ozone gas.',
                    sub: 'Earth & Atmospheric Science'
                },
                {
                    q: 'Which river is known as the "Dakshin Ganga" or the Ganges of the South due to its length and religious significance?',
                    options: ['Godavari River', 'Krishna River', 'Cauvery River', 'Narmada River'],
                    ans: 'A',
                    exp: 'Godavari is the second longest river in India (1,465 km) and is traditionally called Dakshin Ganga.',
                    sub: 'Indian River Systems'
                },
                {
                    q: 'In the Indian parliamentary system, what is the quorum required to constitute a meeting of either House of Parliament?',
                    options: ['One-tenth (1/10th) of the total number of members of the House', 'One-fifth (1/5th) of the total members', 'One-third (1/3rd) of total members', '50 members unconditionally'],
                    ans: 'A',
                    exp: 'Under Article 100(3), the quorum to constitute a sitting of either House is 10% of total membership (55 in Lok Sabha, 25 in Rajya Sabha).',
                    sub: 'Indian Polity - Parliament'
                },
                {
                    q: 'Which highest mountain peak is situated entirely within the territory of India?',
                    options: ['Kangchenjunga (8,586 m)', 'Nanda Devi (7,816 m)', 'Kamet (7,756 m)', 'K2 (Godwin-Austen)'],
                    ans: 'A',
                    exp: 'Kangchenjunga (8,586 m) in Sikkim is the highest peak in India (and 3rd highest in the world). Nanda Devi is the highest peak completely within India\'s uncontested borders.',
                    sub: 'Physical Geography - Mountains'
                },
                {
                    q: 'Which national trophy is awarded annually for the premier first-class domestic cricket championship in India?',
                    options: ['Ranji Trophy', 'Duleep Trophy', 'Deodhar Trophy', 'Irani Cup'],
                    ans: 'A',
                    exp: 'The Ranji Trophy was instituted in 1934 and is named after Maharaja Ranjitsinhji.',
                    sub: 'Sports & Awards'
                },
                {
                    q: 'Which highest civilian award in the Republic of India was instituted on 2 January 1954?',
                    options: ['Bharat Ratna', 'Padma Vibhushan', 'Padma Bhushan', 'Param Vir Chakra'],
                    ans: 'A',
                    exp: 'Bharat Ratna is the highest civilian honour of India, awarded for exceptional service of highest order.',
                    sub: 'Indian Honours & Awards'
                }
            ];
            const item = staticGK[seed % staticGK.length];
            return {
                questionText: item.q,
                options: [
                    { id: 'A', text: item.options[0] },
                    { id: 'B', text: item.options[1] },
                    { id: 'C', text: item.options[2] },
                    { id: 'D', text: item.options[3] },
                ],
                correctOption: item.ans,
                explanation: item.exp,
                difficulty: diff,
                subtopic: item.sub,
            };
        }
    }
    // =========================================================================
    // 4. GENERAL SCIENCE (PHYSICS, CHEMISTRY, BIOLOGY)
    // =========================================================================
    static generateScienceQuestion(seed, diff, topicName, examName) {
        const type = seed % 10;
        if (type === 0) {
            // Physics: Ohm's Law & Electrical Power
            const voltage = 12 + (seed % 60) * 6;
            const current = 1.5 + ((seed >> 2) % 25) * 0.5;
            const power = Math.round(voltage * current * 10) / 10;
            const resistance = Math.round((voltage / current) * 100) / 100;
            return {
                questionText: `An electric appliance operates on a potential difference of ${voltage} V and draws a steady current of ${current.toFixed(1)} A. What is the power consumed and electrical resistance of the appliance?`,
                options: [
                    { id: 'A', text: `Power = ${power} W, Resistance = ${resistance} Ω` },
                    { id: 'B', text: `Power = ${Math.round((power + 45) * 10) / 10} W, Resistance = ${resistance} Ω` },
                    { id: 'C', text: `Power = ${power} W, Resistance = ${resistance + 5} Ω` },
                    { id: 'D', text: `Power = ${Math.round(voltage * 2)} W, Resistance = 10 Ω` },
                ],
                correctOption: 'A',
                explanation: `Power P = V * I = ${voltage} * ${current.toFixed(1)} = ${power} W. Resistance R = V / I = ${voltage} / ${current.toFixed(1)} = ${resistance} Ω.`,
                difficulty: diff,
                subtopic: 'Physics - Electricity & Power',
            };
        }
        else if (type === 1) {
            // Physics: Kinetic Energy
            const mass = 2 + (seed % 50) * 2;
            const velocity = 3 + ((seed >> 2) % 30) * 2;
            const ke = Math.round(0.5 * mass * velocity * velocity);
            return {
                questionText: `What is the kinetic energy possessed by an object of mass ${mass} kg moving at a velocity of ${velocity} m/s?`,
                options: [
                    { id: 'A', text: `${ke} Joules` },
                    { id: 'B', text: `${ke * 2} Joules` },
                    { id: 'C', text: `${Math.round(ke * 0.75)} Joules` },
                    { id: 'D', text: `${mass * velocity} Joules` },
                ],
                correctOption: 'A',
                explanation: `Kinetic Energy formula: K.E. = 1/2 * m * v² = 0.5 * ${mass} * (${velocity})² = ${ke} Joules.`,
                difficulty: diff,
                subtopic: 'Physics - Work & Energy',
            };
        }
        else if (type === 2) {
            // Physics: Potential Energy (mgh)
            const mass = 2 + (seed % 40) * 2.5;
            const height = 5 + ((seed >> 2) % 35) * 2;
            const g = 9.8;
            const pe = Math.round(mass * g * height * 10) / 10;
            return {
                questionText: `Calculate the gravitational potential energy of a mass of ${mass} kg elevated to a vertical height of ${height} meters above ground level (taking g = 9.8 m/s²).`,
                options: [
                    { id: 'A', text: `${pe} Joules` },
                    { id: 'B', text: `${Math.round((pe + 50) * 10) / 10} Joules` },
                    { id: 'C', text: `${Math.round(pe * 0.5 * 10) / 10} Joules` },
                    { id: 'D', text: `${Math.round(mass * height)} Joules` },
                ],
                correctOption: 'A',
                explanation: `Potential Energy PE = m * g * h = ${mass} * 9.8 * ${height} = ${pe} Joules.`,
                difficulty: diff,
                subtopic: 'Physics - Gravitation & Energy',
            };
        }
        else if (type === 3) {
            // Physics: Wave speed formula v = f * lambda
            const freq = 80 + (seed % 60) * 20;
            const lambda = 0.25 + ((seed >> 2) % 30) * 0.1;
            const speed = Math.round(freq * lambda * 10) / 10;
            return {
                questionText: `A wave has an oscillation frequency of ${freq} Hz and a spatial wavelength of ${lambda.toFixed(2)} meters. What is the propagation velocity of this wave?`,
                options: [
                    { id: 'A', text: `${speed} m/s` },
                    { id: 'B', text: `${Math.round((speed + 45) * 10) / 10} m/s` },
                    { id: 'C', text: `${Math.round((speed / 2) * 10) / 10} m/s` },
                    { id: 'D', text: `330 m/s` },
                ],
                correctOption: 'A',
                explanation: `Wave Velocity formula: v = f * λ = ${freq} * ${lambda.toFixed(2)} = ${speed} m/s.`,
                difficulty: diff,
                subtopic: 'Physics - Waves & Sound',
            };
        }
        else if (type === 4) {
            // Chemistry: Mole Concept
            const chemicals = [
                { formula: 'H₂O (Water)', molarMass: 18 },
                { formula: 'CO₂ (Carbon Dioxide)', molarMass: 44 },
                { formula: 'NaCl (Sodium Chloride)', molarMass: 58.5 },
                { formula: 'CaCO₃ (Calcium Carbonate)', molarMass: 100 },
                { formula: 'H₂SO₄ (Sulphuric Acid)', molarMass: 98 },
                { formula: 'NaOH (Sodium Hydroxide)', molarMass: 40 },
                { formula: 'C₆H₁₂O₆ (Glucose)', molarMass: 180 },
                { formula: 'NH₃ (Ammonia)', molarMass: 17 },
                { formula: 'CH₄ (Methane)', molarMass: 16 }
            ];
            const chem = chemicals[seed % chemicals.length];
            const moles = 2 + ((seed >> 2) % 8);
            const totalMass = Math.round(moles * chem.molarMass * 10) / 10;
            return {
                questionText: `How many moles are present in a pure sample of ${totalMass} grams of **${chem.formula}** (Molar mass = ${chem.molarMass} g/mol)?`,
                options: [
                    { id: 'A', text: `${moles} moles` },
                    { id: 'B', text: `${moles + 2} moles` },
                    { id: 'C', text: `${Math.round(totalMass / 2)} moles` },
                    { id: 'D', text: `1 mole` },
                ],
                correctOption: 'A',
                explanation: `Number of moles = Given mass / Molar mass = ${totalMass} / ${chem.molarMass} = ${moles} moles.`,
                difficulty: diff,
                subtopic: 'Chemistry - Mole Concept & Stoichiometry',
            };
        }
        else if (type === 5) {
            // Physics: Newton's 2nd Law Force (F = ma)
            const mass = 5 + (seed % 60) * 3;
            const accel = 2 + ((seed >> 2) % 30) * 1.5;
            const force = Math.round(mass * accel * 10) / 10;
            return {
                questionText: `What net external force must be applied to an object of mass ${mass} kg to produce an acceleration of ${accel.toFixed(1)} m/s²?`,
                options: [
                    { id: 'A', text: `${force} Newtons (N)` },
                    { id: 'B', text: `${Math.round((force + 35) * 10) / 10} N` },
                    { id: 'C', text: `${Math.round(mass * 9.8)} N` },
                    { id: 'D', text: `${Math.round(force * 0.5 * 10) / 10} N` },
                ],
                correctOption: 'A',
                explanation: `Newton's Second Law: Force F = m * a = ${mass} * ${accel.toFixed(1)} = ${force} N.`,
                difficulty: diff,
                subtopic: 'Physics - Laws of Motion',
            };
        }
        else if (type === 6) {
            // Physics: Work & Mechanical Power
            const force = 20 + (seed % 60) * 15;
            const dist = 4 + ((seed >> 2) % 30) * 3;
            const timeSec = 2 + ((seed >> 4) % 15) * 2;
            const work = force * dist;
            const power = Math.round((work / timeSec) * 10) / 10;
            return {
                questionText: `A machine applies a force of ${force} N to displace an object through ${dist} meters along the line of action in ${timeSec} seconds. What is the total work done and power delivered?`,
                options: [
                    { id: 'A', text: `Work = ${work} J, Power = ${power} Watts` },
                    { id: 'B', text: `Work = ${work + 100} J, Power = ${power} W` },
                    { id: 'C', text: `Work = ${work} J, Power = ${Math.round(power * 2)} W` },
                    { id: 'D', text: `Work = ${Math.round(force * 10)} J, Power = 100 W` },
                ],
                correctOption: 'A',
                explanation: `Work = Force * Distance = ${force} * ${dist} = ${work} J. Power = Work / Time = ${work} / ${timeSec} = ${power} W.`,
                difficulty: diff,
                subtopic: 'Physics - Work, Energy & Power',
            };
        }
        else {
            const scienceBank = [
                {
                    q: 'What is the SI unit of Electrical Resistivity (ρ) of a conducting material?',
                    options: ['Ohm-meter (Ω·m)', 'Ohm per meter (Ω/m)', 'Siemens per meter (S/m)', 'Coulomb-volt (C·V)'],
                    ans: 'A',
                    exp: 'From resistance formula R = ρ(L/A), resistivity ρ = (R·A)/L = (Ω·m²)/m = Ohm-meter (Ω·m).',
                    sub: 'Physics - Electricity',
                },
                {
                    q: 'Which human blood group is designated as the universal recipient due to the absence of antibodies against A and B antigens in plasma?',
                    options: ['AB Positive (AB+)', 'O Negative (O-)', 'A Positive (A+)', 'B Negative (B-)'],
                    ans: 'A',
                    exp: 'Blood group AB+ contains both A and B antigens on RBC surfaces and lacks anti-A/anti-B antibodies in plasma, making it the universal recipient.',
                    sub: 'Human Biology',
                },
                {
                    q: 'What is the chemical name and formula of "Plaster of Paris" used in construction and orthopedic casts?',
                    options: ['Calcium Sulphate Hemihydrate (CaSO4·1/2H2O)', 'Calcium Sulphate Dihydrate (CaSO4·2H2O)', 'Calcium Oxychloride (CaOCl2)', 'Magnesium Sulphate (MgSO4)'],
                    ans: 'A',
                    exp: 'Plaster of Paris is produced by heating gypsum (CaSO4·2H2O) to 373 K, producing Calcium Sulphate Hemihydrate (CaSO4·0.5H2O).',
                    sub: 'Chemistry - Inorganic Compounds',
                },
                {
                    q: 'Inside which cell organelle does the citric acid cycle (Krebs cycle) take place in eukaryotic cells?',
                    options: ['Mitochondrial Matrix', 'Cytoplasm (Cytosol)', 'Endoplasmic Reticulum', 'Golgi Apparatus'],
                    ans: 'A',
                    exp: 'While glycolysis occurs in cytoplasm, the Krebs cycle takes place in the inner mitochondrial matrix of eukaryotic cells.',
                    sub: 'Cell Biology',
                },
                {
                    q: 'According to Snell\'s law of refraction, the ratio of the sine of incidence angle to the sine of refraction angle is equal to:',
                    options: ['The relative refractive index of the second medium with respect to the first', 'The ratio of magnetic permeabilities', 'The gravitational constant of the medium', 'Zero for all homogenous transparent media'],
                    ans: 'A',
                    exp: 'Snell\'s Law states sin(i) / sin(r) = n2 / n1 = constant (relative refractive index).',
                    sub: 'Physics - Optics',
                },
                {
                    q: 'Which hormone produced by the beta cells of the Islets of Langerhans in the pancreas regulates blood glucose levels in humans?',
                    options: ['Insulin', 'Glucagon', 'Thyroxine', 'Adrenaline'],
                    ans: 'A',
                    exp: 'Beta cells of the pancreas secrete Insulin, which facilitates the uptake of glucose into cells and glycogen synthesis.',
                    sub: 'Human Physiology',
                },
                {
                    q: 'What type of chemical bonding involves the electrostatic attraction between oppositely charged ions formed by transfer of electrons?',
                    options: ['Ionic (Electrovalent) Bonding', 'Covalent Bonding', 'Metallic Bonding', 'Hydrogen Bonding'],
                    ans: 'A',
                    exp: 'Ionic bonding forms through the transfer of one or more valence electrons from a metal atom to a non-metal atom.',
                    sub: 'Chemistry - Chemical Bonding',
                },
                {
                    q: 'What is the escape velocity from the surface of planet Earth for a projectile (ignoring atmospheric drag)?',
                    options: ['Approximately 11.2 km/s', 'Approximately 7.9 km/s', 'Approximately 9.8 m/s²', 'Approximately 3.0 × 10⁸ m/s'],
                    ans: 'A',
                    exp: 'Earth\'s surface escape velocity v_e = √(2gR) ≈ √(2 * 9.8 * 6.37 * 10⁶) ≈ 11.2 km/s.',
                    sub: 'Physics - Gravitation',
                },
                {
                    q: 'Which gas is predominantly released during the anaerobic decomposition of organic matter in biogas (Gobar gas) plants?',
                    options: ['Methane (CH4)', 'Carbon Monoxide (CO)', 'Sulfur Dioxide (SO2)', 'Nitrogen Dioxide (NO2)'],
                    ans: 'A',
                    exp: 'Biogas consists of 55–70% Methane (CH4) alongside Carbon Dioxide (CO2), produced via anaerobic bacterial digestion.',
                    sub: 'Environmental Science',
                },
                {
                    q: 'Which element is liquid at room temperature and is classified as a non-metal?',
                    options: ['Bromine (Br)', 'Mercury (Hg)', 'Gallium (Ga)', 'Cesium (Cs)'],
                    ans: 'A',
                    exp: 'Bromine is the only non-metallic element that is liquid at standard room temperature. Mercury is a liquid metal.',
                    sub: 'Chemistry - Elements',
                },
                {
                    q: 'In the human eye, on which part is the real and inverted optical image of an external object formed?',
                    options: ['Retina', 'Cornea', 'Iris', 'Ciliary Muscles'],
                    ans: 'A',
                    exp: 'The eye lens focuses light rays onto the retina, where photoreceptors (rods and cones) convert light into electrical impulses.',
                    sub: 'Human Physiology - Eye',
                },
                {
                    q: 'What is the chemical formula of "Baking Soda" commonly used in cooking and antacids?',
                    options: ['Sodium Hydrogen Carbonate (NaHCO3)', 'Sodium Carbonate Decahydrate (Na2CO3·10H2O)', 'Sodium Hydroxide (NaOH)', 'Calcium Carbonate (CaCO3)'],
                    ans: 'A',
                    exp: 'Baking Soda is Sodium Bicarbonate (NaHCO3), whereas Washing Soda is Na2CO3·10H2O.',
                    sub: 'Chemistry - Compounds',
                }
            ];
            const idx = seed % scienceBank.length;
            const item = scienceBank[idx];
            return {
                questionText: item.q,
                options: [
                    { id: 'A', text: item.options[0] },
                    { id: 'B', text: item.options[1] },
                    { id: 'C', text: item.options[2] },
                    { id: 'D', text: item.options[3] },
                ],
                correctOption: item.ans,
                explanation: item.exp,
                difficulty: diff,
                subtopic: item.sub,
            };
        }
    }
    // =========================================================================
    // 5. TECHNICAL & ENGINEERING (RRB JE CBT-2)
    // =========================================================================
    static generateTechnicalQuestion(seed, diff, topicName, examName) {
        const disciplineType = seed % 6;
        if (disciplineType === 0) {
            // Electrical: Synchronous Speed & AC Machines
            const poles = [2, 4, 6, 8, 10, 12, 16][seed % 7];
            const freq = [50, 60][(seed >> 2) % 2];
            const slip = [2, 3, 4, 5, 6][(seed >> 3) % 5];
            const ns = Math.round((120 * freq) / poles);
            const nr = Math.round(ns * (1 - slip / 100));
            if (seed % 2 === 0) {
                return {
                    questionText: `What is the synchronous speed (N_s in rpm) of a ${poles}-pole AC synchronous motor operating on a ${freq} Hz alternating current supply network?`,
                    options: [
                        { id: 'A', text: `${ns} rpm` },
                        { id: 'B', text: `${ns - 150} rpm` },
                        { id: 'C', text: `${ns + 200} rpm` },
                        { id: 'D', text: `${Math.round(ns * 1.5)} rpm` },
                    ],
                    correctOption: 'A',
                    explanation: `Formula for synchronous speed: N_s = (120 * f) / P = (120 * ${freq}) / ${poles} = ${ns} rpm.`,
                    difficulty: diff,
                    subtopic: 'Electrical Machines - Synchronous Speed',
                };
            }
            else {
                return {
                    questionText: `A ${poles}-pole, ${freq} Hz 3-phase induction motor operates with a full-load rotor slip of ${slip}%. What is the actual operating rotor speed (N_r in rpm)?`,
                    options: [
                        { id: 'A', text: `${nr} rpm` },
                        { id: 'B', text: `${ns} rpm` },
                        { id: 'C', text: `${nr - 75} rpm` },
                        { id: 'D', text: `${Math.round(nr * 1.15)} rpm` },
                    ],
                    correctOption: 'A',
                    explanation: `N_s = (120 * ${freq}) / ${poles} = ${ns} rpm.\nRotor speed N_r = N_s * (1 - s) = ${ns} * (1 - ${slip / 100}) = ${nr} rpm.`,
                    difficulty: diff,
                    subtopic: 'Electrical Machines - Induction Motors',
                };
            }
        }
        else if (disciplineType === 1) {
            // Electrical: Ideal Transformers & Turns Ratio
            const n1 = 150 + (seed % 30) * 40;
            const n2 = 30 + ((seed >> 2) % 20) * 15;
            const v1 = 200 + ((seed >> 3) % 15) * 50;
            const v2 = Math.round((v1 * n2) / n1 * 10) / 10;
            return {
                questionText: `An ideal single-phase transformer has ${n1} turns on its primary winding and ${n2} turns on its secondary winding. If a sinusoidal voltage of ${v1} V (RMS) is applied across the primary winding, what is the induced secondary voltage?`,
                options: [
                    { id: 'A', text: `${v2} V` },
                    { id: 'B', text: `${Math.round((v2 + 35) * 10) / 10} V` },
                    { id: 'C', text: `${Math.round((v2 * 1.6) * 10) / 10} V` },
                    { id: 'D', text: `${v1} V` },
                ],
                correctOption: 'A',
                explanation: `Transformer turns ratio formula: V₂ / V₁ = N₂ / N₁ ⇒ V₂ = ${v1} * (${n2} / ${n1}) = ${v2} V.`,
                difficulty: diff,
                subtopic: 'Electrical Engineering - Transformers',
            };
        }
        else if (disciplineType === 2) {
            // Mechanical: Carnot & Thermal Cycles
            const th = 380 + (seed % 50) * 15;
            const tl = 250 + ((seed >> 2) % 20) * 10;
            const eff = Math.round(((th - tl) / th) * 100 * 10) / 10;
            return {
                questionText: `What is the maximum theoretical thermal efficiency of a Carnot heat engine operating between a heat source temperature of ${th} K and a heat sink temperature of ${tl} K?`,
                options: [
                    { id: 'A', text: `${eff}%` },
                    { id: 'B', text: `${Math.round((eff + 12.5) * 10) / 10}%` },
                    { id: 'C', text: `${Math.round((eff - 8.4) * 10) / 10}%` },
                    { id: 'D', text: `${Math.round((100 - eff) * 10) / 10}%` },
                ],
                correctOption: 'A',
                explanation: `Carnot Efficiency η = [1 - (T_L / T_H)] * 100% = [1 - (${tl} / ${th})] * 100% = ${eff}%.`,
                difficulty: diff,
                subtopic: 'Mechanical Thermodynamics - Carnot Cycle',
            };
        }
        else if (disciplineType === 3) {
            // Civil: Bending Moments & Shear
            const span = 3 + (seed % 25);
            const udl = 4 + ((seed >> 2) % 25) * 2;
            const maxBM = Math.round((udl * span * span) / 8 * 10) / 10;
            return {
                questionText: `A simply supported horizontal concrete beam has a clear span of ${span} meters and carries a uniformly distributed load (UDL) of ${udl} kN/m across its entire span. What is the maximum bending moment developed in the beam?`,
                options: [
                    { id: 'A', text: `${maxBM} kN·m` },
                    { id: 'B', text: `${Math.round(maxBM * 2 * 10) / 10} kN·m` },
                    { id: 'C', text: `${Math.round(maxBM * 0.65 * 10) / 10} kN·m` },
                    { id: 'D', text: `${Math.round(udl * span * 10) / 10} kN·m` },
                ],
                correctOption: 'A',
                explanation: `Maximum bending moment for a simply supported beam under UDL occurs at mid-span: M_max = (w * L²) / 8 = (${udl} * ${span}²) / 8 = ${maxBM} kN·m.`,
                difficulty: diff,
                subtopic: 'Civil Engineering - Mechanics of Structures',
            };
        }
        else if (disciplineType === 4) {
            // Electronics & CS: Algorithm Time Complexities
            const sorts = [
                { algo: 'Merge Sort', best: 'O(n log n)', worst: 'O(n log n)', exp: 'Merge Sort always divides array in half and merges in linear time, guaranteeing O(n log n).' },
                { algo: 'Quick Sort', best: 'O(n log n)', worst: 'O(n²)', exp: 'Quick Sort has average time of O(n log n), but worst case of O(n²) when pivot selection is unbalanced.' },
                { algo: 'Bubble Sort', best: 'O(n)', worst: 'O(n²)', exp: 'Bubble Sort takes O(n) best case (with sorted flag) and O(n²) worst case quadratic time.' },
                { algo: 'Heap Sort', best: 'O(n log n)', worst: 'O(n log n)', exp: 'Heap Sort guarantees O(n log n) by building and extracting from a binary heap.' },
                { algo: 'Binary Search', best: 'O(1)', worst: 'O(log n)', exp: 'Binary Search achieves logarithmic time complexity by halving the search space per iteration.' },
                { algo: 'Insertion Sort', best: 'O(n)', worst: 'O(n²)', exp: 'Insertion Sort takes linear O(n) time when elements are already sorted.' },
                { algo: 'Selection Sort', best: 'O(n²)', worst: 'O(n²)', exp: 'Selection Sort always makes n(n-1)/2 comparisons regardless of initial array order.' }
            ];
            const s = sorts[seed % sorts.length];
            return {
                questionText: `What is the worst-case asymptotic time complexity of the **${s.algo}** algorithm for an input dataset containing n elements?`,
                options: [
                    { id: 'A', text: s.worst },
                    { id: 'B', text: 'O(1)' },
                    { id: 'C', text: 'O(n!)' },
                    { id: 'D', text: 'O(2ⁿ)' },
                ],
                correctOption: 'A',
                explanation: s.exp,
                difficulty: diff,
                subtopic: 'Computer Science - Data Structures & Algorithms',
            };
        }
        else {
            const concepts = [
                { q: 'In fluid mechanics, what dimensionless number represents the ratio of inertial forces to viscous forces?', ans: 'Reynolds Number (Re)', exp: 'Reynolds number Re = (ρ·v·D) / μ determines laminar vs turbulent flow regime.' },
                { q: 'In concrete technology according to IS 456:2000, what is the nominal volumetric mix ratio for M20 grade concrete?', ans: '1 : 1.5 : 3 (Cement : Sand : Coarse Aggregate)', exp: 'Standard nominal mix for M20 is 1:1.5:3, while M15 is 1:2:4 and M25 is 1:1:2.' },
                { q: 'What semiconductor device acts as a voltage regulator by operating reliably in its reverse breakdown region?', ans: 'Zener Diode', exp: 'Zener diodes maintain a constant breakdown voltage across their terminals when reverse-biased.' },
                { q: 'In relational databases, which normal form eliminates transitive functional dependencies between non-prime attributes?', ans: 'Third Normal Form (3NF)', exp: '3NF requires 2NF plus no non-prime attribute being transitively dependent on the primary key.' },
                { q: 'In environmental engineering, what does BOD (Biochemical Oxygen Demand) measure in a municipal wastewater sample?', ans: 'Amount of dissolved oxygen consumed by microorganisms to decompose biodegradable organic matter', exp: 'BOD5 represents the oxygen required by aerobic microbes over 5 days at 20°C to oxidize organics.' },
                { q: 'In digital logic design, how many select lines are required for an 8-to-1 Multiplexer (MUX)?', ans: '3 select lines (2³ = 8)', exp: 'For an n-to-1 MUX where n = 8, number of select lines m satisfies 2ᵐ = 8, so m = 3.' },
                { q: 'In engineering materials, the ratio of lateral strain to axial (longitudinal) strain within the elastic limit is called:', ans: 'Poisson\'s Ratio (μ or ν)', exp: 'Poisson\'s ratio represents the absolute ratio of lateral strain to longitudinal strain under uniaxial stress.' },
                { q: 'In surveying, which line is defined as the line passing through the optical centre of the objective and the intersection of cross-hairs in a telescope?', ans: 'Line of Collimation (Line of Sight)', exp: 'The line of collimation is the line of sight passing through the cross-wire intersection and objective lens centre.' }
            ];
            const c = concepts[seed % concepts.length];
            return {
                questionText: c.q,
                options: [
                    { id: 'A', text: c.ans },
                    { id: 'B', text: 'Mach Number' },
                    { id: 'C', text: 'P-N Junction Varactor' },
                    { id: 'D', text: 'Boycott Coefficient' },
                ],
                correctOption: 'A',
                explanation: c.exp,
                difficulty: diff,
                subtopic: 'General Engineering Concepts',
            };
        }
    }
    // =========================================================================
    // 6. ENGLISH LANGUAGE (IBPS PO)
    // =========================================================================
    static generateEnglishQuestion(seed, diff, topicName, examName) {
        const vocabPairs = [
            { word: 'LACONIC', ant: 'Verbose', syn: 'Terse', exp: 'Laconic means brief or concise in speech.' },
            { word: 'EPHEMERAL', ant: 'Permanent', syn: 'Transient', exp: 'Ephemeral means lasting for a very short time.' },
            { word: 'METICULOUS', ant: 'Careless', syn: 'Scrupulous', exp: 'Meticulous means showing great attention to detail.' },
            { word: 'UBIQUITOUS', ant: 'Rare', syn: 'Omnipresent', exp: 'Ubiquitous means present or found everywhere.' },
            { word: 'OBDURATE', ant: 'Flexible', syn: 'Stubborn', exp: 'Obdurate means stubbornly refusing to change opinion.' },
            { word: 'ALACRITY', ant: 'Apathy', syn: 'Eagerness', exp: 'Alacrity means brisk and cheerful readiness.' },
            { word: 'CANDID', ant: 'Deceitful', syn: 'Frank', exp: 'Candid means truthful and straightforward.' },
            { word: 'PRAGMATIC', ant: 'Idealistic', syn: 'Practical', exp: 'Pragmatic means dealing with matters sensibly.' },
            { word: 'ESOTERIC', ant: 'Commonplace', syn: 'Obscure', exp: 'Esoteric means intended for a small group with specialized knowledge.' },
            { word: 'GREGARIOUS', ant: 'Reclusive', syn: 'Sociable', exp: 'Gregarious means fond of company and sociable.' },
            { word: 'SAGACIOUS', ant: 'Foolish', syn: 'Wise', exp: 'Sagacious means having or showing keen mental discernment.' },
            { word: 'RETICENT', ant: 'Talkative', syn: 'Reserved', exp: 'Reticent means not revealing one\'s thoughts readily.' },
            { word: 'LUCID', ant: 'Confusing', syn: 'Clear', exp: 'Lucid means expressed clearly and easy to understand.' },
            { word: 'TENACIOUS', ant: 'Yielding', syn: 'Persistent', exp: 'Tenacious means tending to keep a firm hold of something.' },
            { word: 'EQUANIMITY', ant: 'Agitation', syn: 'Composure', exp: 'Equanimity means calmness and composure in a difficult situation.' },
            { word: 'OSTENTATIOUS', ant: 'Modest', syn: 'Showy', exp: 'Ostentatious means characterized by pretentious display.' },
            { word: 'INEFFABLE', ant: 'Describable', syn: 'Indescribable', exp: 'Ineffable means too great or extreme to be expressed in words.' },
            { word: 'SURREPTITIOUS', ant: 'Overt', syn: 'Secretive', exp: 'Surreptitious means kept secret, especially because it would not be approved of.' },
            { word: 'FASTIDIOUS', ant: 'Unfussy', syn: 'Punctilious', exp: 'Fastidious means very attentive to and concerned about accuracy and detail.' },
            { word: 'VOCIFEROUS', ant: 'Quiet', syn: 'Vehement', exp: 'Vociferous means expressing or characterized by vehement opinions.' },
            { word: 'PERSPICACIOUS', ant: 'Dull-witted', syn: 'Shrewd', exp: 'Perspicacious means having a ready insight into and understanding of things.' },
            { word: 'TACITURN', ant: 'Garrulous', syn: 'Uncommunicative', exp: 'Taciturn means saying little and reserved in speech.' },
            { word: 'IMPECUNIOUS', ant: 'Wealthy', syn: 'Penniless', exp: 'Impecunious means having little or no money.' },
            { word: 'AUSPICIOUS', ant: 'Ominous', syn: 'Favorable', exp: 'Auspicious means conducive to success; favorable.' },
            { word: 'CAPRICIOUS', ant: 'Consistent', syn: 'Fickle', exp: 'Capricious means given to sudden and unaccountable changes of mood or behavior.' },
            { word: 'BENEVOLENT', ant: 'Malevolent', syn: 'Kind-hearted', exp: 'Benevolent means well-meaning and kindly.' },
            { word: 'PROLIFIC', ant: 'Unproductive', syn: 'Fruitful', exp: 'Prolific means producing much fruit or foliage or many works.' },
            { word: 'ENERVATE', ant: 'Invigorate', syn: 'Exhaust', exp: 'Enervate means to make someone feel drained of energy or vitality.' },
            { word: 'DISPARATE', ant: 'Similar', syn: 'Divergent', exp: 'Disparate means essentially different in kind; not able to be compared.' },
            { word: 'EQUIVOCAL', ant: 'Unambiguous', syn: 'Ambiguous', exp: 'Equivocal means open to more than one interpretation; uncertain.' },
            { word: 'INTRINSIC', ant: 'Extrinsic', syn: 'Inherent', exp: 'Intrinsic means belonging naturally; essential.' },
            { word: 'FORTUITOUS', ant: 'Calculated', syn: 'Serendipitous', exp: 'Fortuitous means happening by accident or chance rather than design.' },
            { word: 'COPIOUS', ant: 'Sparse', syn: 'Abundant', exp: 'Copious means abundant in supply or quantity.' },
            { word: 'DIFFIDENT', ant: 'Confident', syn: 'Shy', exp: 'Diffident means modest or shy because of a lack of self-confidence.' },
            { word: 'EXACERBATE', ant: 'Alleviate', syn: 'Aggravate', exp: 'Exacerbate means to make a problem, bad situation, or negative feeling worse.' }
        ];
        const type = seed % 8;
        if (type === 0) {
            // Antonyms
            const pair = vocabPairs[seed % vocabPairs.length];
            return {
                questionText: `Choose the word most OPPOSITE in meaning (Antonym) to the capitalized word:\n\n**${pair.word}**`,
                options: [
                    { id: 'A', text: pair.ant },
                    { id: 'B', text: pair.syn },
                    { id: 'C', text: 'Ambiguous' },
                    { id: 'D', text: 'Conventional' },
                ],
                correctOption: 'A',
                explanation: `${pair.exp} Hence, its direct antonym is "${pair.ant}".`,
                difficulty: diff,
                subtopic: 'Vocabulary - Antonyms',
            };
        }
        else if (type === 1) {
            // Synonyms
            const pair = vocabPairs[(seed + 7) % vocabPairs.length];
            return {
                questionText: `Choose the word most SIMILAR in meaning (Synonym) to the capitalized word:\n\n**${pair.word}**`,
                options: [
                    { id: 'A', text: pair.syn },
                    { id: 'B', text: pair.ant },
                    { id: 'C', text: 'Superfluous' },
                    { id: 'D', text: 'Vindictive' },
                ],
                correctOption: 'A',
                explanation: `${pair.exp} Hence, its closest synonym is "${pair.syn}".`,
                difficulty: diff,
                subtopic: 'Vocabulary - Synonyms',
            };
        }
        else if (type === 2) {
            // Active to Passive Voice Transformation (Parametric)
            const subjects = [
                'The senior credit auditor',
                'The branch general manager',
                'The vigilance investigation committee',
                'The financial stability board',
                'The external rating agency',
                'The risk assessment panel',
                'The debt recovery officer',
                'The compliance monitoring team',
                'The banking ombudsman',
                'The loan sanctioning board'
            ];
            const actions = [
                { vAct: 'inspected', vPass: 'was inspected by', tense: 'Simple Past' },
                { vAct: 'scrutinized', vPass: 'was scrutinized by', tense: 'Simple Past' },
                { vAct: 'sanctioned', vPass: 'was sanctioned by', tense: 'Simple Past' },
                { vAct: 'disbursed', vPass: 'was disbursed by', tense: 'Simple Past' },
                { vAct: 'evaluated', vPass: 'was evaluated by', tense: 'Simple Past' },
                { vAct: 'approved', vPass: 'was approved by', tense: 'Simple Past' },
                { vAct: 'audited', vPass: 'was audited by', tense: 'Simple Past' },
                { vAct: 'restructured', vPass: 'was restructured by', tense: 'Simple Past' }
            ];
            const objects = [
                'the microfinance loan portfolio',
                'the infrastructure credit proposal',
                'the annual balance sheet accounts',
                'the non-performing asset settlement claim',
                'the commercial mortgage file',
                'the priority sector advance application',
                'the quarterly risk exposure report',
                'the foreign exchange reserve statement'
            ];
            const s = subjects[seed % subjects.length];
            const a = actions[(seed >> 2) % actions.length];
            const o = objects[(seed >> 4) % objects.length];
            const activeSentence = `${s} ${a.vAct} ${o} yesterday.`;
            const passiveCorrect = `${o.charAt(0).toUpperCase() + o.slice(1)} ${a.vPass} ${s.toLowerCase()} yesterday.`;
            const passiveWrong1 = `${o.charAt(0).toUpperCase() + o.slice(1)} is ${a.vAct} by ${s.toLowerCase()} yesterday.`;
            const passiveWrong2 = `${o.charAt(0).toUpperCase() + o.slice(1)} has been ${a.vAct} by ${s.toLowerCase()} yesterday.`;
            const passiveWrong3 = `${s} had been ${a.vAct} by ${o.toLowerCase()} yesterday.`;
            return {
                questionText: `Convert the following active sentence into the correct passive voice structure:\n\n**"${activeSentence}"**`,
                options: [
                    { id: 'A', text: passiveCorrect },
                    { id: 'B', text: passiveWrong1 },
                    { id: 'C', text: passiveWrong2 },
                    { id: 'D', text: passiveWrong3 },
                ],
                correctOption: 'A',
                explanation: `Simple past passive rule: Object + was/were + past participle (V3) + by Subject. Correct: "${passiveCorrect}".`,
                difficulty: diff,
                subtopic: 'Grammar - Voice Transformation',
            };
        }
        else if (type === 3) {
            // Error Detection / Grammar
            const errorBank = [
                {
                    q: 'Identify the segment containing an error:\n"(A) Neither the managing director / (B) nor the branch executives / (C) was present / (D) at the annual shareholders symposium."',
                    err: '(C) was present',
                    exp: 'When two subjects are joined by "neither... nor", the verb agrees with the closer subject ("branch executives" is plural, requiring "were present").'
                },
                {
                    q: 'Identify the segment containing an error:\n"(A) Scarcely had the manager entered / (B) the banking premises / (C) than the audit team / (D) presented the quarterly report."',
                    err: '(C) than the audit team',
                    exp: 'The correlative conjunction "Scarcely... when" is used, not "than". ("than" is used with "No sooner").'
                },
                {
                    q: 'Identify the segment containing an error:\n"(A) One of the most critical challenges / (B) faced by public sector banks / (C) are the escalating quantum / (D) of non-performing assets."',
                    err: '(C) are the escalating quantum',
                    exp: 'The subject is singular ("One"), therefore the verb must be singular ("is the escalating quantum").'
                },
                {
                    q: 'Identify the segment containing an error:\n"(A) The loan applicant requested the manager / (B) to furnish him with / (C) all the relevant informations / (D) concerning the home loan policy."',
                    err: '(C) all the relevant informations',
                    exp: '"Information" is an uncountable noun and does not have a plural form ("informations").'
                },
                {
                    q: 'Identify the segment containing an error:\n"(A) Unless the statutory reserve ratio / (B) is not maintained / (C) by commercial institutions, / (D) regulatory penalties will be levied."',
                    err: '(B) is not maintained',
                    exp: '"Unless" already expresses a negative condition; using "is not maintained" creates a redundant double negative.'
                },
                {
                    q: 'Identify the segment containing an error:\n"(A) The chairperson as well as / (B) the board directors / (C) were present at / (D) the emergency policy deliberation."',
                    err: '(C) were present at',
                    exp: 'When subjects are joined by "as well as", the verb agrees with the first subject ("The chairperson" is singular, requiring "was present").'
                },
                {
                    q: 'Identify the segment containing an error:\n"(A) The microfinance institution / (B) has been operating / (C) since five consecutive years / (D) in rural districts."',
                    err: '(C) since five consecutive years',
                    exp: 'For a duration or period of time ("five consecutive years"), the preposition "for" is used instead of "since".'
                },
                {
                    q: 'Identify the segment containing an error:\n"(A) He preferred investing in sovereign gold bonds / (B) than putting all savings / (C) in volatile stock equities / (D) without diversification."',
                    err: '(B) than putting all savings',
                    exp: 'The adjective "preferred" is followed by the preposition "to", not "than".'
                },
                {
                    q: 'Identify the segment containing an error:\n"(A) No sooner did the governor / (B) made the monetary policy announcement / (C) when the benchmark stock indices / (D) rallied sharply."',
                    err: '(B) made the monetary policy announcement',
                    exp: 'With the auxiliary verb "did", the base form (V1) of the verb "make" must be used ("did make").'
                },
                {
                    q: 'Identify the segment containing an error:\n"(A) Each of the candidates who / (B) has appeared for the probationary officer exam / (C) have completed their documentation / (D) before the deadline."',
                    err: '(C) have completed their documentation',
                    exp: 'The distributive pronoun "Each" is singular and requires a singular verb ("has completed his/her documentation").'
                }
            ];
            const errItem = errorBank[seed % errorBank.length];
            return {
                questionText: errItem.q,
                options: [
                    { id: 'A', text: errItem.err },
                    { id: 'B', text: 'No error' },
                    { id: 'C', text: '(A) Part A segment' },
                    { id: 'D', text: '(B) Part B segment' },
                ],
                correctOption: 'A',
                explanation: errItem.exp,
                difficulty: diff,
                subtopic: 'Spotting Errors',
            };
        }
        else if (type === 4) {
            // One Word Substitution
            const oneWordBank = [
                { desc: 'A person who settles a dispute or has ultimate authority in a matter', word: 'Arbitrator', exp: 'An arbitrator is an independent person chosen to settle a dispute.' },
                { desc: 'A person unable to pay their debts in legal proceedings', word: 'Insolvent', exp: 'Insolvent refers to a state of being unable to meet debt obligations.' },
                { desc: 'An official count or survey especially of a population', word: 'Census', exp: 'A census is an official systematic enumeration of a population.' },
                { desc: 'One who has keen knowledge and refined taste in culinary or fine arts', word: 'Connoisseur', exp: 'A connoisseur is an expert judge in matters of taste.' },
                { desc: 'A government or financial grant to support an industry or business', word: 'Subsidy', exp: 'A subsidy is a sum of money granted by the state to maintain competitive prices.' },
                { desc: 'Holding an office or position without receiving pay or salary', word: 'Honorary', exp: 'Honorary denotes an unpaid position or role granted as an honour.' },
                { desc: 'A remedy or curative agent for all diseases or difficulties', word: 'Panacea', exp: 'A panacea is a universal remedy or solution for all ills.' },
                { desc: 'The state of remaining unmarried or abstaining from sexual relations', word: 'Celibacy', exp: 'Celibacy is the state of voluntarily being unmarried or abstinent.' },
                { desc: 'One who makes an official financial examination of accounts', word: 'Auditor', exp: 'An auditor is an authorized person who inspects accounting records.' },
                { desc: 'A person who makes a formal application for something, especially a job or loan', word: 'Applicant', exp: 'An applicant is one who applies formally for a post or privilege.' },
                { desc: 'A government department in charge of public revenue and taxation', word: 'Exchequer', exp: 'Exchequer refers to the national treasury or public purse.' },
                { desc: 'A person who renounces a religious or political belief or principle', word: 'Apostate', exp: 'An apostate is a person who forsakes their religion or cause.' }
            ];
            const item = oneWordBank[seed % oneWordBank.length];
            return {
                questionText: `Select the word that can substitute the given group of words:\n\n**"${item.desc}"**`,
                options: [
                    { id: 'A', text: item.word },
                    { id: 'B', text: 'Altruist' },
                    { id: 'C', text: 'Mercenary' },
                    { id: 'D', text: 'Amateur' },
                ],
                correctOption: 'A',
                explanation: `${item.exp}`,
                difficulty: diff,
                subtopic: 'One Word Substitution',
            };
        }
        else if (type === 5) {
            // Idioms & Phrases
            const idiomBank = [
                { idiom: 'Bite the bullet', meaning: 'To endure a painful situation with courage and fortitude', exp: '"To bite the bullet" means facing a grim situation bravely.' },
                { idiom: 'Burn the midnight oil', meaning: 'To work or study late into the night', exp: '"Burning the midnight oil" refers to late night diligent work.' },
                { idiom: 'Hit the nail on the head', meaning: 'To state or describe a situation with exact precision', exp: 'Refers to saying or doing exactly the right thing.' },
                { idiom: 'Break the ice', meaning: 'To relieve initial tension or awkwardness in a social setting', exp: 'To initiate conversation and make people feel comfortable.' },
                { idiom: 'Read between the lines', meaning: 'To understand the hidden or implied meaning beyond literal words', exp: 'To discern a meaning which isn\'t stated explicitly.' },
                { idiom: 'Spill the beans', meaning: 'To disclose confidential or secret information prematurely', exp: 'To reveal a secret either intentionally or accidentally.' },
                { idiom: 'Take with a grain of salt', meaning: 'To maintain a degree of skepticism towards information', exp: 'To not accept something completely as absolute truth.' },
                { idiom: 'Piece of cake', meaning: 'A task that is extremely simple and straightforward to accomplish', exp: 'Something easily achieved without strenuous effort.' }
            ];
            const item = idiomBank[seed % idiomBank.length];
            return {
                questionText: `Select the option that most accurately expresses the meaning of the idiom:\n\n**"${item.idiom}"**`,
                options: [
                    { id: 'A', text: item.meaning },
                    { id: 'B', text: 'To act rashly without calculating future consequences' },
                    { id: 'C', text: 'To procrastinate indefinitely on an urgent decision' },
                    { id: 'D', text: 'To accept complete financial defeat in negotiations' },
                ],
                correctOption: 'A',
                explanation: item.exp,
                difficulty: diff,
                subtopic: 'Idioms & Phrases',
            };
        }
        else if (type === 6) {
            // Phrasal Verbs & Prepositions in Context
            const prepBank = [
                {
                    q: 'The external audit committee called ________ an immediate clarification on the discrepancy in the ledger balance.',
                    ans: 'for',
                    exp: '"To call for" means to demand or necessitate an explanation/action.'
                },
                {
                    q: 'The executive committee decided to put ________ the annual general meeting until next quarter due to unavoidable circumstances.',
                    ans: 'off',
                    exp: '"To put off" is a phrasal verb meaning to postpone.'
                },
                {
                    q: 'The commercial bank managed to pull ________ the complex corporate restructuring despite severe market downturn.',
                    ans: 'through',
                    exp: '"To pull through" means to survive or overcome a dangerous or difficult period.'
                },
                {
                    q: 'The compliance officer was instructed to look ________ the complaints regarding unauthorized electronic fund transactions.',
                    ans: 'into',
                    exp: '"To look into" means to investigate or examine thoroughly.'
                },
                {
                    q: 'The new financial regulation will come ________ force starting from the first day of the next fiscal year.',
                    ans: 'into',
                    exp: 'The standard idiomatic phrase is "to come into force" (become legally effective).'
                }
            ];
            const item = prepBank[seed % prepBank.length];
            return {
                questionText: `Fill in the blank with the most appropriate preposition or particle to complete the phrasal verb:\n\n"${item.q}"`,
                options: [
                    { id: 'A', text: item.ans },
                    { id: 'B', text: 'with' },
                    { id: 'C', text: 'upon' },
                    { id: 'D', text: 'against' },
                ],
                correctOption: 'A',
                explanation: item.exp,
                difficulty: diff,
                subtopic: 'Phrasal Verbs & Prepositions',
            };
        }
        else {
            // Sentence Improvement
            const sentBank = [
                {
                    q: 'Select the option that corrects the underlined segment:\n"Had the financial committee met earlier, the disbursement *would have been approved* without penalty."',
                    ans: 'would have been approved (No correction required)',
                    exp: 'Third conditional structure: "Had + Subject + Past Participle..., Subject + would have been + Past Participle" (Passive voice).'
                },
                {
                    q: 'Select the option that improves the underlined segment:\n"Not only the branch manager *but also the clerks was felicitated* at the annual awards gala."',
                    ans: 'but also the clerks were felicitated',
                    exp: 'In "not only... but also", the verb agrees with the closer subject ("the clerks" is plural, requiring "were felicitated").'
                },
                {
                    q: 'Select the option that improves the underlined segment:\n"Hardly the auditor had begun the inspection *when the system crashed* unexpectedly."',
                    ans: 'Hardly had the auditor begun the inspection when the system crashed',
                    exp: 'Negative inversion rule: "Hardly + had + Subject + V3... when...".'
                },
                {
                    q: 'Select the option that improves the underlined segment:\n"The regulatory framework is aimed *to curbing inflationary pressures* in the commodities market."',
                    ans: 'at curbing inflationary pressures',
                    exp: 'The verb "aimed" is followed by the preposition "at" + gerund ("aimed at curbing").'
                }
            ];
            const item = sentBank[seed % sentBank.length];
            return {
                questionText: `${item.q}`,
                options: [
                    { id: 'A', text: item.ans },
                    { id: 'B', text: 'No correction required' },
                    { id: 'C', text: 'would be approved without penalty' },
                    { id: 'D', text: 'having been approved without delay' },
                ],
                correctOption: 'A',
                explanation: item.exp,
                difficulty: diff,
                subtopic: 'Sentence Improvement',
            };
        }
    }
    // =========================================================================
    // 7. BANKING & ECONOMY (IBPS PO MAINS) - PARAMETRIC & EXPANDED
    // =========================================================================
    static generateBankingEconomyQuestion(seed, diff, topicName, examName) {
        const banks = [
            'State Bank of India',
            'Punjab National Bank',
            'Bank of Baroda',
            'Canara Bank',
            'Union Bank of India',
            'HDFC Bank',
            'ICICI Bank',
            'Axis Bank',
            'Kotak Mahindra Bank',
            'IndusInd Bank',
            'Bank of India',
            'Indian Bank',
            'Federal Bank',
            'IDBI Bank',
            'Central Bank of India'
        ];
        const bankName = banks[seed % banks.length];
        const type = seed % 12;
        if (type === 0) {
            // CRR Calculation with unique Bank & NDTL & CRR Rate
            const ndtl = 1000 + (seed % 1500) * 25; // ₹1000 to ₹38,500 crore (1500 variations)
            const crrRates = [3.5, 4.0, 4.25, 4.5, 4.75, 5.0, 5.25, 5.5];
            const crrPct = crrRates[(seed >> 3) % crrRates.length];
            const crrAmount = Math.round((ndtl * crrPct) / 100 * 100) / 100;
            return {
                questionText: `In the reporting fortnight, **${bankName}** reports a Net Demand and Time Liabilities (NDTL) base of ₹${ndtl} crore. If the Cash Reserve Ratio (CRR) mandated by the Reserve Bank of India is ${crrPct}%, what is the exact minimum cash reserve ${bankName} must maintain with the RBI?`,
                options: [
                    { id: 'A', text: `₹${crrAmount} crore` },
                    { id: 'B', text: `₹${Math.round((crrAmount * 1.35) * 100) / 100} crore` },
                    { id: 'C', text: `₹${Math.round((crrAmount - 18.5) * 100) / 100} crore` },
                    { id: 'D', text: `₹${Math.round(ndtl * 0.18)} crore` },
                ],
                correctOption: 'A',
                explanation: `CRR Requirement = NDTL * (CRR% / 100) = ₹${ndtl} crore * (${crrPct} / 100) = ₹${crrAmount} crore.`,
                difficulty: diff,
                subtopic: 'Monetary Policy - CRR & NDTL',
            };
        }
        else if (type === 1) {
            // SLR Calculation with unique Bank & NDTL & SLR Rate
            const ndtl = 3000 + (seed % 1200) * 50; // ₹3000 to ₹63,000 crore (1200 variations)
            const slrRates = [18.0, 18.5, 19.0, 19.5, 20.0, 21.0, 21.5];
            const slrPct = slrRates[(seed >> 3) % slrRates.length];
            const slrAmount = Math.round((ndtl * slrPct) / 100);
            return {
                questionText: `If **${bankName}** records an NDTL of ₹${ndtl} crore and the Statutory Liquidity Ratio (SLR) is fixed at ${slrPct}%, what minimum quantum of funds must be deployed in unencumbered statutory approved liquid assets (G-Secs, T-Bills, Gold)?`,
                options: [
                    { id: 'A', text: `₹${slrAmount} crore` },
                    { id: 'B', text: `₹${Math.round(slrAmount * 1.25)} crore` },
                    { id: 'C', text: `₹${Math.round(slrAmount * 0.82)} crore` },
                    { id: 'D', text: `₹${Math.round(ndtl * 0.045)} crore` },
                ],
                correctOption: 'A',
                explanation: `SLR Requirement = NDTL * (SLR% / 100) = ₹${ndtl} crore * (${slrPct} / 100) = ₹${slrAmount} crore.`,
                difficulty: diff,
                subtopic: 'Banking Regulations - SLR',
            };
        }
        else if (type === 2) {
            // NPA Provisioning Norms parameterized
            const loanAmount = 20 + (seed % 500) * 10; // ₹20 to ₹5020 crore
            const npaCategories = [
                { cat: 'Sub-Standard Asset (Secured)', pct: 15, rule: '15% provisioning on secured exposure' },
                { cat: 'Sub-Standard Asset (Unsecured infrastructure)', pct: 20, rule: '20% provisioning on unsecured infra accounts' },
                { cat: 'Doubtful Asset (D1 - up to 1 year secured)', pct: 25, rule: '25% provisioning on secured portion' },
                { cat: 'Doubtful Asset (D2 - 1 to 3 years secured)', pct: 40, rule: '40% provisioning on secured portion' },
                { cat: 'Doubtful Asset (D3 - more than 3 years)', pct: 100, rule: '100% provisioning' },
                { cat: 'Loss Asset (identified uncollectible)', pct: 100, rule: '100% provisioning requirement' }
            ];
            const npa = npaCategories[(seed >> 2) % npaCategories.length];
            const provAmount = Math.round((loanAmount * npa.pct) / 100 * 10) / 10;
            return {
                questionText: `**${bankName}** holds a non-performing loan portfolio of ₹${loanAmount} crore classified as **"${npa.cat}"**. According to RBI Prudential Norms on Income Recognition and Asset Classification (IRAC), what is the mandatory provision amount required?`,
                options: [
                    { id: 'A', text: `₹${provAmount} crore (${npa.pct}%)` },
                    { id: 'B', text: `₹${Math.round(provAmount * 1.5 * 10) / 10} crore` },
                    { id: 'C', text: `₹${Math.round((provAmount * 0.6) * 10) / 10} crore` },
                    { id: 'D', text: `₹${loanAmount} crore unconditionally` },
                ],
                correctOption: 'A',
                explanation: `Under RBI IRAC guidelines, ${npa.cat} requires ${npa.rule}: ₹${loanAmount} crore * ${npa.pct}% = ₹${provAmount} crore.`,
                difficulty: diff,
                subtopic: 'IRAC Norms & NPA Provisioning',
            };
        }
        else if (type === 3) {
            // Capital Adequacy Ratio (CRAR) calculation
            const tier1 = 500 + (seed % 200) * 25; // ₹500 to ₹5500 crore
            const tier2 = 200 + ((seed >> 2) % 100) * 15; // ₹200 to ₹1700 crore
            const rwa = 6000 + ((seed >> 4) % 300) * 100; // ₹6000 to ₹36000 crore
            const crar = Math.round(((tier1 + tier2) / rwa) * 100 * 100) / 100;
            return {
                questionText: `**${bankName}** possesses Tier 1 Capital of ₹${tier1} crore and Tier 2 Capital of ₹${tier2} crore against total Risk-Weighted Assets (RWA) of ₹${rwa} crore. What is the Capital to Risk-Weighted Assets Ratio (CRAR) of the bank?`,
                options: [
                    { id: 'A', text: `${crar}%` },
                    { id: 'B', text: `${Math.round((crar + 2.4) * 100) / 100}%` },
                    { id: 'C', text: `${Math.round((crar - 1.8) * 100) / 100}%` },
                    { id: 'D', text: `${Math.round((tier1 / rwa) * 100 * 100) / 100}%` },
                ],
                correctOption: 'A',
                explanation: `CRAR Formula = [(Tier 1 Capital + Tier 2 Capital) / Total Risk Weighted Assets] * 100 = [(${tier1} + ${tier2}) / ${rwa}] * 100 = ${crar}%.`,
                difficulty: diff,
                subtopic: 'Basel Accords & CRAR',
            };
        }
        else if (type === 4) {
            // Fiscal Deficit and Primary Deficit calculation
            const totalExp = 25000 + (seed % 400) * 150;
            const revReceipts = 14000 + ((seed >> 2) % 250) * 100;
            const nonDebtCap = 500 + ((seed >> 3) % 50) * 50;
            const intPayments = 4000 + ((seed >> 4) % 100) * 50;
            const fiscalDeficit = totalExp - (revReceipts + nonDebtCap);
            const primaryDeficit = fiscalDeficit - intPayments;
            return {
                questionText: `In the Union Budget, if Total Budget Expenditure is ₹${totalExp} crore, Revenue Receipts are ₹${revReceipts} crore, Non-Debt Capital Receipts are ₹${nonDebtCap} crore, and Interest Payments stand at ₹${intPayments} crore, what is the Gross Fiscal Deficit and Primary Deficit?`,
                options: [
                    { id: 'A', text: `Fiscal Deficit = ₹${fiscalDeficit} crore, Primary Deficit = ₹${primaryDeficit} crore` },
                    { id: 'B', text: `Fiscal Deficit = ₹${fiscalDeficit + intPayments} crore, Primary Deficit = ₹${fiscalDeficit} crore` },
                    { id: 'C', text: `Fiscal Deficit = ₹${fiscalDeficit} crore, Primary Deficit = ₹${fiscalDeficit + 1000} crore` },
                    { id: 'D', text: `Fiscal Deficit = ₹${totalExp - revReceipts} crore, Primary Deficit = ₹${totalExp - intPayments} crore` },
                ],
                correctOption: 'A',
                explanation: `Gross Fiscal Deficit = Total Expenditure - (Revenue Receipts + Non-debt Capital Receipts) = ${totalExp} - (${revReceipts} + ${nonDebtCap}) = ₹${fiscalDeficit} crore.\nPrimary Deficit = Fiscal Deficit - Interest Payments = ${fiscalDeficit} - ${intPayments} = ₹${primaryDeficit} crore.`,
                difficulty: diff,
                subtopic: 'Public Finance & Budgetary Deficits',
            };
        }
        else if (type === 5) {
            // Priority Sector Lending sub-targets
            const anbc = 20000 + (seed % 600) * 250;
            const pslSub = [
                { name: 'Agriculture (18% target)', pct: 18 },
                { name: 'Small and Marginal Farmers (10% target)', pct: 10 },
                { name: 'Micro Enterprises (7.5% target)', pct: 7.5 },
                { name: 'Weaker Sections (12% target)', pct: 12 },
                { name: 'Overall Priority Sector for Domestic Commercial Banks (40%)', pct: 40 }
            ];
            const item = pslSub[(seed >> 3) % pslSub.length];
            const targetAmount = Math.round((anbc * item.pct) / 100 * 10) / 10;
            return {
                questionText: `**${bankName}** has an Adjusted Net Bank Credit (ANBC) of ₹${anbc} crore. Under RBI PSL mandates, what is the minimum lending commitment required for **${item.name}**?`,
                options: [
                    { id: 'A', text: `₹${targetAmount} crore` },
                    { id: 'B', text: `₹${Math.round(targetAmount * 1.25 * 10) / 10} crore` },
                    { id: 'C', text: `₹${Math.round((targetAmount - 150) * 10) / 10} crore` },
                    { id: 'D', text: `₹${Math.round(anbc * 0.5)} crore` },
                ],
                correctOption: 'A',
                explanation: `Mandatory allocation for ${item.name} = ₹${anbc} crore * ${item.pct}% = ₹${targetAmount} crore.`,
                difficulty: diff,
                subtopic: 'Priority Sector Lending (PSL)',
            };
        }
        else if (type === 6) {
            // Monetary Policy Instruments
            const rates = [
                { name: 'Repo Rate', desc: 'The interest rate at which the RBI provides liquidity to commercial banks against the collateral of approved government securities under LAF' },
                { name: 'Standing Deposit Facility (SDF)', desc: 'The uncollateralized liquidity absorption rate situated 25 basis points below the policy Repo Rate' },
                { name: 'Marginal Standing Facility (MSF)', desc: 'The penal liquidity facility enabling scheduled banks to borrow overnight funds against approved G-Secs up to a specified limit beyond SLR' },
                { name: 'Bank Rate', desc: 'The standard rate under Section 49 of RBI Act at which RBI is prepared to buy or rediscount bills of exchange or other commercial papers' },
                { name: 'Reverse Repo Rate', desc: 'The rate at which the RBI absorbs liquidity from commercial banks on an overnight collateralized basis' }
            ];
            const r = rates[seed % rates.length];
            return {
                questionText: `Which Monetary Policy instrument is defined as: **"${r.desc}"**?`,
                options: [
                    { id: 'A', text: r.name },
                    { id: 'B', text: 'Base Lending Rate (BLR)' },
                    { id: 'C', text: 'External Benchmark Lending Rate (EBLR)' },
                    { id: 'D', text: 'MCLR (Marginal Cost of Funds Based Lending Rate)' },
                ],
                correctOption: 'A',
                explanation: `${r.name}: ${r.desc}.`,
                difficulty: diff,
                subtopic: 'Monetary Policy Framework',
            };
        }
        else if (type === 7) {
            // Monetary Aggregates
            const agg = [
                { name: 'M1 (Narrow Money)', comp: 'Currency with Public + Demand Deposits with Banking System + "Other" Deposits with RBI' },
                { name: 'M2', comp: 'M1 + Post Office Savings Bank Deposits' },
                { name: 'M3 (Broad Money)', comp: 'M1 + Time Deposits with the Banking System' },
                { name: 'M4', comp: 'M3 + All deposits with Post Office Savings Banks (excluding National Savings Certificates)' },
                { name: 'Reserve Money (M0 / High Powered Money)', comp: 'Currency in Circulation + Bankers\' Deposits with RBI + "Other" Deposits with RBI' }
            ];
            const item = agg[seed % agg.length];
            return {
                questionText: `In the measurement of monetary aggregates in the Indian economy, which component constitutes **"${item.name}"**?`,
                options: [
                    { id: 'A', text: item.comp },
                    { id: 'B', text: 'Total Foreign Exchange Reserves + Gold bullion holdings' },
                    { id: 'C', text: 'Call money borrowings + Interbank term liabilities' },
                    { id: 'D', text: 'Total Market Capitalization of Listed Public Equities' },
                ],
                correctOption: 'A',
                explanation: `Under RBI money supply definitions, ${item.name} = ${item.comp}.`,
                difficulty: diff,
                subtopic: 'Money Supply & Macroeconomics',
            };
        }
        else {
            const bankBank = [
                {
                    q: 'What is the full form and primary purpose of "UPI 123PAY" launched by the National Payments Corporation of India (NPCI)?',
                    options: ['Instant payment facility tailored for non-smart feature phone users', 'Cross-border remittances exclusively for corporate enterprises', 'Cryptocurrency settlement portal', 'Credit scoring mechanism for micro-enterprises'],
                    ans: 'A',
                    exp: 'UPI 123PAY allows feature phone users to make secure digital payments using IVR, app, sound-based technology, and missed calls without internet.',
                    sub: 'Banking Awareness & FinTech',
                },
                {
                    q: 'Under the Insolvency and Bankruptcy Code (IBC) 2016, what is the default statutory timeline for the Corporate Insolvency Resolution Process (CIRP)?',
                    options: ['180 days (extendable by up to 90 days)', '90 days strictly', '365 days', '60 days'],
                    ans: 'A',
                    exp: 'Section 12 of IBC mandates CIRP completion within 180 days, extendable by up to 90 days by the Adjudicating Authority.',
                    sub: 'Banking Regulations & IBC',
                },
                {
                    q: 'Under the Basel III regulatory framework, what is the minimum Common Equity Tier 1 (CET1) ratio required to be maintained by Indian banks?',
                    options: ['5.5% of Risk-Weighted Assets (plus 2.5% CCB)', '8.0% of Risk-Weighted Assets', '4.0% of Risk-Weighted Assets', '11.5% of Risk-Weighted Assets'],
                    ans: 'A',
                    exp: 'Under RBI Basel III norms, minimum CET1 is 5.5% plus a Capital Conservation Buffer (CCB) of 2.5%, totaling 8.0%.',
                    sub: 'Basel Accords & Capital Adequacy',
                },
                {
                    q: 'What does the abbreviation "NEFT" stand for in Indian banking, and what is its operational settlement window?',
                    options: ['National Electronic Funds Transfer, operating on 24x7 half-hourly batch settlements', 'National Electronic Fast Transfer, real-time settlement', 'Network Electronic Fund Transaction, 8 AM to 7 PM on working days', 'Nationalized Enterprise Fund Transfer, daily end-of-day batch'],
                    ans: 'A',
                    exp: 'NEFT stands for National Electronic Funds Transfer and operates round-the-clock (24x7) with 48 half-hourly batches daily.',
                    sub: 'Payment & Settlement Systems',
                },
                {
                    q: 'What is the maximum insurance coverage provided per depositor per bank by the Deposit Insurance and Credit Guarantee Corporation (DICGC)?',
                    options: ['₹5,00,000 (Principal + Interest)', '₹1,00,000', '₹10,00,000', '₹2,50,000'],
                    ans: 'A',
                    exp: 'Effective February 4, 2020, DICGC raised deposit insurance cover from ₹1 lakh to ₹5 lakh per depositor across savings, current, and term deposits.',
                    sub: 'DICGC & Banking Security',
                },
                {
                    q: 'Under the Negotiable Instruments Act 1881, which section deals with the dishonour of a cheque for insufficiency of funds as a penal offence?',
                    options: ['Section 138', 'Section 131', 'Section 4', 'Section 15'],
                    ans: 'A',
                    exp: 'Section 138 of the NI Act 1881 makes the dishonour of cheques for lack of funds punishable with imprisonment up to 2 years or fine up to double the cheque amount.',
                    sub: 'Negotiable Instruments Act',
                },
                {
                    q: 'Which committee appointed by RBI recommended the introduction of the 6-member Monetary Policy Committee (MPC) framework in India?',
                    options: ['Urjit Patel Committee (2014)', 'Narasimham Committee (1991)', 'Bimal Jalan Committee (2019)', 'Nachiket Mor Committee (2013)'],
                    ans: 'A',
                    exp: 'The Urjit Patel Committee recommended flexible inflation targeting and setting up a statutory Monetary Policy Committee.',
                    sub: 'Banking Committees & Reforms',
                },
                {
                    q: 'What are the three standard maturity tenors of sovereign Treasury Bills (T-Bills) issued by the Government of India via RBI auctions?',
                    options: ['91 days, 182 days, and 364 days', '30 days, 60 days, and 90 days', '1 year, 3 years, and 5 years', '180 days, 360 days, and 720 days'],
                    ans: 'A',
                    exp: 'Treasury Bills are zero-coupon money market instruments issued at a discount for tenors of 91 days, 182 days, and 364 days.',
                    sub: 'Money Market Instruments',
                },
                {
                    q: 'What does the term "Fiscal Deficit" represent in the Union Budget of the Government of India?',
                    options: ['Total Expenditure - (Revenue Receipts + Non-debt Capital Receipts)', 'Revenue Expenditure - Revenue Receipts', 'Fiscal Deficit - Interest Payments', 'Total Borrowings - External Loan Repayments'],
                    ans: 'A',
                    exp: 'Fiscal Deficit = Total Budget Expenditure - (Revenue Receipts + Non-debt Capital Receipts) = Net borrowing requirement of the government.',
                    sub: 'Public Finance & Budgeting',
                },
                {
                    q: 'What is the base year currently used for calculating the Consumer Price Index (CPI - Combined) in India published by the NSO?',
                    options: ['2012', '2004-05', '2011-12', '2016'],
                    ans: 'A',
                    exp: 'The Consumer Price Index (CPI) combined series uses 2012 as the base year (Base: 2012 = 100).',
                    sub: 'Inflation & Price Indices',
                },
                {
                    q: 'Which apex financial institution regulates housing finance companies (HFCs) and provides refinance for the housing finance sector in India?',
                    options: ['Reserve Bank of India (RBI) with National Housing Bank (NHB) as refinance body', 'SEBI', 'IRDAI', 'NABARD'],
                    ans: 'A',
                    exp: 'Regulatory powers over HFCs were transferred to the RBI under the Finance Act 2019, while NHB continues refinance and developmental roles.',
                    sub: 'Apex Financial Institutions',
                }
            ];
            const idx = seed % bankBank.length;
            const item = bankBank[idx];
            return {
                questionText: item.q,
                options: [
                    { id: 'A', text: item.options[0] },
                    { id: 'B', text: item.options[1] },
                    { id: 'C', text: item.options[2] },
                    { id: 'D', text: item.options[3] },
                ],
                correctOption: item.ans,
                explanation: item.exp,
                difficulty: diff,
                subtopic: item.sub,
            };
        }
    }
    // =========================================================================
    // 8. APPSC SPECIFIC (FBO & ABO)
    // =========================================================================
    static generateAPPSCQuestion(seed, diff, topicName, examName) {
        const appscBank = [
            {
                q: 'Under the Andhra Pradesh Reorganisation Act, 2014, how many Lok Sabha seats and Rajya Sabha seats were allocated to the successor State of Andhra Pradesh?',
                options: ['25 Lok Sabha and 11 Rajya Sabha seats', '17 Lok Sabha and 7 Rajya Sabha seats', '20 Lok Sabha and 9 Rajya Sabha seats', '28 Lok Sabha and 12 Rajya Sabha seats'],
                ans: 'A',
                exp: 'Under the 2014 Act, Andhra Pradesh retained 25 Lok Sabha seats and 11 Rajya Sabha seats.',
                sub: 'AP Reorganisation Act 2014',
            },
            {
                q: 'Which National Park in Andhra Pradesh is located on the Seshachalam hills and is famous for endemic Red Sanders (Pterocarpus santalinus)?',
                options: ['Sri Venkateswara National Park', 'Papikonda National Park', 'Rajiv Gandhi (Rameswaram) National Park', 'Coringa Wildlife Sanctuary'],
                ans: 'A',
                exp: 'Sri Venkateswara National Park in Tirupati/Chittoor covers part of the Seshachalam Biosphere Reserve, renowned for endemic Red Sanders.',
                sub: 'AP Forestry & Wildlife',
            },
            {
                q: 'Under Andhra Pradesh Forest Subordinate Service Rules, what is the minimum height requirement for male candidates applying for the post of Forest Beat Officer (FBO)?',
                options: ['163 cm', '170 cm', '158 cm', '160 cm'],
                ans: 'A',
                exp: 'Official APPSC standards require general male candidates to possess a minimum height of 163 cm and chest of 84 cm with 5 cm expansion.',
                sub: 'AP Forestry Rules',
            },
            {
                q: 'The renowned Polavaram Multipurpose Irrigation Project is being constructed across which major river in Andhra Pradesh?',
                options: ['Godavari River', 'Krishna River', 'Pennar River', 'Tungabhadra River'],
                ans: 'A',
                exp: 'Polavaram Project (Indira Sagar) is a major national project constructed on the Godavari River in Eluru/Alluri Sitharama Raju districts.',
                sub: 'AP Geography & Projects',
            },
            {
                q: 'Which famous wildlife sanctuary in Andhra Pradesh is the largest remaining mangrove ecosystem on the East Coast of India after the Sundarbans?',
                options: ['Coringa Wildlife Sanctuary', 'Kolleru Bird Sanctuary', 'Nelapattu Bird Sanctuary', 'Rollapadu Wildlife Sanctuary'],
                ans: 'A',
                exp: 'Coringa Wildlife Sanctuary in Kakinada district encompasses extensive mangrove forests and estuaries of the Godavari river.',
                sub: 'AP Environment & Mangroves',
            },
            {
                q: 'Who led the famous Rampa Rebellion (1922-1924) against the British Madras Presidency in the Agency areas of Visakhapatnam and East Godavari districts?',
                options: ['Alluri Sitarama Raju', 'Potti Sreeramulu', 'Tanguturi Prakasam Pantulu', 'Uyyalawada Narasimha Reddy'],
                ans: 'A',
                exp: 'Alluri Sitarama Raju led the tribal guerrilla uprising against the 1882 Madras Forest Act in the Rampa region.',
                sub: 'AP Freedom Movement & History',
            },
            {
                q: 'What is the official state animal and state bird of Andhra Pradesh?',
                options: ['Blackbuck (Krishna Jinka) and Rose-ringed Parakeet (Rama Chiluka)', 'Spotted Deer and Great Indian Bustard', 'Indian Leopard and Peacock', 'Nilgai and Asian Koel'],
                ans: 'A',
                exp: 'Government of Andhra Pradesh designated Blackbuck as State Animal, Rose-ringed Parakeet as State Bird, Neem as State Tree, and Jasmine as State Flower.',
                sub: 'AP State Symbols',
            },
            {
                q: 'Kolleru Lake, one of the largest freshwater lakes in India and a designated Ramsar wetland site, is situated between which two river basins?',
                options: ['Godavari and Krishna river basins', 'Krishna and Pennar river basins', 'Godavari and Vamsadhara river basins', 'Pennar and Palar river basins'],
                ans: 'A',
                exp: 'Kolleru Lake is located between the deltas of Krishna and West Godavari districts, fed by seasonal Budameru and Tammileru streams.',
                sub: 'AP Wetlands & Geography',
            },
            {
                q: 'Under the Indian Forest Act and Wildlife Protection Act, in which schedule are critically endangered species like the Great Indian Bustard and Indian Pangolin protected with the highest penalties?',
                options: ['Schedule I', 'Schedule II', 'Schedule III', 'Schedule IV'],
                ans: 'A',
                exp: 'Under the Wild Life (Protection) Act 1972 (and 2022 amendment), Schedule I contains animal species that enjoy absolute protection.',
                sub: 'Forestry Legislation & Wildlife',
            },
            {
                q: 'Who was popularly conferred the title "Andhra Kesari" (Lion of Andhra) and served as the first Chief Minister of Andhra State in 1953?',
                options: ['Tanguturi Prakasam Pantulu', 'Neelam Sanjiva Reddy', 'Bhogaraju Pattabhi Sitaramayya', 'Burgula Ramakrishna Rao'],
                ans: 'A',
                exp: 'Tanguturi Prakasam Pantulu served as the premier of Madras Presidency and first Chief Minister of Andhra State at Kurnool.',
                sub: 'AP Modern History',
            },
            {
                q: 'Which wildlife sanctuary in Kurnool district of Andhra Pradesh is famous for the conservation of the endangered Great Indian Bustard (Ardeotis nigriceps)?',
                options: ['Rollapadu Wildlife Sanctuary', 'Gundla Brahmeswaram Sanctuary', 'Kambalakonda Wildlife Sanctuary', 'Sri Lankamalleswara Sanctuary'],
                ans: 'A',
                exp: 'Rollapadu Wildlife Sanctuary in Kurnool protects the grassland habitat of the critically endangered Great Indian Bustard and Lesser Florican.',
                sub: 'AP Wildlife Sanctuaries',
            },
            {
                q: 'Which ancient Buddhist heritage site in Andhra Pradesh on the banks of Krishna River is famous for Mahachaitya and Amaravati school of art?',
                options: ['Amaravati (Dharanikota)', 'Bhattiprolu', 'Nagarjunakonda', 'Salihundam'],
                ans: 'A',
                exp: 'Amaravati was a great seat of Hinayana and Mahayana Buddhism under the Satavahanas and Ikshvakus.',
                sub: 'AP Ancient History & Culture',
            },
            {
                q: 'Which hill range in Andhra Pradesh is recognized as a UNESCO Biosphere Reserve in India?',
                options: ['Seshachalam Hills', 'Nallamala Hills', 'Erramala Hills', 'Velikonda Hills'],
                ans: 'A',
                exp: 'The Seshachalam Biosphere Reserve in the Eastern Ghats of Southern Andhra Pradesh was designated as a Biosphere Reserve in 2010.',
                sub: 'AP Biosphere Reserves & Ecology',
            },
            {
                q: 'In which year did the Government of Andhra Pradesh reorganise the state into 26 administrative districts (effective April 4)?',
                options: ['2022', '2019', '2014', '2020'],
                ans: 'A',
                exp: 'On April 4, 2022, Andhra Pradesh carved out 13 new districts, creating a total of 26 districts aligned with parliamentary constituencies.',
                sub: 'AP Administration & Governance',
            }
        ];
        const idx = seed % appscBank.length;
        const item = appscBank[idx];
        return {
            questionText: item.q,
            options: [
                { id: 'A', text: item.options[0] },
                { id: 'B', text: item.options[1] },
                { id: 'C', text: item.options[2] },
                { id: 'D', text: item.options[3] },
            ],
            correctOption: item.ans,
            explanation: item.exp,
            difficulty: diff,
            subtopic: item.sub,
        };
    }
}
