import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    OPENALEX_API_URL = 'https://api.openalex.org'
    OPENALEX_EMAIL = os.environ.get('OPENALEX_EMAIL')
    API_RATE_LIMIT_CALLS = 10
    API_RATE_LIMIT_PERIOD = 1
    CACHE_DEFAULT_TIMEOUT = timedelta(days=30).total_seconds()
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_ECHO = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///C:/PaperLink/research-graph-backend/research_graph.db'


class ProductionConfig(Config):
    DEBUG = False
    
    def __init__(self):
        super().__init__()
        db_url = os.environ.get('DATABASE_URL')
        if not db_url:
            raise ValueError("DATABASE_URL environment variable must be set in production")
        if db_url.startswith('postgres://'):
            db_url = db_url.replace('postgres://', 'postgresql://', 1)
        self.SQLALCHEMY_DATABASE_URI = db_url


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}