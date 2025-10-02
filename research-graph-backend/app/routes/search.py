from flask import Blueprint, request, jsonify
from app.services import OpenAlexService

search_bp = Blueprint('search', __name__)

@search_bp.route('', methods=['GET'])
def search_papers():

  query = request.args.get('q', '').strip()

  if not query:
    return jsonify({
      'error': 'Query parameter "q" is required',
      'example': '/api/search?q=machine+learning'
    }), 400
  
  filters = {}

  try:
    if request.args.get('year_min'):
      filters['year_min'] = int(request.args.get('year_min'))
    if request.args.get('year_max'):
      filters['year_max'] = int(request.args.get('year_max'))
    if request.args.get('min_citations'):
      filters['min_citations'] = int(request.args.get('min_citations'))
  
  except ValueError:
    return jsonify({
      'error': 'Invalid filter values. year_min, year_max, and min_citations must be integers.'
    }), 400

  try:
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    if page < 1:
      page = 1
    if per_page < 1 or per_page > 100:
      per_page = 20

  except ValueError:
    return jsonify({
      'error': 'Invalid pagination values. page and per_page must be integers.'
    }), 400

  try:

    service = OpenAlexService()
    results = service.search_papers(
      query=query,
      filters=filters if filters else None,
      page=page,
      per_page=per_page
    )

    return jsonify({
      'success': True,
      'query': query,
      'filters': filters,
      'results': results['results'],
      'meta': results['meta']
    }), 200

  except Exception as e:
    return jsonify({
      'error': 'Search failed',
      'message': str(e)
    }), 500

@search_bp.route('/suggestions', methods=['GET'])
def search_suggestions():

  query = request.args.get('q', '').strip()

  if not query or len(query) < 2:
    return jsonify({
      'error': 'Query must be at least 2 characters',
      'suggestions': []
    }), 400

  try:
    limit = int(request.args.get('limit', 5))
    if limit < 1 or limit > 20:
      limit = 5
  except ValueError:
    limit = 5
  
  try:

    service = OpenAlexService()

    results = service.search_papers(
      query=query,
      page=1,
      per_page=limit
    )

    suggestions = []
    seen = set()

    for paper in  results['results']:
      title = paper.get('title', '')
      if title and title not in seen:
        suggestions.append({
          'type': 'paper',
          'text': title,
          'paper_id': paper.get('id')
        })
        seen.add(title)
      
      for author in paper.get('authors', []):
        author_name = author.get('display_name', '')
        if author_name and author_name not in seen:
          suggestions.append({
            'type': 'author',
            'text': author_name,
            'author_id': author.get('id')
          })
          seen.add(author_name)

        if len(suggestions) >= limit:
          break
      
      if len(suggestions) >= limit:
        break
    
    return jsonify({
      'success': True,
      'query': query,
      'suggestions': suggestions[:limit]
    }), 200
  
  except Exception as e:
    return jsonify({
      'error': 'Failed to get suggestions',
      'message': str(e),
      'suggestions': []
    }), 500

@search_bp.route('/filters', methods=['GET'])
def get_available_filters():

  return jsonify({
        'success': True,
        'filters': {
            'year_min': {
                'type': 'integer',
                'description': 'Minimum publication year',
                'example': 2020
            },
            'year_max': {
                'type': 'integer',
                'description': 'Maximum publication year',
                'example': 2024
            },
            'min_citations': {
                'type': 'integer',
                'description': 'Minimum number of citations',
                'example': 10
            }
        },
        'pagination': {
            'page': {
                'type': 'integer',
                'description': 'Page number (starts at 1)',
                'default': 1
            },
            'per_page': {
                'type': 'integer',
                'description': 'Results per page',
                'default': 20,
                'max': 100
            }
        },
        'example_queries': [
            '/api/search?q=machine+learning&year_min=2020&per_page=10',
            '/api/search?q=climate+change&min_citations=100&year_max=2023',
            '/api/search?q=quantum+computing&page=2'
        ]
    }), 200