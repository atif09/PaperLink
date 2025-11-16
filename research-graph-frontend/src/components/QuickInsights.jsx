import React from 'react';
import { Lightbulb, TrendingUp, Database } from 'lucide-react';

const QuickInsights = ({ insights }) => {
  if (!insights) return null;

  const getMetricIcon = (type) => {
    switch(type) {
      case 'performance':
      case 'achievement':
      case 'improvement':
        return <TrendingUp size={14} />;
      case 'data':
        return <Database size={14} />;
      default:
        return <TrendingUp size={14} />;
    }
  };

  return (
    <div className="quick-insights">
      <div className="insights-header">
        <Lightbulb size={18} />
        <span>Paper Summary</span>
      </div>

      {insights.abstractExcerpt && (
        <div className="insights-section">
          <h4 className="insights-section-title">Abstract</h4>
          <p className="insight-text">{insights.abstractExcerpt}...</p>
        </div>
      )}
    </div>
  );
};

export default QuickInsights;
