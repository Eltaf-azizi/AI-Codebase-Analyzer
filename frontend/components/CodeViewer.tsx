type Props = {
  filePath: string;
  content: string;
};

export function CodeViewer({ filePath, content }: Props) {
  return (
    <section className="card" style={{ flex: 1 }}>
      <h3>{filePath || "Code Viewer"}</h3>
      <pre style={{ overflow: "auto", whiteSpace: "pre-wrap" }}>{content}</pre>
    </section>
  );
}
