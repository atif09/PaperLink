import React from 'react';
import { Lightbulb, Target, TrendingUp, Database} from 'lucide-react';

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
        <span>Quick Insights</span>
      </div>

      {insights.metrics.length > 0 && (
        <div className="insights-section">
          <h4 className="insights-section-title">Key Metrics</h4>
          <div className="metrics-grid">
            {insights.metrics.slice(0, 4).map((metric, idx) => (
              <div key={idx} className="metric-item">
                {getMetricIcon(metric.type)}
                <span>{metric.fullMatch}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {insights.problemSolved && (
        <div className="insights-section">
          <h4 className="insights-section-title">
            <Target size={14} />
            Problem Addressed
          </h4>
          <p className="insight-text">{insights.problemSolved}</p>
        </div>
      )}

      {insights.mainContribution && (
        <div className="insights-section">
          <h4 className="insights-section-title">
            <Lightbulb size={14} />
            Main Contribution
          </h4>
          <p className="insight-text">{insights.mainContribution}</p>
        </div>
      )}

      {insights.keyFindings.length > 0 && (
        <div className="insights-section">
          <h4 className="insights-section-title">Key Findings</h4>
          <ul className="findings-list">
            {insights.keyFindings.map((finding, idx) => (
              <li key={idx}>{finding}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default QuickInsights;
