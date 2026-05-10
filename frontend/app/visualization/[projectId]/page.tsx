"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../lib/apiClient";
import { DependencyGraph } from "../../../components/DependencyGraph";

export default function VisualizationPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [paths, setPaths] = useState<string[]>([]);

  useEffect(() => {
    apiFetch<{ paths: string[] }>(`/projects/${projectId}/tree`).then((r) => setPaths(r.paths));
  }, [projectId]);

  const nodes = paths.map((path) => ({ id: path }));
  const links = paths.slice(1).map((path, i) => ({ source: paths[i], target: path }));

  return (
    <main className="container">
      <h1>Architecture Visualization</h1>
      <DependencyGraph nodes={nodes} links={links} />
    </main>
  );
}
