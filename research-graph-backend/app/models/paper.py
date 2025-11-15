from app import db
from datetime import datetime

class Paper(db.Model):

  __tablename__ = 'papers'

  id = db.Column(db.String(50), primary_key=True)

  title = db.Column(db.String(500), nullable=False, index=True)
  abstract = db.Column(db.Text, nullable=True)
  doi = db.Column(db.String(100), nullable=True, index=True)

  publication_year = db.Column(db.Integer, nullable=True, index=True)
  publication_date = db.Column(db.String(20), nullable=True)

  venue = db.Column(db.String(300), nullable=True)
  venue_issn = db.Column(db.String(20), nullable=True)

  citation_count = db.Column(db.Integer, default=0, index=True)
  referenced_works_count = db.Column(db.Integer, default=0)

  openalex_url = db.Column(db.String(200), nullable=True)
  pdf_url = db.Column(db.String(300), nullable=True)

  cached_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
  last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


  authors = db.relationship('Author', secondary='paper_authors', back_populates='papers', lazy='dynamic')

  cited_by = db.relationship(
    'Citation',
    foreign_keys='Citation.cited_paper_id',
    back_populates='cited_paper',
    lazy='dynamic',
    cascade='all, delete-orphan'
  )

  references = db.relationship(
    'Citation',
    foreign_keys='Citation.citing_paper_id',
    back_populates='citing_paper',
    lazy='dynamic',
    cascade='all, delete-orphan'
  )

  def __repr__(self):
    return f'<Paper {self.id}: {self.title[:50]}...>'

  def to_dict(self, include_authors=True, include_abstract=False):


    data = {
      'id': self.id,
      'title': self.title,
      'doi': self.doi,
      'publication_year': self.publication_year,
      'publication_date': self.publication_date,
      'venue': self.venue,
      'citation_count': self.citation_count,
      'referenced_works_count': self.referenced_works_count,
      'openalex_url': self.openalex_url,
      'pdf_url': self.pdf_url,
    }

    if include_abstract:
      data['abstract'] = self.abstract

    if include_authors:
      data['authors'] = [author.to_dict() for author in self.authors.all()]

    return data
  def get_citation_graph(self, depth=1):

    nodes = [self.to_dict(include_authors=True, include_abstract=False)]
    edges = []
    visited = {self.id}

    for citation in self.cited_by.all():
      citing_paper = citation.citing_paper
      if citing_paper.id not in visited:
        nodes.append(citing_paper.to_dict(include_authors=True, include_abstract=False))
        visited.add(citing_paper.id)
      edges.append({
        'source': citing_paper.id,
        'target': self.id,
        'type': 'cites'
      })
    for citation in self.references.all():
      cited_paper = citation.cited_paper
      if cited_paper.id not in visited:
        nodes.append(cited_paper.to_dict(include_authors=True, include_abstract=False))
        visited.add(cited_paper.id)
      edges.append({
        'source': self.id,
        'target': cited_paper.id,
        'type': 'cites'
      })
    
    return {
      'nodes': nodes,
      'edges': edges,
      'center_node': self.id
    }

paper_authors = db.Table('paper_authors',
    db.Column('paper_id', db.String(50), db.ForeignKey('papers.id', ondelete='CASCADE'), primary_key=True),
    db.Column('author_id', db.String(50), db.ForeignKey('authors.id', ondelete='CASCADE'), primary_key=True),
    db.Column('author_position', db.Integer, nullable=True)  
)

class Collection(db.Model):
  __tablename__ = 'collections'

  id = db.Column(db.Integer, primary_key=True)
  name = db.Column(db.String(200), nullable=False)
  description = db.Column(db.Text, nullable=True)
  user_id = db.Column(db.String(100), nullable=False, index=True)
  created_at = db.Column(db.DateTime, default=datetime.utcnow)
  updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


  saved_papers = db.relationship('SavedPaper', back_populates='collection', cascade='all, delete-orphan')


  def to_dict(self):
    return {
      'id': self.id,
      'name': self.name,
      'description': self.description,
      'paper_count': len(self.saved_papers),
      'created_at': self.created_at.isoformat(),
      'updated_at': self.updated_at.isoformat()
    }

class SavedPaper(db.Model):
  __tablename__ = 'saved_papers'
  
    
  id = db.Column(db.Integer, primary_key=True)
  paper_id = db.Column(db.String(50), db.ForeignKey('papers.id'), nullable=False)
  collection_id = db.Column(db.Integer, db.ForeignKey('collections.id'), nullable=False)
  user_id = db.Column(db.String(100), nullable=False, index=True)
  notes = db.Column(db.Text, nullable=True)
  status = db.Column(db.String(20), default='to_read')
  saved_at = db.Column(db.DateTime, default=datetime.utcnow)

  paper = db.relationship('Paper')
  collection = db.relationship('Collection', back_populates='saved_papers')

  def to_dict(self, include_authors=True):
    import json
    paper_obj = self.paper
    if paper_obj:
      paper_dict = paper_obj.to_dict(include_authors=include_authors, include_abstract=False)
    else:
      meta = {}
      try:
        if self.notes and self.notes.strip().startswith('{'):
          meta = json.loads(self.notes)
      except Exception:
        meta = {}
      paper_dict = {
        'id': self.paper_id,
        'title': meta.get('title', 'Unknown'),
        'authors': meta.get('authors', []),
        'publication_year': meta.get('publication_year'),
        'venue': meta.get('venue'),
        'doi': meta.get('doi'),
        'citation_count': meta.get('citation_count')
      }
    return {
      'id': self.id,
      'paper': paper_dict,
      'paper_id': self.paper_id,
      'collection_id': self.collection_id,
      'notes': self.notes,
      'status': self.status,
      'saved_at': self.saved_at.isoformat()
    }
  

