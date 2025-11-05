const advancedVenues = [
  'NeurIPS', 'ICML', 'ICCV', 'CVPR', 'ECCV', 'IJCAI', 'AAAI',
  'Nature', 'Science', 'Nature Machine Intelligence', 'IEEE TPAMI',
  'JMLR', 'ACM Transactions', 'SIAM', 'Annals of Statistics'
];

const intermediateVenues = [
  'ICLR', 'IJCNN', 'ESANN', 'Neurocomputing', 'Information Sciences',
  'IEEE Transactions', 'ACM Computing Surveys', 'Journal of Machine Learning'
];

const normalizeVenueName = (venue) => {
  if (!venue) return '';
  return venue.toLowerCase().trim();
};

export const getVenueComplexity = (venue) => {
  if (!venue) return 'Intermediate';
  
  const venueLower = normalizeVenueName(venue);

  if (advancedVenues.some(v => venueLower.includes(normalizeVenueName(v)))) {
    return 'Advanced';
  }
  
  if (intermediateVenues.some(v => venueLower.includes(normalizeVenueName(v)))) {
    return 'Intermediate';
  }

  if (venueLower.includes('arxiv') || venueLower.includes('preprint') || venueLower === '') {
    return 'Beginner';
  }
  
  return 'Intermediate';
};

export const calculateComplexityScore = (paper) => {
  const venue = paper.venue || '';
  const level = getVenueComplexity(venue);
  
  if (level === 'Advanced') return 70;
  if (level === 'Intermediate') return 40;
  return 20;
};

export const getComplexityLevel = (score) => {
  if (score >= 60) {
    return {
      level: 'Advanced',
      color: 'red',
      description: 'Published in top venues (NeurIPS, ICML, Nature, etc.)'
    };
  } else if (score >= 30) {
    return {
      level: 'Intermediate',
      color: 'yellow',
      description: 'Published in peer-reviewed venues'
    };
  } else {
    return {
      level: 'Beginner',
      color: 'green',
      description: 'Preprint or emerging venue'
    };
  }
};

export const analyzeComplexity = (paper) => {
  const score = calculateComplexityScore(paper);
  const complexity = getComplexityLevel(score);

  return {
    ...paper,
    complexityScore: score,
    complexityLevel: complexity.level,
    complexityColor: complexity.color,
    complexityDescription: complexity.description
  };
};

export const filterByComplexity = (papers, level) => {
  return papers.filter(paper => {
    const analyzed = analyzeComplexity(paper);
    return analyzed.complexityLevel === level;
  });
};