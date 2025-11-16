import React from 'react';
// import QuickInsights from './QuickInsights';
import { X, ExternalLink, Users, Calendar, TrendingUp, BookOpen } from 'lucide-react';
import {formatCitationCount} from '../utils/graphUtils';

const PaperDetails = ({ paper, onClose }) => {
  if (!paper) return null;


  return (
    <div className="paper-details-overlay" onClick={onClose}>
      <div className="paper-details" onClick={(e) => e.stopPropagation()}>
        <button className="details-close" onClick={onClose}>
          <X size={24} />
        </button>
        
        <div className="details-header">
          <h2 className="details-title">{paper.title}</h2>
          
          {paper.doi && (
            <a 
              href={`https://doi.org/${paper.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="details-link"
            >
              <ExternalLink size={18} />
              DOI
            </a>
          )}
        </div>
        
        <div className="details-meta">
          <div className="meta-badge">
            <Calendar size={16} />
            {paper.publication_year || 'N/A'}
          </div>
          
          <div className="meta-badge">
            <TrendingUp size={16} />
            {formatCitationCount(paper.citation_count || 0)} citations
          </div>
          
          {paper.venue && (
            <div className="meta-badge">
              <BookOpen size={16} />
              {paper.venue}
            </div>
          )}
        </div>
        
        {paper.authors && paper.authors.length > 0 && (
          <div className="details-section">
            <h3 className="section-title">
              <Users size={18} />
              Authors
            </h3>
            <div className="authors-list">
              {paper.authors.map((author, idx) => (
                <div key={idx} className="author-item">
                  <span className="author-name">{author.display_name}</span>
                  {author.last_known_institution && (
                    <span className="author-institution">{author.last_known_institution}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

    

        {paper.abstract && (
          <div className="details-section">
            <h3 className="section-title">Abstract</h3>
            <p className="insight-text">{paper.abstract.replace(/\\n/g, ' ')}</p>
          </div>
        )}
        
        <div className="details-actions">
          {paper.pdf_url && (
            <a 
              href={paper.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="action-button primary"
            >
              View PDF
            </a>
          )}
          
          {paper.openalex_url && (
            <a 
              href={paper.openalex_url}
              target="_blank"
              rel="noopener noreferrer"
              className="action-button secondary"
            >
              OpenAlex
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaperDetails;