import React, { useState, useCallback } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import PaperCard from './components/PaperCard';
import GraphVisualization from './components/GraphVisualization';
import PaperDetails from './components/PaperDetails';
import FilterPanel from './components/FilterPanel';
import StatsPanel from './components/StatsPanel';
import CategoryFilter from './components/CategoryFilter';
import { categorizePapers, sortPaperByCategory } from './utils/paperCategorization';
import { searchPapers, getPaperDetails, getCitationGraph } from './services/api';
import { processGraphData } from './utils/graphUtils';
import { Network } from 'lucide-react';


function App() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [categorizedResults, setCategorizedResults] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [detailsPaper, setDetailsPaper] = useState(null);
  const [filters, setFilters] = useState({
    year_min: '',
    year_max: '',
    min_citations: '',
    per_page: 20,
  });

  const [stats, setStats] = useState(null);
  const [view, setView] = useState('search');

  const handleSearch = useCallback(async (query) => {
    setIsSearching(true);

    try{
      const data = await searchPapers(query, filters);
      const results = data.results || [];
      const categorized = categorizePapers(results);
      setSearchResults(categorized);
      setCategorizedResults(categorized);
      setView('search');
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      setCategorizedResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [filters]);

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    if (category === 'all') {
      setSearchResults(categorizedResults);
    } else {
      const sorted = sortPaperByCategory(categorizedResults, category);
      setSearchResults(sorted);
    }
  };

  const handlePaperClick = async (paper) => {
    setSelectedPaper(paper);
    setIsLoadingGraph(true);
    setView('graph');

    try {
      const details = await getPaperDetails(paper.id);
      const graphResponse = await getCitationGraph(paper.id, 1);

      const processed = processGraphData(graphResponse.graph)
      setGraphData(processed);

      calculateStats(processed);
    } catch (error) {
      console.error('Failed to load graph:', error);
    } finally {
      setIsLoadingGraph(false);
    }
  };

  const handleNodeClick = async (node) => {
    try {
      const details = await getPaperDetails(node.id);
      setDetailsPaper(details.paper);
    } catch (error) {
      console.error('Failed to load paper details:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,

    }));
  };

  const handleResetFilters = () => {
    setFilters({
      year_min: '',
      year_max: '',
      min_citations: '',
      per_page: 20,
    });
  };

  const calculateStats = (data) => {
    if (!data || !data.nodes) return;

    const citations = data.nodes.map(n => n.citation_count || 0);
    const years = data.nodes.map(n => n.publication_year).filter(y => y);

    setStats({
      totalPapers: data.nodes.length,
      totalConnections: data.edges.length,
      avgCitations: Math.round(citations.reduce((a, b) => a + b, 0) / citations.length),
      yearRange: years.length > 0 ? `${Math.min(...years)}–${Math.max(...years)}` : 'N/A',
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <Network size={32} />
            <span>PaperLink</span>
          </div>
          
          <nav className="nav-tabs">
            <button 
              className={`nav-tab ${view === 'search' ? 'active' : ''}`}
              onClick={() => setView('search')}
            >
              Search
            </button>
            <button 
              className={`nav-tab ${view === 'graph' ? 'active' : ''}`}
              onClick={() => setView('graph')}
              disabled={!graphData}
            >
              Graph
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {view === 'search' && (
          <div className="search-view">
            <div className="search-sidebar">
              <SearchBar onSearch={handleSearch} isLoading={isSearching} />
              <FilterPanel 
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
              />
            </div>

            <div className="search-results-container">
              {searchResults.length > 0 && (
                <CategoryFilter 
                  activeCategory={activeCategory}
                  onCategoryChange={handleCategoryChange}
                />
              )}
              
              <div className="search-results">
                {searchResults.length === 0 && !isSearching && (
                  <div className="empty-state">
                    <Network size={64} />
                    <h2>Discover Research Networks</h2>
                    <p>Search for papers to visualize citation relationships</p>
                  </div>
                )}

                {searchResults.map(paper => (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    onClick={handlePaperClick}
                    isSelected={selectedPaper?.id === paper.id}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {view === 'graph' && (
          <div className="graph-view">
            {isLoadingGraph ? (
              <div className="loading-state">
                <div className="loader" />
                <p>Building citation network...</p>
              </div>
            ) : graphData ? (
              <>
                <StatsPanel stats={stats} />
                <GraphVisualization
                  graphData={graphData}
                  onNodeClick={handleNodeClick}
                  selectedNodeId={detailsPaper?.id}
                />
              </>
            ) : (
              <div className="empty-state">
                <Network size={64} />
                <h2>No Graph Data</h2>
                <p>Select a paper to visualize its citation network</p>
              </div>
            )}
          </div>
        )}
      </main>

      {detailsPaper && (
        <PaperDetails
          paper={detailsPaper}
          onClose={() => setDetailsPaper(null)}
        />
      )}
    </div>
  );
}

export default App;

