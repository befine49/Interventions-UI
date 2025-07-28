import React, { useState, useEffect } from "react";
import { Card, Button, Alert, Spinner } from "react-bootstrap";
import axios from "axios";

function PreviousInterventions() {
  const [interventions, setInterventions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    axios.get("http://localhost:8000/api/qa/qa-list")
      .then((response) => {
        setInterventions(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError("Erreur lors du chargement des interventions.");
        setInterventions([]);
        setLoading(false);
      });
  }, []);

  const toggleDetails = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="container my-5">
      <h2 className="mb-4">📋 Questions & Réponses</h2>
      {loading && (
        <div className="text-center my-4">
          <Spinner animation="border" variant="primary" />
        </div>
      )}
      {error && (
        <Alert variant="danger" className="my-3">
          {error}
        </Alert>
      )}
      {!loading && !error && interventions.length === 0 && (
        <Alert variant="info" className="my-3">
          Aucune question trouvée.
        </Alert>
      )}
      {interventions.map((item) => (
        <Card className="mb-3 shadow-sm" key={item.id}>
          <Card.Body>
            <Card.Title>Question: {item.question}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">
              Créé le : {new Date(item.created_at).toLocaleString()}
            </Card.Subtitle>
            {expandedId === item.id && (
              <Card.Text className="mt-2">
                <strong>Réponse:</strong> {item.answer}
              </Card.Text>
            )}
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => toggleDetails(item.id)}
            >
              {expandedId === item.id ? "Masquer la réponse" : "Voir la réponse"}
            </Button>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}

export default PreviousInterventions;