import React, { useMemo, useState } from 'react';
import { TrendingUp, Award, Calendar, BarChart3 } from 'lucide-react';
import { formatCitationCount } from '../utils/graphUtils';

const NetworkStats = ({ graphData, filters }) => {
  const [isHovered, setIsHovered] = useState(false);

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

    const currentDate = new Date();
    const velocities = filteredNodes
      .map(n => {
       
        let pubDate;
        if (n.publicationDate) {
          pubDate = n.publicationDate instanceof Date ? n.publicationDate : new Date(n.publicationDate);
        } else if (n.year || n.publication_year) {
          const year = n.year || n.publication_year;
          pubDate = new Date(year, 5, 30); 
        } else {
          return null; 
        }

        const ageMs = currentDate - pubDate;
        const age = ageMs / (1000 * 60 * 60 * 24 * 365.25);

        
        if (age < 0.5 || isNaN(age) || age < 0) {
          return null;
        }

        return (n.citation_count || 0) / age;
      })
      .filter(v => v !== null); 

    const citationVelocity = velocities.length > 0 
      ? Math.round(velocities.reduce((sum, v) => sum + v, 0) / velocities.length) 
      : 0;

    const yearRange = years.length > 0 ? `${Math.min(...years)}-${Math.max(...years)}` : 'N/A';

    return {
      totalPapers: filteredNodes.length,
      mostCited,
      avgCitations,
      citationVelocity,
      yearRange,
      papersWithVelocity: velocities.length 
    };
  }, [graphData, filters]);

  if (!stats) {
    return null;
  }

  return (
    <div 
      className="network-stats-dropdown"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="stats-dropdown-header">
        <BarChart3 size={18} />
        <span>Network Analysis</span>
        <div className="paper-count">{stats.totalPapers} papers</div>
      </div>

      {isHovered && (
        <div className="stats-dropdown-content">
          <div className="stats-grid-horizontal">
            <div className="stat-card-compact">
              <div className="stat-icon-small">
                <TrendingUp size={14} />
              </div>
              <div className="stat-content-compact">
                <div className="stat-label-small">Avg Citations</div>
                <div className="stat-value-small">{formatCitationCount(stats.avgCitations)}</div>
              </div>
            </div>

            <div className="stat-card-compact">
              <div className="stat-icon-small">
                <TrendingUp size={14} />
              </div>
              <div className="stat-content-compact">
                <div className="stat-label-small">Velocity</div>
                <div className="stat-value-small">{formatCitationCount(stats.citationVelocity)}/yr</div>
              </div>
            </div>

            <div className="stat-card-compact">
              <div className="stat-icon-small">
                <Calendar size={14} />
              </div>
              <div className="stat-content-compact">
                <div className="stat-label-small">Year Range</div>
                <div className="stat-value-small">{stats.yearRange}</div>
              </div>
            </div>
          </div>

          <div className="stat-card-full">
            <div className="stat-icon-small">
              <Award size={14} />
            </div>
            <div className="stat-content-compact">
              <div className="stat-label-small">Most Cited Paper</div>
              <div className="stat-value-small">{stats.mostCited.title?.substring(0, 35)}...</div>
              <div className="stat-detail-small">{formatCitationCount(stats.mostCited.citation_count || 0)} citations</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkStats;