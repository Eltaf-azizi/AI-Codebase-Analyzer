"use client";

type Props = {
  paths: string[];
  onSelect: (path: string) => void;
};

export function FileExplorer({ paths, onSelect }: Props) {
  return (
    <aside className="card" style={{ minWidth: 260, maxHeight: 600, overflow: "auto" }}>
      <h3>Files</h3>
      {paths.map((path) => (
        <button
          key={path}
          onClick={() => onSelect(path)}
          style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 6 }}
        >
          {path}
        </button>
      ))}
    </aside>
  );
}
