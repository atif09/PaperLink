import os
from sqlalchemy import create_engine
from app import create_app, db

os.environ['FLASK_ENV'] = 'production'

app = create_app('production')

with app.app_context():
    db.create_all()
    print("Database tables created successfully")