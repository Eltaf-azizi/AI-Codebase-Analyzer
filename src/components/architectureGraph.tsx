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
