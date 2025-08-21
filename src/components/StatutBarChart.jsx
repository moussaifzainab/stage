import React from 'react';
import { Bar } from 'react-chartjs-2';

const StatutBarChart = ({ incidents }) => {
  const labels = ['NOUVEAU', 'EN_COURS', 'EN_ATTENTE', 'RESOLU', 'NON_RESOLU', 'CLOTURE', 'ANNULE'];

  const data = {
    labels,
    datasets: [
      {
        label: 'Incidents par Statut',
        data: labels.map((statut) =>
          incidents.filter((incident) => incident.statut === statut).length
        ),
        backgroundColor: [
          '#60A5FA', // NOUVEAU - bleu clair
          '#F97316', // EN_COURS - orange
          '#FACC15', // EN_ATTENTE - jaune
          '#10B981', // RESOLU - vert
          '#EF4444', // NON_RESOLU - rouge
          '#6B7280', // CLOTURE - gris foncé
          '#A78BFA'  // ANNULE - violet clair
        ],
        borderWidth: 1,
      },
    ],
  };

  return <Bar data={data} />;
};

export default StatutBarChart;
