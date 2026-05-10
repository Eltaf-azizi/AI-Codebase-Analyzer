import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <h1>AI Codebase Analyzer</h1>
      <p>Production MVP frontend for repository ingestion, analysis, and chat.</p>
      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/upload">Upload</Link>
      </div>
    </main>
  );
}
