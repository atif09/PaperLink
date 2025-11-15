from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import config
import os

db = SQLAlchemy()


def create_app(config_name='development'):
    app = Flask(__name__, instance_relative_config=True)
    
    app.config.from_object(config[config_name])
    
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        pass
    
    db.init_app(app)
    
    
    CORS(app, resources={r"/*": {"origins": "*"}}, allow_headers="*", expose_headers="*")
    
    with app.app_context():
        from app.routes import search_bp, papers_bp, library_bp
        
        
        app.register_blueprint(search_bp, url_prefix='/api/search')
        app.register_blueprint(papers_bp, url_prefix='/api/papers')
        app.register_blueprint(library_bp, url_prefix='/api/library')
    
    @app.route('/health')
    def health_check():
        return {
            'status': 'healthy',
            'message': 'Research Graph API is running',
            'version': '1.0.0'
        }, 200
    
    @app.route('/')
    def index():
        return {
            'message': 'Research Paper Graph Visualization API',
            'version': '1.0.0',
            'endpoints': {
                'health': '/health',
                'search': '/api/search?q=<query>&year_min=<year>&year_max=<year>',
                'paper_details': '/api/papers/<paper_id>',
                'citation_graph': '/api/papers/<paper_id>/citations',
            },
            'documentation': 'https://github.com/yourusername/research-graph-backend'
        }, 200
    
    return app



