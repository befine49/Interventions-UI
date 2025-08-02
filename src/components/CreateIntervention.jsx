import React, { useState } from "react";

const CreateIntervention = ({ onInterventionCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problem_type: '',
    priority: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const problemTypes = [
    'Technical Issue',
    'Billing Problem',
    'Account Access',
    'Service Request',
    'Bug Report',
    'Feature Request',
    'General Inquiry',
    'Other'
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: '#28a745' },
    { value: 'medium', label: 'Medium', color: '#ffc107' },
    { value: 'high', label: 'High', color: '#fd7e14' },
    { value: 'urgent', label: 'Urgent', color: '#dc3545' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch("http://localhost:8000/api/interventions/", {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Intervention created:", data);
        setFormData({
          title: '',
          description: '',
          problem_type: '',
          priority: 'medium'
        });
        if (onInterventionCreated) {
          onInterventionCreated(data);
        }
        // Redirect to the chat for this intervention
        window.location.href = `/intervention/${data.id}/chat`;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create intervention');
      }
    } catch (err) {
      setError('Failed to create intervention');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "20px" }}>
      <h3 style={{ marginBottom: "20px", textAlign: "center" }}>
        Create New Support Request
      </h3>
      
      <form onSubmit={handleSubmit} style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "8px" }}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Problem Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            placeholder="Brief description of your problem"
            style={{ 
              width: "100%", 
              padding: "10px", 
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px"
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Problem Type
          </label>
          <select
            name="problem_type"
            value={formData.problem_type}
            onChange={handleInputChange}
            style={{ 
              width: "100%", 
              padding: "10px", 
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px"
            }}
          >
            <option value="">Select problem type</option>
            {problemTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Priority Level
          </label>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {priorities.map(priority => (
              <label key={priority.value} style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "5px",
                cursor: "pointer"
              }}>
                <input
                  type="radio"
                  name="priority"
                  value={priority.value}
                  checked={formData.priority === priority.value}
                  onChange={handleInputChange}
                />
                <span style={{ 
                  color: priority.color, 
                  fontWeight: "bold",
                  fontSize: "12px"
                }}>
                  {priority.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            Detailed Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            placeholder="Please provide detailed information about your problem. Include any error messages, steps to reproduce, and what you were trying to do."
            rows="6"
            style={{ 
              width: "100%", 
              padding: "10px", 
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              resize: "vertical"
            }}
          />
        </div>

        {error && (
          <div style={{ 
            color: "red", 
            marginBottom: "15px", 
            padding: "10px",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "4px"
          }}>
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
          style={{ 
            width: "100%",
            padding: "12px", 
            backgroundColor: isSubmitting || !formData.title.trim() || !formData.description.trim() ? "#6c757d" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            cursor: isSubmitting || !formData.title.trim() || !formData.description.trim() ? "not-allowed" : "pointer"
          }}
        >
          {isSubmitting ? "Creating..." : "Submit Support Request"}
        </button>
      </form>

      <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#e7f3ff", borderRadius: "4px" }}>
        <h4 style={{ margin: "0 0 10px 0", color: "#0056b3" }}>What happens next?</h4>
        <ul style={{ margin: 0, paddingLeft: "20px", color: "#0056b3" }}>
          <li>Your request will be reviewed by our support team</li>
          <li>An employee will be assigned to help you</li>
          <li>You'll receive updates and can chat directly with the assigned employee</li>
          <li>You can track the progress of your request in real-time</li>
        </ul>
      </div>
    </div>
  );
};

export default CreateIntervention; 