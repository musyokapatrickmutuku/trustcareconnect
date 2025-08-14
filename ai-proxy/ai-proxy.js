const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration - adjust origins for production
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:4943', 'https://localhost:4943'],
  methods: ['GET', 'POST'],
  credentials: true
}));

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Configuration
const API_CONFIGS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    key: process.env.OPENAI_API_KEY || 'mock-openai-key',
    model: 'gpt-3.5-turbo'
  },
  claude: {
    url: 'https://api.anthropic.com/v1/messages',
    key: process.env.CLAUDE_API_KEY || 'mock-claude-key',
    model: 'claude-3-haiku-20240307'
  }
};

// Mock responses for development/testing
const MOCK_RESPONSES = {
  diabetes: [
    "Based on your diabetes-related query, I recommend maintaining regular blood sugar monitoring and following your prescribed medication schedule. However, please consult with your healthcare provider for personalized advice.",
    "For diabetes management, focus on a balanced diet with controlled carbohydrate intake, regular exercise, and consistent medication timing. Always discuss any changes with your doctor.",
    "Diabetes care involves multiple factors including diet, exercise, medication adherence, and regular check-ups. Your healthcare team can provide specific guidance based on your individual needs."
  ],
  hypertension: [
    "For blood pressure management, consider lifestyle modifications such as reducing sodium intake, regular exercise, stress management, and medication compliance as prescribed by your doctor.",
    "Hypertension management typically involves dietary changes, regular monitoring, appropriate medication, and lifestyle adjustments. Please work closely with your healthcare provider.",
    "Blood pressure control requires a comprehensive approach including medication adherence, dietary modifications, regular exercise, and routine monitoring. Consult your doctor for personalized care."
  ],
  general: [
    "Thank you for your health inquiry. While I can provide general information, it's important to consult with your healthcare provider for personalized medical advice and proper diagnosis.",
    "I understand your health concern. For accurate diagnosis and treatment recommendations, please discuss your symptoms with your assigned healthcare professional.",
    "Your health question is important. While I can offer general guidance, your healthcare provider is best positioned to give you specific medical advice based on your individual situation."
  ]
};

// Helper function to get mock response based on condition
function getMockResponse(condition, queryText) {
  const conditionLower = condition.toLowerCase();
  let responses = MOCK_RESPONSES.general;
  
  if (conditionLower.includes('diabetes')) {
    responses = MOCK_RESPONSES.diabetes;
  } else if (conditionLower.includes('hypertension') || conditionLower.includes('blood pressure')) {
    responses = MOCK_RESPONSES.hypertension;
  }
  
  // Add query-specific context to the response
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  return `${randomResponse}\n\n**Note: This is an AI-generated response for your "${queryText}" query. Always consult your healthcare provider for medical decisions.**`;
}

// Helper function to create medical prompt
function createMedicalPrompt(queryText, condition) {
  return `You are a helpful medical AI assistant providing general health information. A patient with ${condition} has asked: "${queryText}"

Please provide a helpful, informative response that:
1. Offers general medical guidance related to their condition
2. Emphasizes the importance of consulting their healthcare provider
3. Avoids specific diagnoses or treatment recommendations
4. Is empathetic and supportive
5. Keeps the response concise and easy to understand

Remember: This is for general information only and should not replace professional medical advice.`;
}

// OpenAI API call function
async function callOpenAI(queryText, condition) {
  try {
    const response = await axios.post(API_CONFIGS.openai.url, {
      model: API_CONFIGS.openai.model,
      messages: [
        {
          role: "system",
          content: "You are a helpful medical AI assistant that provides general health information while emphasizing the importance of professional medical consultation."
        },
        {
          role: "user",
          content: createMedicalPrompt(queryText, condition)
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${API_CONFIGS.openai.key}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    throw new Error('Failed to get OpenAI response');
  }
}

// Claude API call function
async function callClaude(queryText, condition) {
  try {
    const response = await axios.post(API_CONFIGS.claude.url, {
      model: API_CONFIGS.claude.model,
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: createMedicalPrompt(queryText, condition)
        }
      ]
    }, {
      headers: {
        'x-api-key': API_CONFIGS.claude.key,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });

    return response.data.content[0].text;
  } catch (error) {
    console.error('Claude API Error:', error.message);
    throw new Error('Failed to get Claude response');
  }
}

// Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'TrustCareConnect AI Proxy',
    version: '1.0.0'
  });
});

// Main AI query endpoint
app.post('/api/query', async (req, res) => {
  try {
    const { queryText, condition, provider = 'mock' } = req.body;

    // Validation
    if (!queryText || typeof queryText !== 'string') {
      return res.status(400).json({
        error: 'Invalid or missing queryText',
        code: 'INVALID_QUERY_TEXT'
      });
    }

    if (!condition || typeof condition !== 'string') {
      return res.status(400).json({
        error: 'Invalid or missing condition',
        code: 'INVALID_CONDITION'
      });
    }

    // Sanitize inputs
    const sanitizedQuery = queryText.trim().substring(0, 1000); // Limit query length
    const sanitizedCondition = condition.trim().substring(0, 100);

    if (sanitizedQuery.length === 0) {
      return res.status(400).json({
        error: 'Query text cannot be empty',
        code: 'EMPTY_QUERY'
      });
    }

    let aiResponse;
    let responseProvider = provider;

    try {
      switch (provider.toLowerCase()) {
        case 'openai':
          if (API_CONFIGS.openai.key === 'mock-openai-key') {
            console.log('Using mock OpenAI response (no real API key provided)');
            aiResponse = getMockResponse(sanitizedCondition, sanitizedQuery);
            responseProvider = 'mock-openai';
          } else {
            aiResponse = await callOpenAI(sanitizedQuery, sanitizedCondition);
            responseProvider = 'openai';
          }
          break;

        case 'claude':
          if (API_CONFIGS.claude.key === 'mock-claude-key') {
            console.log('Using mock Claude response (no real API key provided)');
            aiResponse = getMockResponse(sanitizedCondition, sanitizedQuery);
            responseProvider = 'mock-claude';
          } else {
            aiResponse = await callClaude(sanitizedQuery, sanitizedCondition);
            responseProvider = 'claude';
          }
          break;

        case 'mock':
        default:
          aiResponse = getMockResponse(sanitizedCondition, sanitizedQuery);
          responseProvider = 'mock';
          break;
      }
    } catch (apiError) {
      console.error(`${provider} API failed, falling back to mock response:`, apiError.message);
      aiResponse = getMockResponse(sanitizedCondition, sanitizedQuery);
      responseProvider = `mock-${provider}-fallback`;
    }

    // Response
    res.json({
      success: true,
      response: aiResponse,
      metadata: {
        provider: responseProvider,
        condition: sanitizedCondition,
        queryLength: sanitizedQuery.length,
        timestamp: new Date().toISOString(),
        responseId: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    });

    // Log the interaction (without sensitive data)
    console.log(`AI Query processed: ${responseProvider} | Condition: ${sanitizedCondition} | Query length: ${sanitizedQuery.length}`);

  } catch (error) {
    console.error('AI Proxy Error:', error);
    res.status(500).json({
      error: 'Internal server error while processing AI query',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// Get available AI providers
app.get('/api/providers', (req, res) => {
  res.json({
    providers: [
      {
        name: 'mock',
        description: 'Mock AI responses for testing',
        available: true,
        default: true
      },
      {
        name: 'openai',
        description: 'OpenAI GPT-3.5 Turbo',
        available: API_CONFIGS.openai.key !== 'mock-openai-key',
        model: API_CONFIGS.openai.model
      },
      {
        name: 'claude',
        description: 'Anthropic Claude 3 Haiku',
        available: API_CONFIGS.claude.key !== 'mock-claude-key',
        model: API_CONFIGS.claude.model
      }
    ],
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'UNHANDLED_ERROR',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    availableEndpoints: [
      'GET /api/health',
      'POST /api/query',
      'GET /api/providers'
    ],
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TrustCareConnect AI Proxy Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 OpenAI available: ${API_CONFIGS.openai.key !== 'mock-openai-key'}`);
  console.log(`🤖 Claude available: ${API_CONFIGS.claude.key !== 'mock-claude-key'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});