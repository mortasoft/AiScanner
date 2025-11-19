import subprocess
import threading
import mysql.connector
from flask import Flask, render_template, request, jsonify
import shlex
import datetime

app = Flask(__name__)

# --- CONFIGURATION ---
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',        # Change to your DB user
    'password': '',        # Change to your DB password
    'database': 'secops'
}

# --- DATABASE HELPER ---
def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

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
        
        # 3. Execute Command
        # stderr=subprocess.STDOUT merges errors into output
        process = subprocess.Popen(
            shlex.split(cmd), 
            stdout=subprocess.PIPE, 
            stderr=subprocess.STDOUT,
            text=True
        )
        
        stdout, _ = process.communicate()

        # 4. Update status to COMPLETED
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)