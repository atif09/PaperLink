export const generateReadingPath = (centerPaper, graphData) => {
  if (!graphData || !graphData.nodes || !graphData.edges) {
    return { prerequisites: [], path: [] };
  }

  const referencedPapers = graphData.edges
    .filter(edge => edge.source === centerPaper.id)
    .map(edge => graphData.nodes.find(n => n.id === edge.target))
    .filter(paper => paper)

  const citationDegree = {};
  graphData.edges.forEach(edge => {
    citationDegree[edge.target] = (citationDegree[edge.target] || 0) + 1;
  });

  const scoredPapers = referencedPapers.map(paper => {
    const age = new Date().getFullYear() - (paper.publication_year || new Date().getFullYear());
    const citationScore = citationDegree[paper.id] || 0;
    const totalCitations = paper.citation_count || 0;

    const score = (citationScore * 100) + (totalCitations * 0.1) + (age * 2);

    return {
      ...paper,
      prerequisiteScore: score,
      citedByInNetwork: citationScore,
    };
  });

  scoredPapers.sort((a, b) => b.prerequisiteScore - a.prerequisiteScore);

  const prerequisites = scoredPapers.slice(0, 3);

  const path = [
    ...prerequisites,
    centerPaper
  ];

  return {
    prerequisites,
    path,
    totalReferences: referencedPapers.length
  };
};

export const generateLearningSequence = (papers) => {
  const sorted = [...papers].sort((a,b) => {
    const yearA = a.publication_year || 9999;
    const yearB = b.publication_year || 9999;

    if (Math.abs(yearA - yearB) > 5) {
      return yearA - yearB;
    }

    return (b.citation_count || 0) - (a.citation_count || 0);
  });

  return sorted;
};