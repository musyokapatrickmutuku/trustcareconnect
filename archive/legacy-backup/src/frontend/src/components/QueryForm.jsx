import React, { useState } from 'react';

function QueryForm({ onCreateQuery }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title && formData.description) {
      onCreateQuery(formData);
      setFormData({
        title: '',
        description: '',
        category: 'general'
      });
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="query-form">
      <h3>Ask a Question</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Question Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Brief description of your question"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Detailed Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Please provide more details about your question or concern"
            rows="4"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category:</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="general">General Health</option>
            <option value="diabetes">Diabetes</option>
            <option value="medication">Medication</option>
          </select>
        </div>

        <button type="submit" className="submit-btn">
          Submit Question
        </button>
      </form>
    </div>
  );
}

export default QueryForm;