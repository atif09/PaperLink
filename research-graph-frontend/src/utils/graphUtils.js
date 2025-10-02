export const processGraphData = (graphData) => {
  const {nodes, edges, center_node} = graphData;

  const nodeMap = new Map();
  nodes.forEach(node => {
    nodeMap.set(node.id, {
      ...node,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    });
  });

  const processedEdges = edges.map(edge => ({
    source: edge.source,
    target: edge.target,
    type: edge.type,
  }));

  return {
    nodes: Array.from(nodeMap.values()),
    edges: processedEdges,
    centerNode: center_node,

  };
};

export const calculateNodeSize = (citationCount) => {
  const minSize = 8;
  const maxSize = 24;
  const logScale = Math.log(citationCount + 1);
  return Math.min(maxSize, minSize + logScale * 2);
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

};

export const formatYear = (year) => {
  return year || 'N/A';
};

export const formatCitationCount = (count) => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

