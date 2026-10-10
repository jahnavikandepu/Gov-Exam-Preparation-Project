import { prisma } from '../config/db.js';
import { generateQuestionHash } from '../utils/questionHash.js';

export async function migrateAppscMainsPattern() {
    console.log('🚀 Starting APPSC FBO & ABO Mains Examination Pattern Migration...');

    const appscExam = await prisma.exam.findFirst({
        where: {
            OR: [{ code: 'APPSC_FBO_ABO' }, { slug: 'appsc-fbo-abo' }],
        },
        include: {
            stages: {
                include: { sections: true, tests: true },
            },
            subjects: {
                include: { topics: true },
            },
        },
    });

    if (!appscExam) {
        throw new Error('APPSC FBO & ABO exam not found in database!');
    }

    console.log(`Found exam: ${appscExam.name} (${appscExam.id})`);

    // 1. Update Exam Pattern JSON & Descriptions
    const updatedPattern = [
        {
            item: 'Screening Test (Offline/CBT)',
            details: '150 Questions | 150 Mins | Part A: GS & Mental Ability (75 Qs) + Part B: Science & Maths (75 Qs) | 1/3 Negative Marking',
        },
        {
            item: 'Mains Component A: Qualifying Essay',
            details: '1 Descriptive Essay | 45 Mins | 50 Marks | Environmental & Forest Subjects | English, Telugu, or Urdu | Qualifying',
        },
        {
            item: 'Mains Component B: Paper 1',
            details: 'General Studies & Mental Ability | 100 Objective MCQs | 100 Mins | 100 Marks | 1/3 Negative Marking (0.33)',
        },
        {
            item: 'Mains Component C: Paper 2',
            details: 'General Science & General Mathematics | 100 Objective MCQs | 100 Mins | 100 Marks | 1/3 Negative Marking (0.33)',
        },
    ];

    await prisma.exam.update({
        where: { id: appscExam.id },
        data: {
            pattern: JSON.stringify(updatedPattern),
            shortDescription: 'Official APPSC FBO & ABO Pattern: Screening (150 Qs/150m) & Mains (Qualifying Essay 50M/45m + Paper 1: GS 100 Qs/100m + Paper 2: Science & Maths 100 Qs/100m).',
            fullDescription: 'Recruitment examination conducted by Andhra Pradesh Public Service Commission (APPSC) for Forest Beat Officer (FBO) and Assistant Beat Officer (ABO) in A.P. Forest Subordinate Service. The Mains Examination comprises Component A: Qualifying Essay on Environmental & Forest topics (50 Marks, 45 Mins), Component B: Paper 1 (General Studies & Mental Ability, 100 MCQs, 100 Mins, 100 Marks), and Component C: Paper 2 (General Science & General Mathematics, 100 MCQs, 100 Mins, 100 Marks). Negative marking of 1/3rd mark applies to objective papers.',
        },
    });
    console.log('✅ Updated Exam metadata and official pattern.');

    // 2. Ensure Essay Subject & Topic exist
    let essaySubject = appscExam.subjects.find((s) => s.slug === 'appsc-qualifying-essay' || s.name.toLowerCase().includes('essay'));
    if (!essaySubject) {
        essaySubject = await prisma.subject.create({
            data: {
                examId: appscExam.id,
                name: 'Qualifying Essay: Environmental & Forest Subjects',
                slug: 'appsc-qualifying-essay',
                order: 3,
            },
        });
        console.log('✅ Created Essay Subject:', essaySubject.name);
    }

    let essayTopic = await prisma.topic.findFirst({
        where: { subjectId: essaySubject.id },
    });
    if (!essayTopic) {
        essayTopic = await prisma.topic.create({
            data: {
                subjectId: essaySubject.id,
                name: 'Environmental & Forestry Essay Topics',
                slug: 'appsc-environmental-essay',
                order: 1,
            },
        });
        console.log('✅ Created Essay Topic:', essayTopic.name);
    }

    // Identify Subject A and Subject B
    const subjectA = appscExam.subjects.find((s) => s.slug === 'appsc-part-a' || s.name.toLowerCase().includes('part a') || s.name.toLowerCase().includes('general studies')) || appscExam.subjects[0];
    const subjectB = appscExam.subjects.find((s) => s.slug === 'appsc-part-b' || s.name.toLowerCase().includes('part b') || s.name.toLowerCase().includes('science')) || appscExam.subjects[1];

    // 3. Update ExamStage MAINS
    let mainsStage = appscExam.stages.find((s) => s.code === 'MAINS');
    if (!mainsStage) {
        mainsStage = await prisma.examStage.create({
            data: {
                examId: appscExam.id,
                code: 'MAINS',
                name: 'Mains Examination',
                paperName: 'Mains Examination (3 Components)',
                description: 'APPSC FBO & ABO Mains Examination: Component A (Qualifying Essay, 45m / 50 Marks), Component B (Paper 1: GS & Mental Ability, 100 Qs / 100m / 100 Marks), Component C (Paper 2: Science & Maths, 100 Qs / 100m / 100 Marks).',
                durationMinutes: 245,
                scribeDurationMinutes: 326,
                totalQuestions: 201,
                totalMarks: 250,
                marksPerQuestion: 1.0,
                negativeMarks: 0.33,
                questionType: 'OBJECTIVE_AND_DESCRIPTIVE',
                language: 'English, Telugu, Urdu',
                isQualifying: false,
                isMerit: true,
                isScreening: false,
                separateTimer: true,
                sectionTiming: true,
                hasScribeExtension: true,
                notificationReference: 'APPSC Notification No. 04/2024',
                notificationYear: 2024,
                lastVerifiedAt: new Date(),
                status: 'ACTIVE',
                order: 2,
            },
        });
        console.log('✅ Created Mains Stage');
    } else {
        mainsStage = await prisma.examStage.update({
            where: { id: mainsStage.id },
            data: {
                name: 'Mains Examination',
                paperName: 'Mains Examination (3 Components)',
                description: 'APPSC FBO & ABO Mains Examination: Component A (Qualifying Essay, 45m / 50 Marks), Component B (Paper 1: GS & Mental Ability, 100 Qs / 100m / 100 Marks), Component C (Paper 2: Science & Maths, 100 Qs / 100m / 100 Marks).',
                durationMinutes: 245,
                scribeDurationMinutes: 326,
                totalQuestions: 201,
                totalMarks: 250,
                marksPerQuestion: 1.0,
                negativeMarks: 0.33,
                questionType: 'OBJECTIVE_AND_DESCRIPTIVE',
                language: 'English, Telugu, Urdu',
                separateTimer: true,
                sectionTiming: true,
                lastVerifiedAt: new Date(),
                status: 'ACTIVE',
            },
        });
        console.log('✅ Updated Mains Stage configuration (201 questions, 245 mins, 250 marks, 3 components)');
    }

    // 4. Update ExamSections under MAINS
    // Delete old sections under Mains to cleanly replace with the 3 official components
    await prisma.examSection.deleteMany({
        where: { stageId: mainsStage.id },
    });

    const secEssay = await prisma.examSection.create({
        data: {
            stageId: mainsStage.id,
            subjectId: essaySubject.id,
            name: 'Component A: Qualifying Essay (Environmental & Forest Topics)',
            code: 'ESSAY',
            questionCount: 1,
            durationMinutes: 45,
            totalMarks: 50.0,
            marksPerQuestion: 50.0,
            negativeMarks: 0.0,
            questionType: 'DESCRIPTIVE_ESSAY',
            order: 1,
        },
    });

    const secPaper1 = await prisma.examSection.create({
        data: {
            stageId: mainsStage.id,
            subjectId: subjectA.id,
            name: 'Component B: Paper 1 — General Studies & Mental Ability',
            code: 'PAPER_1',
            questionCount: 100,
            durationMinutes: 100,
            totalMarks: 100.0,
            marksPerQuestion: 1.0,
            negativeMarks: 0.33,
            questionType: 'OBJECTIVE_MCQ',
            order: 2,
        },
    });

    const secPaper2 = await prisma.examSection.create({
        data: {
            stageId: mainsStage.id,
            subjectId: subjectB.id,
            name: 'Component C: Paper 2 — General Science & General Mathematics',
            code: 'PAPER_2',
            questionCount: 100,
            durationMinutes: 100,
            totalMarks: 100.0,
            marksPerQuestion: 1.0,
            negativeMarks: 0.33,
            questionType: 'OBJECTIVE_MCQ',
            order: 3,
        },
    });
    console.log('✅ Created 3 Official ExamSections for Mains:', secEssay.name, secPaper1.name, secPaper2.name);

    // 5. Remove or archive the outdated 150-question mock
    await prisma.test.updateMany({
        where: {
            examId: appscExam.id,
            slug: 'appsc-fbo-abo-mains-mock-01',
        },
        data: {
            status: 'ARCHIVED',
        },
    });
    console.log('✅ Archived legacy 150-question mock: appsc-fbo-abo-mains-mock-01');

    // 6. Create / Update the 3 separate Component Tests under MAINS
    // Component A: Qualifying Essay Test
    const essayTestSlug = 'appsc-fbo-abo-mains-qualifying-essay';
    const essayInstructions = JSON.stringify([
        'Qualifying test in Essay Writing on Environmental and Forest related subjects.',
        'Question Type: Descriptive essay (1 question to be answered).',
        'Permitted Languages: English, Telugu, or Urdu.',
        'Examination Duration: 45 Minutes strictly enforced by the server countdown timer.',
        'Maximum Marks: 50 Marks. This is a qualifying paper.',
        'Type your response directly into the descriptive editor. Word count and autosave are active.',
        'If evaluated via AI assistance, scoring is an estimate based on a transparent rubric (Relevance, Structure, Language) subject to official evaluation rules.',
    ]);

    await prisma.test.upsert({
        where: { slug: essayTestSlug },
        update: {
            examId: appscExam.id,
            stageId: mainsStage.id,
            subjectId: essaySubject.id,
            topicId: essayTopic.id,
            title: 'APPSC FBO & ABO Mains: Component A — Qualifying Essay',
            type: 'DESCRIPTIVE',
            difficulty: 'MEDIUM',
            totalQuestions: 1,
            durationMinutes: 45,
            totalMarks: 50,
            negativeMarkingPerQuestion: 0.0,
            marksPerCorrect: 50.0,
            status: 'ACTIVE',
            instructions: essayInstructions,
        },
        create: {
            examId: appscExam.id,
            stageId: mainsStage.id,
            subjectId: essaySubject.id,
            topicId: essayTopic.id,
            title: 'APPSC FBO & ABO Mains: Component A — Qualifying Essay',
            slug: essayTestSlug,
            type: 'DESCRIPTIVE',
            difficulty: 'MEDIUM',
            totalQuestions: 1,
            durationMinutes: 45,
            totalMarks: 50,
            negativeMarkingPerQuestion: 0.0,
            marksPerCorrect: 50.0,
            status: 'ACTIVE',
            instructions: essayInstructions,
        },
    });
    console.log('✅ Upserted Component A Test: Qualifying Essay (1 Q, 45m, 50 Marks, Descriptive)');

    // Component B: Paper 1 Test
    const paper1Slug = 'appsc-fbo-abo-mains-paper-1';
    const paper1Instructions = JSON.stringify([
        'Official Mains Component B: Paper 1 — General Studies & Mental Ability.',
        'Total Questions: 100 Objective Multiple Choice Questions (MCQs).',
        'Examination Duration: 100 Minutes.',
        'Marking Scheme: Correct answer = +1.0 Mark. Negative Marking = -1/3 (0.33) Mark for each incorrect answer.',
        'Maximum Marks: 100 Marks.',
        'All 100 questions are randomized and uniquely prepared for your attempt.',
        'Server-side countdown clock will automatically save and submit answers when time expires.',
    ]);

    await prisma.test.upsert({
        where: { slug: paper1Slug },
        update: {
            examId: appscExam.id,
            stageId: mainsStage.id,
            subjectId: subjectA.id,
            topicId: null,
            title: 'APPSC FBO & ABO Mains: Component B — Paper 1 (General Studies & Mental Ability)',
            type: 'FULL_MOCK',
            difficulty: 'MEDIUM',
            totalQuestions: 100,
            durationMinutes: 100,
            totalMarks: 100,
            negativeMarkingPerQuestion: 0.33,
            marksPerCorrect: 1.0,
            status: 'ACTIVE',
            instructions: paper1Instructions,
        },
        create: {
            examId: appscExam.id,
            stageId: mainsStage.id,
            subjectId: subjectA.id,
            topicId: null,
            title: 'APPSC FBO & ABO Mains: Component B — Paper 1 (General Studies & Mental Ability)',
            slug: paper1Slug,
            type: 'FULL_MOCK',
            difficulty: 'MEDIUM',
            totalQuestions: 100,
            durationMinutes: 100,
            totalMarks: 100,
            negativeMarkingPerQuestion: 0.33,
            marksPerCorrect: 1.0,
            status: 'ACTIVE',
            instructions: paper1Instructions,
        },
    });
    console.log('✅ Upserted Component B Test: Paper 1 (100 Qs, 100m, 100 Marks, -0.33 Neg)');

    // Component C: Paper 2 Test
    const paper2Slug = 'appsc-fbo-abo-mains-paper-2';
    const paper2Instructions = JSON.stringify([
        'Official Mains Component C: Paper 2 — General Science & General Mathematics.',
        'Total Questions: 100 Objective Multiple Choice Questions (MCQs).',
        'Examination Duration: 100 Minutes.',
        'Marking Scheme: Correct answer = +1.0 Mark. Negative Marking = -1/3 (0.33) Mark for each incorrect answer.',
        'Maximum Marks: 100 Marks.',
        'Syllabus areas include General Science, Basics of Forestry, Arithmetic, and Mensuration.',
        'Server-side countdown clock strictly governs session validity.',
    ]);

    await prisma.test.upsert({
        where: { slug: paper2Slug },
        update: {
            examId: appscExam.id,
            stageId: mainsStage.id,
            subjectId: subjectB.id,
            topicId: null,
            title: 'APPSC FBO & ABO Mains: Component C — Paper 2 (General Science & General Mathematics)',
            type: 'FULL_MOCK',
            difficulty: 'MEDIUM',
            totalQuestions: 100,
            durationMinutes: 100,
            totalMarks: 100,
            negativeMarkingPerQuestion: 0.33,
            marksPerCorrect: 1.0,
            status: 'ACTIVE',
            instructions: paper2Instructions,
        },
        create: {
            examId: appscExam.id,
            stageId: mainsStage.id,
            subjectId: subjectB.id,
            topicId: null,
            title: 'APPSC FBO & ABO Mains: Component C — Paper 2 (General Science & General Mathematics)',
            slug: paper2Slug,
            type: 'FULL_MOCK',
            difficulty: 'MEDIUM',
            totalQuestions: 100,
            durationMinutes: 100,
            totalMarks: 100,
            negativeMarkingPerQuestion: 0.33,
            marksPerCorrect: 1.0,
            status: 'ACTIVE',
            instructions: paper2Instructions,
        },
    });
    console.log('✅ Upserted Component C Test: Paper 2 (100 Qs, 100m, 100 Marks, -0.33 Neg)');

    // 7. Seed 20 Descriptive Essay Prompts
    console.log('🌱 Seeding Environmental & Forest Descriptive Essay Prompts...');
    const essayPrompts = [
        {
            text: 'Role of Joint Forest Management (JFM) and Vana Samrakshana Samithis (VSS) in sustainable forest conservation and tribal livelihood empowerment in Andhra Pradesh.',
            exp: 'Comprehensive essay prompt evaluating candidate understanding of community-based forestry, VSS participatory management, tribal rights under Forest Rights Act, non-timber forest produce (NTFP) collection, and forest protection mechanisms.',
            sub: 'Community Forest Management & Tribal Livelihoods',
        },
        {
            text: 'Impact of climate change and anthropogenic deforestation on the biodiversity of the Eastern Ghats: Ecological threats and strategic mitigation measures.',
            exp: 'Evaluates climate impacts on endemic flora and fauna of Eastern Ghats, habitat fragmentation, shifting monsoon patterns, and ecological restoration methods in Andhra Pradesh.',
            sub: 'Eastern Ghats Biodiversity & Climate Change',
        },
        {
            text: 'Forest fires in tropical dry deciduous and thorn forest tracts of Andhra Pradesh: Causes, ecological repercussions, and modern technological interventions for fire prevention.',
            exp: 'Analyzes natural vs anthropogenic causes of forest fires, loss of understory regeneration, satellite remote sensing (FSI fire alerts), fire lines, and beat-level rapid response strategies.',
            sub: 'Forest Fire Ecology & Management',
        },
        {
            text: 'Conservation and protection of Red Sanders (Pterocarpus santalinus) in the Seshachalam Biosphere Reserve: Legal frameworks, anti-smuggling challenges, and ecological significance.',
            exp: 'Focuses on endemic Red Sanders distribution in Rayalaseema, CITES listing, AP Forest Act provisions, checkpost surveillance, and frontline field patrolling tactics.',
            sub: 'Red Sanders Protection & Anti-Smuggling',
        },
        {
            text: 'Man-animal conflict in fringe forest communities of Andhra Pradesh: Underlying causes, economic impacts, and preventive mitigation measures under Forest Subordinate Services.',
            exp: 'Covers elephant depredation in Chittoor/Parvathipuram Manyam, leopard straying, crop compensation schemes, solar fencing, trenches, and community liaison by frontline staff.',
            sub: 'Human-Wildlife Conflict Mitigation',
        },
        {
            text: 'Significance of Mangrove ecosystems in coastal protection and climate resilience: A case study of Coringa Wildlife Sanctuary and Krishna Mangroves.',
            exp: 'Discusses ecological role of mangroves against cyclones and storm surges, blue carbon sequestration, fishing nursery grounds, and conservation pressures.',
            sub: 'Coastal & Mangrove Ecosystems',
        },
        {
            text: 'Wetland conservation in Andhra Pradesh with special focus on Kolleru Lake and Pulicat Lake ecosystems: Ecological threats and restoration pathways.',
            exp: 'Examines Ramsar wetland criteria, migratory bird conservation (pelicans, flamingos), aquaculture encroachment, water quality degradation, and eco-restoration.',
            sub: 'Wetland Ecology & Conservation',
        },
        {
            text: 'Agroforestry and social forestry initiatives: Bridging rural economic development and green cover expansion in Andhra Pradesh.',
            exp: 'Assesses farm forestry models (Subabul, Casuarina, Eucalyptus, Teak), carbon credits, rural employment, and the target of 33% geographical forest cover.',
            sub: 'Agroforestry & Farm Forestry',
        },
        {
            text: 'Soil erosion, watershed management, and afforestation programs: Combating drought and land degradation in the Rayalaseema region of Andhra Pradesh.',
            exp: 'Analyzes arid-zone afforestation, check dams, contour bunding, percolation tanks, and drought-hardy indigenous species selection.',
            sub: 'Watershed Management & Soil Conservation',
        },
        {
            text: 'Wildlife corridor fragmentation in Andhra Pradesh: Impact on large mammal populations and strategies for securing contiguous ecological habitats.',
            exp: 'Discusses Nagarjunasagar-Srisailam Tiger Reserve (NSTR) landscape, road and rail infrastructure mitigation (ecoducts), and territorial forest coordination.',
            sub: 'Wildlife Corridors & Protected Areas',
        },
        {
            text: 'Role of Forest Beat Officers (FBO) and Assistant Beat Officers (ABO) in frontline patrol, territorial boundary demarcation, and wildlife crime prevention.',
            exp: 'Directly tests operational duties: beat inspection, cairn maintenance, illicit felling detection, forest offense reporting (POR/FIR), and weapon handling protocols.',
            sub: 'Frontline Forest Beat Administration',
        },
        {
            text: 'Invasive alien plant species (Prosopis juliflora, Lantana camara, Parthenium) in Andhra Pradesh forests: Threats to native flora and eradication techniques.',
            exp: 'Evaluates ecological displacement of native grasses and browse species, suppression of natural regeneration, and systematic mechanical/biological management.',
            sub: 'Invasive Species & Habitat Restoration',
        },
        {
            text: 'Biological Diversity Act, 2002 and People’s Biodiversity Registers (PBR): Empowering local communities in conservation and access-benefit sharing in AP.',
            exp: 'Covers Andhra Pradesh State Biodiversity Board (APSBB), Biodiversity Management Committees (BMC), documentation of local cultivars and medicinal plants.',
            sub: 'Biodiversity Legislation & PBR',
        },
        {
            text: 'Eco-tourism and sustainable forest governance: Balancing ecological carrying capacity with local livelihood generation in Andhra Pradesh.',
            exp: 'Case studies: Papikonda, Talakona, Maredumilli, and Belum Caves eco-tourism initiatives, plastic-free zones, and revenue sharing with tribal guides.',
            sub: 'Community Eco-Tourism',
        },
        {
            text: 'Urban forestry, municipal green belts, and Miyawaki forests: Mitigating urban heat island effect and air pollution in Andhra Pradesh cities.',
            exp: 'Examines urban greening in Visakhapatnam, Vijayawada, and Tirupati, avenue plantations, roadside green buffers, and community afforestation drives.',
            sub: 'Urban Forestry & Green Cover',
        },
        {
            text: 'Non-Timber Forest Products (NTFP) and the role of Girijan Cooperative Corporation (GCC) in tribal economic development in Andhra Pradesh.',
            exp: 'Details collection of Gum Karaya, Honey, Tamarind, Aonla, sustainable harvesting practices, minimum support price, and forest preservation.',
            sub: 'NTFP & Tribal Economy',
        },
        {
            text: 'The Wildlife (Protection) Act, 1972 and recent amendments: Schedule classifications, penalties for poaching, and frontline enforcement responsibilities.',
            exp: 'Analyzes streamlined schedules (Schedule I & II), hunting prohibitions, confiscation procedures, and powers of forest officers in wildlife crime investigation.',
            sub: 'Wildlife Protection Legal Framework',
        },
        {
            text: 'Tiger conservation in Andhra Pradesh: Status, threats, and management protocols in the Nagarjunasagar-Srisailam Tiger Reserve (NSTR).',
            exp: 'Focuses on India’s largest tiger reserve by area, MSTrIPES patrol monitoring, camera trapping, prey base augmentation, and anti-poaching strike forces.',
            sub: 'Tiger Conservation & NSTR',
        },
        {
            text: 'Sacred Groves (Pavitra Vanalu) of Andhra Pradesh: Traditional ecological heritage, cultural significance, and modern conservation challenges.',
            exp: 'Explores cultural taboos protecting climax vegetation, biodiversity refugia in Chittoor and Kadapa, and need for state recognition and boundary protection.',
            sub: 'Sacred Groves & Cultural Conservation',
        },
        {
            text: 'Application of Geospatial Technology (GIS, GPS, and Remote Sensing) in Forest Beat demarcation, canopy density monitoring, and wildlife surveillance in AP.',
            exp: 'Explains GIS-based forest resource mapping, GPS tracking of forest beat boundaries, drone monitoring for illicit felling, and satellite change detection.',
            sub: 'Geospatial Technology in Forestry',
        },
    ];

    let seededPromptsCount = 0;
    for (const prompt of essayPrompts) {
        const hash = generateQuestionHash(prompt.text, []);
        const existing = await prisma.question.findFirst({
            where: {
                examId: appscExam.id,
                subjectId: essaySubject.id,
                questionHash: hash,
            },
        });

        if (!existing) {
            await prisma.question.create({
                data: {
                    examId: appscExam.id,
                    subjectId: essaySubject.id,
                    topicId: essayTopic.id,
                    questionText: prompt.text,
                    questionType: 'DESCRIPTIVE_ESSAY',
                    options: JSON.stringify([]),
                    correctOption: 'N/A',
                    explanation: prompt.exp,
                    difficulty: 'MEDIUM',
                    subtopic: prompt.sub,
                    status: 'PUBLISHED',
                    source: 'APPSC Syllabus Blueprint',
                    generationModel: 'official-rubric-curated',
                    generationPromptVersion: 'appsc-mains-essay-v1',
                    questionHash: hash,
                },
            });
            seededPromptsCount++;
        }
    }
    console.log(`✅ Seeded ${seededPromptsCount} descriptive essay prompts into PostgreSQL.`);

    // 8. Ensure Paper 2 has a large pool of questions (at least 150)
    console.log('🌱 Checking Subject B (General Science & Mathematics) Question Bank size...');
    const currentSubjectBCount = await prisma.question.count({
        where: { examId: appscExam.id, subjectId: subjectB.id },
    });
    console.log(`Current Subject B Questions in DB: ${currentSubjectBCount}`);

    if (currentSubjectBCount < 150) {
        console.log('Adding additional verified questions for Subject B to ensure Paper 2 always has plenty of unique questions...');
        const topicScience = subjectB.topics.find((t) => t.slug === 'forestry-science') || subjectB.topics[0];
        const topicMaths = subjectB.topics.find((t) => t.slug === 'ap-maths') || subjectB.topics[1] || subjectB.topics[0];

        const additionalPaper2Questions = [
            // Forestry & General Science
            {
                q: 'What is the silvicultural term used for the natural or artificial restocking of an existing forest and woodland that has been depleted?',
                options: ['Reforestation', 'Afforestation', 'Agroforestry', 'Social forestry'],
                ans: 'A',
                exp: 'Reforestation refers to re-establishing forest cover on areas that previously bore forest, whereas afforestation creates forests on non-forest land.',
                topicId: topicScience.id,
                sub: 'Silvicultural Principles',
            },
            {
                q: 'In plant physiology, which hormone is primarily responsible for apical dominance in forest trees and woody perennials?',
                options: ['Auxin (IAA)', 'Gibberellin', 'Cytokinin', 'Abscisic acid'],
                ans: 'A',
                exp: 'Auxins synthesized in the shoot apical meristem suppress the growth of lateral buds, leading to apical dominance and tall straight timber poles.',
                topicId: topicScience.id,
                sub: 'Plant Physiology',
            },
            {
                q: 'Which layer of forest vegetation is composed of decaying plant matter, fallen leaves, and microorganisms directly above the mineral soil?',
                options: ['Forest Litter (Duff / O-Horizon)', 'Canopy Layer', 'Understory Layer', 'Shrub Layer'],
                ans: 'A',
                exp: 'The O-horizon (litter layer) consists of organic detritus undergoing decomposition, crucial for nutrient cycling in forest soils.',
                topicId: topicScience.id,
                sub: 'Forest Soils & Litter',
            },
            {
                q: 'What is the botanical family to which Red Sanders (Pterocarpus santalinus), endemic to the Seshachalam hills, belongs?',
                options: ['Fabaceae (Leguminosae)', 'Dipterocarpaceae', 'Meliaceae', 'Myrtaceae'],
                ans: 'A',
                exp: 'Pterocarpus santalinus belongs to the subfamily Faboideae within the family Fabaceae (Leguminosae).',
                topicId: topicScience.id,
                sub: 'Dendrology & Forest Botany',
            },
            {
                q: 'Which of the following instruments is commonly used by foresters to measure tree heights based on trigonometric principles?',
                options: ['Abney Level / Clinometer', 'Calliper', 'Planimeter', 'Dendrometer band'],
                ans: 'A',
                exp: 'Clinometers and Abney levels measure angles of elevation and depression, enabling tree height calculation using tangent principles.',
                topicId: topicScience.id,
                sub: 'Forest Mensuration',
            },
            {
                q: 'What is the standard Breast Height at which tree diameter (DBH) is measured in Indian forestry practice?',
                options: ['1.37 meters (4 ft 6 in)', '1.0 meter', '1.5 meters', '1.2 meters'],
                ans: 'A',
                exp: 'In India, diameter at breast height (DBH) is standardized at 1.37 meters above ground level on the uphill side.',
                topicId: topicScience.id,
                sub: 'Forest Mensuration',
            },
            {
                q: 'The process of controlled burning conducted during cooler seasons to reduce hazardous fuel accumulation in forest tracts is termed as:',
                options: ['Prescribed / Controlled Burning', 'Wildfire Suppression', 'Slash and Burn', 'Backfiring'],
                ans: 'A',
                exp: 'Prescribed burning is a planned management tool to reduce dry litter fuel loads under controlled weather conditions.',
                topicId: topicScience.id,
                sub: 'Forest Fire Protection',
            },
            {
                q: 'Which gas is predominantly released during anaerobic decomposition of organic matter in submerged mangrove wetland soils?',
                options: ['Methane (CH4)', 'Nitrous Oxide', 'Ozone', 'Carbon Monoxide'],
                ans: 'A',
                exp: 'Methanogenic archaea in anoxic waterlogged sediment produce methane during anaerobic decomposition.',
                topicId: topicScience.id,
                sub: 'Environmental Science',
            },
            {
                q: 'The phenomenon of biomagnification in aquatic and forest food chains refers to:',
                options: ['Progressive increase in chemical concentration at successively higher trophic levels', 'Rapid multiplication of algae', 'Decomposition of heavy biomass', 'Increase in species richness'],
                ans: 'A',
                exp: 'Non-biodegradable lipophilic toxins (e.g., DDT, mercury) accumulate and concentrate exponentially up successive trophic levels.',
                topicId: topicScience.id,
                sub: 'Ecology & Pollution',
            },
            {
                q: 'Which Indian tree species is famously associated with the extraction of high-grade natural Kattha and Cutch used in leather tanning?',
                options: ['Acacia catechu (Khair)', 'Butea monosperma (Palash)', 'Acacia nilotica (Babul)', 'Dalbergia sissoo (Shisham)'],
                ans: 'A',
                exp: 'Acacia catechu (Khair) heartwood yields commercial Kattha and Cutch through aqueous boiling and crystallisation.',
                topicId: topicScience.id,
                sub: 'Non-Timber Forest Produce',
            },
            {
                q: 'What type of roots do Rhizophora species in the Coringa mangroves possess to enable gas exchange in waterlogged, anaerobic mud?',
                options: ['Pneumatophores (Stilt & Breathing Roots)', 'Tuberous roots', 'Haustoria roots', 'Prop roots only'],
                ans: 'A',
                exp: 'Rhizophora and Avicennia develop specialized aerial breathing roots (pneumatophores with lenticels) to absorb atmospheric oxygen.',
                topicId: topicScience.id,
                sub: 'Mangrove Adaptations',
            },
            {
                q: 'What is the primary vector responsible for the transmission of Kyasanur Forest Disease (KFD), also known as monkey fever?',
                options: ['Hard Ticks (Haemaphysalis spinigera)', 'Aedes aegypti mosquito', 'Anopheles mosquito', 'Tsetse fly'],
                ans: 'A',
                exp: 'KFD is a viral hemorrhagic disease transmitted by Haemaphysalis hard ticks inhabiting forest leaf litter in south India.',
                topicId: topicScience.id,
                sub: 'Zoonotic Diseases & Wildlife',
            },
            {
                q: 'What is the chemical formula of ozone, the gas present in the stratosphere that absorbs harmful ultraviolet (UV-B) radiation?',
                options: ['O3', 'O2', 'O4', 'H2O2'],
                ans: 'A',
                exp: 'Ozone is a triatomic oxygen molecule (O3) forming the protective stratospheric ozone layer.',
                topicId: topicScience.id,
                sub: 'Atmospheric Chemistry',
            },
            {
                q: 'In physics, what is the SI unit of luminous intensity?',
                options: ['Candela (cd)', 'Lumen', 'Lux', 'Watt'],
                ans: 'A',
                exp: 'The candela (cd) is the base SI unit of luminous intensity in a given direction.',
                topicId: topicScience.id,
                sub: 'General Physics',
            },
            {
                q: 'Which Newton’s Law of Motion explains the recoil of a firearm when a bullet is discharged during anti-poaching operations?',
                options: ['Newton’s Third Law of Motion', 'Newton’s First Law of Motion', 'Newton’s Second Law of Motion', 'Newton’s Law of Gravitation'],
                ans: 'A',
                exp: 'Newton’s Third Law states that for every action force, there is an equal and opposite reaction force, causing weapon recoil.',
                topicId: topicScience.id,
                sub: 'Classical Mechanics',
            },
            {
                q: 'Which acid is found in the stinging hairs of stinging nettles (Urtica dioica) and in the venom of red forest ants?',
                options: ['Formic acid (Methanoic acid)', 'Acetic acid', 'Oxalic acid', 'Tartaric acid'],
                ans: 'A',
                exp: 'Formic acid (HCOOH) is the organic irritant secreted by ants and stinging nettles.',
                topicId: topicScience.id,
                sub: 'Organic Chemistry',
            },
            {
                q: 'Which metal is extracted from the ore Bauxite, extensive deposits of which occur in the Araku Valley and Visakhapatnam Agency tract?',
                options: ['Aluminium', 'Iron', 'Copper', 'Zinc'],
                ans: 'A',
                exp: 'Bauxite is the principal ore of aluminium, found abundantly in the bauxite-capped plateaus of the Eastern Ghats.',
                topicId: topicScience.id,
                sub: 'Mineral Resources',
            },
            {
                q: 'What is the main function of xylem tissue in vascular forest plants?',
                options: ['Transport of water and dissolved minerals from roots to leaves', 'Transport of sucrose from leaves to roots', 'Production of seeds', 'Photosynthetic carbon fixation'],
                ans: 'A',
                exp: 'Xylem transports water and dissolved inorganic nutrients unidirectionally from roots to aerial parts, while phloem transports photosynthates.',
                topicId: topicScience.id,
                sub: 'Plant Anatomy',
            },
            {
                q: 'Which organelle in eukaryotic cells is popularly referred to as the "Powerhouse of the Cell"?',
                options: ['Mitochondrion', 'Ribosome', 'Golgi Apparatus', 'Lysosome'],
                ans: 'A',
                exp: 'Mitochondria generate cellular energy in the form of ATP through oxidative phosphorylation.',
                topicId: topicScience.id,
                sub: 'Cell Biology',
            },
            {
                q: 'What is the speed of light in a vacuum approximately?',
                options: ['3 × 10^8 m/s', '3 × 10^6 m/s', '3 × 10^5 km/s (or 3 × 10^8 m/s)', '1.5 × 10^8 m/s'],
                ans: 'A',
                exp: 'The speed of light in vacuum is precisely 299,792,458 m/s, approximately 3 × 10^8 meters per second.',
                topicId: topicScience.id,
                sub: 'General Physics',
            },
            // General Mathematics & Arithmetic
            {
                q: 'A forest nursery has 1,200 saplings. If 35% are Red Sanders, 40% are Teak, and the rest are Neem, how many Neem saplings are in the nursery?',
                options: ['300', '250', '350', '280'],
                ans: 'A',
                exp: 'Percentage of Neem saplings = 100% - (35% + 40%) = 25%. Number of Neem saplings = 25% of 1,200 = 0.25 × 1200 = 300 saplings.',
                topicId: topicMaths.id,
                sub: 'Percentages & Practical Arithmetic',
            },
            {
                q: 'A forest patrol team walks at a speed of 4 km/h through rugged terrain. How much time will they take to patrol a beat boundary of 18 km?',
                options: ['4 hours 30 minutes', '4 hours', '5 hours', '3 hours 45 minutes'],
                ans: 'A',
                exp: 'Time = Distance / Speed = 18 / 4 = 4.5 hours = 4 hours and 30 minutes.',
                topicId: topicMaths.id,
                sub: 'Speed, Time and Distance',
            },
            {
                q: 'If the radius of a circular watch tower base is 7 meters, what is its circumference? (Use π = 22/7)',
                options: ['44 meters', '22 meters', '88 meters', '154 meters'],
                ans: 'A',
                exp: 'Circumference = 2 × π × r = 2 × (22/7) × 7 = 44 meters.',
                topicId: topicMaths.id,
                sub: 'Mensuration: 2D Geometry',
            },
            {
                q: 'The length and breadth of a rectangular forest plantation plot are 150 meters and 80 meters respectively. What is the area of the plot in hectares? (1 hectare = 10,000 m²)',
                options: ['1.2 hectares', '1.5 hectares', '0.8 hectares', '2.4 hectares'],
                ans: 'A',
                exp: 'Area in square meters = 150 × 80 = 12,000 m². In hectares = 12,000 / 10,000 = 1.2 hectares.',
                topicId: topicMaths.id,
                sub: 'Mensuration: Area & Land Units',
            },
            {
                q: 'A timber merchant buys a log of wood for ₹12,000 and sells it for ₹15,000. What is his profit percentage?',
                options: ['25%', '20%', '30%', '15%'],
                ans: 'A',
                exp: 'Profit = ₹15,000 - ₹12,000 = ₹3,000. Profit % = (3000 / 12000) × 100 = 25%.',
                topicId: topicMaths.id,
                sub: 'Profit and Loss',
            },
            {
                q: 'Find the simple interest on a departmental equipment loan of ₹25,000 at 8% per annum for 3 years.',
                options: ['₹6,000', '₹5,000', '₹7,500', '₹4,800'],
                ans: 'A',
                exp: 'Simple Interest = (P × R × T) / 100 = (25000 × 8 × 3) / 100 = ₹6,000.',
                topicId: topicMaths.id,
                sub: 'Simple and Compound Interest',
            },
            {
                q: 'If 12 forest watchers can dig a 240-meter fire trench in 6 days, how many days will 18 watchers take to dig the same trench working at the same rate?',
                options: ['4 days', '3 days', '5 days', '4.5 days'],
                ans: 'A',
                exp: 'Using M1 × D1 = M2 × D2: 12 × 6 = 18 × D2 => 72 = 18 × D2 => D2 = 4 days.',
                topicId: topicMaths.id,
                sub: 'Time and Work',
            },
            {
                q: 'The average height of 5 teak trees in a sample plot is 14 meters. When a 6th tree is included, the average becomes 15 meters. What is the height of the 6th tree?',
                options: ['20 meters', '18 meters', '19 meters', '21 meters'],
                ans: 'A',
                exp: 'Sum of 5 trees = 5 × 14 = 70 m. Sum of 6 trees = 6 × 15 = 90 m. Height of 6th tree = 90 - 70 = 20 meters.',
                topicId: topicMaths.id,
                sub: 'Averages & Statistical Measures',
            },
            {
                q: 'What is the Greatest Common Divisor (GCD / HCF) of 48 and 72?',
                options: ['24', '12', '18', '36'],
                ans: 'A',
                exp: 'Factors of 48: 1, 2, 3, 4, 6, 8, 12, 16, 24, 48. Factors of 72: 1, 2, 3, 4, 6, 8, 9, 12, 18, 24, 36, 72. Highest common factor = 24.',
                topicId: topicMaths.id,
                sub: 'Number Systems & HCF/LCM',
            },
            {
                q: 'Solve for x: 3x - 15 = 45.',
                options: ['x = 20', 'x = 15', 'x = 25', 'x = 10'],
                ans: 'A',
                exp: '3x = 45 + 15 = 60 => x = 60 / 3 = 20.',
                topicId: topicMaths.id,
                sub: 'Basic Algebra',
            },
            {
                q: 'The ratio of female candidates to male candidates appearing for the ABO physical test is 3 : 5. If there are 150 male candidates, what is the number of female candidates?',
                options: ['90', '75', '100', '120'],
                ans: 'A',
                exp: '5 parts = 150 => 1 part = 30. Female candidates (3 parts) = 3 × 30 = 90.',
                topicId: topicMaths.id,
                sub: 'Ratio and Proportion',
            },
            {
                q: 'What is the surface area of a cube whose edge length is 5 cm?',
                options: ['150 cm²', '125 cm²', '100 cm²', '75 cm²'],
                ans: 'A',
                exp: 'Total surface area of a cube = 6a² = 6 × (5)² = 6 × 25 = 150 cm².',
                topicId: topicMaths.id,
                sub: 'Mensuration: 3D Solids',
            },
        ];

        let addedCount = 0;
        for (const q of additionalPaper2Questions) {
            const hash = generateQuestionHash(q.q, q.options);
            const exists = await prisma.question.findFirst({
                where: { examId: appscExam.id, questionHash: hash },
            });
            if (!exists) {
                await prisma.question.create({
                    data: {
                        examId: appscExam.id,
                        subjectId: subjectB.id,
                        topicId: q.topicId,
                        questionText: q.q,
                        questionType: 'OBJECTIVE_MCQ',
                        options: JSON.stringify(q.options.map((opt, i) => ({ id: ['A', 'B', 'C', 'D'][i], text: opt }))),
                        correctOption: q.ans,
                        explanation: q.exp,
                        difficulty: 'MEDIUM',
                        subtopic: q.sub,
                        status: 'PUBLISHED',
                        source: 'APPSC Paper 2 Syllabus Expert Team',
                        questionHash: hash,
                    },
                });
                addedCount++;
            }
        }
        console.log(`✅ Added ${addedCount} additional questions for Subject B in PostgreSQL.`);
    }

    console.log('🎉 APPSC FBO & ABO Mains Migration Complete!');
}

// Execute if run directly
if (process.argv[1]?.endsWith('migrate_appsc_mains_pattern.js')) {
    migrateAppscMainsPattern()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Migration failed:', err);
            process.exit(1);
        });
}
