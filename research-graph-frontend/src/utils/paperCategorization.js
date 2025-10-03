export const categorizePapers = (papers) => {
  const currentYear = new Date().getFullYear();

  return papers.map(paper => {
    const categories = [];
    const age = currentYear - (paper.publication_year || currentYear);
    const citations = paper.citation_count || 0;

    if (age >= 10 && citations >= 1000) {
      categories.push('foundational');
    }

    if (age <= 2 && citations >= 50) {
      const citationVelocity = citations / Math.max(age, 1);
      if (citationVelocity >= 25) {
        categories.push('trending');
      }
    }

    if (age <= 3) {
      categories.push('recent');
    }

    if (citations >= 500) {
      categories.push('highly-cited');
    }

    return {
      ...paper,
      categories,
      citationVelocity: citations / Math.max(age, 1)
    };
  });
};

export const sortPaperByCategory = (papers, category) => {
  const categorized = categorizePapers(papers);

  switch(cateogry) {
    case 'foundational': 
      return categorized
        .filter(p => p.categories.includes('foundational'))
        .sort((a,b) => b.citation_count - a.citation_count);

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
        .sort((a, b) => b.citation_Count - a.citation_count);

    default:
      return categorized.sort((a, b) => b.citation_count - a.citation_count);
  }
};

export const getCategoryBadge = (categories) => {
  if (categories.includes('foundational')) return { label: 'Foundational', color: 'gold' };
  if (categories.includes('trending')) return { label: 'Trending', color: 'green' };
  if (categories.includes('recent')) return { label: 'Recent', color: 'blue' };
  if (categories.includes('highly-cited')) return { label: 'Highly Cited', color: 'purple' };
  return null;
};