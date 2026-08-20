import { useCallback, useEffect, useRef, useState } from 'react';
import { applyNodeChanges, type Node, type NodeChange } from 'reactflow';

export function useDraggableNodes(nodes: Node[]) {
  const [flowNodes, setFlowNodes] = useState<Node[]>([]);
  const prevNodesRef = useRef<Node[]>([]);

  useEffect(() => {
    const prev = prevNodesRef.current;
    const prevPos = new Map(prev.map((n) => [n.id, n.position]));
    const merged = nodes.map((n) => ({ ...n, position: prevPos.get(n.id) ?? n.position }));

    const same =
      merged.length === prev.length &&
      merged.every(
        (n, i) =>
          n.id === prev[i]?.id &&
          n.position.x === prev[i]?.position.x &&
          n.position.y === prev[i]?.position.y &&
          n.data === prev[i]?.data
      );

    if (!same) {
      prevNodesRef.current = merged;
      setFlowNodes(merged);
    }
  }, [nodes]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setFlowNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  return { nodes: flowNodes, onNodesChange };
}
