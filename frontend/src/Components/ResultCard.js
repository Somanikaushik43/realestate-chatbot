import React from "react";
import { Row, Col } from "react-bootstrap";
import { motion } from "framer-motion";
import ChartView from "./ChartView";
import TableView from "./TableView";

export default function ResultCard({ data, area }) {
  if (!data) {
    return <div className="glass-card p-3">No results yet.</div>;
  }

  const summary = data.summary || {};
  const chart = data.chart || {};
  const rows = Array.isArray(data.rows) ? data.rows : [];

  const areaKey = Object.keys(summary)[0] || area;
  const summaryText = summary[areaKey];
  const chartData = chart[areaKey];

  return (
    <motion.div
      className="glass-card p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Title */}
      <h4 className="fw-bold mb-4" style={{ color: "#ffa84d" }}>
        Insights for: {areaKey}
      </h4>

      {/* Summary + Price Trend Row */}
      <Row className="g-4 mb-4">
        {/* Summary */}
        <Col md={6}>
          <div className="glass-card p-3">
            <h6 className="fw-bold mb-2">📌 Summary</h6>

            {!summaryText ? (
              <p>No summary available.</p>
            ) : (
              <p>{summaryText}</p>
            )}
          </div>
        </Col>

        {/* Price Trend */}
        <Col md={6}>
          <div className="glass-card p-3">
            <h6 className="fw-bold mb-2">📈 Price Trend</h6>

            {!chartData || !chartData.years?.length ? (
              <p>No chart data</p>
            ) : (
              <ChartView chart={chartData} />
            )}
          </div>
        </Col>
      </Row>

      {/* Dataset */}
      <h6 className="fw-bold mb-2">📄 Dataset (Top 200 Rows)</h6>

      {rows.length === 0 ? (
        <p>No rows found.</p>
      ) : (
        <TableView rows={rows} />
      )}
    </motion.div>
  );
}
