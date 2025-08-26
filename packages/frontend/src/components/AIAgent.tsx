// Simple HTTP Outcall Test Interface
import React, { useState } from 'react';
// @ts-ignore
import { createActor } from '../declarations/backend';

const AIAgent: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>('');

  const testHealthCheck = async () => {
    setIsLoading(true);
    try {
      const actor = createActor(process.env.REACT_APP_BACKEND_CANISTER_ID || 'uxrrr-q7777-77774-qaaaq-cai');
      const result = await actor.healthCheck();
      setResponse(result);
    } catch (error) {
      setResponse(`Health check failed: ${error}`);
    }
    setIsLoading(false);
  };

  const submitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    try {
      const actor = createActor(process.env.REACT_APP_BACKEND_CANISTER_ID || 'uxrrr-q7777-77774-qaaaq-cai');
      const result = await actor.makeHttpCall(prompt);
      setResponse(result);
      setPrompt('');
    } catch (error) {
      console.error('Error making HTTP call:', error);
      setResponse(`Error: ${error}`);
    }
    setIsLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>TrustCareConnect MVP - HTTP Outcall Test</h1>
      
      {/* Health Check Button */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testHealthCheck} 
          disabled={isLoading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Backend Health Check
        </button>
      </div>
      
      {/* HTTP Outcall Form */}
      <form onSubmit={submitQuery}>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="prompt" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Enter your prompt for HTTP outcall:
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your question here (will be sent via HTTP outcall to AI API)..."
            rows={4}
            style={{ 
              width: '100%', 
              padding: '10px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              fontFamily: 'inherit'
            }}
            disabled={isLoading}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading || !prompt.trim()}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: isLoading ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isLoading ? 'Making HTTP Call...' : 'Send HTTP Outcall to AI API'}
        </button>
      </form>
      
      {/* Response Display */}
      {response && (
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6', 
          borderRadius: '4px'
        }}>
          <h3 style={{ marginTop: 0, color: '#28a745' }}>HTTP Response:</h3>
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            wordWrap: 'break-word',
            fontSize: '14px',
            lineHeight: '1.4'
          }}>
            {response}
          </pre>
        </div>
      )}
      
      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeaa7', 
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <strong>MVP Note:</strong> This is a minimal viable product for testing HTTP outcalls from ICP canisters to external APIs. 
        The backend makes real HTTP requests to the Novita AI API and returns the responses.
      </div>
    </div>
  );
};

export default AIAgent;