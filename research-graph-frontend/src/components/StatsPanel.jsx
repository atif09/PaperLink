import React from 'react';
import {fileText, GitBranch, TrendingUp, Calendar } from 'lucide-react';

const StatsPanel = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="stats-panel">
      <div className="stat-item">
        <FileText size={20} />
        <div className="stat-content">
          <span className="stat-value">{stats.totalPapers || 0}</span>
          <span className="stat-label">Papers</span>
        </div>
      </div>
      
      <div className="stat-item">
        <GitBranch size={20} />
        <div className="stat-content">
          <span className="stat-value">{stats.totalConnections || 0}</span>
          <span className="stat-label">Connections</span>
        </div>
      </div>
      
      <div className="stat-item">
        <TrendingUp size={20} />
        <div className="stat-content">
          <span className="stat-value">{stats.avgCitations || 0}</span>
          <span className="stat-label">Avg Citations</span>
        </div>
      </div>
      
      <div className="stat-item">
        <Calendar size={20} />
        <div className="stat-content">
          <span className="stat-value">{stats.yearRange || 'N/A'}</span>
          <span className="stat-label">Year Range</span>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;