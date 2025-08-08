import React, { useEffect, useState } from "react";

function AdminDashboard() {
  const [interventions, setInterventions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch interventions
        const interventionsRes = await fetch("http://localhost:8000/api/interventions/", {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const interventionsData = interventionsRes.ok ? await interventionsRes.json() : [];
        setInterventions(interventionsData);

        // Fetch employees
        const employeesRes = await fetch("http://localhost:8000/api/employees/", {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const employeesData = employeesRes.ok ? await employeesRes.json() : [];
        setEmployees(employeesData);

      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleAssign = async (interventionId, employeeId) => {
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
          prev.map(i => i.id === interventionId ? { ...i, assigned_to: employees.find(e => e.id === employeeId) } : i)
        );
      }
    } catch (err) {
      alert("Failed to assign employee");
    }
  };

  const handleDelete = async (interventionId) => {
    if (!window.confirm("Are you sure you want to delete this intervention?")) return;
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

  if (loading) return <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>;
  if (error) return <div style={{ color: "red", textAlign: "center", padding: "20px" }}>{error}</div>;

  return (
    <div style={{ maxWidth: "900px", margin: "auto", padding: "30px" }}>
      <h2>Admin Dashboard</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Title</th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Client</th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Priority</th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Status</th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Assigned Employee</th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {interventions.map(intervention => (
            <tr key={intervention.id}>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>{intervention.title}</td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>{intervention.created_by?.username}</td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>{intervention.priority_display || intervention.priority}</td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>{intervention.status_display || intervention.status}</td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>
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
              </td>
              <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                <button
                  onClick={() => handleDelete(intervention.id)}
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;
