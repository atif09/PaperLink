import React from 'react';
import {Brain} from 'lucide-react';

const ComplexityFilter = ({ activeComplexity, onComplexityChange, counts }) => {
  const complexityLevels = [
    { id: 'all', label: 'All Levels', color: null },
    { id: 'Beginner', label: 'Beginner', color: 'green' },
    {id: 'Intermediate', label: 'Intermediate', color: 'yellow' },
    { id: 'Advanced', label: 'Advanced', color: 'red' },
  ];

  const getButtonStyle = (color) => {
    if (!color) return {};

    const styles = {
      green: { borderColor: '#2a3a2a' },
      yellow: { borderColor: '#3a3a2a' },
      red: { borderColor: '#3a2a2a' }
    };

    return styles[color] || {};
  };

  const getActiveStyle = (color) => {
    if (!color) return {};

    const styles = {
      green: { background: '#1a2a1a', color: '#00ff88', borderColor: '#00ff88' },
      yellow: { background: '#2a2a1a', color: '#ffd700', borderColor: '#ffd700' },
      red: { background: '#2a1a1a', color: '#ff6b6b', borderColor: '#ff6b6b' },
    };
    
    return styles[color] || {};
  };

  return (
    <div className="complexity-filter">
      <div className="complexity-filter-header">
        <Brain size={16} />
        <span>Difficulty Level</span>
      </div>
      <div className="complexity-filter-buttons">
        {complexityLevels.map(level => {
          const isActive = activeComplexity === level.id;
          const count = counts?.[level.id] || 0;
          
          return (
            <button
              key={level.id}
              className={`complexity-filter-btn ${isActive ? 'active' : ''}`}
              onClick={() => onComplexityChange(level.id)}
              style={isActive ? getActiveStyle(level.color) : getButtonStyle(level.color)}
            >
              {level.label}
              {level.id !== 'all' && count > 0 && (
                <span className="filter-count">({count})</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ComplexityFilter;
