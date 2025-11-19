import subprocess
import threading
import mysql.connector
from flask import Flask, render_template, request, jsonify
import shlex
import datetime
import re
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from flask import send_file

app = Flask(__name__)
APP_VERSION = "1.2.0"

@app.context_processor
def inject_version():
    return dict(version=APP_VERSION)

import os

# --- CONFIGURATION ---
DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': os.environ.get('DB_NAME', 'secops')
}

# --- DATABASE HELPER ---
def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

def init_db():
    """Initialize the database and tables."""
    try:
        # 1. Create Database if not exists
        # Copy config and remove database to connect to server only
        config_no_db = DB_CONFIG.copy()
        if 'database' in config_no_db:
            db_name = config_no_db.pop('database')
        else:
            db_name = 'secops' # Default fallback

        conn = mysql.connector.connect(**config_no_db)
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        conn.close()

        # 2. Create Table
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                target VARCHAR(255) NOT NULL,
                tool VARCHAR(50),
                status VARCHAR(50),
                output LONGTEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scan_results (
                id INT AUTO_INCREMENT PRIMARY KEY,
                scan_id INT,
                port INT,
                protocol VARCHAR(10),
                state VARCHAR(20),
                service VARCHAR(100),
                FOREIGN KEY (scan_id) REFERENCES scans(id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS discovered_hosts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                scan_id INT,
                ip VARCHAR(50),
                hostname VARCHAR(255),
                os VARCHAR(255),
                FOREIGN KEY (scan_id) REFERENCES scans(id)
            )
        """)
        
        # Add os column if it doesn't exist (for existing databases)
        try:
            cursor.execute("ALTER TABLE discovered_hosts ADD COLUMN os VARCHAR(255)")
            print("Added 'os' column to discovered_hosts table")
        except Exception as e:
            # Column already exists or other error - safe to ignore
            pass
        
        conn.commit()
        conn.close()
        print("Database initialized successfully.")
    except Exception as e:
        print(f"Database initialization failed: {e}")

# --- BACKGROUND SCANNER ENGINE ---
def run_nmap_task(scan_id, target, tool_type):
    """
    Executed in a background thread. Runs the command and updates DB.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 1. Update status to RUNNING
        cursor.execute("UPDATE scans SET status = 'RUNNING' WHERE id = %s", (scan_id,))
        conn.commit()

        # 2. Construct Command (Security Note: In production, validate 'target' strictly!)
        # We use -F for Fast mode in this demo to save time
        cmd = f"nmap -F {target}" 
        if tool_type == 'intense':
            cmd = f"nmap -T4 -A -v {target}"
        elif tool_type == 'os_scan':
            cmd = f"nmap -O {target}"
        elif tool_type == 'ping_scan':
            cmd = f"nmap -sn {target}/24"
        
        # 3. Execute Command
        # stderr=subprocess.STDOUT merges errors into output
        process = subprocess.Popen(
            shlex.split(cmd), 
            stdout=subprocess.PIPE, 
            stderr=subprocess.STDOUT,
            text=True
        )
        
        stdout, _ = process.communicate()

        # Parse Hosts and OS information
        host_regex = r"Nmap scan report for ([\w\.-]+)(?: \(([\d\.]+)\))?"
        host_matches = re.findall(host_regex, stdout)
        
        # Parse OS info - look for "Running:" or "OS details:" lines
        os_regex = r"(?:Running|OS details):\s*([^\n]+)"
        os_matches = re.findall(os_regex, stdout)
        
        # Create a simple mapping - if we have OS info, try to associate it with hosts
        # For simplicity, we'll use the first OS match found (Nmap typically shows one OS per host)
        detected_os = os_matches[0] if os_matches else ""
        
        for match in host_matches:
            # If IP is in group 2, group 1 is hostname. If group 2 is empty, group 1 is IP.
            if match[1]:
                hostname = match[0]
                ip = match[1]
            else:
                hostname = ""
                ip = match[0]
            
            cursor.execute(
                "INSERT INTO discovered_hosts (scan_id, ip, hostname, os) VALUES (%s, %s, %s, %s)",
                (scan_id, ip, hostname, detected_os)
            )

        # Parse Ports
        port_regex = r"(\d+)/(tcp|udp)\s+(\w+)\s+(\S+)"
        matches = re.findall(port_regex, stdout)
        
        for match in matches:
            port, protocol, state, service = match
            cursor.execute(
                "INSERT INTO scan_results (scan_id, port, protocol, state, service) VALUES (%s, %s, %s, %s, %s)",
                (scan_id, port, protocol, state, service)
            )

        # 5. Update status to COMPLETED
        cursor.execute(
            "UPDATE scans SET status = 'COMPLETED', output = %s WHERE id = %s", 
            (stdout, scan_id)
        )
        conn.commit()

    except Exception as e:
        cursor.execute(
            "UPDATE scans SET status = 'FAILED', output = %s WHERE id = %s", 
            (str(e), scan_id)
        )
        conn.commit()
    finally:
        cursor.close()
        conn.close()

# --- API ROUTES ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/scan', methods=['POST'])
def start_scan():
    data = request.json
    target = data.get('target')
    tool = data.get('tool')

    if not target:
        return jsonify({'error': 'Target required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create initial DB record
    cursor.execute(
        "INSERT INTO scans (target, tool, status, output) VALUES (%s, %s, 'PENDING', '')", 
        (target, tool)
    )
    conn.commit()
    scan_id = cursor.lastrowid
    cursor.close()
    conn.close()

    # Start Background Thread
    thread = threading.Thread(target=run_nmap_task, args=(scan_id, target, tool))
    thread.start()

    return jsonify({'message': 'Scan started', 'scan_id': scan_id})

@app.route('/api/status/<int:scan_id>', methods=['GET'])
def check_status(scan_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM scans WHERE id = %s", (scan_id,))
    scan = cursor.fetchone()
    
    if scan:
        cursor.execute("SELECT * FROM scan_results WHERE scan_id = %s", (scan_id,))
        scan['results'] = cursor.fetchall()
        
        cursor.execute("SELECT * FROM discovered_hosts WHERE scan_id = %s", (scan_id,))
        scan['hosts'] = cursor.fetchall()

    cursor.close()
    conn.close()

    if scan:
        return jsonify(scan)
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/history', methods=['GET'])
def get_history():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    # Get last 50 scans, newest first
    cursor.execute("SELECT * FROM scans ORDER BY id DESC LIMIT 50")
    scans = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(scans)

@app.route('/api/hosts', methods=['GET'])
def get_hosts():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM discovered_hosts ORDER BY id DESC")
    hosts = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(hosts)

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Total hosts
    cursor.execute("SELECT COUNT(DISTINCT ip) as total FROM discovered_hosts")
    total_hosts = cursor.fetchone()['total']
    
    # Hosts per subnet
    cursor.execute("""
        SELECT SUBSTRING_INDEX(ip, '.', 3) as subnet, COUNT(*) as count 
        FROM discovered_hosts 
        GROUP BY subnet
    """)
    hosts_per_subnet = cursor.fetchall()
    
    # Count by OS
    cursor.execute("""
        SELECT os, COUNT(*) as count 
        FROM discovered_hosts 
        WHERE os != '' 
        GROUP BY os 
        ORDER BY count DESC
    """)
    os_counts = cursor.fetchall()
    
    # Top 10 hosts with most open ports
    cursor.execute("""
        SELECT h.ip, h.hostname, COUNT(sr.id) as port_count
        FROM discovered_hosts h
        LEFT JOIN scan_results sr ON h.scan_id = sr.scan_id
        GROUP BY h.ip, h.hostname
        ORDER BY port_count DESC
        LIMIT 10
    """)
    top_hosts = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'total_hosts': total_hosts,
        'hosts_per_subnet': hosts_per_subnet,
        'os_counts': os_counts,
        'top_hosts': top_hosts
    })

@app.route('/api/delete/<int:scan_id>', methods=['DELETE'])
def delete_scan(scan_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Delete related records first (foreign key constraints)
    cursor.execute("DELETE FROM scan_results WHERE scan_id = %s", (scan_id,))
    cursor.execute("DELETE FROM discovered_hosts WHERE scan_id = %s", (scan_id,))
    cursor.execute("DELETE FROM scans WHERE id = %s", (scan_id,))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Scan deleted successfully'})

def generate_pdf(scan, results):
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Header
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, height - 50, f"NEXUS Scan Report - #{scan['id']}")
    
    p.setFont("Helvetica", 12)
    p.drawString(50, height - 80, f"Target: {scan['target']}")
    p.drawString(50, height - 100, f"Tool: {scan['tool']}")
    p.drawString(50, height - 120, f"Date: {scan['created_at']}")
    p.drawString(50, height - 140, f"Status: {scan['status']}")

    # Results Table Header
    y = height - 180
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Port")
    p.drawString(120, y, "Protocol")
    p.drawString(200, y, "State")
    p.drawString(300, y, "Service")
    
    # Results Rows
    y -= 20
    p.setFont("Helvetica", 10)
    for res in results:
        if y < 50: # New page if needed
            p.showPage()
            y = height - 50
        
        p.drawString(50, y, str(res['port']))
        p.drawString(120, y, res['protocol'])
        p.drawString(200, y, res['state'])
        p.drawString(300, y, res['service'])
        y -= 15

    # Raw Output
    y -= 30
    if y < 50:
        p.showPage()
        y = height - 50
    
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Raw Output")
    y -= 20

    p.setFont("Courier", 9)
    raw_output = scan.get('output', '')
    if raw_output:
        for line in raw_output.split('\n'):
            if y < 50:
                p.showPage()
                p.setFont("Courier", 9)
                y = height - 50
            p.drawString(50, y, line)
            y -= 12

    p.save()
    buffer.seek(0)
    return buffer

@app.route('/api/download/<int:scan_id>')
def download_pdf(scan_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get Scan Info
    cursor.execute("SELECT * FROM scans WHERE id = %s", (scan_id,))
    scan = cursor.fetchone()
    
    # Get Results
    cursor.execute("SELECT * FROM scan_results WHERE scan_id = %s", (scan_id,))
    results = cursor.fetchall()
    
    cursor.close()
    conn.close()

    if not scan:
        return "Scan not found", 404

    pdf = generate_pdf(scan, results)
    return send_file(
        pdf,
        as_attachment=True,
        download_name=f"scan_report_{scan_id}.pdf",
        mimetype='application/pdf'
    )

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('APP_PORT', 5000))
    app.run(debug=True, port=port, host='0.0.0.0')