const metricPatterns = [
  { pattern: /(\d+\.?\d*)\s*%\s*(accuracy|precision|recall|f1|improvement)/gi, type: 'performance' },
  { pattern: /(\d+\.?\d*)\s*times?\s*(faster|slower|better|worse)/gi, type: 'comparison' },
  { pattern: /dataset\s*(?:of|with|containing)?\s*(\d+[,\d]*)\s*(?:samples|images|examples|instances)/gi, type: 'data' },
  { pattern: /(\d+\.?\d*)\s*(?:billion|million|thousand)\s*parameters/gi, type: 'model_size' },
  { pattern: /(?:outperform|beat|exceed|surpass).*?by\s*(\d+\.?\d*)\s*%/gi, type: 'improvement' },
  { pattern: /(?:achieve|達到|reach).*?(\d+\.?\d*)\s*%/gi, type: 'achievement' }
];

const negationKeywords = ['not', 'no', 'none', 'neither', 'cannot', 'fails', 'unable'];
const contextualNegations = ['only', 'just', 'merely', 'reduced from', 'decrease'];

const isInNegativeContext = (text, metricIndex) => {
  const windowSize = 30;
  const start = Math.max(0, metricIndex - windowSize);
  const end = Math.min(text.length, metricIndex + windowSize);
  const contextWindow = text.substring(start, end).toLowerCase();
  
  return negationKeywords.some(keyword => contextWindow.includes(keyword)) ||
         contextualNegations.some(keyword => contextWindow.includes(keyword));
};

const isRelatedToMethod = (text, metricIndex, metric) => {
  const methodKeywords = ['propose', 'method', 'approach', 'algorithm', 'framework', 'model', 'system', 'technique'];
  const windowSize = 100;
  const start = Math.max(0, metricIndex - windowSize);
  const end = Math.min(text.length, metricIndex + windowSize);
  const contextWindow = text.substring(start, end).toLowerCase();
  
  return methodKeywords.some(keyword => contextWindow.includes(keyword));
};

const validatePerformanceMetric = (text, metricIndex, metric) => {
  if (isInNegativeContext(text, metricIndex)) return false;
  if (!isRelatedToMethod(text, metricIndex, metric)) return false;
  return true;
};

export const extractQuickInsights = (paper) => {
  const abstract = paper.abstract || '';
  if (!abstract) {
    return {
      metrics: [],
      abstractExcerpt: '',
      keyFindings: []
    };
  }

  const metrics = [];
  const seen = new Set();

  for (const metricPattern of metricPatterns) {
    let match;
    while ((match = metricPattern.pattern.exec(abstract)) !== null) {
      const fullMatch = match[0];
      const matchIndex = match.index;

      if (!seen.has(fullMatch) && validatePerformanceMetric(abstract, matchIndex, fullMatch)) {
        seen.add(fullMatch);
        metrics.push({
          fullMatch: fullMatch.trim(),
          type: metricPattern.type,
          value: match[1]
        });

        if (metrics.length >= 3) break;
      }
    }
    if (metrics.length >= 3) break;
  }

  const abstractExcerpt = abstract.substring(0, 300);

  const sentencePattern = /[^.!?]*[.!?]+(?!\d)/g;
  const sentences = abstract.match(sentencePattern) || [];
  const keyFindings = sentences
    .slice(2, 5)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  return {
    metrics: metrics,
    abstractExcerpt: abstractExcerpt,
    keyFindings: keyFindings
  };
};

export const hasInsights = (insights) => {
  return insights && (
    (insights.metrics && insights.metrics.length > 0) ||
    (insights.abstractExcerpt && insights.abstractExcerpt.length > 0) ||
    (insights.keyFindings && insights.keyFindings.length > 0)
  );
};