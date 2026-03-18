# NEXUS | SecOps Scanner - Development Guide

Welcome to the NEXUS development environment. This document provides essential context for interacting with and evolving the SecOps Scanner.

## Project Overview
NEXUS is a modern, web-based security scanner interface designed to simplify Nmap operations. It provides real-time status updates, historical scan tracking, and PDF report generation.

## Core Stack
- **Backend:** Flask (Python 3.x)
- **Database:** MariaDB/MySQL (using `mysql-connector-python`)
- **Scanner Engine:** Nmap (external process execution)
- **Frontend:** Vanilla HTML/JS with a dark-themed CSS (Modern UI)
- **Containerization:** Docker & Docker Compose

## Key Architecture Patterns
- **Asynchronous Scanning:** Scans are executed in background threads (`threading.Thread`) to prevent blocking the Flask event loop.
- **Database Initialization:** The `init_db()` function in `ai_studio_code.py` handles schema creation and migrations (e.g., adding the `os` column).
- **Result Parsing:** Regex-based parsing of Nmap stdout into structured database records (`scan_results`, `discovered_hosts`).
- **PDF Generation:** Utilizes `reportlab` for generating downloadable scan reports.

## Critical Files
- `ai_studio_code.py`: The heart of the application (API routes, scanning logic, DB helpers).
- `templates/index.html`: Single-page dashboard interface.
- `requirements.txt`: Python dependencies (Flask, mysql-connector-python, reportlab).
- `Dockerfile` & `docker-compose.yml`: Container configuration.

## Development Workflows
### Database Schema
The database `secops` contains:
- `scans`: Metadata for each scan (target, tool, status, raw output).
- `scan_results`: Port-level details (port, protocol, state, service).
- `discovered_hosts`: Host-level details (IP, hostname, OS).

### Running Locally
1. Ensure MariaDB and Nmap are installed.
2. Set environment variables for DB connection if not using defaults.
3. Run `python ai_studio_code.py`.

### UI/UX Standards
- Maintain the "SecOps" dark-themed aesthetic.
- Ensure all new API endpoints return JSON.
- All scan-initiating actions should be non-blocking for the UI.

## Environment Variables
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Database connectivity.
- `APP_PORT`: Port for the Flask application (default: 5000).
