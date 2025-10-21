# PaperLink

A modern academic research platform that helps researchers discover, analyze, and organize scholarly papers with intelligent categorization and interactive visualizations.

## Overview

PaperLink is a web-based application that provides access to over 250 million scholarly works through the OpenAlex API. The platform features intelligent paper classification, complexity-based filtering, interactive citation network visualizations, and comprehensive reference management tools.

## Features

### Core Functionality

- **Comprehensive Search**: Access and search through 250M+ scholarly works via OpenAlex API integration
- **Intelligent Classification**: Automatic categorization of papers as Foundational, Trending, Recent, or Highly Cited based on citation metadata analysis
- **Complexity Assessment**: Abstract-based labeling system that classifies papers as Beginner, Intermediate, or Advanced level
- **Citation Network Visualization**: Interactive force-directed graphs powered by D3.js to explore research landscapes and paper relationships
- **Reference Management**: Built-in system with BibTeX export functionality and custom research paper collections
- **Advanced Filtering**: Filter results by publication date, citation count, author, institution, and research domain

### Classification System

Papers are automatically classified into four categories:

- **Foundational**: Highly cited classical papers that established key concepts in their field
- **Trending**: Recent papers with rapidly growing citation counts indicating emerging importance
- **Recent**: Newly published research from the last two years
- **Highly Cited**: Papers with exceptional citation counts relative to their publication date and field

### Complexity Levels

Based on abstract analysis and readability metrics:

- **Beginner**: Accessible papers suitable for those new to the topic
- **Intermediate**: Standard research papers requiring domain familiarity
- **Advanced**: Highly technical papers requiring specialized knowledge

## Technology Stack

### Frontend
- React.js
- D3.js (Interactive data visualizations)
- HTML5
- CSS3

### Backend
- Python
- Flask (Web framework)
- SQLAlchemy (ORM)
- SQLite (Database)

### External APIs
- OpenAlex API (Scholarly metadata and citation data)

### Deployment
- Vercel (Frontend)
- Render (Backend)
