"use client";

type Node = { id: string };
type Link = { source: string; target: string };

export function DependencyGraph({ nodes, links }: { nodes: Node[]; links: Link[] }) {
  return (
    <section className="card">
      <h3>Architecture Graph</h3>
      <p>Nodes: {nodes.length}</p>
      <p>Links: {links.length}</p>
      <ul>
        {links.slice(0, 20).map((link, i) => (
          <li key={`${link.source}-${link.target}-${i}`}>
            {link.source} -&gt; {link.target}
          </li>
        ))}
      </ul>
    </section>
  );
}
