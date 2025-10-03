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

  const words = text.split(/\s+/);
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / Math.max(words.length, 1);

  if (avgWordLength > 6) score += 15;
  else if (avgWordLength > 5) score += 10;
  else score += 5;

  advancedTerms.forEach(term => {
    if (text.includes(term)) score += 8;
  });

  intermediateTerms.forEach(term => {
    if (text.includes(term)) score += 3;
  });

  const refCount = paper.referenced_works_count || 0;
  if (refCount > 50) score += 20;
  else if (refCount > 30) score += 15;
  else if (refCount > 15) score += 10;
  else score += 5;

  const abstractLength = (paper.abstract || '').length;
  if (abstractLength > 1500) score += 10;
  else if (abstractLength > 1000) score += 7;
  else if (abstractLength > 500) score += 4;

  return Math.min(score, 100);
};

export const getComplexityLevel = (score) => {
  if (score >= 60) {
    return {
      level: 'Advanced',
      color: 'red',
      description: 'Requires strong background in the field'
    };

  } else if (score >= 35) {
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