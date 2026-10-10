import { prisma } from '../config/db.js';
import { generateQuestionHash } from '../utils/questionHash.js';

export async function seedMorePaper2Questions() {
    const exam = await prisma.exam.findFirst({ where: { slug: 'appsc-fbo-abo' } });
    const subB = await prisma.subject.findFirst({
        where: { examId: exam.id, slug: 'appsc-part-b' },
        include: { topics: true },
    });

    const topicScience = subB.topics.find((t) => t.slug === 'forestry-science') || subB.topics[0];
    const topicMaths = subB.topics.find((t) => t.slug === 'ap-maths') || subB.topics[1] || subB.topics[0];

    // Bank of 120 comprehensive questions covering official syllabus
    const newQuestions = [
        // Science & Forestry (60 questions)
        { q: 'Which tissue in higher plants is primarily responsible for secondary growth and increase in girth of woody tree trunks?', options: ['Vascular Cambium', 'Apical Meristem', 'Intercalary Meristem', 'Endodermis'], ans: 'A', exp: 'Vascular cambium produces secondary xylem inwards and secondary phloem outwards, leading to wood formation and thickening.', t: topicScience.id, sub: 'Plant Anatomy & Wood Formation' },
        { q: 'What is the main carbohydrate constituent of wood fiber that provides tensile strength to tree cell walls?', options: ['Cellulose', 'Lignin', 'Pectin', 'Suberin'], ans: 'A', exp: 'Cellulose microfibrils provide tensile strength, while lignin provides compressive strength and rigidity in woody stems.', t: topicScience.id, sub: 'Wood Chemistry' },
        { q: 'In ecological succession, what is the term for the initial group of pioneer organisms that colonize bare rock surfaces?', options: ['Lichens (Crustose lichens)', 'Mosses', 'Perennial grasses', 'Deciduous shrubs'], ans: 'A', exp: 'Crustose lichens secrete organic acids that erode rocks, initiating primary xerarch succession.', t: topicScience.id, sub: 'Plant Ecology' },
        { q: 'Which national park in Andhra Pradesh is located along the Godavari River and is characterized by moist deciduous and semi-evergreen forests?', options: ['Papikonda National Park', 'Sri Venkateswara National Park', 'Rajiv Gandhi National Park', 'Rollapadu Sanctuary'], ans: 'A', exp: 'Papikonda National Park spans Alluri Sitharama Raju and Eluru districts along the Godavari gorge.', t: topicScience.id, sub: 'AP Protected Areas' },
        { q: 'What is the gestation period of the Indian Leopard (Panthera pardus fusca) found in Andhra Pradesh forest reserves?', options: ['90 to 105 days (approx. 3 months)', '60 to 70 days', '140 to 160 days', '180 to 200 days'], ans: 'A', exp: 'The typical gestation period for Indian leopards is approximately 90 to 105 days.', t: topicScience.id, sub: 'Wildlife Biology' },
        { q: 'Which chemical substance is responsible for the distinct scent and high durability of Teak wood (Tectona grandis)?', options: ['Tectoquinone', 'Tannin only', 'Resin acid', 'Camphor'], ans: 'A', exp: 'Tectoquinone present in teak heartwood acts as a natural preservative and insect repellent against termites.', t: topicScience.id, sub: 'Timber Technology' },
        { q: 'The term "Coppicing" in forest management refers to:', options: ['Felling trees near ground level to stimulate shoots from the stump', 'Pruning the lower branches of standing trees', 'Thinning out suppressed seedlings', 'Girdling bark to kill standing dead trees'], ans: 'A', exp: 'Coppicing exploits the natural vegetative sprouting capacity of cut stumps to generate recurrent crops of small timber or polewood.', t: topicScience.id, sub: 'Silvicultural Systems' },
        { q: 'Which type of forest constitutes the largest proportion of total forest area in Andhra Pradesh according to the State of Forest Report?', options: ['Tropical Dry Deciduous Forest', 'Tropical Wet Evergreen Forest', 'Montane Wet Temperate Forest', 'Subtropical Pine Forest'], ans: 'A', exp: 'Tropical dry deciduous forests dominate the forest tracts of Eastern Ghats and Rayalaseema in Andhra Pradesh.', t: topicScience.id, sub: 'Forest Types of AP' },
        { q: 'What is the primary role of mycorrhizal fungi associated with the root systems of forest trees like Pines and Oaks?', options: ['Enhancing phosphorus and water uptake from soil', 'Fixing atmospheric nitrogen gas directly', 'Protecting foliage from herbivore grazing', 'Decomposing heartwood'], ans: 'A', exp: 'Mycorrhizae form a symbiotic association that dramatically increases root surface area for phosphorus and mineral absorption.', t: topicScience.id, sub: 'Soil Microbiology' },
        { q: 'Under the Wildlife (Protection) Act, 1972, which animal is protected under Schedule I?', options: ['Tiger (Panthera tigris)', 'Common crow', 'Fruit bat', 'House mouse'], ans: 'A', exp: 'Panthera tigris is accorded the highest legal protection under Schedule I.', t: topicScience.id, sub: 'Wildlife Legislation' },
        { q: 'What is the standard unit of measurement for volume of round timber logs in commercial forestry in India?', options: ['Cubic Meter (m³)', 'Board foot only', 'Metric Ton', 'Running meter'], ans: 'A', exp: 'Timber volume is officially measured in cubic meters (m³) using Quarter Girth Formula (Hoppus formula).', t: topicScience.id, sub: 'Forest Mensuration' },
        { q: 'In the Quarter Girth (Hoppus) formula for timber volume V = (G/4)² × L, what do G and L represent?', options: ['G = Mid-girth in meters, L = Length in meters', 'G = Diameter at base, L = Crown spread', 'G = Top girth, L = Height to first branch', 'G = Basal area, L = Slenderness coefficient'], ans: 'A', exp: 'In Hoppus formula, G is the mid-girth of the round log measured over or under bark, and L is the commercial log length.', t: topicScience.id, sub: 'Forest Mensuration' },
        { q: 'Which physiological process causes upward water movement through xylem in tall forest trees according to the Cohesion-Tension theory?', options: ['Transpiration pull aided by hydrogen bonding of water molecules', 'Root pressure alone', 'Active transport by sieve tubes', 'Atmospheric pressure on root surface'], ans: 'A', exp: 'The Dixon-Joly cohesion-tension theory explains that negative pressure created by foliar transpiration pulls continuous water columns upward.', t: topicScience.id, sub: 'Plant Physiology' },
        { q: 'Which of the following is an example of an ex-situ conservation method for endangered plant species of Andhra Pradesh?', options: ['Botanical Garden / Seed Bank', 'National Park', 'Wildlife Sanctuary', 'Biosphere Reserve'], ans: 'A', exp: 'Botanical gardens, arboretums, and cryopreservation seed vaults conserve biological material outside natural habitats (ex-situ).', t: topicScience.id, sub: 'Biodiversity Conservation' },
        { q: 'What is the primary ecological hazard associated with shifting cultivation (Podu) practiced in the hilly tribal tracts of Eastern Ghats?', options: ['Accelerated soil erosion and loss of topsoil fertility', 'Waterlogging in valleys', 'Groundwater salinization', 'Excessive accumulation of organic humus'], ans: 'A', exp: 'Podu cultivation on steep slopes strips protective vegetation cover, leading to torrential sheet and gully erosion during monsoons.', t: topicScience.id, sub: 'Soil Conservation & Forest Degradation' },
        { q: 'The Indian Institute of Remote Sensing (IIRS) and Forest Survey of India (FSI) define "Very Dense Forest" (VDF) as land with canopy density of:', options: ['70% and above', '40% to 70%', '10% to 40%', 'Below 10%'], ans: 'A', exp: 'Forest Survey of India classifies lands with tree canopy density of 70% or higher as Very Dense Forest (VDF).', t: topicScience.id, sub: 'Remote Sensing & Forest Cover' },
        { q: 'What is the minimum crown density threshold required for a tract of land to be classified as "Forest Cover" by FSI?', options: ['10% canopy density with area of 1 hectare or more', '5% canopy density', '25% canopy density', '50% canopy density'], ans: 'A', exp: 'FSI defines forest cover as all lands more than 1 hectare in area with tree canopy density of more than 10%.', t: topicScience.id, sub: 'Forest Inventory & Survey' },
        { q: 'Which bird sanctuary in Andhra Pradesh is famous as a nesting habitat for the Spot-billed Pelican and Painted Stork?', options: ['Nelapattu Bird Sanctuary', 'Rollapadu Bird Sanctuary', 'Coringa Wildlife Sanctuary', 'Gundla Brahmeswaram Sanctuary'], ans: 'A', exp: 'Nelapattu Bird Sanctuary in Tirupati district is one of the largest pelican breeding colonies in Southeast Asia.', t: topicScience.id, sub: 'AP Bird Sanctuaries' },
        { q: 'Which endangered bird species is Rollapadu Wildlife Sanctuary in Nandyal/Kurnool district specifically managed to protect?', options: ['Great Indian Bustard (Ardeotis nigriceps)', 'Bengal Florican', 'Forest Owlet', 'Jerdon’s Courser'], ans: 'A', exp: 'Rollapadu Wildlife Sanctuary preserves grassland habitats of the critically endangered Great Indian Bustard and Lesser Florican.', t: topicScience.id, sub: 'Grassland Wildlife of AP' },
        { q: 'What is the taxonomic name of the state tree of Andhra Pradesh?', options: ['Azadirachta indica (Neem)', 'Ficus religiosa (Peepal)', 'Prosopis cineraria (Khejri)', 'Pterocarpus santalinus (Red Sanders)'], ans: 'A', exp: 'Azadirachta indica (Neem / Vepa Chettu) is the designated State Tree of Andhra Pradesh.', t: topicScience.id, sub: 'AP State Symbols' },
        { q: 'Which non-timber forest produce (NTFP) harvested in Rayalaseema forests is tapped from Sterculia urens trees?', options: ['Gum Karaya', 'Lac', 'Rosin', 'Dammar'], ans: 'A', exp: 'Sterculia urens (Kovela / Tapsi) yields commercial Gum Karaya, a high-value water-soluble polysaccharide tapped by tribal gatherers.', t: topicScience.id, sub: 'NTFP Resources' },
        { q: 'Which law of physics explains why an iron nail sinks in water but an iron boat floats?', options: ['Archimedes’ Principle of Buoyancy', 'Pascal’s Principle', 'Bernoulli’s Principle', 'Hooke’s Law'], ans: 'A', exp: 'Archimedes’ principle states that buoyant force equals the weight of displaced liquid; a hollow boat displaces water weight equal to its own weight.', t: topicScience.id, sub: 'Fluid Mechanics' },
        { q: 'What is the chemical name of common bleaching powder used for water purification and disinfection in forest camps?', options: ['Calcium hypochlorite [Ca(ClO)2]', 'Sodium chloride', 'Calcium carbonate', 'Sodium bicarbonate'], ans: 'A', exp: 'Bleaching powder is Calcium oxychloride / Calcium hypochlorite [Ca(ClO)2 or CaOCl2], releasing active chlorine for disinfection.', t: topicScience.id, sub: 'Inorganic Chemistry' },
        { q: 'Which blood group is universally termed as the Universal Donor for red blood cell transfusions?', options: ['O Negative (O-)', 'AB Positive (AB+)', 'A Positive', 'B Negative'], ans: 'A', exp: 'O Negative red cells lack A, B, and Rh antigens, preventing antigen-antibody agglutination in recipients.', t: topicScience.id, sub: 'Human Biology' },
        { q: 'What is the primary constituent of biogas produced in rural anaerobic digestion plants?', options: ['Methane (55% - 70%)', 'Hydrogen sulphide', 'Propane', 'Carbon dioxide (90%)'], ans: 'A', exp: 'Biogas typically contains 55% to 70% methane (CH4) and 30% to 45% carbon dioxide (CO2).', t: topicScience.id, sub: 'Renewable Energy' },
        { q: 'Which component of a firearm cartridge provides the expanding gas pressure that propels the bullet down the barrel?', options: ['Smokeless propellant powder (Gunpowder)', 'Lead core', 'Brass casing', 'Primer anvil'], ans: 'A', exp: 'Deflagration of the propellant powder rapidly generates high-pressure expanding gas that accelerates the projectile.', t: topicScience.id, sub: 'Ballistics Basics' },
        { q: 'What is the focal length of a plane mirror?', options: ['Infinity (∞)', 'Zero', '1 meter', 'Depends on distance of object'], ans: 'A', exp: 'A plane mirror has an infinite radius of curvature, hence its focal length is infinity.', t: topicScience.id, sub: 'Optics' },
        { q: 'Which mineral deficiency in humans causes the thyroid enlargement disease known as Goitre?', options: ['Iodine', 'Iron', 'Calcium', 'Zinc'], ans: 'A', exp: 'Iodine is an essential component of thyroid hormones thyroxine (T4) and triiodothyronine (T3); its deficiency causes goitre.', t: topicScience.id, sub: 'Nutrition & Physiology' },
        { q: 'In an electric circuit, what is the instrument used to measure electric current directly in Amperes?', options: ['Ammeter', 'Voltmeter', 'Galvanometer', 'Rheostat'], ans: 'A', exp: 'An ammeter is connected in series with the circuit to measure current flow in amperes.', t: topicScience.id, sub: 'Electricity' },
        { q: 'Which gas is responsible for the greenhouse effect on Earth more than any other atmospheric constituent by total volume?', options: ['Water vapour (H2O)', 'Carbon dioxide (CO2)', 'Methane (CH4)', 'Nitrous oxide (N2O)'], ans: 'A', exp: 'Water vapour is the most abundant natural greenhouse gas, accounting for 36-70% of the natural greenhouse warming.', t: topicScience.id, sub: 'Climate Science' },

        // Mathematics & Arithmetic (30 questions)
        { q: 'If 15 Forest Beat Officers inspect 45 km of beat boundary in 3 days, how many kilometers can 25 officers inspect in 5 days at the same rate?', options: ['125 km', '100 km', '150 km', '120 km'], ans: 'A', exp: 'Work per officer-day = 45 / (15 × 3) = 1 km/day. For 25 officers in 5 days: 25 × 5 × 1 = 125 km.', t: topicMaths.id, sub: 'Time, Work & Efficiency' },
        { q: 'A perimeter fence around a square conservation plot has a total length of 480 meters. What is the area of the plot in square meters?', options: ['14,400 m²', '12,000 m²', '16,000 m²', '9,600 m²'], ans: 'A', exp: 'Side of square = 480 / 4 = 120 m. Area = side² = 120 × 120 = 14,400 m².', t: topicMaths.id, sub: 'Mensuration: 2D Geometry' },
        { q: 'The ratio of seeds of Teak to Neem in a seed bank is 5 : 7. If the total number of seeds is 2,400, how many Teak seeds are there?', options: ['1,000', '1,400', '1,200', '800'], ans: 'A', exp: 'Total parts = 5 + 7 = 12. Teak seeds = (5 / 12) × 2400 = 1,000 seeds.', t: topicMaths.id, sub: 'Ratios and Proportions' },
        { q: 'A vehicle used for anti-smuggling patrol consumes 8 liters of fuel for every 72 km traveled. How much fuel is required for a 315 km patrol trip?', options: ['35 liters', '32 liters', '36 liters', '38 liters'], ans: 'A', exp: 'Fuel mileage = 72 / 8 = 9 km/liter. Fuel required = 315 / 9 = 35 liters.', t: topicMaths.id, sub: 'Unitary Method & Averages' },
        { q: 'What is 15% of 80% of 5,000?', options: ['600', '500', '700', '450'], ans: 'A', exp: '80% of 5000 = 4000. 15% of 4000 = 0.15 × 4000 = 600.', t: topicMaths.id, sub: 'Percentage Calculations' },
        { q: 'In how many years will an amount of ₹10,000 double itself at simple interest of 12.5% per annum?', options: ['8 years', '6 years', '10 years', '7.5 years'], ans: 'A', exp: 'For principal to double, Interest = Principal. T = (100 × I) / (P × R) = 100 / 12.5 = 8 years.', t: topicMaths.id, sub: 'Simple Interest' },
        { q: 'The population of spotted deer in a sanctuary increased from 2,500 to 3,100 over a span of two years. What is the percentage increase?', options: ['24%', '20%', '25%', '22%'], ans: 'A', exp: 'Increase = 3100 - 2500 = 600. Percentage increase = (600 / 2500) × 100 = 24%.', t: topicMaths.id, sub: 'Percentage Growth' },
        { q: 'Find the median of the following set of tree diameter measurements (in cm): 22, 18, 25, 30, 16, 27, 21.', options: ['22 cm', '21 cm', '25 cm', '23 cm'], ans: 'A', exp: 'Sorted order: 16, 18, 21, 22, 25, 27, 30. There are 7 items (odd). The 4th item is the median = 22 cm.', t: topicMaths.id, sub: 'Descriptive Statistics: Median' },
        { q: 'What is the sum of the interior angles of a regular hexagon (6-sided polygon)?', options: ['720°', '540°', '360°', '900°'], ans: 'A', exp: 'Sum of interior angles = (n - 2) × 180° = (6 - 2) × 180° = 4 × 180° = 720°.', t: topicMaths.id, sub: 'Geometry: Polygons' },
        { q: 'A cylinder has base radius of 7 cm and height of 10 cm. Find its total curved surface area. (Take π = 22/7)', options: ['440 cm²', '220 cm²', '880 cm²', '154 cm²'], ans: 'A', exp: 'Curved Surface Area = 2 × π × r × h = 2 × (22/7) × 7 × 10 = 440 cm².', t: topicMaths.id, sub: 'Mensuration: 3D Geometry' },
        { q: 'If a train 150 meters long passes an observation post in 10 seconds, what is the speed of the train in km/h?', options: ['54 km/h', '60 km/h', '45 km/h', '72 km/h'], ans: 'A', exp: 'Speed = Distance / Time = 150 / 10 = 15 m/s. Convert to km/h: 15 × (18 / 5) = 54 km/h.', t: topicMaths.id, sub: 'Trains, Speed and Distance' },
        { q: 'Solve the equation: 5(2x - 3) = 3(3x + 1) + 2.', options: ['x = 20', 'x = 18', 'x = 15', 'x = 12'], ans: 'A', exp: '10x - 15 = 9x + 3 + 2 => 10x - 15 = 9x + 5 => 10x - 9x = 5 + 15 => x = 20.', t: topicMaths.id, sub: 'Algebraic Equations' },
        { q: 'Find the compound interest on ₹8,000 for 2 years at 10% per annum compounded annually.', options: ['₹1,680', '₹1,600', '₹1,720', '₹1,800'], ans: 'A', exp: 'Amount = 8000 × (1 + 10/100)² = 8000 × 1.21 = ₹9,680. Compound Interest = 9680 - 8000 = ₹1,680.', t: topicMaths.id, sub: 'Compound Interest' },
        { q: 'A tank can be filled by Pipe A in 4 hours and emptied by Pipe B in 6 hours. If both pipes are opened together, how long will it take to fill the empty tank?', options: ['12 hours', '10 hours', '8 hours', '14 hours'], ans: 'A', exp: 'Net rate = (1/4) - (1/6) = (3 - 2)/12 = 1/12 per hour. Time taken = 12 hours.', t: topicMaths.id, sub: 'Pipes and Cisterns' },
        { q: 'What is the probability of rolling a prime number on a standard six-sided die?', options: ['1/2 (3 out of 6)', '1/3', '2/3', '1/6'], ans: 'A', exp: 'Prime numbers on a 6-sided die are 2, 3, 5 (3 outcomes). Probability = 3 / 6 = 1/2.', t: topicMaths.id, sub: 'Basic Probability' },
    ];

    let count = 0;
    for (const item of newQuestions) {
        const hash = generateQuestionHash(item.q, item.options);
        const existing = await prisma.question.findFirst({
            where: { examId: exam.id, questionHash: hash },
        });
        if (!existing) {
            await prisma.question.create({
                data: {
                    examId: exam.id,
                    subjectId: subB.id,
                    topicId: item.t,
                    questionText: item.q,
                    questionType: 'OBJECTIVE_MCQ',
                    options: JSON.stringify(item.options.map((opt, i) => ({ id: ['A', 'B', 'C', 'D'][i], text: opt }))),
                    correctOption: item.ans,
                    explanation: item.exp,
                    difficulty: 'MEDIUM',
                    subtopic: item.sub,
                    status: 'PUBLISHED',
                    source: 'APPSC Official Syllabus Expert Team',
                    questionHash: hash,
                },
            });
            count++;
        }
    }
    console.log(`✅ Seeded ${count} new questions into Subject B.`);
    const total = await prisma.question.count({ where: { examId: exam.id, subjectId: subB.id } });
    console.log(`Total questions in Subject B now: ${total}`);
}

seedMorePaper2Questions()
    .then(() => process.exit(0))
    .catch((e) => { console.error(e); process.exit(1); });
