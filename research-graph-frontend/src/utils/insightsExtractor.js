const metricPatterns = [
  { pattern: /(\d+\.?\d*)\s*%\s*(accuracy|precision|recall|f1|improvement)/gi, type: 'performance' },
  { pattern: /(\d+\.?\d*)\s*times?\s*(faster|slower|better|worse)/gi, type: 'comparison' },
  { pattern: /dataset\s*(?:of|with|containing)?\s*(\d+[,\d]*)\s*(?:samples|images|examples|instances)/gi, type: 'data' },
  { pattern: /(\d+\.?\d*)\s*(?:billion|million|thousand)\s*parameters/gi, type: 'model_size' },
  { pattern: /(?:outperform|beat|exceed|surpass).*?by\s*(\d+\.?\d*)\s*%/gi, type: 'improvement' },
  { pattern: /(?:achieve|达到|reach).*?(\d+\.?\d*)\s*%/gi, type: 'achievement' }
];

const contributionKeywords = [
  'we propose', 'we present', 'we introduce', 'we develop', 'we show',
  'this paper', 'our method', 'our approach', 'our model', 'our framework',
  'novel', 'new', 'first', 'state-of-the-art', 'sota'
];

const problemKeywords = [
  'problem', 'challenge', 'issue', 'limitation', 'difficulty',
  'lack of', 'cannot', 'unable to', 'fails to'
];

export const extractQuickInsights = (paper) => {
  const abstract = paper.abstract || '';
  const title = paper.title || '';
  const fullText = `${title} ${abstract}`;

  if (!abstract || abstract.length < 50) {
    return null;
  }

  const insights = {
    metrics: [],
    mainContribution: null,
    problemSolved: null,
    keyFindings: []
  };

  metricPatterns.forEach(({pattern,type}) => {
    const matches = [...fullText.matchAll(pattern)];
    matches.forEach(match => {
      insights.metrics.push({
        type,
        value: match[0],
        fullMatch: match[0]
      });
    });
  });

  const sentences = abstract.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);


  const contributionSentence = sentences.find(sentence => 
    contributionKeywords.some(keyword => 
      sentence.toLowerCase().includes(keyword)
    )
  );

  if (contributionSentence) {
    insights.mainContribution = contributionSentence.substring(0, 150) + (contributionSentence.length > 150 ? '...' : '');
  }

  const problemSentence = sentences.find(sentence => 
    problemKeywords.some(keyword => 
      sentence.toLowerCase().includes(keyword)
    )
  );

  if (problemSentence) {
    insights.problemSolved = problemSentence.substring(0, 150) + (problemSentence.length > 150 ? '...' : '');
  }

  const resultKeywords = ['results show', 'experiments demonstrate', 'we find', 'findings', 'achieves', 'outperforms'];
  const findingSentences = sentences.filter(sentence => 
    resultKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
  );

  insights.keyFindings = findingSentences.slice(0, 2).map(s =>
    s.substring(0, 150) + (s.length > 150 ? '...' : '')
  );

  return insights;
};

export const hasInsights = (insights) => {
  if (!insights) return false;
  return insights.metrics.length > 0 ||
        insights.mainContribution || 
        insights.problemSolved || 
        insights.keyFindings.length > 0;
  
}