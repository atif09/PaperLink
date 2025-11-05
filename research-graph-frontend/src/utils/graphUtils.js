export const processGraphData = (graphData) => {
  const { nodes, edges } = graphData;

  const nodeMap = new Map();
  nodes.forEach(node => {
    nodeMap.set(node.id, {
      ...node,
      x: 0,
      y: 0,
    });
  });

  const processedEdges = edges.map(edge => ({
    source: typeof edge.source === 'string' ? edge.source : edge.source.id,
    target: typeof edge.target === 'string' ? edge.target : edge.target.id,
    type: edge.type,
  }));

  return {
    nodes: Array.from(nodeMap.values()),
    edges: processedEdges,
    centerNode: graphData.nodes.find(n => n.type === 'main')?.id,
  };
};

export const calculateNodeSize = (citationCount) => {
  const minSize = 12;
  const maxSize = 35;
  const logScale = Math.log(citationCount + 1);
  const size = Math.min(maxSize, minSize + logScale * 2.5);
  return size;
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

export const formatYear = (year) => {
  return year || 'N/A';
};

export const formatCitationCount = (count) => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

export const getNodeColor = (node, centerNodeId) => {
  if (node.id === centerNodeId) {
    return '#ffffff';
  }

  if (node.type === 'citing') {
    return '#10b981';
  }

  if (node.type === 'referenced') {
    return '#3b82f6';
  }

  return '#6b7280';
};

export const calculateInfluenceScore = (node, allNodes) => {
  const citations = node.citation_count || 0;
  const year = node.year || new Date().getFullYear();
  const age = new Date().getFullYear() - year;
  
  const velocity = age > 0 ? citations / age : citations;
  
  const citationScore = Math.log(citations + 1) * 10;
  const velocityScore = Math.log(velocity + 1) * 15;
  const recencyBonus = age < 5 ? 20 : (age < 10 ? 10 : 0);
  
  return citationScore + velocityScore + recencyBonus;
};

export const calculateChronologicalPositions = (nodes, edges, centerNodeId, width, height) => {
  const yearRange = {
    min: Math.min(...nodes.map(n => n.year || new Date().getFullYear())),
    max: Math.max(...nodes.map(n => n.year || new Date().getFullYear()))
  };

  const citationRange = {
    min: Math.min(...nodes.map(n => n.citation_count || 0)),
    max: Math.max(...nodes.map(n => n.citation_count || 0))
  };

  const padding = { x: 80, y: 60 };
  const usableWidth = width - padding.x * 2;
  const usableHeight = height - padding.y * 2;

  const positions = {};

  nodes.forEach(node => {
    const year = node.year || new Date().getFullYear();
    const citations = node.citation_count || 0;

    const x = padding.x + ((year - yearRange.min) / (yearRange.max - yearRange.min || 1)) * usableWidth;
    const y = height - padding.y - ((citations - citationRange.min) / (citationRange.max - citationRange.min || 1)) * usableHeight;

    positions[node.id] = {
      x: isNaN(x) ? width / 2 : x,
      y: isNaN(y) ? height / 2 : y,
    };
  });

  return { positions, yearRange, citationRange };
};
