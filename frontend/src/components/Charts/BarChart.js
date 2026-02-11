import React from "react";
import { Bar } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function BarChart({ labels, chartData, titleName }) {
  const data = {
    labels: labels,
    datasets: [
      {
        label: titleName,
        data: chartData,
        backgroundColor: labels.map(
          (_, index) => `hsla(${index * 100}, 70%, 50%, 0.5)`
        ),
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        display: false,
      },
      title: {
        display: true,
        text: titleName,
        font: {
          size: 20,
          weight: "bold",
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "No. of Predictions",
          font: {
            size: 16,
            weight: "bold",
          },
        },
      },
      x: {
        title: {
          display: true,
          text: "Models",
          font: {
            size: 16,
            weight: "bold",
          },
        },
      },
    },
  };

  return <Bar options={options} data={data} />;
}

export default BarChart;
