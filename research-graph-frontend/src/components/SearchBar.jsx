import React, {useState} from 'react';
import {Search, X} from 'lucide-react';
import {useDebounce} from '../hooks/useDebounce';

const SearchBar = ({onSearch, isLoading}) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 100);

  React.useEffect(() => {
    if (debouncedQuery.trim().length > 2) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="search-bar-container">
      <div className="search-bar">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Search research papers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        {query && (
          <button onClick={handleClear} className="clear-button">
            <X size={18} />
          </button>
        )}
      </div>
      {isLoading && <div className="search-loading">Searching...</div>}
    </div>
  );
};

export default SearchBar;
