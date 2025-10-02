from flask import Blueprint, request, jsonify
from app.services import OpenAlexService
from app.models import Paper, Citation

papers_bp = Blueprint('papers', __name__)

@papers_bp.route('/<paper_id>', methods=['GET'])
def get_paper_details(paper_id):

  include_abstract = request.args.get('include_abstract', 'true').lower() == 'true'
  force_refresh = request.args.get('force_refresh', 'false').lower() == 'true'

  try:
    service = OpenAlexService()
    paper = service.get_paper_details(paper_id, force_refresh=force_refresh)

    if not paper:
      return jsonify({
        'error': 'Paper not found',
        'paper_id': paper_id
      }), 404
    return jsonify({
      'success': True,
      'paper': paper.to_dict(include_authors=True, include_abstract=include_abstract)
    }), 200
  
  except Exception as e:
    return jsonify({
      'error': 'Failed to fetch paper details',
      'message': str(e)
    }), 500

@papers_bp.route('/<paper_id>/citations', methods=['GET'])
def get_paper_citations(paper_id):

  include_references = request.args.get('include_references', 'true').lower() == 'true'

  try:
    service = OpenAlexService()
    citation_data = service.get_paper_citations(
      paper_id, 
      fetch_cited_papers=include_references
    )

    if not citation_data:
      return jsonify({
        'error': 'Paper not found',
        'paper_id': paper_id
      }), 404
    return jsonify({
      'success': True,
      'data': citation_data

    }), 200
  
  except Exception as e:
    return jsonify({
      'error': 'Failed to fetch citations',
      'message': str(e)
    }), 500

@papers_bp.route('/<paper_id>/graph', methods=['GET'])
def get_citation_graph(paper_id):

  try:
    depth = int(request.args.get('depth', 1))
    if depth < 1:
      depth = 1
    if depth > 3:
      depth = 3
  except ValueError:
    depth = 1
  
  try:

    paper = Paper.query.get(paper_id)

    if not paper:

      service = OpenAlexService()
      paper = service.get_paper_details(paper_id)

      if not paper:
        return jsonify({
          'error': 'Paper not found',
          'paper_id': paper_id
        }), 404
    
    if depth == 1:

      graph_data = paper.get_citation_graph()
    
    else:
      graph_data = Citation.get_citation_network(paper_id, max_depth=depth)

    return jsonify({
      'success': True,
      'graph': graph_data
    }), 200

  except Exception as e:
    return jsonify({
      'error': 'Failed to build citation graph',
      'message': str(e)
    }), 500

@papers_bp.route('/<paper_id>/expand', methods=['POST'])
def expand_paper_node(paper_id):

  try:
    data = request.get_json() or {}
    fetch_citing = data.get('fetch_citing', True)
    fetch_references = data.get('fetch_references', True)

    service = OpenAlexService()

    paper = service.get_paper_details(paper_id)
    if not paper:
      return jsonify({
        'error': 'Paper not found',
        'paper_id': paper_id
      }), 404
    
    citation_data = service.get_paper_citations(
      paper_id,
      fetch_cited_papers=fetch_references
    )

    return jsonify({
      'success': True,
      'paper_id': paper_id,
      'new_citations': {

        'citing_papers': citation_data['cited_by'] if fetch_citing else [],
        'referenced_papers': citation_data['references'] if fetch_references else []
      },
      'graph': citation_data['citation_graph']
    }), 200

  except Exception as e:
    return jsonify({
      'error': 'Failed to expand paper node',
      'message': str(e)

    }), 500

@papers_bp.route('/batch', methods=['POST'])
def get_multiple_papers():

  try:
    data = request.get_json()

    if not data or 'papers_ids' not in data:
      return jsonify({
        'error': 'Request body must include "papers_ids" array'
      }), 400
    
    paper_ids = data.get('paper_ids', [])
    include_abstract = data.get('include_abstract', False)

    if not isinstance(paper_ids, list) or len(paper_ids) == 0:
      return jsonify({
        'error': 'paper_ids must be a non-empty array'
      }), 400
    
    if len(paper_ids) > 50:
      return jsonify({
        'error': 'Maximum 50 papers per batch request'
      }), 400

    
    service = OpenAlexService()
    papers = []
    not_found = []

    for paper_id in paper_ids:
      paper = service.get_paper_details(paper_id)
      if paper:
        papers.append(paper.to_dict(include_authors=True, include_abstract=include_abstract))
      
      else:
        not_found.append(paper_id)

    return jsonify({
      'success': True,
      'papers': papers,
      'not_found': not_found,
      'total_requested': len(paper_ids),
      'total_found': len(papers)
    }), 200
  
  except Exception as e:
    return jsonify({
      'error': 'Batch request failed',
      'message': str(e)
    }), 500