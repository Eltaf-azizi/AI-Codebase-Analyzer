import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ArchitectureNode, ArchitectureLink } from '../types';

interface Props {
  data: {
    nodes: ArchitectureNode[];
    links: ArchitectureLink[];
  };
  width?: number;
  height?: number;
}

export const ArchitectureGraph: React.FC<Props> = ({ data, width = 800, height = 600 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const simulation = d3.forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(data.links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1));

    const link = svg.append('g')
      .attr('stroke', '#3f3f46')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke-width', (d: any) => Math.sqrt(d.value));

    const node = svg.append('g')
      .attr('stroke', '#18181b')
      .attr('stroke-width', 1.5)
      .selectAll('g')
      .data(data.nodes)
      .join('g')
      .call(drag(simulation) as any);

    node.append('circle')
      .attr('r', (d: any) => d.type === 'file' ? 8 : 5)
      .attr('fill', (d: any) => d.type === 'file' ? '#6366f1' : '#a1a1aa');

    node.append('title')
      .text((d: any) => d.id);

    node.append('text')
      .attr('x', 12)
      .attr('y', 4)
      .text((d: any) => d.id.split('/').pop())
      .attr('fill', '#e4e4e7')
      .attr('font-size', '10px')
      .attr('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    return () => { simulation.stop(); };
  }, [data, width, height]);

  return (
    <div className="w-full h-full bg-zinc-950/50 rounded-3xl border border-zinc-900 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-xs text-zinc-400 font-medium">Files</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-zinc-500" />
          <span className="text-xs text-zinc-400 font-medium">External Deps</span>
        </div>
      </div>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="cursor-move"
      />
    </div>
  );
};
