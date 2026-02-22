"use client";

import { useState } from "react";

import type { FilingWorkflowActionLogEntry } from "@/components/payroll-year-end-filing/filing-types";
import styles from "@/components/payroll-year-end-filing/FilingWorkflow.module.css";

type FilingActionLogProps = {
  entries: readonly FilingWorkflowActionLogEntry[];
  onRecordAction: (message: string, actor: string) => void;
};

export default function FilingActionLog({ entries, onRecordAction }: FilingActionLogProps) {
  const [message, setMessage] = useState("");
  const [actor, setActor] = useState("");

  return (
    <article className="panel" id="filing-workflow-action-log">
      <h3>Workflow Action Log</h3>
      <div className={styles.controlGrid}>
        <label>
          Actor
          <input value={actor} onChange={(event) => setActor(event.target.value)} />
        </label>
        <label>
          Message
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} />
        </label>
      </div>
      <button
        className="btn btn-secondary btn-small"
        onClick={() => {
          onRecordAction(message, actor);
          setMessage("");
        }}
      >
        Add Action Log
      </button>

      {entries.length === 0 ? (
        <p className="small">No workflow actions recorded yet.</p>
      ) : (
        <ul className={styles.blockerList} aria-label="filing workflow action log list">
          {entries.map((entry) => (
            <li key={entry.id} className="small">
              [{entry.step}] {entry.message} ({entry.actor}) at {new Date(entry.at).toLocaleString("ko-KR")}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
