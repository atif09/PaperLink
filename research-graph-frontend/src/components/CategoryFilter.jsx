import React from 'react';
import {Sparkles, TrendingUp, Clock, Award, BookOpen, BarChart3} from 'lucide-react';

const CategoryFilter = ({ activeCategory, onCategoryChange }) => {
  const categories = [
    { id: 'all', label: 'All Papers', icon: null },
    { id: 'Foundational', label: 'Foundational', icon: Award },
    { id: 'Highly Cited', label: 'Highly Cited', icon: Sparkles },
    { id: 'Trending', label: 'Trending', icon: TrendingUp },
    { id: 'Emerging', label: 'Emerging', icon: BarChart3 },
    { id: 'Recent', label: 'Recent', icon: Clock },
    { id: 'Established', label: 'Established', icon: BookOpen },
    
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