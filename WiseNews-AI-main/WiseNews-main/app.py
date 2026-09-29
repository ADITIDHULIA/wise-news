"""
WiseNews Web Application
Flask-based UI for WiseNews credibility scoring and summarization
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash

from credibility_model import analyze_article, fetch_article_from_url
from summarization.summarizer import summarize_article

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = 'wisenews-secret-key-change-in-production'
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)

# Simple user database (replace with real DB in production)
USERS = {
    'demo': generate_password_hash('demo123'),
    'user': generate_password_hash('password123')
}


def _build_preview(text, max_words=55):
    """Create a compact preview for UI comparison blocks."""
    words = (text or '').split()

    if len(words) <= max_words:
        return ' '.join(words)

    return ' '.join(words[:max_words]) + '...'


def _get_auth_payload():
    """Parse and validate auth payload fields."""
    data = request.get_json(silent=True) or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''

    if not username or not password:
        raise ValueError('Username and password are required')

    return data, username, password


def _get_article_input():
    """Parse article input from the request body."""
    data = request.get_json()
    input_type = data.get('input_type')  # 'url' or 'text'

    if input_type == 'url':
        url = data.get('url')
        if not url:
            raise ValueError('URL is required')

        article_data = fetch_article_from_url(url)
        return article_data['text'], article_data.get('title', 'Article')

    article_text = data.get('text')
    title = data.get('title')

    if not article_text or not title:
        raise ValueError('Both title and text are required')

    return article_text, title


@app.route('/')
def index():
    """Home page."""
    if 'user' not in session:
        return redirect(url_for('login'))

    return render_template('index.html', user=session['user'])


@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login page."""
    if request.method == 'POST':
        try:
            _, username, password = _get_auth_payload()
        except ValueError as e:
            return jsonify({'success': False, 'message': str(e)}), 400

        if username in USERS and check_password_hash(USERS[username], password):
            session['user'] = username
            return jsonify({'success': True, 'redirect': url_for('index')})
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

    return render_template('login.html')


@app.route('/signup', methods=['POST'])
def signup():
    """Create a new user account."""
    try:
        data, username, password = _get_auth_payload()
    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400

    confirm_password = data.get('confirm_password') or ''

    if len(username) < 3:
        return jsonify({'success': False, 'message': 'Username must be at least 3 characters'}), 400
    if len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters'}), 400
    if password != confirm_password:
        return jsonify({'success': False, 'message': 'Passwords do not match'}), 400
    if username in USERS:
        return jsonify({'success': False, 'message': 'Username already exists'}), 409

    USERS[username] = generate_password_hash(password)
    session['user'] = username
    return jsonify({'success': True, 'redirect': url_for('index')})


@app.route('/logout')
def logout():
    """Logout user."""
    session.clear()
    return redirect(url_for('login'))


@app.route('/analyzer')
def analyzer():
    """News analyzer page."""
    if 'user' not in session:
        return redirect(url_for('login'))

    return render_template('analyzer.html', user=session['user'])


@app.route('/summarizer')
def summarizer():
    """News summarizer page."""
    if 'user' not in session:
        return redirect(url_for('login'))

    return render_template('summarizer.html', user=session['user'])


@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    """API endpoint for credibility analysis."""
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        article_text, title = _get_article_input()

        result = analyze_article(article_text=article_text, title=title)
        breakdown = result.get('breakdown') or result.get('details', {})

        return jsonify({
            'success': True,
            'data': {
                'score': result.get('final_score'),
                'tier': result.get('credibility_tier'),
                'breakdown': breakdown,
                'factors': {
                    'content': breakdown.get('content_score', 0),
                    'source': breakdown.get('source_score', 0),
                    'completeness': breakdown.get('completeness_score', 0),
                    'emotion': breakdown.get('emotion_score', 0),
                    'headline': breakdown.get('headline_score', 0),
                }
            }
        })

    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
    except Exception as e:
        print(f"Error in analysis: {e}")
        return jsonify({'success': False, 'message': f'Analysis failed: {str(e)}'}), 500


@app.route('/api/summarize', methods=['POST'])
def api_summarize():
    """API endpoint for summarization."""
    if 'user' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    try:
        article_text, title = _get_article_input()
        summary = summarize_article(article_text)

        return jsonify({
            'success': True,
            'data': {
                'title': title,
                'summary': summary,
                'original_length': len(article_text.split()),
                'summary_length': len(summary.split()),
                'preview': _build_preview(article_text)
            }
        })

    except ValueError as e:
        return jsonify({'success': False, 'message': str(e)}), 400
    except Exception as e:
        print(f"Error in summarization: {e}")
        return jsonify({'success': False, 'message': f'Summarization failed: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
