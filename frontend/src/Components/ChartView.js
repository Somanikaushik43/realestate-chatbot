import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function ChartView({ chart }) {

  const data = {
    labels: chart.years,
    datasets: [
      {
        label: "Average Price",
        data: chart.prices,
        borderColor: "#ff8c2b",
        backgroundColor: "rgba(255, 140, 43, 0.25)",
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: "#ff8c2b",
        tension: 0.4,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        labels: {
          color: "#eee",
          font: { size: 14 }
        }
      },
      tooltip: {
        backgroundColor: "#222",
        titleColor: "#fff",
        bodyColor: "#ddd",
      }
    },

    scales: {
      x: {
        ticks: { color: "#ccc" },
        grid: { color: "rgba(255,255,255,0.05)" }
      },
      y: {
        ticks: { color: "#ccc" },
        grid: { color: "rgba(255,255,255,0.07)" }
      }
    },

    layout: {
      padding: 12
    }
  };

  return (
    <div style={{ height: "320px" }}>
      <Line data={data} options={options} />
    </div>
  );
}
