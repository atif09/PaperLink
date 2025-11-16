
# PaperLink

A modern academic research platform for discovering, analyzing, and organizing scholarly papers with intelligent categorization, interactive citation networks, and personal library management.

## Overview

PaperLink is a web-based application that provides access to millions of scholarly works through the OpenAlex API. The platform features smart paper classification, dynamic filtering, interactive citation network visualizations, and a personal library with BibTeX export—all in a fast, user-friendly interface.

## Features

### Core Functionality

- **Comprehensive Search:** Search and explore scholarly works via OpenAlex API integration
- **Intelligent Categorization:** Automatic labeling of papers as Foundational, Trending, Recent, or Highly Cited based on citation data and publication age
- **Dynamic Filtering:** Instantly filter results by publication year, citation count, and category to reduce network complexity and focus on relevant research
- **Citation Network Visualization:** Interactive, force-directed D3.js graphs to explore citation relationships (both cited and citing papers)
- **Personal Library:** Save papers to custom collections in your browser.
- **BibTeX Export:** Export your saved collections as BibTeX files for easy citation management in LaTeX and reference managers
- **Responsive UI:** Clean, modern interface with real-time feedback and smooth navigation

### Additional Features

- **Paper Details:** View detailed metadata, including authors, venue, year, and citation count for each paper
- **Quick Insights:** Extract and display key insights from papers (if available)
- **No Account Needed:** All features, including library and export, work without user registration—collections are stored locally

## Technology Stack

### Frontend
- React.js
- D3.js (for interactive visualizations)
- HTML5, CSS3

### Backend
- Python
- Flask (API server)
- SQLAlchemy (ORM)
- SQLite (Database)

### External APIs
- OpenAlex API (scholarly metadata and citation data)

### Deployment
- Vercel (Frontend)
- Render (Backend)

---

**Note:**
- User collections and saved papers are stored locally in the browser for privacy and instant access.
- The platform does not currently support user accounts or cloud sync.
