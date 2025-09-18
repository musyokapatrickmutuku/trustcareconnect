const axios = require('axios');

/**
 * NovitaAIClient - Enhanced medical AI client for TrustCareConnect
 * Features: Kenyan context, rate limiting, caching, retry logic, comprehensive safety scoring
 */
class NovitaAIClient {
    constructor(apiKey = null) {
        this.apiKey = apiKey || process.env.NOVITA_API_KEY;
        this.baseUrl = 'https://api.novita.ai/openai/v1';

        if (!this.apiKey) {
            throw new Error('NOVITA_API_KEY is required. Pass as constructor parameter or set environment variable.');
        }

        // Rate limiting: max 10 requests per minute
        this.rateLimiter = {
            requests: [],
            maxRequests: 10,
            windowMs: 60000 // 1 minute
        };

        // Response caching with 5-minute TTL
        this.responseCache = new Map();
        this.cacheConfig = {
            ttl: 5 * 60 * 1000, // 5 minutes
            maxSize: 100 // Maximum cache entries
        };

        // Audit logging
        this.auditLog = [];

        // Initialize HTTP client
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'TrustCareConnect-Kenya/1.0.0'
            },
            timeout: 60000 // 60 second timeout for medical queries
        });

        // Setup response interceptors
        this.setupInterceptors();

        console.log('🧠 NovitaAIClient initialized for Kenya diabetes care');
    }

    setupInterceptors() {
        this.client.interceptors.response.use(
            (response) => {
                this.logAuditEvent('api_success', {
                    status: response.status,
                    responseTime: response.headers['x-response-time'] || 'unknown'
                });
                return response;
            },
            (error) => {
                this.logAuditEvent('api_error', {
                    status: error.response?.status,
                    message: error.message,
                    retryable: this.isRetryableError(error)
                });
                return Promise.reject(error);
            }
        );
    }

    /**
     * Main method to call medical AI with full Kenya context
     * @param {string} query - Patient's medical query
     * @param {Object} patientContext - Patient medical context
     * @returns {Promise<Object>} AI response with safety score and urgency
     */
    async callMedicalAI(query, patientContext = {}) {
        const startTime = Date.now();

        try {
            // Check rate limiting
            if (this.isRateLimited()) {
                throw new Error('Rate limit exceeded. Maximum 10 requests per minute allowed.');
            }

            // Check cache first
            const cacheKey = this.generateCacheKey(query, patientContext);
            const cachedResponse = this.getFromCache(cacheKey);
            if (cachedResponse) {
                console.log('📦 Returning cached response for medical query');
                this.logAuditEvent('cache_hit', { cacheKey, query: query.substring(0, 50) });
                return cachedResponse;
            }

            // Build Kenya-specific medical prompt
            const systemPrompt = this.buildKenyanMedicalPrompt(patientContext);

            // Format query with patient context
            const userMessage = this.formatMedicalQuery(query, patientContext);

            // Prepare API request
            const requestPayload = {
                model: 'baichuan/baichuan-m2-32b',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.3, // Lower temperature for medical accuracy
                max_tokens: 2048,
                top_p: 0.9,
                frequency_penalty: 0.1
            };

            // Make API call with retry logic
            const response = await this.makeRequestWithRetry(requestPayload);
            const aiContent = response.data.choices[0].message.content;

            // Process AI response
            const processedResponse = this.processMedicalResponse(
                aiContent,
                patientContext.vitalSigns,
                Date.now() - startTime
            );

            // Cache the response
            this.setCache(cacheKey, processedResponse);

            // Log successful API call
            this.logAuditEvent('medical_query_success', {
                patientId: patientContext.patientId,
                queryLength: query.length,
                safetyScore: processedResponse.safetyScore,
                urgency: processedResponse.urgency,
                processingTime: processedResponse.processingTime
            });

            console.log(`✅ Medical AI query processed successfully. Safety: ${processedResponse.safetyScore}%, Urgency: ${processedResponse.urgency}`);

            return processedResponse;

        } catch (error) {
            const processingTime = Date.now() - startTime;

            console.error('❌ Medical AI query failed:', error.message);
            this.logAuditEvent('medical_query_error', {
                error: error.message,
                processingTime,
                fallbackUsed: true
            });

            // Return appropriate fallback response
            return this.getFallbackMedicalResponse(query, patientContext, error);
        }
    }

    /**
     * Build comprehensive medical prompt with Kenyan context
     */
    buildKenyanMedicalPrompt(patientContext) {
        const { diabetesType, hba1c, medications = [], allergies = [], medicalHistory } = patientContext;

        let prompt = `You are a specialized AI medical assistant for diabetes care in Kenya. You understand Kenyan healthcare context, local foods, and cultural practices.

PATIENT MEDICAL PROFILE:`;

        if (diabetesType) {
            prompt += `\n- Diabetes Type: ${diabetesType}`;
        }
        if (hba1c) {
            prompt += `\n- Latest HbA1c: ${hba1c}%`;
        }
        if (medications.length > 0) {
            prompt += `\n- Current Medications: ${medications.join(', ')}`;
        }
        if (allergies.length > 0) {
            prompt += `\n- Known Allergies: ${allergies.join(', ')}`;
        }
        if (medicalHistory) {
            prompt += `\n- Medical History: ${medicalHistory}`;
        }

        prompt += `

KENYAN CONTEXT GUIDELINES:
- Consider local foods: ugali, sukuma wiki, githeri, sweet potatoes, cassava, bananas
- Include Swahili terms when appropriate: "homa" (fever), "maumivu" (pain), "dawa" (medicine)
- Account for healthcare access challenges in rural Kenya
- Consider cultural dietary practices and Ramadan if applicable
- Factor in common Kenyan diabetes complications: infections, foot problems
- Suggest locally available foods and affordable treatment options

RESPONSE REQUIREMENTS:
1. Provide immediate safety assessment (CRITICAL/URGENT/NORMAL)
2. Give clear medical analysis in simple English and basic Swahili if helpful
3. Include specific numbered action steps (1., 2., 3., etc.)
4. Mention when to visit clinic/hospital immediately
5. Suggest locally available foods for blood sugar management
6. Consider cost-effective treatment options available in Kenya
7. Include relevant cultural sensitivity

SAFETY PROTOCOLS:
- If blood glucose <70mg/dL or >250mg/dL: Mark as URGENT
- If severe symptoms mentioned: Mark as CRITICAL
- Always err on side of caution for safety
- Include emergency contact advice for serious cases

Format your response clearly with sections and end with numbered action steps in both English and simple Swahili where helpful.`;

        return prompt;
    }

    /**
     * Format medical query with vital signs and context
     */
    formatMedicalQuery(query, patientContext) {
        let formattedQuery = `PATIENT QUERY: ${query}`;

        const { vitalSigns } = patientContext;
        if (vitalSigns) {
            formattedQuery += '\n\nCURRENT VITAL SIGNS:';

            if (vitalSigns.bloodGlucose) {
                formattedQuery += `\n- Blood Glucose: ${vitalSigns.bloodGlucose} mg/dL`;
            }
            if (vitalSigns.bloodPressure) {
                formattedQuery += `\n- Blood Pressure: ${vitalSigns.bloodPressure}`;
            }
            if (vitalSigns.heartRate) {
                formattedQuery += `\n- Heart Rate: ${vitalSigns.heartRate} BPM`;
            }
            if (vitalSigns.temperature) {
                formattedQuery += `\n- Temperature: ${vitalSigns.temperature}°C`;
            }
            if (vitalSigns.weight) {
                formattedQuery += `\n- Weight: ${vitalSigns.weight} kg`;
            }
        }

        return formattedQuery;
    }

    /**
     * Make API request with exponential backoff retry logic
     */
    async makeRequestWithRetry(payload, maxRetries = 3) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Record rate limiting
                this.recordRateLimit();

                const response = await this.client.post('/chat/completions', payload);

                console.log(`✅ API call successful on attempt ${attempt}`);
                return response;

            } catch (error) {
                lastError = error;

                if (!this.isRetryableError(error) || attempt === maxRetries) {
                    throw error;
                }

                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, attempt - 1) * 1000;
                console.log(`⏳ API call failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);

                await this.sleep(delay);
            }
        }

        throw lastError;
    }

    /**
     * Calculate comprehensive safety score (0-100)
     */
    calculateSafetyScore(response, vitalSigns = {}) {
        let score = 100;

        // Critical symptoms detection (highest priority)
        const criticalSymptoms = [
            'chest pain', 'difficulty breathing', 'unconscious', 'seizure',
            'severe bleeding', 'stroke symptoms', 'heart attack', 'collapse',
            'severe abdominal pain', 'severe headache', 'vision loss',
            'inability to speak', 'numbness on one side'
        ];

        const responseText = response.toLowerCase();
        for (const symptom of criticalSymptoms) {
            if (responseText.includes(symptom)) {
                score -= 70; // Major deduction for critical symptoms
                break;
            }
        }

        // Blood glucose assessment (diabetes-specific)
        const glucose = vitalSigns.bloodGlucose ? parseFloat(vitalSigns.bloodGlucose) : null;
        if (glucose) {
            if (glucose < 54) {
                score -= 60; // Severe hypoglycemia
            } else if (glucose < 70) {
                score -= 40; // Hypoglycemia
            } else if (glucose > 400) {
                score -= 55; // Severe hyperglycemia
            } else if (glucose > 300) {
                score -= 35; // High hyperglycemia
            } else if (glucose > 250) {
                score -= 25; // Moderate hyperglycemia
            }
        }

        // Vital signs assessment
        const temp = vitalSigns.temperature ? parseFloat(vitalSigns.temperature) : null;
        if (temp) {
            if (temp > 40 || temp < 35) {
                score -= 30; // Severe fever/hypothermia
            } else if (temp > 38.5 || temp < 36) {
                score -= 15; // Moderate fever/low temp
            }
        }

        const heartRate = vitalSigns.heartRate ? parseInt(vitalSigns.heartRate) : null;
        if (heartRate) {
            if (heartRate > 120 || heartRate < 50) {
                score -= 20; // Abnormal heart rate
            }
        }

        const bp = vitalSigns.bloodPressure;
        if (bp) {
            const [systolic] = bp.split('/').map(x => parseInt(x));
            if (systolic > 180 || systolic < 90) {
                score -= 25; // Dangerous blood pressure
            }
        }

        // Medication safety flags
        const medicationRisks = [
            'stop taking medication', 'quit medicine', 'discontinue treatment',
            'skip insulin', 'double dose', 'take extra pills'
        ];

        for (const risk of medicationRisks) {
            if (responseText.includes(risk)) {
                score -= 35;
                break;
            }
        }

        // Emergency and urgency indicators
        const urgencyTerms = ['emergency', 'urgent', 'immediately', 'right away', 'hospital now'];
        for (const term of urgencyTerms) {
            if (responseText.includes(term)) {
                score -= 20;
                break;
            }
        }

        // Pregnancy considerations
        if (responseText.includes('pregnant') || responseText.includes('pregnancy')) {
            score -= 25; // Pregnancy requires special care
        }

        // Infection indicators
        const infectionSigns = ['fever', 'infection', 'pus', 'wound', 'cut', 'sore'];
        for (const sign of infectionSigns) {
            if (responseText.includes(sign)) {
                score -= 15;
                break;
            }
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Determine urgency level based on response and glucose
     */
    determineUrgency(response, glucose = null) {
        const responseText = response.toLowerCase();

        // Critical keywords trigger HIGH urgency
        const criticalKeywords = [
            'emergency', 'urgent', 'immediately', 'hospital now',
            'chest pain', 'difficulty breathing', 'unconscious',
            'severe pain', 'bleeding', 'seizure'
        ];

        for (const keyword of criticalKeywords) {
            if (responseText.includes(keyword)) {
                return 'high';
            }
        }

        // Blood glucose specific urgency
        if (glucose !== null) {
            const glucoseValue = parseFloat(glucose);
            if (glucoseValue < 70 || glucoseValue > 300) {
                return 'high';
            } else if (glucoseValue < 80 || glucoseValue > 250) {
                return 'medium';
            }
        }

        // Check for moderate urgency indicators
        const moderateKeywords = [
            'concern', 'worried', 'monitor', 'check with doctor',
            'fever', 'infection', 'pain', 'discomfort'
        ];

        for (const keyword of moderateKeywords) {
            if (responseText.includes(keyword)) {
                return 'medium';
            }
        }

        return 'low';
    }

    /**
     * Process AI response and calculate scores
     */
    processMedicalResponse(aiContent, vitalSigns, processingTime) {
        // Calculate safety score
        const safetyScore = this.calculateSafetyScore(aiContent, vitalSigns);

        // Determine urgency
        const glucose = vitalSigns?.bloodGlucose;
        const urgency = this.determineUrgency(aiContent, glucose);

        // Extract action steps
        const actionSteps = this.extractActionSteps(aiContent);

        // Determine if doctor review is required
        const requiresReview = safetyScore < 70 || urgency === 'high' || this.hasComplexConditions(aiContent);

        return {
            content: actionSteps,
            fullResponse: aiContent,
            safetyScore,
            urgency,
            requiresReview,
            timestamp: Date.now(),
            processingTime,
            modelVersion: 'baichuan-m2-32b',
            source: 'novita-ai'
        };
    }

    /**
     * Extract numbered action steps from AI response
     */
    extractActionSteps(response) {
        const lines = response.split('\n');
        const actionSteps = [];

        for (const line of lines) {
            const trimmed = line.trim();
            // Match numbered steps like "1.", "2.", etc.
            if (/^[1-9]\d*\./.test(trimmed)) {
                actionSteps.push(trimmed);
            }
        }

        // If no numbered steps found, return first few sentences
        if (actionSteps.length === 0) {
            const sentences = response.split(/[.!?]+/).slice(0, 3);
            return sentences.join('. ').trim() + '.';
        }

        return actionSteps.join('\n');
    }

    /**
     * Check if response indicates complex medical conditions
     */
    hasComplexConditions(response) {
        const complexIndicators = [
            'specialist', 'referral', 'further testing', 'blood test',
            'x-ray', 'scan', 'biopsy', 'surgery', 'hospitalization'
        ];

        const responseText = response.toLowerCase();
        return complexIndicators.some(indicator => responseText.includes(indicator));
    }

    /**
     * Get fallback response for API failures
     */
    getFallbackMedicalResponse(query, patientContext, error) {
        const { vitalSigns = {} } = patientContext;
        const glucose = vitalSigns.bloodGlucose ? parseFloat(vitalSigns.bloodGlucose) : null;

        // Critical glucose levels need emergency response
        if (glucose && (glucose < 70 || glucose > 300)) {
            return {
                content: "1. Hali ya haraka - Emergency situation\n2. Go to nearest hospital immediately\n3. Monitor blood sugar closely\n4. Have someone accompany you",
                safetyScore: 20,
                urgency: 'high',
                requiresReview: true,
                timestamp: Date.now(),
                processingTime: 0,
                modelVersion: 'fallback-emergency',
                source: 'fallback'
            };
        }

        // Network/API error fallback
        if (error.message.includes('network') || error.message.includes('timeout')) {
            return {
                content: "1. Try again in a few minutes\n2. If symptoms are urgent, go to clinic immediately\n3. Contact your doctor directly if needed\n4. Monitor your condition closely",
                safetyScore: 60,
                urgency: 'medium',
                requiresReview: true,
                timestamp: Date.now(),
                processingTime: 0,
                modelVersion: 'fallback-network',
                source: 'fallback'
            };
        }

        // General fallback
        return {
            content: "1. Consult with your healthcare provider about your symptoms\n2. Monitor your blood glucose regularly\n3. Take your medications as prescribed\n4. Seek medical care if symptoms worsen",
            safetyScore: 50,
            urgency: 'medium',
            requiresReview: true,
            timestamp: Date.now(),
            processingTime: 0,
            modelVersion: 'fallback-general',
            source: 'fallback'
        };
    }

    /**
     * Rate limiting implementation
     */
    isRateLimited() {
        const now = Date.now();

        // Remove old requests outside the window
        this.rateLimiter.requests = this.rateLimiter.requests.filter(
            time => now - time < this.rateLimiter.windowMs
        );

        return this.rateLimiter.requests.length >= this.rateLimiter.maxRequests;
    }

    recordRateLimit() {
        this.rateLimiter.requests.push(Date.now());
    }

    /**
     * Response caching implementation
     */
    generateCacheKey(query, patientContext) {
        // Create hash of query + essential context (excluding timestamps)
        const keyData = {
            query: query.toLowerCase().trim(),
            diabetesType: patientContext.diabetesType,
            currentGlucose: patientContext.vitalSigns?.bloodGlucose
        };

        return Buffer.from(JSON.stringify(keyData)).toString('base64').substring(0, 32);
    }

    getFromCache(key) {
        const cached = this.responseCache.get(key);
        if (!cached) return null;

        // Check if expired
        if (Date.now() - cached.timestamp > this.cacheConfig.ttl) {
            this.responseCache.delete(key);
            return null;
        }

        return cached.response;
    }

    setCache(key, response) {
        // Limit cache size
        if (this.responseCache.size >= this.cacheConfig.maxSize) {
            const oldestKey = this.responseCache.keys().next().value;
            this.responseCache.delete(oldestKey);
        }

        this.responseCache.set(key, {
            response,
            timestamp: Date.now()
        });
    }

    /**
     * Audit logging for compliance
     */
    logAuditEvent(eventType, data) {
        const auditEntry = {
            timestamp: new Date().toISOString(),
            eventType,
            data,
            sessionId: this.generateSessionId()
        };

        this.auditLog.push(auditEntry);

        // Keep only last 1000 entries
        if (this.auditLog.length > 1000) {
            this.auditLog.shift();
        }

        // Log to console for development
        console.log(`🔍 AUDIT: ${eventType}`, data);
    }

    generateSessionId() {
        // Simple session ID for audit tracking
        if (!this.sessionId) {
            this.sessionId = Math.random().toString(36).substring(2, 15);
        }
        return this.sessionId;
    }

    /**
     * Utility methods
     */
    isRetryableError(error) {
        if (!error.response) return true; // Network errors are retryable

        const status = error.response.status;
        return status >= 500 || status === 429; // Server errors and rate limits
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get audit log for monitoring
     */
    getAuditLog() {
        return this.auditLog.slice(); // Return copy
    }

    /**
     * Health check for monitoring
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/models', { timeout: 5000 });
            return {
                status: 'healthy',
                responseTime: response.headers['x-response-time'] || 'unknown',
                rateLimit: {
                    remaining: this.rateLimiter.maxRequests - this.rateLimiter.requests.length,
                    resetTime: Math.max(...this.rateLimiter.requests) + this.rateLimiter.windowMs
                }
            };
        } catch (error) {
            throw new Error(`Novita AI service unavailable: ${error.message}`);
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.responseCache.size,
            maxSize: this.cacheConfig.maxSize,
            ttl: this.cacheConfig.ttl,
            hitRate: this.calculateHitRate()
        };
    }

    calculateHitRate() {
        const totalRequests = this.auditLog.filter(entry =>
            entry.eventType === 'medical_query_success' || entry.eventType === 'cache_hit'
        ).length;

        const cacheHits = this.auditLog.filter(entry =>
            entry.eventType === 'cache_hit'
        ).length;

        return totalRequests > 0 ? (cacheHits / totalRequests * 100).toFixed(2) : 0;
    }
}

module.exports = NovitaAIClient;