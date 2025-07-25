import React from "react";
import "./ModernUI.css";

const tasks = [
  { name: "Answer customer inquiries", status: "In progress" },
  { name: "Provide product recommendations", status: "Completed" },
  { name: "Assist with order processing", status: "Completed" },
  { name: "Handle customer complaints", status: "Consent required" },
];

const statusColors = {
  "In progress": "#3ea6ff",
  "Completed": "#2ee59d",
  "Consent required": "#ffe066"
};

export default function AgentTasks() {
  return (
    <div className="modern-bg">
      <div className="glass-card" style={{ maxWidth: 520, width: '100%' }}>
        <h2 className="modern-title" style={{ fontSize: '1.7rem' }}>Agent Tasks</h2>
        <p className="modern-desc" style={{ marginBottom: '1.5em' }}>
          Overview of all the tasks the agent is currently running
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {tasks.map((task) => (
            <li key={task.name} style={{ marginBottom: "1.2em", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 500 }}>{task.name}</span>
              <span style={{
                background: statusColors[task.status],
                color: "#111",
                borderRadius: "1em",
                padding: "0.2em 0.9em",
                fontWeight: 600,
                fontSize: "0.9em",
                boxShadow: '0 0 8px #c084fc55',
                letterSpacing: 0.5
              }}>
                {task.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
