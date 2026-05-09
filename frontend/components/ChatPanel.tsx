"use client";

import { useState } from "react";
import { apiFetch } from "../lib/apiClient";

type Props = { projectId: string };

export function ChatPanel({ projectId }: Props) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");

  async function ask() {
    const response = await apiFetch<{ answer: string }>(`/projects/${projectId}/chat`, {
      method: "POST",
      body: JSON.stringify({ query }),
    });
    setAnswer(response.answer);
  }

  return (
    <section className="card">
      <h3>AI Chat</h3>
      <textarea value={query} onChange={(e) => setQuery(e.target.value)} rows={4} style={{ width: "100%" }} />
      <button onClick={ask}>Ask</button>
      <pre>{answer}</pre>
    </section>
  );
}
