import React from 'react';
import { BookMarked, ArrowRight, Info } from 'lucide-react';
import { truncateText, formatCitationCount } from '../utils/graphUtils';

const ReadingPath = ({ readingPath, onPaperClick }) => {
  if (!readingPath || readingPath.prerequisites.length === 0) {
    return null;
  }

  return (
    <div className="reading-path-container">
      <div className="reading-path-header">
        <BookMarked size={20} />
        <h3>Recommended Reading Path</h3>
        <div className="info-tooltip">
          <Info size={16} />
          <span className="tooltip-text">Start with these foundational papers to better understand the main paper</span>
        </div>
      </div>

      <div className="reading-path-steps">
        {readingPath.prerequisites.map((paper, index) => (
          <React.Fragment key={paper.id}>
            <div 
              className="reading-path-item prerequisite"
              onClick={() => onPaperClick(paper)}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-content">
                <h4 className="step-title">{truncateText(paper.title, 60)}</h4>
                <div className="step-meta">
                  <span className="step-year">{paper.publication_year}</span>
                  <span className="step-citations">{formatCitationCount(paper.citation_count || 0)} citations</span>
                  {paper.citedByInNetwork > 1 && (
                    <span className="step-badge">Cited by {paper.citedByInNetwork} papers in network</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="path-arrow">
              <ArrowRight size={20} />
            </div>
          </React.Fragment>
        ))}

        <div className="reading-path-item target">
          <div className="step-number">
            <BookMarked size={16} />
          </div>
          <div className="step-content">
            <h4 className="step-title">{truncateText(readingPath.path[readingPath.path.length - 1].title, 60)}</h4>
            <div className="step-meta">
              <span className="target-label">Target Paper</span>
            </div>
          </div>
        </div>
      </div>

      {readingPath.totalReferences > 3 && (
        <div className="reading-path-footer">
          This paper references {readingPath.totalReferences} papers total. Showing top 3 prerequisites.
        </div>
      )}
    </div>
  );
};

export default ReadingPath;
