# WiseNews Web Interface

A professional, modern web UI for the WiseNews credibility analysis and summarization system.

## Features

✨ **4-Page Application:**
1. **Login Page** - Secure authentication
2. **Home Page** - Latest news feed and feature overview
3. **Analyzer Page** - News credibility scoring with detailed breakdown
4. **Summarizer Page** - AI-powered article summarization

## Quick Start

### 1. Install Web Dependencies

```bash
pip install -r web_requirements.txt
```

### 2. Run the Application

```bash
python app.py
```

The application will start on `http://localhost:5000`

### 3. Login

Use demo credentials:
- **Username:** `demo`
- **Password:** `demo123`

## Pages Overview

### 🔐 Login Page
- Secure authentication
- Demo credentials included
- Beautiful gradient background
- Responsive design

### 🏠 Home Page
- Welcome hero section
- Features overview (4 key features)
- Latest news feed from major sources
- How it works section
- Call-to-action buttons

### 📊 Analyzer Page
- Dual input modes:
  - 📎 URL Input: Analyze articles from any URL
  - 📝 Text Input: Paste article title and text
- Results show:
  - **Credibility Score** (0-100) with visual gauge
  - **Tier Classification** (High/Moderate/Low/Very Low)
  - **Detailed Breakdown** of 5 factors:
    - Content Quality (RoBERTa)
    - Source Credibility
    - Content Completeness
    - Emotional Tone
    - Headline Quality
- Each factor shows:
  - Score and max points
  - Progress bar
  - Description

### 📝 Summarizer Page
- Same dual input modes as Analyzer
- Results show:
  - Article title
  - AI-generated summary
  - Statistics (original length, summary length, compression %)
  - Original vs Summary comparison
  - Quick links to analyze the article

## Technical Stack

- **Backend:** Flask (Python web framework)
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Charts:** Chart.js for visualization
- **Styling:** Custom CSS with responsive design

## Customization

### Add More Users
Edit `app.py` and modify the `USERS` dictionary:
```python
USERS = {
    'demo': generate_password_hash('demo123'),
    'user': generate_password_hash('password123'),
    'newuser': generate_password_hash('newpassword')  # Add here
}
```

### Change Styling
Edit `static/css/style.css` or directly in the template files.

### Modify News Sources
Update `NEWS_FEEDS` list in `app.py`:
```python
NEWS_FEEDS = [
    'https://feeds.your-source.com/feed',
    'https://another-feed.com/rss',
]
```

## Color Scheme

- **Primary:** `#667eea` (Indigo)
- **Secondary:** `#764ba2` (Purple)
- **Success:** `#10b981` (Green)
- **Warning:** `#f59e0b` (Amber)
- **Danger:** `#ef4444` (Red)

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Production Deployment

For production:

1. **Change SECRET_KEY** in `app.py`:
   ```python
   app.config['SECRET_KEY'] = 'your-secure-random-key'
   ```

2. **Use a production WSGI server** (e.g., Gunicorn):
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

3. **Set up HTTPS/SSL** using a reverse proxy like Nginx

4. **Use a real database** instead of in-memory user storage

5. **Add rate limiting** to prevent abuse

## Troubleshooting

**Issue:** Port 5000 already in use
```bash
# Change the port in app.py:
app.run(debug=True, host='0.0.0.0', port=5001)
```

**Issue:** Templates not found
- Ensure `templates/` folder is created
- Ensure templates are in the correct location

**Issue:** Static files not loading
- Check `static/` folder structure
- Clear browser cache (Ctrl+Shift+Delete)

## API Endpoints

All endpoints require authentication (user session).

### POST `/api/analyze`
Analyze article credibility

**Request:**
```json
{
    "input_type": "url|text",
    "url": "https://example.com/article",  // if URL input
    "title": "Article Title",              // if text input
    "text": "Article content..."           // if text input
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "score": 65,
        "tier": "Moderate Credibility",
        "factors": {
            "content": 30,
            "source": 20,
            "completeness": 3,
            "emotion": 8,
            "headline": 9
        }
    }
}
```

### POST `/api/summarize`
Summarize an article

**Request:**
```json
{
    "input_type": "url|text",
    "url": "https://example.com/article",  // if URL input
    "title": "Article Title",              // if text input
    "text": "Article content..."           // if text input
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "title": "Article Title",
        "summary": "Concise summary of the article...",
        "original_length": 500,
        "summary_length": 100
    }
}
```

## License

This project is part of WiseNews. See main README for license details.
