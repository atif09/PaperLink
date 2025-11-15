from flask import Blueprint, request, jsonify
from app import db
from app.models.paper import Collection, SavedPaper, Paper
import json

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
  import sys
  try:
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
  except Exception as e:
    print('CREATE_COLLECTION_ERROR:', e, file=sys.stderr)
    return jsonify({'error': str(e)}), 500

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
    import sys
    try:
      data = request.get_json()
      user_id = data.get('user_id', 'anonymous')
      paper_id = data.get('paper_id')
      collection_id = data.get('collection_id')
      if not paper_id or not collection_id:
        return jsonify({'error': 'paper_id and collection_id are required'}), 400
      
      authors = data.get('authors')
      authors_json = json.dumps(authors) if authors else None
      
      existing = SavedPaper.query.filter_by(
        paper_id=paper_id,
        collection_id=collection_id,
        user_id=user_id
      ).first()
      if existing:
        return jsonify({'error': 'Paper already saved in this collection'}), 400
      
      paper = Paper.query.filter_by(id=paper_id).first()
      if not paper:
        # Try to fetch paper metadata from OpenAlex
        try:
          from app.services.openalex_service import OpenAlexService
          service = OpenAlexService()
          paper_obj = service.get_paper_details(paper_id)
          if paper_obj and hasattr(paper_obj, 'id'):
            db.session.add(paper_obj)
            db.session.flush()
            paper = paper_obj
          else:
            raise Exception('No OpenAlex data')
        except Exception as fetch_err:
          print('OPENALEX_FETCH_ERROR:', fetch_err, file=sys.stderr)
          # Try to use frontend-provided metadata if available
          title = data.get('title', 'Unknown')
          publication_year = data.get('publication_year')
          venue = data.get('venue')
          doi = data.get('doi')
          citation_count = data.get('citation_count')
          paper = Paper(id=paper_id, title=title, publication_year=publication_year, venue=venue, doi=doi, citation_count=citation_count, authors_json=authors_json)
          db.session.add(paper)
          db.session.flush()
      
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
    except Exception as e:
      print('SAVE_PAPER_ERROR:', e, file=sys.stderr)
      return jsonify({'error': str(e)}), 500

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

def _get_paper_metadata(saved_paper):
  
  paper = saved_paper.paper
  metadata = {
    'id': saved_paper.paper_id,
    'title': None,
    'authors': None,
    'publication_year': None,
    'venue': None,
    'doi': None
  }
  
  if paper:
    metadata['title'] = paper.title
    metadata['publication_year'] = paper.publication_year
    metadata['venue'] = paper.venue
    metadata['doi'] = paper.doi
    if hasattr(paper, 'authors') and paper.authors:
      metadata['authors'] = ' and '.join([a.display_name for a in paper.authors.all()])
  
  if not metadata['title'] or metadata['title'] == 'Unknown':
    try:
      if saved_paper.notes:
        notes_data = json.loads(saved_paper.notes)
        if isinstance(notes_data, dict):
          metadata['title'] = notes_data.get('title') or metadata['title']
          metadata['publication_year'] = notes_data.get('publication_year') or metadata['publication_year']
          metadata['venue'] = notes_data.get('venue') or metadata['venue']
          metadata['doi'] = notes_data.get('doi') or metadata['doi']
   
          if 'authors' in notes_data:
            authors_list = notes_data['authors']
            if isinstance(authors_list, list) and len(authors_list) > 0:
       
              author_names = []
              for author in authors_list:
                if isinstance(author, dict) and 'display_name' in author:
                  author_names.append(author['display_name'])
                elif isinstance(author, str):
                  author_names.append(author)
              if author_names:
                metadata['authors'] = ' and '.join(author_names)
    except (json.JSONDecodeError, AttributeError) as e:
      import sys
      print(f'Error parsing notes JSON: {e}', file=sys.stderr)
  
  metadata['title'] = metadata['title'] or 'Unknown'
  metadata['authors'] = metadata['authors'] or 'Unknown'
  metadata['publication_year'] = metadata['publication_year'] or 'n.d.'
  metadata['venue'] = metadata['venue'] or 'Unknown'
  metadata['doi'] = metadata['doi'] or ''
  
  return metadata

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

  enriched_papers = []
  for sp in saved_papers:
    sp_dict = sp.to_dict()
    metadata = _get_paper_metadata(sp)
    
    if 'paper' in sp_dict:
      sp_dict['paper']['title'] = metadata['title']
      sp_dict['paper']['publication_year'] = metadata['publication_year']
      sp_dict['paper']['venue'] = metadata['venue']
      sp_dict['paper']['doi'] = metadata['doi']
    else:

      sp_dict['paper'] = {
        'id': metadata['id'],
        'title': metadata['title'],
        'publication_year': metadata['publication_year'],
        'venue': metadata['venue'],
        'doi': metadata['doi']
      }
    
    enriched_papers.append(sp_dict)

  return jsonify({
    'success': True,
    'collection': collection.to_dict(),
    'papers': enriched_papers
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

  if format_type == 'bibtex':
    bibtex_entries = []
    for sp in saved_papers:
      metadata = _get_paper_metadata(sp)
      
      entry = f"""@article{{{metadata['id']},
    title = {{{metadata['title']}}},
    author = {{{metadata['authors']}}},
    year = {{{metadata['publication_year']}}},
    journal = {{{metadata['venue']}}},
    doi = {{{metadata['doi']}}}
}}"""
      bibtex_entries.append(entry)
    
    return '\n\n'.join(bibtex_entries), 200, {'Content-Type': 'text/plain'}
  
  return jsonify({'error': 'Unsupported format'}), 400