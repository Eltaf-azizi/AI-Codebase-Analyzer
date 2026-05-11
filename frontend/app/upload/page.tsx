"use client";

import { useState } from "react";
import { apiFetch } from "../../lib/apiClient";
import Link from "next/link";

export default function UploadPage() {
  const [projectId, setProjectId] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [zipFile, setZipFile] = useState<File | null>(null);

  async function createProjectAndIngestGithub() {
    const project = await apiFetch<{ project_id: string }>("/projects", {
      method: "POST",
      body: JSON.stringify({ name: "Uploaded Project" }),
    });
    setProjectId(project.project_id);
    await apiFetch("/ingestion/github", {
      method: "POST",
      body: JSON.stringify({ project_id: project.project_id, repo_url: repoUrl }),
    });
  }

  async function createProjectAndIngestZip() {
    if (!zipFile) return;
    const project = await apiFetch<{ project_id: string }>("/projects", {
      method: "POST",
      body: JSON.stringify({ name: zipFile.name }),
    });
    setProjectId(project.project_id);
    const form = new FormData();
    form.append("upload", zipFile);
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1"}/ingestion/zip?project_id=${project.project_id}`, {
      method: "POST",
      body: form,
    });
  }

  return (
    <main className="container">
      <h1>Upload Repository</h1>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>GitHub URL</h3>
        <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/org/repo" />
        <button onClick={createProjectAndIngestGithub}>Analyze GitHub Repo</button>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>ZIP Upload</h3>
        <input type="file" accept=".zip" onChange={(e) => setZipFile(e.target.files?.[0] ?? null)} />
        <button onClick={createProjectAndIngestZip}>Analyze ZIP</button>
      </div>
      {projectId && (
        <p>
          Project created. Open <Link href={`/dashboard/${projectId}`}>Dashboard</Link>.
        </p>
      )}
    </main>
  );
}
