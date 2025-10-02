from app import db
from datetime import datetime

class Author(db.Model):

  __tablename__ = 'authors'

  id = db.Column(db.String(50), primary_key=True)

  display_name = db.Column(db.String(200), nullable=False, index=True)
  orcid = db.Column(db.String(50), nullable=True, unique=True, index=True)

  last_known_institution = db.Column(db.String(300), nullable=True)
  institution_id = db.Column(db.String(50), nullable=True)

  works_count = db.Column(db.Integer, default=0)
  cited_by_count = db.Column(db.Integer, default=0)
  h_index = db.Column(db.Integer, default=0)

  openalex_url = db.Column(db.String(200), nullable=True)

  cached_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
  last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

  papers = db.relationship('Paper', secondary='paper_authors', back_populates='authors', lazy='dynamic')

  def __repr__(self):
    return f'<Author {self.id}: {self.display_name}>'

  def to_dict(self, include_stats=False):

    data = {
      'id': self.id,
      'display_name': self.display_name,
      'orcid': self.orcid,
      'last_known_institution': self.last_known_institution,
      'openalex_url': self.openalex_url,
    }

    if include_stats: 
      data['works_count'] = self.works_count
      data['cited_by_count'] = self.cited_by_count
      data['h_index'] = self.h_index

    return data

  def get_papers_by_year(self):

    papers_by_year = {}
    for paper in self.papers.all():
      year = paper.publication_year
      if year:
        papers_by_year[year] = papers_by_year.get(year, 0) + 1
    return papers_by_year

  def get_top_cited_papers(self, limit=10):

    top_papers = self.papers.order_by(db.desc('citation_count')).limit(limit).all()
    return [paper.to_dict(include_authors=False) for paper in top_papers]

  def get_coauthors(self, limit=20):

    from sqlalchemy  import func
    from app.models.paper import paper_authors

    coauthor_query = db.session.query(
      Author,
      func.count(paper_authors.c.paper_id).label('collaboration_count')
    ).join(
      paper_authors, Author.id == paper_authors.c.author_id
    ).filter(
      paper.authors.c.paper_id.in_(
        db.session.query(paper_authors.c.paper_id).filter(
          paper_authors.c.author_id == self.id
        )
      ),
      Author.id != self.id
    ).group_by(
      Author.id
    ).order_by(
      func.count(paper_authors.c.paper_id).desc()
    ).limit(limit)

    coauthors = []
    for author, collab_count in coauthor_query.all():
      author_dict = author.to_dict()
      author_dict['collaboration_count'] = collab_count
      coauthors.append(author_dict)
    
    return coauthors


