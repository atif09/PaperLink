import React from 'react';
import { Filter, X} from 'lucid-react';

const FilterPanel = ({ filters, onFilterChange, onReset }) => {
  return (
    <div className="filter-panel">
      <div className="filter-header">
        <Filter size={18} />
        <span>Filters</span>
        <button onClick={onReset} className="filter-reset">
          <X size={16} />
        </button>
      </div>
      
      <div className="filter-group">
        <label>Year Range</label>
        <div className="filter-row">
          <input
            type="number"
            placeholder="Min"
            value={filters.year_min || ''}
            onChange={(e) => onFilterChange('year_min', e.target.value)}
            className="filter-input"
          />
          <span className="filter-separator">—</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.year_max || ''}
            onChange={(e) => onFilterChange('year_max', e.target.value)}
            className="filter-input"
          />
        </div>
      </div>
      
      <div className="filter-group">
        <label>Min Citations</label>
        <input
          type="number"
          placeholder="0"
          value={filters.min_citations || ''}
          onChange={(e) => onFilterChange('min_citations', e.target.value)}
          className="filter-input"
        />
      </div>
      
      <div className="filter-group">
        <label>Results Per Page</label>
        <select
          value={filters.per_page || 20}
          onChange={(e) => onFilterChange('per_page', e.target.value)}
          className="filter-select"
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>
    </div>
  );
};

export default FilterPanel;