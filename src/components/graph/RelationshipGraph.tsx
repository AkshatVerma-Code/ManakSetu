'use client';

import { useMemo } from 'react';
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

interface RelationshipGraphProps {
  standardNumber: string;
}

export default function RelationshipGraph({ standardNumber }: RelationshipGraphProps) {
  const nodes: Node[] = useMemo(() => [
    {
      id: '1',
      position: { x: 250, y: 50 },
      data: { label: standardNumber },
      style: { backgroundColor: '#1A5FB4', color: '#fff', fontWeight: 'bold' }
    },
    {
      id: '2',
      position: { x: 100, y: 150 },
      data: { label: 'IS 10322 (Part 1)' },
    },
    {
      id: '3',
      position: { x: 400, y: 150 },
      data: { label: 'IS 16102' },
    },
  ], [standardNumber]);

  const edges: Edge[] = useMemo(() => [
    { id: 'e1-2', source: '2', target: '1', label: 'Reference', animated: true },
    { id: 'e1-3', source: '1', target: '3', label: 'Related' },
  ], []);

  return (
    <div className="w-full h-full" style={{ minHeight: '300px' }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
