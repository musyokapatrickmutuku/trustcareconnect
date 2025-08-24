// Clinical Response Display Component - Enhanced UI for Healthcare Providers
import React, { useState } from 'react';
import './ClinicalResponseDisplay.css';

interface ClinicalSection {
  title: string;
  content: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  icon?: string;
}

interface ClinicalResponseProps {
  rawResponse: string;
  patientId: string;
  queryId: string;
  onEditResponse: (editedResponse: string) => void;
  onApproveResponse: () => void;
  onOrderAction: (action: string) => void;
}

const ClinicalResponseDisplay: React.FC<ClinicalResponseProps> = ({
  rawResponse,
  patientId,
  queryId,
  onEditResponse,
  onApproveResponse,
  onOrderAction
}) => {
  // Ensure rawResponse is properly defined and converted to string
  const safeRawResponse = String(rawResponse || 'No response available');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [editMode, setEditMode] = useState(false);
  const [editedResponse, setEditedResponse] = useState('');

  // Parse the clinical response into structured sections
  const parseClinicalResponse = (response: string): ClinicalSection[] => {
    const sections: ClinicalSection[] = [];
    
    // Ensure response is a string and handle all edge cases
    let safeResponse: string;
    try {
      if (!response) {
        safeResponse = 'No response available';
      } else if (typeof response !== 'string') {
        safeResponse = String(response);
      } else {
        safeResponse = response;
      }
    } catch (error) {
      return [{
        title: 'Response Error',
        content: 'Failed to process response format',
        icon: '⚠️',
        priority: 'urgent'
      }];
    }
    
    // Parse Patient History Summary
    const historyMatch = safeResponse.match(/## PATIENT HISTORY SUMMARY([\s\S]*?)(?=## |$)/i);
    if (historyMatch) {
      sections.push({
        title: 'Patient History Summary',
        content: historyMatch[1].trim(),
        icon: '📋',
        priority: 'medium'
      });
    }

    // Parse Symptom Analysis
    const symptomMatch = safeResponse.match(/## SYMPTOM ANALYSIS([\s\S]*?)(?=## |$)/i);
    if (symptomMatch) {
      sections.push({
        title: 'Symptom Analysis',
        content: symptomMatch[1].trim(),
        icon: '🔍',
        priority: 'high'
      });
    }

    // Parse Immediate Assessment
    const immediateMatch = safeResponse.match(/### Immediate Assessment.*?Management[:\s]*([\s\S]*?)(?=### |$)/i);
    if (immediateMatch) {
      sections.push({
        title: 'Immediate Assessment & Management',
        content: immediateMatch[1].trim(),
        icon: '⚡',
        priority: 'urgent'
      });
    }

    // Parse Differential Diagnosis
    const differentialMatch = safeResponse.match(/### Differential Diagnosis.*?Considerations[:\s]*([\s\S]*?)(?=### |$)/i);
    if (differentialMatch) {
      sections.push({
        title: 'Differential Diagnosis',
        content: differentialMatch[1].trim(),
        icon: '🎯',
        priority: 'high'
      });
    }

    // Parse Treatment Plan
    const treatmentMatch = safeResponse.match(/### Treatment Plan.*?Options[:\s]*([\s\S]*?)(?=### |$)/i);
    if (treatmentMatch) {
      sections.push({
        title: 'Treatment Plan Options',
        content: treatmentMatch[1].trim(),
        icon: '💊',
        priority: 'high'
      });
    }

    // Parse Follow-up
    const followupMatch = safeResponse.match(/### Follow-up.*?Monitoring[:\s]*([\s\S]*?)(?=### |$)/i);
    if (followupMatch) {
      sections.push({
        title: 'Follow-up & Monitoring',
        content: followupMatch[1].trim(),
        icon: '📅',
        priority: 'medium'
      });
    }

    // Parse Patient Communication
    const communicationMatch = safeResponse.match(/### Patient Communication.*?Points[:\s]*([\s\S]*?)(?=### |$)/i);
    if (communicationMatch) {
      sections.push({
        title: 'Patient Communication Points',
        content: communicationMatch[1].trim(),
        icon: '💬',
        priority: 'medium'
      });
    }

    // If no structured sections found, display the raw response
    if (sections.length === 0) {
      sections.push({
        title: 'AI Clinical Response',
        content: safeResponse,
        icon: '🤖',
        priority: 'medium'
      });
    }

    return sections;
  };

  const clinicalSections = parseClinicalResponse(safeRawResponse);

  const toggleSection = (sectionTitle: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionTitle)) {
      newCollapsed.delete(sectionTitle);
    } else {
      newCollapsed.add(sectionTitle);
    }
    setCollapsedSections(newCollapsed);
  };

  const toggleAction = (action: string) => {
    const newCompleted = new Set(completedActions);
    if (newCompleted.has(action)) {
      newCompleted.delete(action);
    } else {
      newCompleted.add(action);
    }
    setCompletedActions(newCompleted);
  };

  const getPriorityClass = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  const extractActionItems = (content: string) => {
    const items: string[] = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('✅')) {
        items.push(trimmed.replace(/^[-•✅]\s*/, ''));
      }
    });
    
    return items;
  };

  const quickActions = [
    { label: 'Order CGM', action: 'order_cgm', icon: '📊' },
    { label: 'Order Labs', action: 'order_labs', icon: '🩸' },
    { label: 'Schedule Follow-up', action: 'schedule_followup', icon: '📅' },
    { label: 'Refer to Specialist', action: 'refer_specialist', icon: '👨‍⚕️' },
    { label: 'Patient Education', action: 'patient_education', icon: '📚' },
    { label: 'Medication Review', action: 'medication_review', icon: '💊' }
  ];

  const handleEditSubmit = () => {
    onEditResponse(editedResponse);
    setEditMode(false);
  };

  const handleSaveDraft = () => {
    // Save the current response as draft
    console.log('Saving draft response for query:', queryId);
    // TODO: Implement actual draft saving functionality
    alert('Draft saved successfully! This response has been saved and can be continued later.');
  };

  const handleRequestNewResponse = () => {
    // Request a new AI response
    console.log('Requesting new AI response for query:', queryId);
    // TODO: Implement regenerate AI response functionality
    if (confirm('Are you sure you want to request a new AI response? This will replace the current response.')) {
      alert('New AI response requested! The system will generate a fresh response based on the patient data.');
    }
  };

  return (
    <div className="clinical-response-display">
      <div className="clinical-header">
        <h3>🩺 Clinical Decision Support Response</h3>
        <div className="patient-info">
          <span>Patient ID: {patientId}</span>
          <span>Query ID: {queryId}</span>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="quick-actions-panel">
        <h4>⚡ Quick Actions</h4>
        <div className="quick-actions-grid">
          {quickActions.map(action => (
            <button
              key={action.action}
              className={`quick-action-btn ${completedActions.has(action.action) ? 'completed' : ''}`}
              onClick={() => {
                toggleAction(action.action);
                onOrderAction(action.action);
              }}
            >
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
              {completedActions.has(action.action) && <span className="checkmark">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Clinical Sections */}
      <div className="clinical-sections">
        {clinicalSections.map((section, index) => {
          const isCollapsed = collapsedSections.has(section.title);
          const actionItems = extractActionItems(section.content);
          
          return (
            <div key={index} className={`clinical-section ${getPriorityClass(section.priority)}`}>
              <div 
                className="section-header"
                onClick={() => toggleSection(section.title)}
              >
                <div className="section-title">
                  <span className="section-icon">{section.icon}</span>
                  <span className="title-text">{section.title}</span>
                  {section.priority && (
                    <span className={`priority-badge ${section.priority}`}>
                      {section.priority.toUpperCase()}
                    </span>
                  )}
                </div>
                <span className={`collapse-icon ${isCollapsed ? 'collapsed' : 'expanded'}`}>
                  {isCollapsed ? '▶' : '▼'}
                </span>
              </div>
              
              {!isCollapsed && (
                <div className="section-content">
                  {section.title === 'Immediate Assessment & Management' && actionItems.length > 0 ? (
                    <div className="action-checklist">
                      {actionItems.map((item, itemIndex) => (
                        <label key={itemIndex} className="action-item">
                          <input
                            type="checkbox"
                            checked={completedActions.has(`${section.title}-${itemIndex}`)}
                            onChange={() => toggleAction(`${section.title}-${itemIndex}`)}
                          />
                          <span className="checkmark-custom"></span>
                          <span className="item-text">{item}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="section-text">
                      {section.content.split('\n').map((line, lineIndex) => (
                        <p key={lineIndex} className="content-line">
                          {line.trim()}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Response Editor */}
      <div className="response-editor">
        <div className="editor-header">
          <h4>✏️ Edit Response for Patient</h4>
          <button
            className="edit-toggle-btn"
            onClick={() => {
              setEditMode(!editMode);
              if (!editMode) {
                setEditedResponse(safeRawResponse);
              }
            }}
          >
            {editMode ? 'Cancel' : 'Edit Response'}
          </button>
        </div>
        
        {editMode && (
          <div className="editor-container">
            <textarea
              className="response-editor-textarea"
              value={editedResponse}
              onChange={(e) => setEditedResponse(e.target.value)}
              placeholder="Edit the response to be sent to the patient..."
              rows={10}
            />
            <div className="editor-actions">
              <button className="btn-save" onClick={handleEditSubmit}>
                Save Changes
              </button>
              <button className="btn-cancel" onClick={() => setEditMode(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="clinical-actions">
        <button className="btn-approve" onClick={onApproveResponse}>
          ✅ Approve & Send to Patient
        </button>
        <button className="btn-save-draft" onClick={handleSaveDraft}>
          💾 Save as Draft
        </button>
        <button className="btn-reject" onClick={handleRequestNewResponse}>
          ❌ Request New Response
        </button>
      </div>
    </div>
  );
};

export default ClinicalResponseDisplay;