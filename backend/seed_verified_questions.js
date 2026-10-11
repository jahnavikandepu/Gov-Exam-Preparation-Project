import { prisma } from './src/config/db.js';
import { generateQuestionHash } from './src/utils/questionHash.js';

async function seedVerifiedQuestions() {
  console.log('🚀 Starting Comprehensive Question Bank Expansion...');

  const exams = await prisma.exam.findMany({
    include: {
      subjects: { include: { topics: true } },
      stages: { include: { sections: true } }
    }
  });

  const appscExam = exams.find(e => e.slug === 'appsc-fbo-abo');
  const ibpsExam = exams.find(e => e.slug === 'ibps-po');
  const rrbNtpcExam = exams.find(e => e.slug === 'rrb-ntpc');
  const rrbJeExam = exams.find(e => e.slug === 'rrb-je');
  const rrbGroupDExam = exams.find(e => e.slug === 'rrb-group-d');

  // =========================================================================
  // 1. APPSC QUALIFYING ESSAY PROMPTS (DESCRIPTIVE_ESSAY)
  // =========================================================================
  if (appscExam) {
    const essaySubject = appscExam.subjects.find(s => s.slug === 'appsc-qualifying-essay') || appscExam.subjects[0];
    const essayTopic = essaySubject.topics[0] || (await prisma.topic.create({
      data: {
        subjectId: essaySubject.id,
        name: 'Forest Conservation & Environment',
        slug: 'appsc-env-conservation'
      }
    }));

    const appscEssayPrompts = [
      {
        questionText: 'Analyze the impact of mangrove forest depletion on cyclone resilience along the Andhra Pradesh coastline and propose sustainable conservation measures under the Coastal Regulation Zone framework.',
        difficulty: 'MEDIUM',
        subtopic: 'Coastal Ecology & Mangroves',
        explanation: 'Evaluate ecological buffers provided by mangroves like Coringa Wildlife Sanctuary against storm surges, impacts of aquaculture conversion, and community-led restoration strategies.'
      },
      {
        questionText: 'Discuss the role of Joint Forest Management (JFM) and Van Samrakshana Samithis (VSS) in preventing forest fires and promoting eco-tourism in the Eastern Ghats of Andhra Pradesh.',
        difficulty: 'MEDIUM',
        subtopic: 'Community Forestry & Fire Management',
        explanation: 'Examine tribal participatory management, controlled burning techniques, early warning satellite fire alerts (FSI), and livelihood generation through eco-tourism.'
      },
      {
        questionText: 'Examine the ecological and economic significance of Red Sanders (Pterocarpus santalinus) in the Seshachalam Biosphere Reserve and suggest comprehensive policy and technological strategies to curb illegal felling and smuggling.',
        difficulty: 'HARD',
        subtopic: 'Endemic Flora & Anti-Smuggling',
        explanation: 'Focus on endemic habitat, CITES Appendix II regulation, geo-tagging, drone surveillance, Special Task Force operations, and legal plantation frameworks.'
      },
      {
        questionText: 'Evaluate the escalating challenges of Human-Wildlife Conflict (HWC) in elephant migration corridors across Chittoor and Tirupati districts, and propose evidence-based mitigation policies.',
        difficulty: 'MEDIUM',
        subtopic: 'Wildlife Management & Corridor Conservation',
        explanation: 'Analyze habitat fragmentation, solar fencing, bio-fencing (chilli-dung fences), Kumki elephant deployments, and rapid compensation mechanisms.'
      },
      {
        questionText: 'Discuss the significance of agro-forestry and social forestry in combating desertification and groundwater depletion in the Rayalaseema drought-prone agro-climatic zone.',
        difficulty: 'EASY',
        subtopic: 'Agro-Forestry & Climate Adaptation',
        explanation: 'Evaluate drought-resilient silvopastoral models, groundwater recharge through check dams, watershed management, and farm forestry with indigenous tree species.'
      }
    ];

    for (const p of appscEssayPrompts) {
      const qHash = generateQuestionHash(p.questionText, []);
      const existing = await prisma.question.findFirst({ where: { questionHash: qHash } });
      if (!existing) {
        await prisma.question.create({
          data: {
            examId: appscExam.id,
            subjectId: essaySubject.id,
            topicId: essayTopic.id,
            questionText: p.questionText,
            questionType: 'DESCRIPTIVE_ESSAY',
            options: JSON.stringify([]),
            correctOption: 'Descriptive Essay',
            explanation: p.explanation,
            difficulty: p.difficulty,
            subtopic: p.subtopic,
            status: 'PUBLISHED',
            source: 'VERIFIED',
            questionHash: qHash
          }
        });
      }
    }
    console.log('✅ Seeded APPSC Qualifying Essay prompts');
  }

  // =========================================================================
  // 2. IBPS PO MAINS DESCRIPTIVE ENGLISH (LETTERS & ESSAYS)
  // =========================================================================
  if (ibpsExam) {
    const englishSubject = ibpsExam.subjects.find(s => s.slug === 'ibps-english') || ibpsExam.subjects[0];
    let letterTopic = englishSubject.topics.find(t => t.slug === 'letter-writing');
    if (!letterTopic) {
      letterTopic = await prisma.topic.create({
        data: {
          subjectId: englishSubject.id,
          name: 'Letter Writing (Formal & Informal)',
          slug: 'letter-writing'
        }
      });
    }

    let essayTopic = englishSubject.topics.find(t => t.slug === 'essay-writing');
    if (!essayTopic) {
      essayTopic = await prisma.topic.create({
        data: {
          subjectId: englishSubject.id,
          name: 'Essay Writing (Contemporary Banking & Economy)',
          slug: 'essay-writing'
        }
      });
    }

    const ibpsLetterPrompts = [
      {
        questionText: 'Write a formal letter to the Branch Manager of your bank requesting the replacement of an expired EMV chip debit card and temporary issuance of a virtual card for urgent transactions.',
        difficulty: 'MEDIUM',
        subtopic: 'Formal Banking Correspondence',
        explanation: 'Formal letter structure: Sender address, Date, Receiver designation/branch, Salutation, Subject line, Clear concise 3-paragraph body, Formal sign-off.'
      },
      {
        questionText: 'Write a letter to the Chief Vigilance Officer of a commercial bank reporting a fraudulent phishing SMS pretending to represent the bank’s KYC update portal.',
        difficulty: 'MEDIUM',
        subtopic: 'Cyber Security & Fraud Reporting',
        explanation: 'Detail the spoofed URL, timestamp of the message, account safety precautions taken, and request public advisory warnings.'
      },
      {
        questionText: 'Write a formal letter to the Editor of a prominent financial newspaper discussing the potential advantages of Central Bank Digital Currency (e-Rupee) for retail payments in rural India.',
        difficulty: 'HARD',
        subtopic: 'Financial Editorial',
        explanation: 'Highlight offline transaction capability, lower transaction friction, reduction in physical currency printing costs, and digital financial inclusion.'
      }
    ];

    for (const p of ibpsLetterPrompts) {
      const qHash = generateQuestionHash(p.questionText, []);
      const existing = await prisma.question.findFirst({ where: { questionHash: qHash } });
      if (!existing) {
        await prisma.question.create({
          data: {
            examId: ibpsExam.id,
            subjectId: englishSubject.id,
            topicId: letterTopic.id,
            questionText: p.questionText,
            questionType: 'DESCRIPTIVE_ESSAY',
            options: JSON.stringify([]),
            correctOption: 'Descriptive Letter',
            explanation: p.explanation,
            difficulty: p.difficulty,
            subtopic: p.subtopic,
            status: 'PUBLISHED',
            source: 'VERIFIED',
            questionHash: qHash
          }
        });
      }
    }

    const ibpsEssayPrompts = [
      {
        questionText: 'Write an essay on "Impact of Generative AI and Automation on Customer Service and Cyber Risk in Modern Commercial Banking". (Approx. 250 words)',
        difficulty: 'HARD',
        subtopic: 'Banking Technology',
        explanation: 'Structure: Introduction defining AI adoption in core banking, body paragraphs analyzing fraud detection vs synthetic identity theft, conclusion on ethical governance.'
      },
      {
        questionText: 'Write an essay on "Deepening Financial Inclusion in India: The Role of Digital Public Infrastructure (UPI, Account Aggregator, and PMJDY)". (Approx. 250 words)',
        difficulty: 'MEDIUM',
        subtopic: 'Financial Inclusion',
        explanation: 'Analyze India Stack layers, credit underwriting for informal workers via Account Aggregator, and the transformation of micro-credit delivery.'
      },
      {
        questionText: 'Write an essay on "Green Banking and ESG Financing: Aligning Indian Financial Institutions with Sustainable Development Goals". (Approx. 250 words)',
        difficulty: 'MEDIUM',
        subtopic: 'Sustainable Finance',
        explanation: 'Discuss sovereign green bonds, climate risk disclosures (RBI guidelines), priority sector lending for renewable energy, and net-zero targets.'
      }
    ];

    for (const p of ibpsEssayPrompts) {
      const qHash = generateQuestionHash(p.questionText, []);
      const existing = await prisma.question.findFirst({ where: { questionHash: qHash } });
      if (!existing) {
        await prisma.question.create({
          data: {
            examId: ibpsExam.id,
            subjectId: englishSubject.id,
            topicId: essayTopic.id,
            questionText: p.questionText,
            questionType: 'DESCRIPTIVE_ESSAY',
            options: JSON.stringify([]),
            correctOption: 'Descriptive Essay',
            explanation: p.explanation,
            difficulty: p.difficulty,
            subtopic: p.subtopic,
            status: 'PUBLISHED',
            source: 'VERIFIED',
            questionHash: qHash
          }
        });
      }
    }
    console.log('✅ Seeded IBPS PO Descriptive English letters and essays');
  }

  // =========================================================================
  // 3. RRB JE CBT-1 QUESTIONS (100 Questions Benchmark)
  // =========================================================================
  if (rrbJeExam) {
    const mathSubj = rrbJeExam.subjects.find(s => s.slug === 'je-maths') || rrbJeExam.subjects[0];
    const mathTopic = mathSubj.topics[0];
    const reasSubj = rrbJeExam.subjects.find(s => s.slug === 'je-reasoning') || rrbJeExam.subjects[1];
    const reasTopic = reasSubj.topics[0];
    const gaSubj = rrbJeExam.subjects.find(s => s.slug === 'je-ga') || rrbJeExam.subjects[2];
    const gaTopic = gaSubj.topics[0];
    const sciSubj = rrbJeExam.subjects.find(s => s.slug === 'je-science') || rrbJeExam.subjects[3];
    const sciTopic = sciSubj.topics[0];

    const jeQuestions = [
      // Mathematics (30 Questions target)
      {
        examId: rrbJeExam.id,
        subjectId: mathSubj.id,
        topicId: mathTopic.id,
        questionText: 'If the roots of the quadratic equation x^2 - 7x + 12 = 0 are p and q, find the value of p^2 + q^2.',
        options: ['25', '37', '49', '13'],
        correctOption: '25',
        explanation: 'Sum of roots p + q = 7, product pq = 12. p^2 + q^2 = (p + q)^2 - 2pq = 49 - 24 = 25.',
        difficulty: 'EASY',
        subtopic: 'Quadratic Equations'
      },
      {
        examId: rrbJeExam.id,
        subjectId: mathSubj.id,
        topicId: mathTopic.id,
        questionText: 'A pipe can fill a reservoir in 12 hours, while an outlet pipe can empty it in 20 hours. If both pipes are opened simultaneously, in how many hours will the reservoir be filled?',
        options: ['30 hours', '32 hours', '25 hours', '28 hours'],
        correctOption: '30 hours',
        explanation: 'Net rate = 1/12 - 1/20 = (5 - 3)/60 = 2/60 = 1/30 reservoir per hour. Total time = 30 hours.',
        difficulty: 'MEDIUM',
        subtopic: 'Pipes & Cisterns'
      },
      {
        examId: rrbJeExam.id,
        subjectId: mathSubj.id,
        topicId: mathTopic.id,
        questionText: 'Evaluate the limit of (sin 3x) / (5x) as x approaches 0.',
        options: ['3/5', '5/3', '0', '1'],
        correctOption: '3/5',
        explanation: 'lim (sin 3x)/(5x) = (3/5) * lim (sin 3x)/(3x) = (3/5) * 1 = 3/5.',
        difficulty: 'MEDIUM',
        subtopic: 'Calculus Fundamentals'
      },
      {
        examId: rrbJeExam.id,
        subjectId: mathSubj.id,
        topicId: mathTopic.id,
        questionText: 'The simple interest on a certain sum of money for 3 years at 8% per annum is ₹240 less than the compound interest on the same sum for 2 years at 10% per annum. What is the sum?',
        options: ['₹8,000', '₹7,500', '₹9,000', '₹6,000'],
        correctOption: '₹8,000',
        explanation: 'SI = P * 8 * 3 / 100 = 0.24P. CI = P[(1.1)^2 - 1] = 0.21P. 0.24P - 0.21P = 0.03P. P = 240 / 0.03 = ₹8,000.',
        difficulty: 'HARD',
        subtopic: 'Interest & Annuities'
      },
      {
        examId: rrbJeExam.id,
        subjectId: mathSubj.id,
        topicId: mathTopic.id,
        questionText: 'In a triangle ABC, angle B = 90°, AB = 8 cm, and BC = 15 cm. Find the radius of the incircle (inradius).',
        options: ['3 cm', '4 cm', '2.5 cm', '5 cm'],
        correctOption: '3 cm',
        explanation: 'Hypotenuse AC = sqrt(8^2 + 15^2) = 17 cm. For right-angled triangle, inradius r = (a + b - c)/2 = (8 + 15 - 17)/2 = 6/2 = 3 cm.',
        difficulty: 'MEDIUM',
        subtopic: 'Geometry & Mensuration'
      },

      // Reasoning (25 Questions target)
      {
        examId: rrbJeExam.id,
        subjectId: reasSubj.id,
        topicId: reasTopic.id,
        questionText: 'Find the missing number in the series: 4, 18, 48, 100, 180, ?',
        options: ['294', '280', '290', '312'],
        correctOption: '294',
        explanation: 'The pattern is n^3 - n^2: 2^3 - 2^2 = 4; 3^3 - 3^2 = 18; 4^3 - 4^2 = 48; 5^3 - 5^2 = 100; 6^3 - 6^2 = 180; 7^3 - 7^2 = 343 - 49 = 294.',
        difficulty: 'HARD',
        subtopic: 'Number Series'
      },
      {
        examId: rrbJeExam.id,
        subjectId: reasSubj.id,
        topicId: reasTopic.id,
        questionText: 'Statements: All diodes are semiconductors. Some semiconductors are silicon chips. Conclusions: I. Some silicon chips are diodes. II. All semiconductors are diodes.',
        options: ['Neither I nor II follows', 'Only I follows', 'Only II follows', 'Both I and II follow'],
        correctOption: 'Neither I nor II follows',
        explanation: 'Diodes are a subset of semiconductors; silicon chips overlap with semiconductors. No definite relation between chips and diodes.',
        difficulty: 'MEDIUM',
        subtopic: 'Syllogism'
      },
      {
        examId: rrbJeExam.id,
        subjectId: reasSubj.id,
        topicId: reasTopic.id,
        questionText: 'Point A is 10 m North of Point B. Point C is 12 m East of Point B. Point D is 6 m South of Point C. What is the shortest distance between Point A and Point D?',
        options: ['20 m', '18 m', '22 m', '16 m'],
        correctOption: '20 m',
        explanation: 'Vertical distance = 10 + 6 = 16 m. Horizontal distance = 12 m. Shortest distance = sqrt(16^2 + 12^2) = sqrt(256 + 144) = sqrt(400) = 20 m.',
        difficulty: 'MEDIUM',
        subtopic: 'Direction Sense'
      },

      // General Awareness (15 Questions target)
      {
        examId: rrbJeExam.id,
        subjectId: gaSubj.id,
        topicId: gaTopic.id,
        questionText: 'Which Indian railway zone is headquartered at Bilaspur?',
        options: ['South East Central Railway', 'East Central Railway', 'South Central Railway', 'West Central Railway'],
        correctOption: 'South East Central Railway',
        explanation: 'South East Central Railway (SECR) zone headquarters is situated at Bilaspur, Chhattisgarh.',
        difficulty: 'EASY',
        subtopic: 'Indian Railways Infrastructure'
      },
      {
        examId: rrbJeExam.id,
        subjectId: gaSubj.id,
        topicId: gaTopic.id,
        questionText: 'Under the Indian Constitution, the concept of "Judicial Review" is largely inspired by the Constitution of which nation?',
        options: ['United States of America', 'United Kingdom', 'Canada', 'Australia'],
        correctOption: 'United States of America',
        explanation: 'The doctrine of Judicial Review and independence of the judiciary was borrowed from the US Constitution.',
        difficulty: 'EASY',
        subtopic: 'Indian Polity'
      },

      // General Science (30 Questions target)
      {
        examId: rrbJeExam.id,
        subjectId: sciSubj.id,
        topicId: sciTopic.id,
        questionText: 'What is the SI unit of Magnetic Flux Density (Magnetic Induction)?',
        options: ['Tesla', 'Weber', 'Henry', 'Gauss'],
        correctOption: 'Tesla',
        explanation: 'Tesla (T) is the SI unit of magnetic flux density (Weber per square meter). Weber is the unit of magnetic flux.',
        difficulty: 'EASY',
        subtopic: 'Physics - Electromagnetism'
      },
      {
        examId: rrbJeExam.id,
        subjectId: sciSubj.id,
        topicId: sciTopic.id,
        questionText: 'According to Bernoulli’s theorem, for an incompressible, non-viscous fluid in a streamline flow, which quantity remains constant along a streamline?',
        options: ['Total Energy per unit mass', 'Only Static Pressure', 'Only Kinetic Energy', 'Viscous Force'],
        correctOption: 'Total Energy per unit mass',
        explanation: 'Bernoulli’s principle states that the sum of pressure energy, kinetic energy, and potential energy per unit mass remains constant.',
        difficulty: 'MEDIUM',
        subtopic: 'Physics - Fluid Mechanics'
      },
      {
        examId: rrbJeExam.id,
        subjectId: sciSubj.id,
        topicId: sciTopic.id,
        questionText: 'Which of the following compounds exhibits both ionic and covalent bonding?',
        options: ['KCN (Potassium Cyanide)', 'NaCl (Sodium Chloride)', 'CH4 (Methane)', 'H2O (Water)'],
        correctOption: 'KCN (Potassium Cyanide)',
        explanation: 'KCN contains ionic bonding between K+ and (CN)- and covalent triple bonding between Carbon and Nitrogen in the cyanide ion.',
        difficulty: 'MEDIUM',
        subtopic: 'Chemistry - Chemical Bonding'
      },
      {
        examId: rrbJeExam.id,
        subjectId: sciSubj.id,
        topicId: sciTopic.id,
        questionText: 'Which hormone is primarily responsible for the "fight-or-flight" response in the human body?',
        options: ['Adrenaline (Epinephrine)', 'Thyroxine', 'Insulin', 'Melatonin'],
        correctOption: 'Adrenaline (Epinephrine)',
        explanation: 'Adrenaline secreted by the adrenal medulla increases heart rate, respiration, and glucose availability during acute stress.',
        difficulty: 'EASY',
        subtopic: 'Biology - Endocrine System'
      }
    ];

    for (const q of jeQuestions) {
      const qHash = generateQuestionHash(q.questionText, q.options);
      const existing = await prisma.question.findFirst({ where: { questionHash: qHash } });
      if (!existing) {
        await prisma.question.create({
          data: {
            examId: q.examId,
            subjectId: q.subjectId,
            topicId: q.topicId,
            questionText: q.questionText,
            questionType: 'OBJECTIVE_MCQ',
            options: JSON.stringify(q.options),
            correctOption: q.correctOption,
            explanation: q.explanation,
            difficulty: q.difficulty,
            subtopic: q.subtopic,
            status: 'PUBLISHED',
            source: 'VERIFIED',
            questionHash: qHash
          }
        });
      }
    }
    console.log('✅ Seeded core RRB JE official blueprint questions');
  }

  // =========================================================================
  // 4. RRB GROUP D CBT QUESTIONS (100 Questions Benchmark)
  // =========================================================================
  if (rrbGroupDExam) {
    const sciSubj = rrbGroupDExam.subjects.find(s => s.slug === 'gd-science') || rrbGroupDExam.subjects[0];
    const sciTopic = sciSubj.topics[0];
    const mathSubj = rrbGroupDExam.subjects.find(s => s.slug === 'gd-maths') || rrbGroupDExam.subjects[1];
    const mathTopic = mathSubj.topics[0];
    const reasSubj = rrbGroupDExam.subjects.find(s => s.slug === 'gd-reasoning') || rrbGroupDExam.subjects[2];
    const reasTopic = reasSubj.topics[0];
    const gaSubj = rrbGroupDExam.subjects.find(s => s.slug === 'gd-ga') || rrbGroupDExam.subjects[3];
    const gaTopic = gaSubj.topics[0];

    const groupDQuestions = [
      {
        examId: rrbGroupDExam.id,
        subjectId: sciSubj.id,
        topicId: sciTopic.id,
        questionText: 'What is the pH value of pure water at 25°C?',
        options: ['7.0', '5.6', '8.2', '6.0'],
        correctOption: '7.0',
        explanation: 'Pure neutral water has equal hydrogen and hydroxide ion concentration resulting in a pH of exactly 7.0 at 25°C.',
        difficulty: 'EASY',
        subtopic: 'Chemistry - Acids & Bases'
      },
      {
        examId: rrbGroupDExam.id,
        subjectId: sciSubj.id,
        topicId: sciTopic.id,
        questionText: 'An object of mass 15 kg is moving with a uniform velocity of 4 m/s. What is the kinetic energy possessed by the object?',
        options: ['120 J', '60 J', '240 J', '180 J'],
        correctOption: '120 J',
        explanation: 'Kinetic energy KE = (1/2) * m * v^2 = 0.5 * 15 * 16 = 120 Joules.',
        difficulty: 'EASY',
        subtopic: 'Physics - Work, Power & Energy'
      },
      {
        examId: rrbGroupDExam.id,
        subjectId: mathSubj.id,
        topicId: mathTopic.id,
        questionText: 'The average of 5 consecutive odd numbers is 27. What is the largest of these numbers?',
        options: ['31', '29', '33', '35'],
        correctOption: '31',
        explanation: 'For consecutive numbers with an odd count, the average is the middle number (27). The numbers are 23, 25, 27, 29, 31. Largest is 31.',
        difficulty: 'EASY',
        subtopic: 'Arithmetic - Averages'
      },
      {
        examId: rrbGroupDExam.id,
        subjectId: mathSubj.id,
        topicId: mathTopic.id,
        questionText: 'A train 180 meters long is running at a speed of 54 km/h. How much time will it take to pass an electric pole?',
        options: ['12 seconds', '10 seconds', '15 seconds', '8 seconds'],
        correctOption: '12 seconds',
        explanation: 'Speed in m/s = 54 * (5/18) = 15 m/s. Time = Distance / Speed = 180 / 15 = 12 seconds.',
        difficulty: 'EASY',
        subtopic: 'Speed, Time & Distance'
      },
      {
        examId: rrbGroupDExam.id,
        subjectId: reasSubj.id,
        topicId: reasTopic.id,
        questionText: 'If "RAILWAY" is coded as "SBJMXBZ", how will "TRAIN" be coded in the same pattern?',
        options: ['USBJO', 'URCJP', 'VTBKP', 'USAKM'],
        correctOption: 'USBJO',
        explanation: 'Each letter is shifted forward by 1 (+1): T->U, R->S, A->B, I->J, N->O. Result is USBJO.',
        difficulty: 'EASY',
        subtopic: 'Coding-Decoding'
      },
      {
        examId: rrbGroupDExam.id,
        subjectId: gaSubj.id,
        topicId: gaTopic.id,
        questionText: 'Who was the first Railway Minister of independent India?',
        options: ['John Mathai', 'Lal Bahadur Shastri', 'Asaf Ali', 'Jagjivan Ram'],
        correctOption: 'John Mathai',
        explanation: 'Dr. John Mathai served as the first Railway Minister of independent India and presented the first Railway Budget in 1947.',
        difficulty: 'EASY',
        subtopic: 'General Knowledge & Indian History'
      }
    ];

    for (const q of groupDQuestions) {
      const qHash = generateQuestionHash(q.questionText, q.options);
      const existing = await prisma.question.findFirst({ where: { questionHash: qHash } });
      if (!existing) {
        await prisma.question.create({
          data: {
            examId: q.examId,
            subjectId: q.subjectId,
            topicId: q.topicId,
            questionText: q.questionText,
            questionType: 'OBJECTIVE_MCQ',
            options: JSON.stringify(q.options),
            correctOption: q.correctOption,
            explanation: q.explanation,
            difficulty: q.difficulty,
            subtopic: q.subtopic,
            status: 'PUBLISHED',
            source: 'VERIFIED',
            questionHash: qHash
          }
        });
      }
    }
    console.log('✅ Seeded core RRB Group D CBT questions');
  }

  const finalCount = await prisma.question.count();
  console.log(`\n🎉 Question expansion complete! Total questions in PostgreSQL: ${finalCount}`);
}

seedVerifiedQuestions()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
