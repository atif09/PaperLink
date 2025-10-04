from flask import Blueprint, request, jsonify
from app import db
from app.models.paper import Collection, SavedPaper, Paper

library_bp = Blueprint('library', __name__)

@library_bp.route('/collections', methods=['GET'])
def get_collections():
  user_id = request.args.get('user_id', 'anonymous')
  collections = Collection.query.filter_by(user_id=user_id).all()

  return jsonify({
    'success': True,
    'collections': [c.to_dict() for c in collections]
  }), 200

@library_bp.route('/collections', methods=['POST'])
def create_collection():
  data = request.get_json()
  user_id = data.get('user_id', 'anonymous')


  if not data.get('name'):
    return jsonify({'error': 'Collection name is required'}), 400

  collection = Collection(
    name=data['name'],
    description=data.get('description'),
    user_id=user_id
  )

  db.session.add(collection)
  db.session.commit()

  return jsonify({
    'success': True,
    'collection': collection.to_dict()
  }), 201

@library_bp.route('/collections/<int:collection_id>', methods=['DELETE'])
def delete_collection(collection_id):
  user_id = request.args.get('user_id', 'anonymous')
  collection = Collection.query.filter_by(id=collection_id, user_id=user_id).first()

  if not collection:
    return jsonify({'error': 'Collection not found'}), 404

  db.session.delete(collection)
  db.session.commit()

  return jsonify({'success': True}), 200

@library_bp.route('/saved-papers', methods=['POST'])
def save_paper():
    data = request.get_json()
    user_id = data.get('user_id', 'anonymous')
    paper_id = data.get('paper_id')
    collection_id = data.get('collection_id')
    
    if not paper_id or not collection_id:
        return jsonify({'error': 'paper_id and collection_id are required'}), 400
    
    existing = SavedPaper.query.filter_by(
        paper_id=paper_id,
        collection_id=collection_id,
        user_id=user_id
    ).first()
    
    if existing:
        return jsonify({'error': 'Paper already saved in this collection'}), 400
    
    saved_paper = SavedPaper(
        paper_id=paper_id,
        collection_id=collection_id,
        user_id=user_id,
        notes=data.get('notes', ''),
        status=data.get('status', 'to_read')
    )
    
    db.session.add(saved_paper)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'saved_paper': saved_paper.to_dict()
    }), 201

@library_bp.route('/saved-papers/<int:saved_paper_id>', methods=['PUT'])
def update_saved_paper(saved_paper_id):
  user_id = request.args.get('user_id', 'anonymous')
  data = request.get_json()

  saved_paper = SavedPaper.query.filter_by(id=saved_paper_id, user_id=user_id).first()

  if not saved_paper:
    return jsonify({'error': 'Saved paper not found'}), 404

  if 'notes' in data:
    saved_paper.notes = data['notes']
  if 'status' in data:
    saved_paper.status = data['status']

  db.session.commit()

  return jsonify({
    'success': True,
    'saved_paper': saved_paper.to_dict()
  }), 200

@library_bp.route('/saved-papers/<int:saved_paper_id>', methods=['DELETE'])
def delete_saved_paper(saved_paper_id):
  user_id = request.args.get('user_id', 'anonymous')
  saved_paper = SavedPaper.query.filter_by(id=saved_paper_id, user_id=user_id).first()

  if not saved_paper:
    return jsonify({'error': 'Saved paper not found'}), 404

  db.session.delete(saved_paper)
  db.session.commit()

  return jsonify({'success': True}), 200

@library_bp.route('/collections/<int:collection_id>/papers', methods=['GET'])
def get_collection_papers(collection_id):
  user_id = request.args.get('user_id', 'anonymous')

  collection = Collection.query.filter_by(id=collection_id, user_id=user_id).first()

  if not collection:
    return jsonify({'error': 'Collection not found'}), 404

  saved_papers = SavedPaper.query.filter_by(
    collection_id=collection_id,
    user_id=user_id
  ).all()

  return jsonify({
    'success': True,
    'collection': collection.to_dict(),
    'papers': [sp.to_dict() for sp in saved_papers]
  }), 200

@library_bp.route('/collections/<int:collection_id>/export', methods=['GET'])
def export_collection(collection_id):
  user_id = request.args.get('user_id', 'anonymous')
  format_type = request.args.get('format', 'bibtex')

  collection = Collection.query.filter_by(id=collection_id, user_id=user_id).first()

  if not collection:
    return jsonify({'error': 'Collection not found'}), 404

  saved_papers = SavedPaper.query.filter_by(
    collection_id=collection_id,
    user_id=user_id
  ).all()

  if format_type == 'bibtext':
    bibtext_entries = []
    for sp in saved_papers:
      paper = sp.paper
      authors = ' and '.join([a.display_name for a in paper.authors.all()])
      entry = f"""@article{{{paper.id},
    title = {{{paper.title}}},
    author = {{{authors}}},
    year = {{{paper.publication_year or 'n.d.'}}},
    journal = {{{paper.venue or 'Unknown'}}},
    doi = {{{paper.doi or ''}}}
  }}"""
      bibtext_entries.append(entry)
    
    return '\n\n'.join(bibtex_entries), 200, {'Content-Type': 'text/plain'}
  
  return jsonify({'error': 'Unsupported format'}), 400