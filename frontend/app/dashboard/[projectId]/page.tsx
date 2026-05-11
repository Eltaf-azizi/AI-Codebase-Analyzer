"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../lib/apiClient";
import { FileExplorer } from "../../../components/FileExplorer";
import { CodeViewer } from "../../../components/CodeViewer";
import { ChatPanel } from "../../../components/ChatPanel";
import Link from "next/link";

export default function DashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [paths, setPaths] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [content, setContent] = useState("");
  const [analysis, setAnalysis] = useState<{ project_summary?: string }>({});

  useEffect(() => {
    if (!projectId) return;
    apiFetch<{ paths: string[] }>(`/projects/${projectId}/tree`).then((r) => setPaths(r.paths));
    apiFetch(`/projects/${projectId}/analyze`, { method: "POST" }).then(() =>
      apiFetch<{ project_summary: string }>(`/projects/${projectId}/analysis`).then(setAnalysis),
    );
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !selected) return;
    apiFetch<{ content: string }>(`/projects/${projectId}/files/${selected}`).then((r) => setContent(r.content));
  }, [projectId, selected]);

  return (
    <main className="container">
      <h1>Dashboard</h1>
      <p>{analysis.project_summary}</p>
      <p>
        <Link href={`/chat/${projectId}`}>Chat Page</Link> | <Link href={`/visualization/${projectId}`}>Visualization</Link>
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <FileExplorer paths={paths} onSelect={setSelected} />
        <CodeViewer filePath={selected} content={content} />
      </div>
      <ChatPanel projectId={projectId} />
    </main>
  );
}
