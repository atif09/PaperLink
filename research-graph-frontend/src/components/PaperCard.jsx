import React from 'react';
import {BookOpen, Users, Calendar, TrendingUp } from 'lucide-react';
import {formatCitationCount, truncateText} from '../utils/graphUtils';
import CategoryBadge from './CategoryBadge';
import { getCategoryBadge } from '../utils/paperCategorization';
import SavePaperButton from './SavePaperButton';

const PaperCard = ({ paper, onClick, isSelected }) => {
  const categoryBadge = paper.categories ? getCategoryBadge(paper.categories) : null;
  

  return (
    <div 
      className={`paper-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(paper)}
    >
      <div className="paper-card-header">
        <div className="paper-title-row">
          <h3 className="paper-title">{truncateText(paper.title, 80)}</h3>
          <div className="paper-badges">
            {categoryBadge && <CategoryBadge category={categoryBadge} />}
            
          </div>
        </div>
        <SavePaperButton paper={paper} />
      </div>
      
      <div className="paper-metadata">
        <div className="metadata-item" style={{ display: 'flex', alignItems: 'center', gap: '0.4em' }}>
          <Users size={14} />
          <span style={{ marginLeft: 0 }}>{paper.authors?.slice(0, 3).map(a => a.display_name).join(', ')}</span>
        </div>
        
        <div className="metadata-row">
          <div className="metadata-item">
            <Calendar size={14} />
            <span>{paper.publication_year || 'N/A'}</span>
          </div>
          
          <div className="metadata-item">
            <TrendingUp size={14} />
            <span>{formatCitationCount(paper.citation_count || 0)} citations</span>
          </div>
        </div>
        
        {paper.venue && (
          <div className="metadata-item venue">
            <BookOpen size={14} />
            <span>{truncateText(paper.venue, 40)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaperCard;