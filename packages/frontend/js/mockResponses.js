// Mock Response Configuration for TrustCareConnect Frontend
import { Config } from './config.js';

export class MockResponseManager {
    constructor() {
        this.responses = this.initializeMockResponses();
        this.fallbackResponse = this.createFallbackResponse();
    }

    // Initialize configurable mock responses
    initializeMockResponses() {
        return {
            // Patient-specific responses
            'P001': {
                // Type 2 diabetes responses
                highBloodSugar: {
                    triggers: ['high', 'blood sugar', 'glucose', 'tired', 'thirsty'],
                    response: {
                        content: `🩺 **Personalized Guidance for Sarah Johnson (Type 2 Diabetes)**

**Current Assessment:**
Your blood sugar levels appear elevated. Given your Type 2 diabetes and current medications (Metformin, Empagliflozin), this requires attention.

**Immediate Actions:**
1. Check your blood glucose with your meter if available
2. Drink plenty of water to stay hydrated
3. Avoid sugary foods and drinks for now
4. Take your prescribed medications as scheduled

**When to Contact Healthcare Provider:**
- Blood glucose consistently above 250 mg/dL
- Symptoms worsen or persist
- Experiencing nausea, vomiting, or difficulty breathing

**Follow-up Care:**
Consider scheduling a review of your diabetes management plan with your healthcare provider.

⚠️ This is a demonstration response. For real medical guidance, ensure your backend is connected.`,
                        safetyScore: 65,
                        urgency: 'MEDIUM',
                        timestamp: Date.now(),
                        requiresReview: false
                    }
                },
                lowBloodSugar: {
                    triggers: ['low', 'hypoglycemia', 'shaky', 'dizzy', 'sweating'],
                    response: {
                        content: `🚨 **Urgent: Low Blood Sugar Management for Sarah Johnson**

**Immediate Actions Required:**
1. Test your blood glucose immediately if possible
2. If below 70 mg/dL, consume 15g fast-acting carbohydrates:
   - 3-4 glucose tablets
   - 1/2 cup fruit juice
   - 1 tablespoon honey
3. Wait 15 minutes and retest
4. If still low, repeat treatment

**Do Not:**
- Drive or operate machinery
- Take insulin or diabetes medications until glucose normalizes

**Seek Emergency Care If:**
- Unable to swallow safely
- Losing consciousness
- Glucose remains low after 2 treatments

⚠️ This is a demonstration response. For real medical guidance, ensure your backend is connected.`,
                        safetyScore: 30,
                        urgency: 'HIGH',
                        timestamp: Date.now(),
                        requiresReview: true
                    }
                },
                general: {
                    triggers: ['general', 'question', 'advice'],
                    response: {
                        content: `👋 **General Diabetes Care Guidance for Sarah Johnson**

**Your Current Profile:**
- Type 2 Diabetes, well-controlled (HbA1c 6.9%)
- Current medications: Metformin 1000mg BID, Empagliflozin 10mg daily
- Generally excellent diabetes management

**General Recommendations:**
1. Continue your current medication regimen
2. Maintain regular blood glucose monitoring
3. Follow your established meal plan
4. Stay active with your regular exercise routine
5. Keep up with your regular healthcare appointments

**Questions About Specific Symptoms?**
Please provide more detailed information about your specific concerns for more targeted guidance.

⚠️ This is a demonstration response. For real medical guidance, ensure your backend is connected.`,
                        safetyScore: 85,
                        urgency: 'LOW',
                        timestamp: Date.now(),
                        requiresReview: false
                    }
                }
            },
            'P002': {
                // Type 1 diabetes responses
                stressManagement: {
                    triggers: ['stress', 'college', 'exam', 'pump', 'high'],
                    response: {
                        content: `🎓 **College Stress & Diabetes Management for Michael Rodriguez**

**Understanding Stress Impact:**
Stress hormones can significantly affect blood glucose levels in Type 1 diabetes, often causing elevated readings even with proper pump therapy.

**Stress Management Strategies:**
1. **Pump Adjustments:** Consider temporary basal rate increases during high-stress periods
2. **Monitoring:** Check blood glucose more frequently during exams
3. **Timing:** Test before studying sessions and major exams
4. **Hydration:** Maintain good hydration during stressful periods

**Academic Period Recommendations:**
- Create a consistent study schedule to minimize stress spikes
- Use your continuous glucose monitor alarms
- Keep fast-acting glucose readily available
- Consider connecting with your diabetes educator for pump optimization

**When to Contact Healthcare Team:**
- Persistent high glucose despite increased monitoring
- Difficulty managing around exam schedules
- Need for temporary pump setting adjustments

⚠️ This is a demonstration response. For real medical guidance, ensure your backend is connected.`,
                        safetyScore: 70,
                        urgency: 'MEDIUM',
                        timestamp: Date.now(),
                        requiresReview: false
                    }
                },
                general: {
                    triggers: ['general', 'question', 'advice'],
                    response: {
                        content: `👨‍🎓 **Type 1 Diabetes Support for Michael Rodriguez**

**Your Current Profile:**
- Type 1 Diabetes since age 16
- Insulin pump therapy (basal rate 1.2 units/hour)
- College student managing diabetes independently
- Recent HbA1c: 7.8%

**Key Focus Areas:**
1. **Consistency:** Maintain regular meal and sleep schedules when possible
2. **Technology:** Maximize your pump features and glucose monitoring
3. **Planning:** Prepare for irregular college schedules
4. **Support:** Stay connected with your diabetes care team

**College-Specific Tips:**
- Keep backup supplies in multiple locations
- Inform close friends about diabetes management
- Plan for late-night study sessions and irregular meals

⚠️ This is a demonstration response. For real medical guidance, ensure your backend is connected.`,
                        safetyScore: 80,
                        urgency: 'LOW',
                        timestamp: Date.now(),
                        requiresReview: false
                    }
                }
            }
        };
    }

    // Create fallback response for unknown scenarios
    createFallbackResponse() {
        return {
            content: `🤖 **AI Medical Assistance - Demonstration Mode**

Thank you for your medical question. This is a demonstration of how TrustCareConnect provides personalized medical guidance.

**In Normal Operation:**
- Your query would be processed by BaiChuan M2 32B medical AI
- Response would include your full medical history context
- Safety scoring would determine if doctor review is needed
- You'd receive personalized, evidence-based medical guidance

**To Experience Full Functionality:**
1. Ensure the backend canister is running: \`dfx start --background\`
2. Deploy the system: \`dfx deploy\`
3. Refresh this page to connect to the AI backend

**Current Demo Features:**
✅ Patient context awareness
✅ Safety scoring simulation
✅ Urgency level assessment
✅ Doctor review workflow
✅ Response personalization

⚠️ This is a demonstration response. For real medical guidance, ensure your backend is connected.`,
            safetyScore: 75,
            urgency: 'LOW',
            timestamp: Date.now(),
            requiresReview: false
        };
    }

    // Generate appropriate mock response based on patient and query
    generateMockResponse(patientId, queryText, vitalSigns = {}) {
        console.log('Generating mock response for:', { patientId, queryText, vitalSigns });

        // Get patient-specific responses
        const patientResponses = this.responses[patientId];
        if (!patientResponses) {
            return this.enrichResponseWithVitals(this.fallbackResponse, vitalSigns);
        }

        // Analyze query for keywords and vital signs to determine appropriate response
        const analysisResult = this.analyzeQuery(queryText, vitalSigns);

        // Find matching response category
        let selectedResponse = null;
        for (const [category, responseData] of Object.entries(patientResponses)) {
            if (this.matchesTriggers(queryText, responseData.triggers)) {
                selectedResponse = responseData.response;
                break;
            }
        }

        // Use category-specific response or fallback to general
        if (!selectedResponse) {
            selectedResponse = patientResponses.general?.response || this.fallbackResponse;
        }

        // Enrich response with vital signs data
        return this.enrichResponseWithVitals(selectedResponse, vitalSigns, analysisResult);
    }

    // Analyze query content and vital signs for response selection
    analyzeQuery(queryText, vitalSigns) {
        const analysis = {
            riskFactors: [],
            urgencyIndicators: [],
            categories: []
        };

        const queryLower = queryText.toLowerCase();

        // Check for emergency keywords
        const emergencyKeywords = ['chest pain', 'unconscious', 'severe', 'emergency', 'can\'t breathe'];
        if (emergencyKeywords.some(keyword => queryLower.includes(keyword))) {
            analysis.urgencyIndicators.push('emergency_keywords');
        }

        // Analyze vital signs
        if (vitalSigns.bloodGlucose) {
            const glucose = parseFloat(vitalSigns.bloodGlucose);
            if (glucose < 70) {
                analysis.riskFactors.push('hypoglycemia');
                analysis.urgencyIndicators.push('low_glucose');
            } else if (glucose > 250) {
                analysis.riskFactors.push('hyperglycemia');
                analysis.urgencyIndicators.push('high_glucose');
            }
        }

        // Categorize query content
        if (queryLower.includes('stress') || queryLower.includes('exam')) {
            analysis.categories.push('stress_management');
        }
        if (queryLower.includes('blood sugar') || queryLower.includes('glucose')) {
            analysis.categories.push('glucose_management');
        }

        return analysis;
    }

    // Check if query matches response triggers
    matchesTriggers(queryText, triggers) {
        const queryLower = queryText.toLowerCase();
        return triggers.some(trigger => queryLower.includes(trigger.toLowerCase()));
    }

    // Enrich response with vital signs context
    enrichResponseWithVitals(baseResponse, vitalSigns, analysis = {}) {
        let enrichedResponse = { ...baseResponse };

        // Adjust safety score based on vital signs
        if (vitalSigns.bloodGlucose) {
            const glucose = parseFloat(vitalSigns.bloodGlucose);
            if (glucose < 54) {
                enrichedResponse.safetyScore = Math.min(enrichedResponse.safetyScore, 25);
                enrichedResponse.urgency = 'HIGH';
                enrichedResponse.requiresReview = true;
            } else if (glucose < 70) {
                enrichedResponse.safetyScore = Math.min(enrichedResponse.safetyScore, 40);
                enrichedResponse.urgency = 'HIGH';
            } else if (glucose > 400) {
                enrichedResponse.safetyScore = Math.min(enrichedResponse.safetyScore, 30);
                enrichedResponse.urgency = 'HIGH';
                enrichedResponse.requiresReview = true;
            } else if (glucose > 250) {
                enrichedResponse.safetyScore = Math.min(enrichedResponse.safetyScore, 50);
                enrichedResponse.urgency = 'MEDIUM';
            }
        }

        // Add vital signs context to response if present
        if (Object.keys(vitalSigns).some(key => vitalSigns[key])) {
            const vitalsText = this.formatVitalSigns(vitalSigns);
            enrichedResponse.content += `\n\n**Provided Vital Signs:**\n${vitalsText}`;
        }

        // Update timestamp
        enrichedResponse.timestamp = Date.now();

        return enrichedResponse;
    }

    // Format vital signs for display
    formatVitalSigns(vitalSigns) {
        const formatted = [];

        if (vitalSigns.bloodGlucose) {
            formatted.push(`• Blood Glucose: ${vitalSigns.bloodGlucose} mg/dL`);
        }
        if (vitalSigns.bloodPressure) {
            formatted.push(`• Blood Pressure: ${vitalSigns.bloodPressure}`);
        }
        if (vitalSigns.heartRate) {
            formatted.push(`• Heart Rate: ${vitalSigns.heartRate} BPM`);
        }
        if (vitalSigns.temperature) {
            formatted.push(`• Temperature: ${vitalSigns.temperature}°C`);
        }

        return formatted.join('\n') || '• No vital signs provided';
    }

    // Get available response categories for a patient
    getAvailableResponses(patientId) {
        return Object.keys(this.responses[patientId] || {});
    }

    // Add or update a mock response configuration
    updateMockResponse(patientId, category, responseConfig) {
        if (!this.responses[patientId]) {
            this.responses[patientId] = {};
        }
        this.responses[patientId][category] = responseConfig;
    }

    // Get mock statistics for dashboard
    getMockStats() {
        return {
            totalPatients: Object.keys(this.responses).length,
            totalQueries: 0, // Could be tracked in localStorage
            totalDoctors: 0, // Mock data
            availableResponses: Object.values(this.responses)
                .reduce((total, patient) => total + Object.keys(patient).length, 0)
        };
    }
}

// Create singleton instance
export const mockResponseManager = new MockResponseManager();