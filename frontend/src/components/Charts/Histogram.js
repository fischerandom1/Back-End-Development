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

const Histogram = ({ data }) => {
  // Sort data to approximate a normal distribution
  const sortedData = data.sort((a, b) => a.avg - b.avg);

  const chartData = {
    labels: sortedData.map((d) => d.modelName),
    datasets: [
      {
        label: "Average Number of Classes Detected",
        data: sortedData.map((d) => d.avg),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderWidth: 0,
      },
    ],
  };

  const options = {
    scales: {
      yAxe: [
        {
          ticks: {
            beginAtZero: true,
          },
        },
      ],
      x: {
        title: {
          display: true,
          text: "Models",
          font: {
            size: 16,
            weight: "bold",
          },
        },

        barPercentage: 1.0,
        categoryPercentage: 1.0,
      },
    },
  };

  return <Bar options={options} data={chartData} />;
};

export default Histogram;
