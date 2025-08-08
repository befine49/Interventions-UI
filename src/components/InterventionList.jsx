import React, { useEffect, useState } from "react";
import CreateIntervention from "./CreateIntervention";

function InterventionList({ onSelect }) {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [employees, setEmployees] = useState([]);

  const loadInterventions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch("http://localhost:8000/api/interventions/", {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInterventions(data);
      } else {
        setError('Failed to load interventions');
      }
    } catch (err) {
      setError('Failed to load interventions');
    } finally {
      setLoading(false);
    }
  };

  const handleInterventionCreated = (newIntervention) => {
    console.log("New intervention created:", newIntervention);
    setInterventions(prev => [newIntervention, ...prev]);
    setShowCreateForm(false);
    // The CreateIntervention component will handle the redirect
  };

  useEffect(() => {
    loadInterventions();

    // Detect if user is admin
    const userData = localStorage.getItem('user');
    if (userData) {
      const userType = JSON.parse(userData).user_type;
      setIsAdmin(userType === 'admin');
    }

    // Fetch employees for admin assignment
    const fetchEmployees = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch("http://localhost:8000/api/employees/", {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        setEmployees(await res.json());
      }
    };
    fetchEmployees();
  }, []);

  const handleAssign = async (interventionId, employeeId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8000/api/interventions/${interventionId}/assign/`, {
        method: "POST",
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employee_id: employeeId }),
      });
      if (res.ok) {
        setInterventions(prev =>
          prev.map(i => i.id === interventionId ? { ...i, assigned_to: employees.find(e => e.id === Number(employeeId)) } : i)
        );
      }
    } catch (err) {
      alert("Failed to assign employee");
    }
  };

  const handleDelete = async (interventionId) => {
    if (!window.confirm("Are you sure you want to delete this intervention?")) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8000/api/interventions/${interventionId}/`, {
        method: "DELETE",
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        setInterventions(prev => prev.filter(i => i.id !== interventionId));
      }
    } catch (err) {
      alert("Failed to delete intervention");
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "20px" }}>Loading your support requests...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', textAlign: "center", padding: "20px" }}>{error}</div>;
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      urgent: '#dc3545'
    };
    return colors[priority] || '#6c757d';
  };

  const getStatusColor = (status) => {
    const colors = {
      open: '#007bff',
      in_progress: '#ffc107',
      waiting_for_client: '#fd7e14',
      waiting_for_employee: '#17a2b8',
      resolved: '#28a745',
      closed: '#6c757d'
    };
    return colors[status] || '#6c757d';
  };

  return (
    <div style={{ maxWidth: "800px", margin: "auto", padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>My Support Requests</h2>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{ 
            padding: "10px 20px", 
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          {showCreateForm ? "Cancel" : "New Support Request"}
        </button>
      </div>
      
      {showCreateForm && (
        <div style={{ marginBottom: "30px" }}>
          <CreateIntervention onInterventionCreated={handleInterventionCreated} />
        </div>
      )}

      {/* List of interventions */}
      <div>
        {interventions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            <h3>No support requests yet</h3>
            <p>Create your first support request to get help from our team!</p>
            <button 
              onClick={() => setShowCreateForm(true)}
              style={{ 
                padding: "12px 24px", 
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px"
              }}
            >
              Create Support Request
            </button>
          </div>
        ) : (
          <div>
            {isAdmin && (
              <div style={{ marginBottom: "20px", background: "#f5f5f5", padding: "10px", borderRadius: "8px" }}>
                <h3>Admin Controls</h3>
                <span style={{ color: "#666" }}>You can assign employees or delete interventions below.</span>
              </div>
            )}
            {interventions.map((intervention) => (
              <div
                key={intervention.id}
                onClick={() => onSelect(intervention.id)}
                style={{ 
                  cursor: "pointer", 
                  margin: "15px 0", 
                  padding: "20px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  transition: "box-shadow 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)"}
                onMouseLeave={(e) => e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <h3 style={{ margin: 0, color: "#333" }}>{intervention.title}</h3>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <span style={{ 
                      padding: "4px 8px", 
                      borderRadius: "4px", 
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: "white",
                      backgroundColor: getPriorityColor(intervention.priority)
                    }}>
                      {intervention.priority_display}
                    </span>
                    <span style={{ 
                      padding: "4px 8px", 
                      borderRadius: "4px", 
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: "white",
                      backgroundColor: getStatusColor(intervention.status)
                    }}>
                      {intervention.status_display}
                    </span>
                  </div>
                </div>
                
                {intervention.problem_type && (
                  <div style={{ marginBottom: "8px", fontSize: "14px", color: "#666" }}>
                    <strong>Type:</strong> {intervention.problem_type}
                  </div>
                )}
                
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
                  {intervention.description}
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#999" }}>
                  <div>
                    <strong>Created:</strong> {new Date(intervention.created_at).toLocaleDateString()}
                    {intervention.assigned_to && (
                      <span style={{ marginLeft: "15px" }}>
                        <strong>Assigned to:</strong> {intervention.assigned_to.first_name || intervention.assigned_to.username}
                      </span>
                    )}
                  </div>
                  <div>
                    {intervention.messages && intervention.messages.length > 0 && (
                      <span style={{ marginRight: "10px" }}>
                        💬 {intervention.messages.length} messages
                      </span>
                    )}
                    <span>Click to view details</span>
                  </div>
                </div>
                {/* Display chat rating if available */}
                {typeof intervention.chat_rating === "number" && (
                  <div style={{ marginTop: "8px", color: "#007bff", fontWeight: "bold", fontSize: "14px" }}>
                    Client rating: {intervention.chat_rating} / 5
                  </div>
                )}
                {/* Admin controls for assignment and deletion */}
                {isAdmin && (
                  <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
                    <select
                      value={intervention.assigned_to?.id || ""}
                      onChange={e => handleAssign(intervention.id, e.target.value)}
                      style={{ padding: "6px", borderRadius: "4px" }}
                    >
                      <option value="">Unassigned</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name || emp.username}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(intervention.id); }}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default InterventionList;
