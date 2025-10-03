import React from 'react';

const CategoryBadge = ({ category}) => {
  const getBadgeStyle = () => {
    switch(category.color) {
      case 'gold':
        return { background: '#3a3a1a', color: '#ffd700', border: '1px solid #4a4a2a' };
      case 'green':
        return { background: '#1a2a1a', color: '#00ff88', border: '1px solid #2a3a2a' };
      case 'blue':
        return { background: '#1a1a2a', color: '#4d9fff', border: '1px solid #2a2a3a' };
      case 'purple':
        return { background: '#2a1a2a', color: '#b877ff', border: '1px solid #3a2a3a' };
      default:
        return { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' };
    }
  };


  return (
    <span className="category-badge" style={getBadgeStyle()}>
      {category.label}
    </span>
  )
};

export default CategoryBadge;