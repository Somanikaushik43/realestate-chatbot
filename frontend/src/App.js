import React, { useState } from "react";
import { motion } from "framer-motion";
import ChatBox from "./Components/ChatBox";
import ResultCard from "./Components/ResultCard";
import { queryArea, uploadFile, downloadCSV } from "./api";
import "./styles.css";

export default function App() {
  const [areaInput, setAreaInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAsk = async () => {
    if (!areaInput.trim()) {
      setError("Please enter an area.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const data = await queryArea(areaInput);
      setResult(data);
    } catch (err) {
      setError("Something went wrong!");
    }

    setLoading(false);
  };

  return (
    <div className="main-container">

      {/* TITLE */}
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="title"
      >
        🏙 Real Estate Insights Chatbot
      </motion.h2>

      {/* GLASS CARD */}
      <motion.div className="glass-card">

        {/* TOP BAR FLEX ROW */}
        <div className="top-bar">
          <input
            className="modern-input"
            placeholder="Search locality (e.g., Wakad)"
            value={areaInput}
            onChange={(e) => setAreaInput(e.target.value)}
          />

          <div className="button-group">
            <button className="btn-primary-modern" onClick={handleAsk}>
              {loading ? "..." : "Analyze"}
            </button>

            <button
              className="btn-primary-modern"
              disabled={!result}
              onClick={async () => {
                const file = await downloadCSV(areaInput);
                const url = window.URL.createObjectURL(file);
                const a = document.createElement("a");
                a.href = url;
                a.download = `filtered_${areaInput}.csv`;
                a.click();
              }}
            >
              Download
            </button>
          </div>
        </div>

        {/* CHATBOX */}
        <ChatBox
          onQuery={async (query) => {
            try {
              const cleaned = query.toLowerCase().trim();
              const data = await queryArea(cleaned);
              setResult(data);

              return "Fetched insights successfully.";
            } catch {
              return "⚠️ Couldn't fetch insights.";
            }
          }}

          onUpload={async (file) => {
            try {
              await uploadFile(file);
              return "Excel uploaded successfully!";
            } catch {
              return "⚠️ Upload failed!";
            }
          }}
        />
      </motion.div>

      {/* RESULT */}
      {result && <ResultCard data={result} area={areaInput} />}
    </div>
  );
}
