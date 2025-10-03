import React from 'react';
import {Brain} from 'lucide-react';

const ComplexityBadge = ({ complexity, showDescription = false }) => {
  const getBadgeStyle = () => {
    switch(complexity.color) {
      case 'green':
        return { background: '#1a2a1a', color: '#00ff88', border: '1px solid #2a3a2a' };
      case 'yellow':
        return { background: '#2a2a1a', color: '#ffd700', border: '1px solid #3a3a2a' };
      case 'red':
        return { background: '#2a1a1a', color: '#ff6b6b', border: '1px solid #3a2a2a' };
      default:
        return { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' };
    }
  };

  return (
    <div className="complexity-badge-container">
      <span className="complexity-badge" style={getBadgeStyle()}>
        <Brain size={12} />
        {complexity.level}
      </span>
      {showDescription && (
        <span className="complexity-description">{complexity.description}</span>
      )}
    </div>
  );
};

export default ComplexityBadge;