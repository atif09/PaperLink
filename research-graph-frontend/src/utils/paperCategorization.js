const calculateRelevanceScore = (paper, age, citations, currentYear) => {
  let score = 0;

  if (age <= 2) {
    score += 30;
  } else if (age <= 5) {
    score += 15;
  }

  score += Math.log10(Math.max(citations, 1)) * 20;

  return Math.round(score);
};

export const categorizePapers = (papers) => {
  if (!papers || papers.length === 0) {
    return [];
  }

  const currentYear = new Date().getFullYear();

  const citations = papers
    .map(p => p.citation_count || 0)
    .sort((a, b) => a - b);
  
  const p85 = citations[Math.floor(citations.length * 0.85)];

  return papers.map(paper => {
    const categories = [];
    const age = currentYear - (paper.publication_year || currentYear);
    const citationCount = paper.citation_count || 0;

    if (citationCount >= p85 || (age >= 10 && citationCount >= 1000)) {
      categories.push('foundational');
    }

    if (age >= 1 && age <= 4 && citationCount >= 10) {
      categories.push('trending');
    }

    if (age <= 3) {
      categories.push('recent');
    }

    if (citationCount >= p85) {
      categories.push('highly-cited');
    }

    return {
      ...paper,
      categories,
      citationVelocity: citationCount / Math.max(age, 1),
      relevanceScore: calculateRelevanceScore(paper, age, citationCount, currentYear)
    };
  });
};

export const sortPapersByCategory = (papers, category) => {
  const categorized = categorizePapers(papers);

  switch (category) {
    case 'foundational':
      return categorized
        .filter(p => p.categories.includes('foundational'))
        .sort((a, b) => b.citation_count - a.citation_count);

    case 'trending':
      return categorized
        .filter(p => p.categories.includes('trending'))
        .sort((a, b) => b.citationVelocity - a.citationVelocity);

    case 'recent':
      return categorized
        .filter(p => p.categories.includes('recent'))
        .sort((a, b) => b.publication_year - a.publication_year);

    case 'highly-cited':
      return categorized
        .filter(p => p.categories.includes('highly-cited'))
        .sort((a, b) => b.citation_count - a.citation_count);

    case 'all':
    default:
      return categorized;
  }
};

export const getCategoryBadge = (categories) => {
  if (categories.includes('foundational')) return { label: 'Foundational', color: 'gold' };
  if (categories.includes('trending')) return { label: 'Trending', color: 'green' };
  if (categories.includes('recent')) return { label: 'Recent', color: 'blue' };
  if (categories.includes('highly-cited')) return { label: 'Highly Cited', color: 'purple' };
  return null;
};