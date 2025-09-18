// Artillery Load Test Helper Functions
// These functions generate realistic test data for medical queries

module.exports = {
    generateMedicalQuery,
    generateMedicalHistory,
    generateMedications,
    generateBloodPressure,
    generateWebSocketQuery,
    generateSymptoms,
    generateComplexQuery
};

// Medical query templates for realistic testing
const medicalQueries = [
    "I have been feeling tired and my blood sugar readings are higher than usual",
    "My insulin levels seem off and I feel dizzy",
    "I've been experiencing frequent urination and increased thirst",
    "My feet have been tingling and I'm concerned about neuropathy",
    "I had a low blood sugar episode last night, what should I do?",
    "My blood pressure readings have been inconsistent lately",
    "I'm having trouble managing my diabetes during stress",
    "My glucose monitor shows readings over 250, should I be worried?",
    "I missed my medication dose yesterday, how should I adjust?",
    "I'm experiencing blurred vision and headaches",
    "My ketone levels are elevated, what does this mean?",
    "I had an allergic reaction to a new medication",
    "My wound healing seems slower than normal",
    "I'm having difficulty sleeping due to night sweats",
    "My appetite has changed significantly recently",
    "I feel chest tightness after climbing stairs",
    "My hands shake sometimes, especially when hungry",
    "I noticed unusual weight loss over the past month",
    "My energy levels are very low throughout the day",
    "I have numbness in my fingers and toes"
];

const symptoms = [
    "fatigue", "dizziness", "nausea", "headache", "blurred vision",
    "chest pain", "shortness of breath", "tingling", "numbness",
    "increased thirst", "frequent urination", "weight loss",
    "night sweats", "confusion", "irritability", "weakness",
    "muscle cramps", "joint pain", "skin changes", "slow healing"
];

const medicalConditions = [
    "Type 1 diabetes", "Type 2 diabetes", "Gestational diabetes",
    "Hypertension", "Hyperlipidemia", "Diabetic neuropathy",
    "Diabetic retinopathy", "Kidney disease", "Heart disease",
    "Thyroid disorders", "Depression", "Anxiety"
];

const medications = [
    "Metformin", "Insulin", "Lisinopril", "Atorvastatin",
    "Empagliflozin", "Glipizide", "Januvia", "Lantus",
    "Humalog", "Glucophage", "Amlodipine", "Gabapentin",
    "Aspirin", "Vitamin D", "Omega-3", "Probiotics"
];

const dosages = [
    "500mg", "1000mg", "10mg", "20mg", "5mg", "25mg",
    "once daily", "twice daily", "three times daily",
    "as needed", "with meals", "before bedtime"
];

function generateMedicalQuery() {
    const templates = [
        () => medicalQueries[Math.floor(Math.random() * medicalQueries.length)],
        () => generateSymptomQuery(),
        () => generateMedicationQuery(),
        () => generateEmergencyQuery(),
        () => generateRoutineQuery(),
        () => generateComplexQuery()
    ];

    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    return selectedTemplate();
}

function generateSymptomQuery() {
    const symptom1 = symptoms[Math.floor(Math.random() * symptoms.length)];
    const symptom2 = symptoms[Math.floor(Math.random() * symptoms.length)];

    const templates = [
        `I've been experiencing ${symptom1} for the past few days`,
        `I have ${symptom1} and ${symptom2}, should I be concerned?`,
        `My ${symptom1} is getting worse, what should I do?`,
        `I woke up with ${symptom1} and feel ${symptom2}`,
        `Is ${symptom1} related to my diabetes medication?`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
}

function generateMedicationQuery() {
    const medication = medications[Math.floor(Math.random() * medications.length)];

    const templates = [
        `I forgot to take my ${medication} yesterday, what should I do?`,
        `I'm having side effects from ${medication}`,
        `Can I take ${medication} with food?`,
        `My ${medication} doesn't seem to be working anymore`,
        `I'm running out of ${medication}, need a refill`,
        `Is it safe to stop taking ${medication}?`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
}

function generateEmergencyQuery() {
    const emergencyScenarios = [
        "I have severe chest pain and difficulty breathing",
        "My blood sugar is over 400 and I feel very sick",
        "I can't stay conscious and feel extremely weak",
        "I have severe abdominal pain and vomiting",
        "My blood pressure is 180/120 and I have a severe headache",
        "I'm experiencing severe hypoglycemia and can't function",
        "I have signs of ketoacidosis with high ketones",
        "I fell and hit my head, now feeling confused",
        "I have severe allergic reaction symptoms"
    ];

    return emergencyScenarios[Math.floor(Math.random() * emergencyScenarios.length)];
}

function generateRoutineQuery() {
    const routineQuestions = [
        "What foods should I avoid with diabetes?",
        "How often should I check my blood sugar?",
        "What exercise is safe for diabetics?",
        "How do I manage diabetes during travel?",
        "What are normal blood sugar ranges?",
        "How do I prevent diabetic complications?",
        "What should I do during sick days?",
        "How do I manage stress with diabetes?",
        "What are signs of low blood sugar?",
        "How do I adjust insulin for meals?"
    ];

    return routineQuestions[Math.floor(Math.random() * routineQuestions.length)];
}

function generateComplexQuery() {
    const symptom = symptoms[Math.floor(Math.random() * symptoms.length)];
    const medication = medications[Math.floor(Math.random() * medications.length)];
    const condition = medicalConditions[Math.floor(Math.random() * medicalConditions.length)];

    const complexTemplates = [
        `I have ${condition} and I'm taking ${medication}, but I'm experiencing ${symptom}. Is this related to my medication or condition?`,
        `My doctor prescribed ${medication} for my ${condition}, but I've been having ${symptom} since starting it. Should I continue?`,
        `I have multiple conditions including ${condition}, and my ${symptom} is worsening. Could this be a complication?`,
        `I'm managing ${condition} with ${medication}, but my ${symptom} is affecting my daily activities. What are my options?`,
        `I've had ${condition} for years and take ${medication}, but recently developed ${symptom}. Is this a new concern?`
    ];

    return complexTemplates[Math.floor(Math.random() * complexTemplates.length)];
}

function generateWebSocketQuery() {
    // Shorter queries suitable for WebSocket testing
    const wsQueries = [
        "Blood sugar is high today",
        "Feeling dizzy after medication",
        "Need advice on insulin timing",
        "Experiencing low energy",
        "Having trouble sleeping",
        "Wound healing slowly",
        "Vision seems blurry",
        "Feet are tingling",
        "Missed dose yesterday",
        "Stress affecting glucose"
    ];

    return wsQueries[Math.floor(Math.random() * wsQueries.length)];
}

function generateMedicalHistory() {
    const conditions = [];
    const numConditions = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < numConditions; i++) {
        const condition = medicalConditions[Math.floor(Math.random() * medicalConditions.length)];
        if (!conditions.includes(condition)) {
            conditions.push(condition);
        }
    }

    const diagnosisYear = 2015 + Math.floor(Math.random() * 9);

    return `${conditions.join(', ')} diagnosed in ${diagnosisYear}`;
}

function generateMedications() {
    const patientMeds = [];
    const numMeds = Math.floor(Math.random() * 4) + 1;

    for (let i = 0; i < numMeds; i++) {
        const medication = medications[Math.floor(Math.random() * medications.length)];
        const dosage = dosages[Math.floor(Math.random() * dosages.length)];

        if (!patientMeds.some(med => med.includes(medication))) {
            patientMeds.push(`${medication} ${dosage}`);
        }
    }

    return patientMeds;
}

function generateBloodPressure() {
    const systolic = 90 + Math.floor(Math.random() * 80); // 90-170
    const diastolic = 60 + Math.floor(Math.random() * 40); // 60-100
    return `${systolic}/${diastolic}`;
}

function generateSymptoms() {
    const numSymptoms = Math.floor(Math.random() * 3) + 1;
    const patientSymptoms = [];

    for (let i = 0; i < numSymptoms; i++) {
        const symptom = symptoms[Math.floor(Math.random() * symptoms.length)];
        if (!patientSymptoms.includes(symptom)) {
            patientSymptoms.push(symptom);
        }
    }

    return patientSymptoms;
}

// Add realistic delays and error conditions for testing
function addTestingVariability() {
    // Simulate network delays
    const networkDelay = Math.random() * 100; // 0-100ms

    // Simulate occasional errors (5% chance)
    const shouldError = Math.random() < 0.05;

    return {
        delay: networkDelay,
        shouldError: shouldError
    };
}

// Export additional utility functions
module.exports.addTestingVariability = addTestingVariability;
module.exports.medicalQueries = medicalQueries;
module.exports.symptoms = symptoms;
module.exports.medications = medications;