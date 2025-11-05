import React, { useMemo } from 'react';
import { TrendingUp, Award, Calendar, BarChart3 } from 'lucide-react';
import { formatCitationCount } from '../utils/graphUtils';

const NetworkStats = ({ graphData, filters }) => {
  const stats = useMemo(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      return null;
    }

    let filteredNodes = graphData.nodes;

    if (filters) {
      if (filters.paperType === 'foundational') {
        filteredNodes = graphData.nodes.filter(n => n.type === 'referenced' || n.type === 'main');
      } else if (filters.paperType === 'influential') {
        filteredNodes = graphData.nodes.filter(n => n.type === 'citing' || n.type === 'main');
      }

      if (filters.minCitations > 0) {
        filteredNodes = filteredNodes.filter(n => (n.citation_count || 0) >= filters.minCitations);
      }
    }

    if (filteredNodes.length === 0) {
      return null;
    }

    const citations = filteredNodes.map(n => n.citation_count || 0);
    const years = filteredNodes.map(n => n.year || n.publication_year).filter(y => y);
    
    const mostCited = filteredNodes.reduce((max, node) => 
      (node.citation_count || 0) > (max.citation_count || 0) ? node : max
    );

    const totalCitations = citations.reduce((sum, c) => sum + c, 0);
    const avgCitations = Math.round(totalCitations / citations.length);

    const currentYear = new Date().getFullYear();
    const avgYear = years.length > 0 ? Math.round(years.reduce((sum, y) => sum + y, 0) / years.length) : currentYear;
    const avgAge = currentYear - avgYear;
    const citationVelocity = avgAge > 0 ? Math.round(avgCitations / avgAge) : avgCitations;

    const yearRange = years.length > 0 ? `${Math.min(...years)}-${Math.max(...years)}` : 'N/A';

    return {
      totalPapers: filteredNodes.length,
      mostCited,
      avgCitations,
      citationVelocity,
      yearRange
    };
  }, [graphData, filters]);

  if (!stats) {
    return null;
  }

  return (
    <div className="network-stats-panel">
      <div className="stats-header">
        <BarChart3 size={18} />
        <span>Network Analysis</span>
        <div className="paper-count">{stats.totalPapers} papers</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Award size={16} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Most Cited</div>
            <div className="stat-value">{stats.mostCited.title?.substring(0, 30)}...</div>
            <div className="stat-detail">{formatCitationCount(stats.mostCited.citation_count || 0)} citations</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={16} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Avg Citations</div>
            <div className="stat-value">{formatCitationCount(stats.avgCitations)}</div>
            <div className="stat-detail">per paper</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={16} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Citation Velocity</div>
            <div className="stat-value">{formatCitationCount(stats.citationVelocity)}/yr</div>
            <div className="stat-detail">average rate</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={16} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Year Range</div>
            <div className="stat-value">{stats.yearRange}</div>
            <div className="stat-detail">publication span</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkStats;