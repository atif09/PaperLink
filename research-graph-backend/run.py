import os
from app import create_app, db
from app.models import Paper, Author, Citation

if os.environ.get('DATABASE_URL'):
    config_name = 'production'
else:
    config_name = os.environ.get('FLASK_ENV', 'development')

app = create_app(config_name)


@app.shell_context_processor
def make_shell_context():
    return {
        'db': db,
        'Paper': Paper,
        'Author': Author,
        'Citation': Citation
    }


@app.cli.command()
def init_db():
    db.create_all()
    print("Database initialized successfully!")
    print(f"Database location: {app.config['SQLALCHEMY_DATABASE_URI']}")


@app.cli.command()
def reset_db():
    response = input("This will delete ALL data. Continue? (yes/no): ")
    if response.lower() == 'yes':
        db.drop_all()
        db.create_all()
        print("Database reset successfully!")
    else:
        print("Database reset cancelled.")


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=app.config.get('DEBUG', False)
    )