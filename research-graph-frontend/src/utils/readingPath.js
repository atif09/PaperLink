export const generateRelatedPapers = (centerPaper, graphData) => {
  if (!graphData || !graphData.nodes || !graphData.edges) {
    return { foundational: [], buildingOn: [], totalReferences: 0 };
  }

  const foundational = graphData.edges
    .filter(edge => edge.source === centerPaper.id)
    .map(edge => graphData.nodes.find(n => n.id === edge.target))
    .filter(paper => paper !== undefined)
    .sort((a, b) => (b.citation_count || 0) - (a.citation_count || 0))
    .slice(0, 5);

  const buildingOn = graphData.edges
    .filter(edge => edge.target === centerPaper.id)
    .map(edge => graphData.nodes.find(n => n.id === edge.source))
    .filter(paper => paper !== undefined)
    .sort((a, b) => (b.citation_count || 0) - (a.citation_count || 0))
    .slice(0, 5);

  const totalReferences = graphData.edges.filter(e => e.source === centerPaper.id).length;

  return {
    foundational,
    buildingOn,
    totalReferences
  };
};

export const generateLearningSequence = (papers) => {
  const sorted = [...papers].sort((a, b) => {
    const yearA = a.publication_year || 9999;
    const yearB = b.publication_year || 9999;

    if (yearA !== yearB) {
      return yearA - yearB;
    }

    return (b.citation_count || 0) - (a.citation_count || 0);
  });

  return sorted;
};