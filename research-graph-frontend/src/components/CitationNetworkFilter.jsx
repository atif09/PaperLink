import React from 'react';
import { Filter } from 'lucide-react';

const CitationNetworkFilter = ({ filters, onFilterChange }) => {
  return (
    <div className="citation-network-filter">
      <div className="filter-header">
        <Filter size={16} />
        <span>Network Filter</span>
      </div>

      <div className="filter-section">
        <label className="filter-label">Paper Type</label>
        <div className="filter-radio-group">
          <label className="radio-option">
            <input
              type="radio"
              name="paperType"
              value="all"
              checked={filters.paperType === 'all'}
              onChange={(e) => onFilterChange('paperType', e.target.value)}
            />
            <span>All Papers</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="paperType"
              value="foundational"
              checked={filters.paperType === 'foundational'}
              onChange={(e) => onFilterChange('paperType', e.target.value)}
            />
            <span>Foundational Only</span>
          </label>
          <label className="radio-option">
            <input
              type="radio"
              name="paperType"
              value="influential"
              checked={filters.paperType === 'influential'}
              onChange={(e) => onFilterChange('paperType', e.target.value)}
            />
            <span>Influential Only</span>
          </label>
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">
          Min Citations: {filters.minCitations}
        </label>
        <input
          type="range"
          min="0"
          max="50000"
          step="1000"
          value={filters.minCitations}
          onChange={(e) => onFilterChange('minCitations', parseInt(e.target.value))}
          className="citation-slider"
        />
      </div>
    </div>
  );
};

export default CitationNetworkFilter;