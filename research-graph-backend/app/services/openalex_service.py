import requests
import time
from datetime import datetime, timedelta
from flask import current_app
from app import db
from app.models import Paper, Author, Citation


class RateLimiter:
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        self.calls = []
    
    def wait_if_needed(self):
        now = time.time()
        
        self.calls = [call_time for call_time in self.calls if now - call_time < self.period]
        
        if len(self.calls) >= self.max_calls:
            sleep_time = self.period - (now - self.calls[0])
            if sleep_time > 0:
                time.sleep(sleep_time)
            self.calls = []
        
        self.calls.append(time.time())


class OpenAlexService:
    
    def __init__(self):
        self.base_url = current_app.config['OPENALEX_API_URL']
        self.email = current_app.config.get('OPENALEX_EMAIL')
        self.rate_limiter = RateLimiter(
            current_app.config['API_RATE_LIMIT_CALLS'],
            current_app.config['API_RATE_LIMIT_PERIOD']
        )
        self.session = requests.Session()
        
        if self.email:
            self.session.headers.update({
                'User-Agent': f'ResearchGraphApp/1.0 (mailto:{self.email})'
            })
    
    def _make_request(self, endpoint, params=None):
        self.rate_limiter.wait_if_needed()
        
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API request error: {e}")
            return None
    
    def search_papers(self, query, filters=None, page=1, per_page=20):
        params = {
            'search': query,
            'page': page,
            'per_page': min(per_page, current_app.config['MAX_PAGE_SIZE'])
        }
        
        filter_parts = []
        if filters:
            if filters.get('year_min'):
                filter_parts.append(f"publication_year:>={filters['year_min']}")
            if filters.get('year_max'):
                filter_parts.append(f"publication_year:<={filters['year_max']}")
            if filters.get('min_citations'):
                filter_parts.append(f"cited_by_count:>={filters['min_citations']}")
        
        if filter_parts:
            params['filter'] = ','.join(filter_parts)
        
        data = self._make_request('/works', params=params)
        
        if not data:
            return {'results': [], 'meta': {'count': 0, 'page': page}}
        
        papers = []
        for work in data.get('results', []):
            paper = self._cache_paper(work)
            if paper:
                papers.append(paper.to_dict(include_authors=True, include_abstract=False))
        
        return {
            'results': papers,
            'meta': {
                'count': data.get('meta', {}).get('count', 0),
                'page': page,
                'per_page': per_page
            }
        }
    
    def get_paper_details(self, paper_id, force_refresh=False):
        if paper_id.startswith('http'):
            paper_id = paper_id.split('/')[-1]
        
        if not force_refresh:
            paper = Paper.query.get(paper_id)
            if paper:
                cache_age = datetime.utcnow() - paper.cached_at
                if cache_age < timedelta(days=30):
                    return paper
        
        data = self._make_request(f'/works/{paper_id}')
        if not data:
            return None
        
        paper = self._cache_paper(data, include_abstract=True)
        return paper
    
    def get_paper_citations(self, paper_id, fetch_cited_papers=True):
        if paper_id.startswith('http'):
            paper_id = paper_id.split('/')[-1]
        
        paper = self.get_paper_details(paper_id)
        if not paper:
            return None
        
        citing_papers = self._fetch_citing_papers(paper_id)
        
        cited_papers = []
        if fetch_cited_papers:
            cited_papers = self._fetch_referenced_papers(paper_id)
        
        return {
            'paper': paper.to_dict(include_authors=True, include_abstract=True),
            'cited_by': citing_papers,
            'references': cited_papers,
            'citation_graph': paper.get_citation_graph()
        }
    
    def _fetch_citing_papers(self, paper_id, limit=50):
        params = {
            'filter': f'cites:{paper_id}',
            'per_page': limit,
            'sort': 'cited_by_count:desc'
        }
        
        data = self._make_request('/works', params=params)
        if not data:
            return []
        
        citing_papers = []
        for work in data.get('results', []):
            citing_paper = self._cache_paper(work)
            if citing_paper:
                Citation.create_citation(citing_paper.id, paper_id)
                citing_papers.append(citing_paper.to_dict(include_authors=True, include_abstract=False))
        
        db.session.commit()
        return citing_papers
    
    def _fetch_referenced_papers(self, paper_id, limit=50):
        params = {
            'filter': f'cited_by:{paper_id}',
            'per_page': limit
        }
        
        data = self._make_request('/works', params=params)
        if not data:
            return []
        
        referenced_papers = []
        for work in data.get('results', []):
            cited_paper = self._cache_paper(work)
            if cited_paper:
                Citation.create_citation(paper_id, cited_paper.id)
                referenced_papers.append(cited_paper.to_dict(include_authors=True, include_abstract=False))
        
        db.session.commit()
        return referenced_papers
    
    def _cache_paper(self, work_data, include_abstract=False):
        try:
            paper_id = work_data.get('id', '').split('/')[-1]
            if not paper_id:
                return None
            
            paper = Paper.query.get(paper_id)
            if not paper:
                paper = Paper(id=paper_id)
            
            paper.title = work_data.get('title', 'Untitled')
            paper.doi = work_data.get('doi', '').replace('https://doi.org/', '') if work_data.get('doi') else None
            paper.publication_year = work_data.get('publication_year')
            paper.publication_date = work_data.get('publication_date')
            
            if work_data.get('primary_location'):
                location = work_data['primary_location']
                if location.get('source'):
                    paper.venue = location['source'].get('display_name')
                paper.pdf_url = location.get('pdf_url')
            
            paper.citation_count = work_data.get('cited_by_count', 0)
            paper.referenced_works_count = len(work_data.get('referenced_works', []))
            
            paper.openalex_url = work_data.get('id')
            
            if include_abstract:
                inverted_abstract = work_data.get('abstract_inverted_index')
                if inverted_abstract:
                    paper.abstract = self._reconstruct_abstract(inverted_abstract)
            
            paper.last_updated = datetime.utcnow()
            
            db.session.add(paper)
            
            for authorship in work_data.get('authorships', []):
                author_data = authorship.get('author')
                if author_data:
                    author = self._cache_author(author_data, authorship)
                    if author and author not in paper.authors.all():
                        paper.authors.append(author)
            
            db.session.commit()
            return paper
            
        except Exception as e:
            db.session.rollback()
            print(f"Error caching paper: {e}")
            return None
    
    def _cache_author(self, author_data, authorship_data=None):
        try:
            author_id = author_data.get('id', '').split('/')[-1]
            if not author_id:
                return None
            
            author = Author.query.get(author_id)
            if not author:
                author = Author(id=author_id)
            
            author.display_name = author_data.get('display_name', 'Unknown Author')
            author.orcid = author_data.get('orcid', '').replace('https://orcid.org/', '') if author_data.get('orcid') else None
            author.openalex_url = author_data.get('id')
            
            if authorship_data and authorship_data.get('institutions'):
                institutions = authorship_data['institutions']
                if institutions:
                    first_inst = institutions[0]
                    author.last_known_institution = first_inst.get('display_name')
                    author.institution_id = first_inst.get('id', '').split('/')[-1]
            
            author.last_updated = datetime.utcnow()
            
            db.session.add(author)
            return author
            
        except Exception as e:
            print(f"Error caching author: {e}")
            return None
    
    def _reconstruct_abstract(self, inverted_index):
        if not inverted_index:
            return None
        
        word_positions = []
        for word, positions in inverted_index.items():
            for pos in positions:
                word_positions.append((pos, word))
        
        word_positions.sort(key=lambda x: x[0])
        abstract = ' '.join([word for _, word in word_positions])
        
        return abstract