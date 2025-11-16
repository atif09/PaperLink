
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

const calculateAge = (publicationDate, currentDate) => {
  const ageMs = currentDate - publicationDate;
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
  return ageYears;
};

const parsePublicationDate = (paper) => {
  if (paper.publicationDate) {
    return paper.publicationDate instanceof Date
      ? paper.publicationDate
      : new Date(paper.publicationDate);
  }
  if (paper.publication_year) {
   
    return new Date(paper.publication_year, 5, 30);
  }
  return null;
};

export const categorizePapers = (papers) => {
  if (!papers || papers.length === 0) {
    return [];
  }

  const currentDate = new Date();

  return papers.slice(0, 100).map(paper => {
    const pubDateObj = parsePublicationDate(paper);
    
    if (!pubDateObj || isNaN(pubDateObj.getTime())) {
      return { ...paper, category: null, citationVelocity: null, age: null };
    }

    const citationCount = typeof paper.citation_count === 'number' ? paper.citation_count : 0;
    const age = calculateAge(pubDateObj, currentDate);

    if (isNaN(age) || age < 0) {
      return { ...paper, category: null, citationVelocity: null, age: null };
    }

    let citationVelocity = null;
    if (age >= 0.5) {
      citationVelocity = citationCount / age;
    }
    let category = null;

    if (
      citationCount >= 5000 || 
      (age >= 10 && citationCount >= 1000) || 
      (age >= 5 && citationCount >= 2000) 
    ) {
      category = 'Foundational';
    }
 
    else if (
      age >= 1 && age <= 5 && 
      citationVelocity !== null &&
      (
        citationVelocity >= 200 || 
        (citationVelocity >= 50 && citationCount >= 100) || 
        (citationVelocity >= 20 && citationCount >= 200) 
      )
    ) {
      category = 'Trending';
    }
    
    else if (
      (age > 5 && citationCount >= 500) || 
      (age > 5 && citationVelocity !== null && citationVelocity >= 50) || 
      (citationCount >= 1000) 
    ) {
      category = 'Highly Cited';
    }
    
    else if (
      age >= 0.5 && age <= 3 && 
      (
        (citationCount >= 20 && citationVelocity >= 10) || 
        (citationCount >= 50) 
      )
    ) {
      category = 'Emerging';
    }
  
    else if (
      age >= 3 && 
      (
        citationCount >= 100 || 
        (citationVelocity !== null && citationVelocity >= 10)
      )
    ) {
      category = 'Established';
    }
    
    else if (age < 3) {
      category = 'Recent';
    }
    

    else {
      category = null;
    }

    if (age < 0.5) {
      category = 'Recent';
      citationVelocity = null;
    }

    return {
      ...paper,
      category,
      citationVelocity: citationVelocity !== null ? Math.round(citationVelocity * 10) / 10 : null,
      age: Math.round(age * 10) / 10,
    };
  });
};

export const sortPapersByCategory = (papers, category) => {
  const categorized = categorizePapers(papers);
  
  if (!category || category === 'all') {
   
    return categorized.sort((a, b) => {
      const scoreA = calculateRelevanceScore(a, a.age, a.citation_count || 0, new Date().getFullYear());
      const scoreB = calculateRelevanceScore(b, b.age, b.citation_count || 0, new Date().getFullYear());
      return scoreB - scoreA;
    });
  }
  
  return categorized
    .filter(p => p.category === category)
    .sort((a, b) => {
    
      if (['Foundational', 'Highly Cited', 'Established'].includes(category)) {
        return (b.citation_count || 0) - (a.citation_count || 0);
      }
      
      if (category === 'Trending') {
        return (b.citationVelocity || 0) - (a.citationVelocity || 0);
      }
      
      if (category === 'Emerging') {
        const velocityDiff = (b.citationVelocity || 0) - (a.citationVelocity || 0);
        if (Math.abs(velocityDiff) > 1) return velocityDiff;
        return (b.citation_count || 0) - (a.citation_count || 0);
      }
   
      if (category === 'Recent') {
        return (b.publication_year || 0) - (a.publication_year || 0);
      }
      
      return 0;
    });
};

export const getCategoryBadge = (category) => {
  switch (category) {
    case 'Foundational':
      return { label: 'Foundational', color: 'gold' };
    case 'Highly Cited':
      return { label: 'Highly Cited', color: 'purple' };
    case 'Trending':
      return { label: 'Trending', color: 'green' };
    case 'Emerging':
      return { label: 'Emerging', color: 'teal' };
    case 'Recent':
      return { label: 'Recent', color: 'blue' };
    case 'Established':
      return { label: 'Established', color: 'gray' };
    default:
      return null;
  }
};

export const getCategoryStats = (papers) => {
  const categorized = categorizePapers(papers);
  const stats = {
    total: categorized.length,
    Foundational: 0,
    Trending: 0,
    'Highly Cited': 0,
    Emerging: 0,
    Established: 0,
    Recent: 0,
    Uncategorized: 0,
  };
  
  categorized.forEach(paper => {
    if (paper.category) {
      stats[paper.category]++;
    } else {
      stats.Uncategorized++;
    }
  });
  
  return stats;
};