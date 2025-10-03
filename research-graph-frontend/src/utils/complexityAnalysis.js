const advancedTerms = [
  'theorem', 'lemma', 'corollary', 'proposition', 'asymptotic', 'stochastic',
  'hierarchical', 'eigenvalue', 'manifold', 'topology', 'gaussian', 'bayesian',
  'convex', 'optimization', 'eigendecomposition', 'tensor', 'gradient descent',
  'regularization', 'backpropagation', 'adversarial', 'variational'
];

const intermediateTerms = [
  'analysis', 'framework', 'methodology', 'empirical', 'statistical',
  'algorithm', 'correlation', 'distribution', 'hypothesis', 'parameter',
  'evaluation', 'implementation', 'architecture', 'optimization', 'metric'
];

export const calculateComplexityScore = (paper) => {
  let score = 0;
  const abstract = (paper.abstract || '').toLowerCase();
  const title = (paper.title || '').toLowerCase();
  const text = `${abstract} ${title}`;
  
  if (text.length < 50) {
    return 40;
  }
  
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / Math.max(words.length, 1);
  
  if (avgWordLength > 6.5) score += 20;
  else if (avgWordLength > 5.5) score += 15;
  else score += 10;
  
  advancedTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) score += matches.length * 8;
  });
  
  intermediateTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) score += matches.length * 4;
  });
  
  const refCount = paper.referenced_works_count || 0;
  if (refCount > 50) score += 25;
  else if (refCount > 30) score += 18;
  else if (refCount > 15) score += 12;
  else if (refCount > 5) score += 8;
  
  const citationCount = paper.citation_count || 0;
  if (citationCount > 10000) score += 10;
  else if (citationCount > 1000) score += 5;
  
  return Math.min(score, 100);
};

export const getComplexityLevel = (score) => {
  if (score >= 50) {
    return {
      level: 'Advanced',
      color: 'red',
      description: 'Requires strong background in the field'
    };
  } else if (score >= 30) {
    return {
      level: 'Intermediate',
      color: 'yellow',
      description: 'Some background knowledge helpful'
    };
  } else {
    return {
      level: 'Beginner',
      color: 'green',
      description: 'Accessible to newcomers'
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