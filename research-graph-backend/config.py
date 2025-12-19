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
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', '')
    # Recommended engine options to avoid stale/closed connections on cloud hosts
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True
    }

    @classmethod
    def init_app(cls, app):
        db_url = cls.SQLALCHEMY_DATABASE_URI
        if not db_url:
            raise ValueError(
                "DATABASE_URL environment variable must be set in production. "
                "Example: postgresql://user:password@host:5432/dbname"
            )

        # Some providers return the legacy `postgres://` scheme; SQLAlchemy expects `postgresql://`
        if db_url.startswith('postgres://'):
            db_url = db_url.replace('postgres://', 'postgresql://', 1)

        # Ensure engine options are applied (e.g. pre-ping to avoid broken connection errors)
        app.config['SQLALCHEMY_DATABASE_URI'] = db_url
        app.config.setdefault('SQLALCHEMY_ENGINE_OPTIONS', {})
        # merge defaults without overwriting any custom settings
        engine_opts = app.config['SQLALCHEMY_ENGINE_OPTIONS']
        engine_opts.update(cls.SQLALCHEMY_ENGINE_OPTIONS)
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = engine_opts


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