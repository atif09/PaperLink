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
  const minSize = 10;
  const maxSize = 32;

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
  
  const citations = node.citation_count || 0;
  
  if (citations >= 10000) {
    return '#6366f1'; 
  }
  
  if (citations >= 1000) {
    return '#8b92a8'; 
  }

  return '#5a5f70'; 
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
