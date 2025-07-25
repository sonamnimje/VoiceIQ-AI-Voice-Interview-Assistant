import React from "react";
import { FaMicrophone, FaRegFileAlt, FaRegCalendarAlt, FaRegStickyNote } from "react-icons/fa";
import "./AgentStats.css";

const actions = [
  { icon: <FaMicrophone />, label: "Generating Image" },
  { icon: <FaRegFileAlt />, label: "Creating Document" },
  { icon: <FaRegCalendarAlt />, label: "Scheduling Meeting" },
  { icon: <FaRegStickyNote />, label: "Writing Note" },
];

export default function AgentStats() {
  return (
    <div className="agent-stats-bg">
      <div className="agent-stats-card glass">
        <h2 className="greeting">Hi Johnson,</h2>
        <p className="subtitle">
          Give any command naturally, from generating images to scheduling meetings.
        </p>
        <div className="actions-grid">
          {actions.map((action, idx) => (
            <div className="action-card" key={idx}>
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
            </div>
          ))}
          <h2 style={{ margin: 0 }}>Voice AI Agent</h2>
          <div style={{ color: "#aaa", fontSize: "0.95em" }}>Agent Tools</div>
        </div>
      </div>
      <div style={{ marginTop: "2em" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ color: "#aaa", fontSize: "0.95em" }}>Response Accuracy</div>
            <div style={{ fontSize: "2em", fontWeight: 700 }}>99%</div>
          </div>
          <div>
            <div style={{ color: "#aaa", fontSize: "0.95em" }}>Customer Satisfaction</div>
            <div style={{ fontSize: "2em", fontWeight: 700 }}>96%</div>
          </div>
        </div>
        <div>
          <div style={{ color: "#aaa", fontSize: "0.95em" }}>Task Completion Rate</div>
          <div style={{ fontSize: "2em", fontWeight: 700 }}>91%</div>
        </div>
      </div>
    </div>
  );
}
