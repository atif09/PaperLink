import React from 'react';
import {Sparkles, TrendingUp, Clock, Award} from 'lucide-react';

const CategoryFilter = ({ activeCategory, onCategoryChange }) => {
  const categories = [
    { id: 'all', label: 'All Papers', icon: null },
    { id: 'foundational', label: 'Foundational', icon: Award },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'highly-cited', label: 'Highly Cited', icon: Sparkles },
  ];

  return (
    <div className="category-filter">
      {categories.map(category => {
        const Icon = category.icon;
        return (
          <button
            key={category.id}
            className={`category-filter-btn ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => onCategoryChange(category.id)}
          >
            {Icon && <Icon size={16} />}
            {category.label}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;