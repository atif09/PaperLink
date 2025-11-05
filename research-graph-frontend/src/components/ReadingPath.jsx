import React from 'react';
import { BookMarked, ArrowRight, Info } from 'lucide-react';
import { truncateText, formatCitationCount } from '../utils/graphUtils';

const RelatedPapersPanel = ({ readingPath, onPaperClick }) => {
  if (!readingPath || (readingPath.foundational?.length === 0 && readingPath.buildingOn?.length === 0)) {
    return null;
  }

  return (
    <div className="reading-path-container">
      <div className="reading-path-header">
        <BookMarked size={20} />
        <h3>Related Papers</h3>
        <div className="info-tooltip">
          <Info size={16} />
          <span className="tooltip-text">
            Foundational: Papers this work cites | Building On: Papers that cite this work
          </span>
        </div>
      </div>

      {readingPath.foundational && readingPath.foundational.length > 0 && (
        <div className="reading-path-section">
          <h4 className="section-title">Foundations (Papers This Work Cites)</h4>
          <div className="reading-path-steps">
            {readingPath.foundational.map((paper, index) => (
              <React.Fragment key={paper.id}>
                <div 
                  className="reading-path-item foundational"
                  onClick={() => onPaperClick(paper)}
                >
                  <div className="step-number">{index + 1}</div>
                  <div className="step-content">
                    <h4 className="step-title">{truncateText(paper.title, 60)}</h4>
                    <div className="step-meta">
                      <span className="step-year">{paper.publication_year}</span>
                      <span className="step-citations">{formatCitationCount(paper.citation_count || 0)} citations</span>
                    </div>
                  </div>
                </div>
                {index < readingPath.foundational.length - 1 && (
                  <div className="path-arrow">
                    <ArrowRight size={20} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {readingPath.buildingOn && readingPath.buildingOn.length > 0 && (
        <div className="reading-path-section">
          <h4 className="section-title">Building On This Work ({readingPath.buildingOn.length} papers)</h4>
          <div className="reading-path-steps">
            {readingPath.buildingOn.map((paper, index) => (
              <React.Fragment key={paper.id}>
                <div 
                  className="reading-path-item building-on"
                  onClick={() => onPaperClick(paper)}
                >
                  <div className="step-number">{index + 1}</div>
                  <div className="step-content">
                    <h4 className="step-title">{truncateText(paper.title, 60)}</h4>
                    <div className="step-meta">
                      <span className="step-year">{paper.publication_year}</span>
                      <span className="step-citations">{formatCitationCount(paper.citation_count || 0)} citations</span>
                    </div>
                  </div>
                </div>
                {index < readingPath.buildingOn.length - 1 && (
                  <div className="path-arrow">
                    <ArrowRight size={20} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="reading-path-disclaimer">
        <Info size={14} />
        <span>Algorithmic suggestion based on citation graph. Not verified by experts.</span>
      </div>

      {readingPath.totalReferences && readingPath.totalReferences > 5 && (
        <div className="reading-path-footer">
          This paper references {readingPath.totalReferences} papers total. Showing top 5.
        </div>
      )}
    </div>
  );
};

export default RelatedPapersPanel;
