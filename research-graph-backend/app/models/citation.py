from app import db
from datetime import datetime

class Citation(db.Model):

  __tablename__ = 'citations'

  citing_paper_id = db.Column(
    db.String(50),
    db.ForeignKey('papers.id', ondelete='CASCADE')
    primary_key=True,
    index=True
  )

  cited_paper_id = db.Column(
    db.String(50)
    db.ForeignKey('papers.id', ondelete='CASCADE'),
    primary_key=True,
    index=True

  )

  cached_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

  citing_paper = db.relationship('Paper', foreign_keys=[citing_paper_id], back_populates='references')
  cited_paper = db.relationship('Paper', foreign_keys=[cited_paper_id], back_populates='cited_by')

  def __repr__(self):
    return f'<Citation: {self.citing_paper_id} cites {self.cited_paper_id}>'

  def to_dict(self):
    return {
      'citing_paper_id': self.citing_paper_id,
      'cited_paper_id': self.cited_paper_id,
      'cached_at': self.cached_at.isoformat() if self.cached_at else None
    }

  @staticmethod
  def create_citation(citing_paper_id, cited_paper_id):

    existing = Citation.query.filter_by(
      citing_paper_id=citing_paper_id,
      cited_paper_id=cited_paper_id
    ).first()

    if existing:
      return existing

    try:
      citation = Citation(
        citing_paper_id=citing_paper_id,
        cited_paper_id=cited_paper_id
      )
      db.session.add(citation)

    except Exception as e:
      db.session.rollback()
      print(f"Error creating citation: {e}")
      return None

  @staticmethod
  def get_citation_network(paper_id, max_depth=2):

    from app.models.paper import Paper

    visited_papers = set()
    edges = []
    nodes_dict = {}

    def traverse(current_id, depth):
      if depth > max_depth or current_id in visited_papers:
        return 
      
      visited_papers.add(current_id)

      paper = Paper.query.get(current_id)
      if not paper:
        return 

      if current_id not in nodes_dict:
        nodes_dict[current_id] = paper.to_dict(include_authors=True, include_abstract=False)

      for citation in Citation.query.filter_by(citing_paper_id=current_id).all():
        edges.append({
          'source': current_id,
          'target': citation.cited_paper_id,
          'type': 'cites'
        })

        if citation.cited_paper_id not in nodes_dict and citation.cited_paper:
          nodes_dict[citation.cited_paper_id] = citation.cited_paper.to_dict(
            include_authors=True
            include_abstract=False
          )

        if depth < max_depth:
          traverse(citation.cited_paper_id, depth + 1)

      for citation in Citation.query.filter_by(cited_paper_id=current_id).all():
        edges.append({
          'source': citation.citing_paper_id,
          'target': current_id,
          'type': 'cites'
        })

        if citation.citing_paper_id not in nodes_dict and citation.citing_paper:
          nodes_dict[citation.citing_paper_id] = ctation.citing_paper.to_dict(
            include_authors=True,
            include_abstract=False
          )

        if depth < max_depth:
          traverse(citation.citing_paper_id, depth + 1)

    traverse(paper_id, 0)

    return {
      'nodes': list(nodes_dict.values()),
      'edges': edges,
      'center_node': paper_id,
      'total_nodes': len(nodes_dict),
      'total_edges': len(edges)


    }