const calculateRelevanceScore = (paper, age, citations, currentYear) => {
  let score = 0;
  if (age <= 2) {
    score += 30;
  } else if (age <= 5) {
    score += 15;
  }
  score += Math.log10(Math.max(citations, 1)) * 20;
  const recentVelocity = paper.recentVelocity || 0;
  score += Math.min(recentVelocity, 100) * 0.3;
  if (paper.momentum === 'accelerating') {
    score += 20;
  } else if (paper.momentum === 'declining') {
    score -= 15;
  }
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

const getRecentCitations = (paper, yearsBack = 2) => {
  const currentYear = new Date().getFullYear();
  if (!paper.counts_by_year || paper.counts_by_year.length === 0) {
    return null;
  }
  return paper.counts_by_year
    .filter(cy => cy.year >= currentYear - yearsBack && cy.year <= currentYear)
    .reduce((sum, cy) => sum + (cy.cited_by_count || 0), 0);
};

const calculateMomentum = (paper) => {
  if (!paper.counts_by_year || paper.counts_by_year.length < 3) {
    return { momentum: 'unknown', acceleration: 0 };
  }
  const sorted = [...paper.counts_by_year]
    .filter(cy => cy.cited_by_count !== undefined && cy.cited_by_count !== null)
    .sort((a, b) => b.year - a.year);
  if (sorted.length < 3) {
    return { momentum: 'unknown', acceleration: 0 };
  }
  const recentYear = sorted[0]?.cited_by_count || 0;
  const oldYear = sorted[2]?.cited_by_count || 0;
  const acceleration = (recentYear - oldYear) / 2;
  let momentum;
  if (acceleration > 20) momentum = 'accelerating';
  else if (acceleration < -20) momentum = 'declining';
  else momentum = 'stable';
  return { momentum, acceleration };
};

export const categorizePapers = (papers) => {
  if (!papers || papers.length === 0) {
    return [];
  }
  const currentDate = new Date();
  return papers.slice(0, 100).map(paper => {
    const pubDateObj = parsePublicationDate(paper);
    if (!pubDateObj || isNaN(pubDateObj.getTime())) {
      return { ...paper, category: null, citationVelocity: null, recentVelocity: null, momentum: 'unknown', accelerationRate: 0, age: null };
    }
    const citationCount = typeof paper.citation_count === 'number' ? paper.citation_count : 0;
    const age = calculateAge(pubDateObj, currentDate);
    if (isNaN(age) || age < 0) {
      return { ...paper, category: null, citationVelocity: null, recentVelocity: null, momentum: 'unknown', accelerationRate: 0, age: null };
    }
    let citationVelocity = null;
    let recentVelocity = null;
    let momentumData = { momentum: 'unknown', acceleration: 0 };
    if (age >= 0.5) {
      citationVelocity = citationCount / age;
      const recentCitations = getRecentCitations(paper, 2);
      if (recentCitations !== null) {
        recentVelocity = recentCitations / Math.min(2, age);
      } else {
        recentVelocity = citationVelocity;
      }
      momentumData = calculateMomentum(paper);
    }
    const velocityToUse = recentVelocity || citationVelocity;
    let category = null;
    if (
      citationCount >= 5000 ||
      (age >= 15 && citationCount >= 1000) ||
      (age >= 10 && citationCount >= 2000 && recentVelocity >= 50) ||
      (age >= 5 && citationCount >= 3000 && recentVelocity >= 100)
    ) {
      category = 'Foundational';
    } else if (
      age >= 1 && age <= 5 &&
      velocityToUse !== null &&
      momentumData.momentum !== 'declining' &&
      (
        velocityToUse >= 200 ||
        (velocityToUse >= 100 && citationCount >= 200) ||
        (velocityToUse >= 50 && citationCount >= 300 && momentumData.momentum === 'accelerating')
      )
    ) {
      category = 'Trending';
    } else if (
      age >= 0.5 && age <= 3 &&
      momentumData.momentum === 'accelerating' &&
      (
        (citationCount >= 30 && velocityToUse >= 20) ||
        (citationCount >= 80 && velocityToUse >= 30) ||
        (citationCount >= 50 && momentumData.acceleration >= 15)
      )
    ) {
      category = 'Emerging';
    } else if (
      (age > 5 && age <= 15 && citationCount >= 500) ||
      (age > 15 && citationCount >= 300 && recentVelocity >= 20) ||
      (age > 5 && recentVelocity >= 50) ||
      (citationCount >= 1000 && citationCount < 5000)
    ) {
      category = 'Highly Cited';
    } else if (
      age >= 3 && age <= 10 &&
      momentumData.momentum !== 'accelerating' &&
      (
        (citationCount >= 100 && citationCount < 500) ||
        (velocityToUse >= 10 && velocityToUse < 50)
      )
    ) {
      category = 'Established';
    } else if (age < 2.5) {
      category = 'Recent';
    } else {
      category = null;
    }
    if (age < 0.5) {
      category = 'Recent';
      citationVelocity = null;
      recentVelocity = null;
      momentumData = { momentum: 'unknown', acceleration: 0 };
    }
    return {
      ...paper,
      category,
      citationVelocity: citationVelocity !== null ? Math.round(citationVelocity * 10) / 10 : null,
      recentVelocity: recentVelocity !== null ? Math.round(recentVelocity * 10) / 10 : null,
      momentum: momentumData.momentum,
      accelerationRate: Math.round(momentumData.acceleration * 10) / 10,
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
        return (b.recentVelocity || 0) - (a.recentVelocity || 0);
      }
      if (category === 'Emerging') {
        const accelDiff = (b.accelerationRate || 0) - (a.accelerationRate || 0);
        if (Math.abs(accelDiff) > 5) return accelDiff;
        return (b.recentVelocity || 0) - (a.recentVelocity || 0);
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