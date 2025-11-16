import React, { useState, useCallback } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import PaperCard from './components/PaperCard';
import GraphVisualization from './components/GraphVisualization';
import PaperDetails from './components/PaperDetails';
import FilterPanel from './components/FilterPanel';


import ReadingPath from './components/ReadingPath';
import LibrarySidebar from './components/LibrarySidebar';
import CitationNetworkFilter from './components/CitationNetworkFilter';
import NetworkStats from './components/NetworkStats';

import CategoryFilter from './components/CategoryFilter';
import { generateRelatedPapers } from './utils/readingPath';
import { categorizePapers, sortPapersByCategory } from './utils/paperCategorization';
import { searchPapers, getPaperDetails, getCitationGraph } from './services/api';
import { processGraphData } from './utils/graphUtils';
import { Network, Library } from 'lucide-react';


function App() {
  const [showLibrary, setShowLibrary] = useState(false);
  const [readingPath, setReadingPath] = useState(null);
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


  const [graphFilters, setGraphFilters] = useState({
    paperType: 'all',
    minCitations: 0
  });

  const[stats, setStats] = useState({
    totalPapers: 0,
    totalConnections:0,
    avgCitations:0,
    yearRange:'N/A'
  })

 
  const [view, setView] = useState('search');

  const handleSearch = useCallback(async (query) => {
    setIsSearching(true);
    try {
      const data = await searchPapers(query, filters);
      const results = data.results || [];
      const categorized = categorizePapers(results);
      setSearchResults(categorized);
      setCategorizedResults(categorized);
      setActiveCategory('all');
      setView('search');
    } catch (error) {
      console.error('Search failed:', error);
      try {
        console.log('Attempting fallback search with "neural"...');
        const fallbackData = await searchPapers('neural', { per_page: 10 });
        const fallbackResults = fallbackData.results || [];
        if (fallbackResults.length > 0) {
          const categorized = categorizePapers(fallbackResults);
          setSearchResults(categorized);
          setCategorizedResults(categorized);
          setActiveCategory('all');
          console.log('Fallback search successful');
        } else {
          setSearchResults([]);
          setCategorizedResults([]);
        }
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
        setSearchResults([]);
        setCategorizedResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  }, [filters]);


  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    let results = categorizedResults;

    if (category !== 'all') {
      results = sortPapersByCategory(results, category);
    }
    
    setSearchResults(results);
  };

  const handlePaperClick = async (paper) => {
    setSelectedPaper(paper);
    setIsLoadingGraph(true);
    setView('graph');
    setGraphFilters({ paperType: 'all', minCitations: 0 });

    try {
      
      const graphResponse = await getCitationGraph(paper.id, 1);

      const processed = processGraphData(graphResponse.graph);
      setGraphData(processed);

      const relatedPapers = generateRelatedPapers(paper, processed);
      setReadingPath(relatedPapers);

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

  const handleGraphFilterChange = (key, value) => {
    setGraphFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const calculateStats = (data) => {
    if (!data || !data.nodes) return;

    const citations = data.nodes.map(n => n.citation_count || 0);
    const years = data.nodes.map(n => n.publication_year).filter(y => y);

    setStats({
      totalPapers: data.nodes.length,
      totalConnections: data.edges.length,
      avgCitations: Math.round(citations.reduce((a, b) => a + b, 0) / citations.length),
      yearRange: years.length > 0 ? `${Math.min(...years)}—${Math.max(...years)}` : 'N/A',
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
            <button
              className="nav-tab library-btn"
              onClick={() => setShowLibrary(true)}>
                <Library size={18}/>
                Library
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
              {categorizedResults.length > 0 && (
                <CategoryFilter 
                  activeCategory={activeCategory}
                  onCategoryChange={handleCategoryChange}
                />
              )}
              
              <div className="search-results">
                {searchResults.length === 0 && !isSearching ? (
                  <div className="empty-state">
                    <Network size={64} />
                    <h2>
                      {activeCategory === 'all'
                      ? 'Discover Research Networks'
                      : 'No papers found in this category'}
                    </h2>
                    <p>
                      {activeCategory === 'all'
                      ? 'Search for papers to visualize citation relationships'
                      : 'Try another category or search term.'}
                    </p>
                  </div>
                ) : (
                  searchResults.map(paper => (
                    <PaperCard
                      key={paper.id}
                      paper={paper}
                      onClick={handlePaperClick}
                      isSelected={selectedPaper?.id === paper.id}
                    />
                  ))
                )}
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
           
              
              {readingPath && (readingPath.foundational?.length > 0 || readingPath.buildingOn?.length > 0) && (
                <ReadingPath 
                  readingPath={readingPath}
                  onPaperClick={handleNodeClick}
                />
              )}
              
              <CitationNetworkFilter 
                filters={graphFilters}
                onFilterChange={handleGraphFilterChange}
              />

              <NetworkStats 
                graphData={graphData}
                filters={graphFilters}
              />
              
              <GraphVisualization
                graphData={graphData}
                onNodeClick={handleNodeClick}
                selectedNodeId={detailsPaper?.id}
                filters={graphFilters}
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

      <LibrarySidebar
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onPaperClick={handlePaperClick}
        />
    </div>
  );
}

export default App;

