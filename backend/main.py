import json
import asyncio
import os
import uuid
import nmap
import time
from datetime import datetime
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import re
import subprocess
import redis.asyncio as redis

app = FastAPI(title="Aura API", description="CISO Security Analysis Platform API")

# Helper for Alerts
async def create_security_alert(description: str, severity: str = "Medium"):
    alert_id = str(uuid.uuid4())
    alert = {
        "id": alert_id,
        "timestamp": datetime.now().isoformat(),
        "description": description,
        "severity": severity,
        "status": "unread"
    }
    await redis_client.lpush("alerts:registry", json.dumps(alert))
    # Keep only last 100 alerts
    await redis_client.ltrim("alerts:registry", 0, 99)
    print(f"[AURA-ALERT] ⚠️  {description}", flush=True)

# Dynamic CORS configuration from ENV
env_origins = os.getenv("CORS_ORIGINS", "")
allowed_origins = [o.strip() for o in env_origins.split(",") if o.strip()] or [
    "http://localhost:43210", 
    "http://127.0.0.1:43210", 
    "http://localhost:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    port = os.getenv("BACKEND_PORT", "unknown")
    print(f"\n[AURA-STARTUP] Engine is active and listening on port: {port}", flush=True)
    print(f"[AURA-STARTUP] Forensic API available at: http://localhost:{port}\n", flush=True)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Aura API",
        "version": "1.0.0",
        "message": "CISO Security Intelligence Platform is ready."
    }

# Connect to Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

# Track active subprocesses to allow termination
ACTIVE_PROCESSES = {}

# Nmap Intensity Configurations
# Enriched Scan Profiles for Unified API Delivery
SCAN_PROFILES = {
    "fast": {
        "label": "Fast Discovery",
        "desc": "Minimal footprint, top 100 ports only.",
        "icon": "ZapOff",
        "flags": "-F -PE -n -T4 --osscan-limit --max-retries 1 --host-timeout 10s"
    },
    "deep": {
        "label": "Deep Scan",
        "desc": "Full port inspection with OS/Service detection.",
        "icon": "Server",
        "flags": "-p- -PE -n -A -T4 --host-timeout 5m"
    },
    "stealth": {
        "label": "Stealth Audit",
        "desc": "SYN scan with OS evasion techniques.",
        "icon": "Shield",
        "flags": "-sS -Pn -n -T4 --host-timeout 1m"
    },
    "ping_sweep": {
        "label": "Ping Sweep",
        "desc": "Host discovery without port scanning.",
        "icon": "Activity",
        "flags": "-sn -PE -n -T4 --max-retries 1 --host-timeout 10s"
    },
    "os_detection": {
        "label": "OS Fingerprint",
        "desc": "Deduce OS version via TCP/IP stack.",
        "icon": "Cpu",
        "flags": "-O -sV -PE -n --osscan-guess -T4 --host-timeout 30s"
    },
    "aggressive": {
        "label": "Aggressive",
        "desc": "Full inspection, scripts & vuln scan.",
        "icon": "Zap",
        "flags": "-A -p- -PE -n -T5 --script default,banner,vuln --host-timeout 5m"
    },
    "service_scan": {
        "label": "Service Discovery",
        "desc": "Identify software versions on open ports.",
        "icon": "RefreshCw",
        "flags": "-sV -PE -n -T4 --version-intensity 5 --max-retries 1 --host-timeout 3m"
    },
    "script_audit": {
        "label": "Script Audit",
        "desc": "NSE scripts for auth and discovery.",
        "icon": "FileCode",
        "flags": "-sV -sC -PE -n --script auth,discovery,safe -T4 --host-timeout 3m"
    }
}

@app.get("/scan/profiles")
async def get_scan_profiles():
    return SCAN_PROFILES

def format_duration(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    
    parts = []
    if h > 0:
        parts.append(f"{h}h")
    if m > 0:
        parts.append(f"{m}min")
    if s > 0 or not parts:
        parts.append(f"{s}seg")
    
    return " ".join(parts)

async def perform_nmap_scan(target: str, scan_id: str, intensity_key: str):
    start_time = time.time()
    await redis_client.hset(f"scan:{scan_id}", mapping={"status": "running", "progress": 0})
    
    # Get actual flags from mapping, fallback to fast scan
    profile = SCAN_PROFILES.get(intensity_key, SCAN_PROFILES["fast"])
    nmap_args = profile.get("flags", SCAN_PROFILES["fast"]["flags"])
    
    # Conditional logic: Don't combine -sn (ping only) with port scan flags (-sS, --open)
    if "-sn" in nmap_args:
        full_cmd = f"nmap --stats-every 1s {nmap_args} -oX - {target}"
    else:
        full_cmd = f"nmap --stats-every 1s -sS --open {nmap_args} -oX - {target}"
    
    now_log = datetime.now().strftime("%H:%M:%S")
    import os
    current_uid = os.getuid()
    print(f"\n[{now_log}] [AURA-SCAN] 📡 STARTING NETWORK DISCOVERY (LIVE PROGRESS)", flush=True)
    print(f"[{now_log}] [AURA-SCAN] 🛂 Process UID: {current_uid} {'(ROOT)' if current_uid == 0 else '(NON-ROOT)'}", flush=True)
    print(f"[{now_log}] [AURA-SCAN] 🎯 Target: {target}", flush=True)
    print(f"[{now_log}] [AURA-SCAN] ⚡ Intensity: {intensity_key}", flush=True)
    print(f"[{now_log}] [AURA-SCAN] 🛠  Command: {full_cmd}", flush=True)
    
    try:
        # Use asynchronous subprocess to read nmap output line by line
        process = await asyncio.create_subprocess_shell(
            full_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        # Store process for potential termination
        ACTIVE_PROCESSES[scan_id] = process
        
        xml_output_parts = []
        progress_re = re.compile(r"About (\d+\.\d+)% done")
        
        async def read_stdout():
            nonlocal xml_output_parts
            while True:
                line = await process.stdout.readline()
                if not line: break
                line_str = line.decode('utf-8', errors='ignore')
                xml_output_parts.append(line_str)
        
        async def read_stderr():
            while True:
                line = await process.stderr.readline()
                if not line: break
                line_str = line.decode('utf-8', errors='ignore').strip()
                if not line_str: continue
                
                # Real-time progress visibility from stderr
                match = progress_re.search(line_str)
                if match:
                    progress_val = float(match.group(1))
                    await redis_client.hset(f"scan:{scan_id}", "progress", progress_val)
                    now_log = datetime.now().strftime("%H:%M:%S")
                    print(f"[{now_log}] [AURA-SCAN] 📊 Progress: {progress_val}%", flush=True)

        # Run stdout and stderr readers concurrently
        await asyncio.gather(read_stdout(), read_stderr())
        await process.wait()
        
        xml_output = "".join(xml_output_parts)
        
        # Clean XML output (remove any non-XML preamble)
        xml_start = xml_output.find('<?xml')
        if xml_start != -1:
            xml_output = xml_output[xml_start:]
        else:
            print(f"[AURA-WARN] ⚠️ No XML preamble found in output!", flush=True)
            
        print(f"\n[AURA-RAW-XML] 📝 Forensic Raw Data Dump (600 chars):\n{xml_output[:600]}\n", flush=True)
            
        import xml.etree.ElementTree as ET
        
        now_log = datetime.now().strftime("%H:%M:%S")
        print(f"[{now_log}] [AURA-SCAN] 🧪 Analyzing forensic report ({len(xml_output)} bytes)...", flush=True)
        
        results = []
        now = datetime.now().isoformat()

        try:
            nm = nmap.PortScanner()
            nm.analyse_nmap_xml_scan(xml_output)
            hosts_to_process = nm.all_hosts()
            print(f"[AURA-DEBUG] Python-nmap found {len(hosts_to_process)} hosts.", flush=True)
            
            for host in hosts_to_process:
                state = nm[host].state()
                if state != 'up': continue
                
                # Ports extraction
                open_ports_list = []
                for proto in nm[host].all_protocols():
                    ports = nm[host][proto].keys()
                    for port in ports:
                        if nm[host][proto][port]['state'] == 'open':
                            open_ports_list.append(str(port))
                
                # MAC & Vendor extraction
                mac_addr = nm[host]['addresses'].get('mac', '-')
                vendor = nm[host]['vendor'].get(mac_addr, '')
                mac_full = f"{mac_addr} ({vendor})" if vendor else mac_addr
                
                # Hostname extraction
                hostname = nm[host].hostname() or "-"
                
                # OS extraction
                os_info = "-"
                os_match_list = nm[host].get('osmatch', [])
                if os_match_list:
                    os_info = os_match_list[0].get('name', '-')
                
                host_info = {
                    "ip": host, 
                    "hostname": hostname,
                    "mac": mac_full if mac_addr != '-' else "-",
                    "os": os_info,
                    "ports": ", ".join(open_ports_list) or "-",
                    "status": "up",
                    "internal_id": f"TR7-009-{host.split('.')[-1]}"
                }
                results.append(host_info)
                print(f"[AURA-HOST] {host} ({hostname}) | MAC: {host_info['mac']} | Ports: {host_info['ports']}", flush=True)

        except Exception as parse_err:
            print(f"[AURA-WARN] ⚠️ Python-nmap parsing failed: {str(parse_err)}. Falling back to direct XML scraping.", flush=True)
            
        # Fallback / Direct scraping if results are empty or python-nmap failed
        if not results:
            print(f"[AURA-DEBUG] Starting direct XML scraping fallback...", flush=True)
            root_xml = ET.fromstring(xml_output)
            for host_node in root_xml.findall('host'):
                ip = "-"
                mac = "-"
                vendor = ""
                hostname = "-"
                
                # Extract IPs and MACs
                for addr in host_node.findall('address'):
                    addr_type = addr.get('addrtype')
                    if addr_type == 'ipv4':
                        ip = addr.get('addr')
                    elif addr_type == 'mac':
                        mac = addr.get('addr')
                        vendor = addr.get('vendor', '')
                
                if ip == "-": continue
                
                # Extract Hostname
                hform = host_node.find('.//hostname')
                if hform is not None:
                    hostname = hform.get('name', '-')
                
                # Extract Ports
                ports_found = []
                for port_node in host_node.findall('.//port'):
                    state = port_node.find('state')
                    if state is not None and state.get('state') == 'open':
                        ports_found.append(port_node.get('portid'))
                
                # Extract OS (if available)
                os_name = "-"
                os_node = host_node.find('.//osmatch')
                if os_node is not None:
                    os_name = os_node.get('name', '-')
                
                mac_display = f"{mac} ({vendor})" if vendor else mac
                
                host_info = {
                    "ip": ip,
                    "hostname": hostname,
                    "mac": mac_display if mac != '-' else "-",
                    "os": os_name,
                    "ports": ", ".join(ports_found) or "-",
                    "status": "up",
                    "internal_id": f"TR7-009-{ip.split('.')[-1]}",
                    "urls": ",".join([f"{'https' if p in ['443','8443'] else 'http'}://{ip}:{p}" for p in ports_found if p in ['80','443','8080','8443','3000','5000','8000']])
                }
                results.append(host_info)
                print(f"[AURA-SCRAPE] {ip} ({hostname}) | MAC: {host_info['mac']} | Ports: {host_info['ports']}", flush=True)
                
        # Final persistence (Aura Registry) with Multi-IP support
        for host_info in results:
            host_ip = host_info['ip']
            # Extract clean MAC (no vendor) for lookup
            clean_mac = host_info['mac'].split(' ')[0] if host_info['mac'] != '-' else None
            
            await redis_client.sadd("hosts:list", host_ip)
            
            # Check if host already exists to preserve first_seen and aggregate IPs
            existing_data = await redis_client.hgetall(f"host:{host_ip}")
            
            # Aggregation logic: If we have a MAC, find other IPs sharing it
            all_ips = {host_ip}
            if clean_mac:
                # Store MAC -> IPs mapping for fast lookup
                await redis_client.sadd(f"mac_ips:{clean_mac}", host_ip)
                # Get all IPs currently known for this MAC
                mac_ips = await redis_client.smembers(f"mac_ips:{clean_mac}")
                for m_ip in mac_ips:
                    all_ips.add(m_ip.decode('utf-8') if isinstance(m_ip, bytes) else m_ip)
            
            host_info["all_ips"] = ", ".join(sorted(list(all_ips)))
            
            if not existing_data:
                host_info["first_seen"] = now
                host_info["scan_history"] = scan_id
                # ALERT: New host discovered
                await create_security_alert(f"New unauthorized host detected at {host_ip}", "High")
            else:
                host_info["first_seen"] = existing_data.get("first_seen", now)
                
                # Compare ports for changes
                old_ports = set(existing_data.get("ports", "-").split(", "))
                new_ports = set(host_info["ports"].split(", "))
                
                added_ports = new_ports - old_ports
                removed_ports = old_ports - new_ports
                
                # Handle "-" in sets
                added_ports.discard("-")
                added_ports.discard("")
                removed_ports.discard("-")
                removed_ports.discard("")

                if added_ports:
                    await create_security_alert(f"Critical Shift: Host {host_ip} opened new ports: {', '.join(added_ports)}", "Medium")
                if removed_ports:
                    await create_security_alert(f"Information: Host {host_ip} closed previously active ports: {', '.join(removed_ports)}", "Low")

                # Merge scan history
                prev_scans = existing_data.get("scan_history", "").split(",")
                scan_set = {s.strip() for s in prev_scans if s.strip()}
                scan_set.add(scan_id)
                host_info["scan_history"] = ",".join(sorted(list(scan_set), reverse=True))
                
                # If we had previous aggregated IPs, merge them
                prev_ips = existing_data.get("all_ips", "").split(", ")
                for p_ip in prev_ips:
                    if p_ip and p_ip != "-":
                        all_ips.add(p_ip)
                host_info["all_ips"] = ", ".join(sorted(list(all_ips)))
                # Preserve manual notes during re-scans
                if "notes" in existing_data:
                    host_info["notes"] = existing_data["notes"]

            await redis_client.hset(f"host:{host_ip}", mapping={**host_info, "last_seen": now})
            
        # Serialize and store scan results
        results_json = json.dumps(results)
        await redis_client.set(f"scan:{scan_id}:results", results_json)
        
        size_kb = round(len(results_json.encode('utf-8')) / 1024, 2)
        duration_str = format_duration(time.time() - start_time)
        
        # Mark as completed and finalize metadata
        await redis_client.hset(f"scan:{scan_id}", mapping={
            "status": "completed", 
            "hosts_found": len(results),
            "duration": duration_str,
            "size": f"{size_kb} KB",
            "progress": 100
        })
        
        now_log = datetime.now().strftime("%H:%M:%S")
        print(f"[{now_log}] [AURA-SCAN] ✅ SUCCESS: Found {len(results)} hosts in {duration_str}", flush=True)
        
    except Exception as e:
        now = datetime.now().strftime("%H:%M:%S")
        print(f"[{now}] [AURA-SCAN] ❌ ERROR: {str(e)}", flush=True)
        await redis_client.hset(f"scan:{scan_id}", mapping={"status": "error", "error_msg": str(e)})
    finally:
        # Cleanup process tracking
        if scan_id in ACTIVE_PROCESSES:
            del ACTIVE_PROCESSES[scan_id]

@app.middleware("http")
async def log_requests(request, call_next):
    now = datetime.now().strftime("%H:%M:%S")
    path = request.url.path
    if path != "/scan/history" and not path.endswith("/status"):
        print(f"[{now}] [AURA-API] 📥 RECV: {request.method} {path}")
    response = await call_next(request)
    return response

@app.get("/")
async def root():
    return {"message": "Aura Platform API"}

@app.post("/scan/network")
async def scan_network(target: str, background_tasks: BackgroundTasks, intensity: str = "fast"):
    scan_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    # Create scan metadata in a Hash
    scan_meta = {
        "id": scan_id,
        "target": target,
        "intensity": intensity,
        "status": "queued",
        "started_at": now,
        "hosts_found": 0
    }
    await redis_client.hset(f"scan:{scan_id}", mapping=scan_meta)
    
    # Add to a global list of scans (store the ID)
    await redis_client.lpush("scans:list", scan_id)
    
    now_log = datetime.now().strftime("%H:%M:%S")
    print(f"[{now_log}] [AURA-API] 🚀 MISSION QUEUED: {scan_id} [Intensity: {intensity}]")
    
    background_tasks.add_task(perform_nmap_scan, target, scan_id, intensity)
    return {"status": "success", "message": f"Network scan started for {target}", "scan_id": scan_id}

@app.get("/scan/history")
async def get_scan_history(page: int = 1, size: int = 10):
    # Calculate Redis list range (0-indexed)
    # scans:list is a list of scan IDs, most recent at the start (lpush)
    start = (page - 1) * size
    end = start + size - 1
    
    scan_ids = await redis_client.lrange("scans:list", start, end)
    total_scans = await redis_client.llen("scans:list")
    
    history = []
    for sid in scan_ids:
        meta = await redis_client.hgetall(f"scan:{sid}")
        if meta:
            # Reconstruct the ID into the dict for frontend convenience
            history.append({"id": sid, **meta})
            
    return {
        "items": history,
        "total": total_scans,
        "page": page,
        "size": size,
        "pages": (total_scans + size - 1) // size if total_scans > 0 else 0
    }

@app.get("/scan/{scan_id}/status")
async def get_scan_status(scan_id: str):
    meta = await redis_client.hgetall(f"scan:{scan_id}")
    if not meta:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"status": meta.get("status", "idle")}

@app.get("/scan/{scan_id}/results")
async def get_results(scan_id: str):
    meta = await redis_client.hgetall(f"scan:{scan_id}")
    if not meta:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    if meta.get("status") == "error":
        raise HTTPException(status_code=500, detail=meta.get("error_msg", "Unknown error"))
        
    results_str = await redis_client.get(f"scan:{scan_id}:results")
    if results_str:
        return json.loads(results_str)
    
    return []

@app.delete("/scan/clear")
async def delete_all_scans():
    # Get all scan IDs
    scan_ids = await redis_client.lrange("scans:list", 0, -1)
    
    # Delete each scan hash and its results
    for sid in scan_ids:
        # Terminate any active process for this scan before deleting
        if sid in ACTIVE_PROCESSES:
            process = ACTIVE_PROCESSES[sid]
            try:
                now_log = datetime.now().strftime("%H:%M:%S")
                print(f"[{now_log}] [AURA-API] 🛑 TERMINATING SCAN {sid} (CLEANUP REQUESTED)", flush=True)
                process.terminate()
                # The finally block in perform_nmap_scan will remove it from ACTIVE_PROCESSES
            except Exception as e:
                print(f"Error terminating process {sid}: {e}")

        await redis_client.delete(f"scan:{sid}")
        await redis_client.delete(f"scan:{sid}:results")
        
    # Clear the global scan list
    await redis_client.delete("scans:list")
    
    return {"status": "success", "message": "All scan history cleared"}

@app.delete("/scan/{scan_id}")
async def delete_scan(scan_id: str):
    # First, terminate any active process for this scan
    if scan_id in ACTIVE_PROCESSES:
        process = ACTIVE_PROCESSES[scan_id]
        try:
            now_log = datetime.now().strftime("%H:%M:%S")
            print(f"[{now_log}] [AURA-API] 🛑 TERMINATING SCAN {scan_id} (CLEANUP REQUESTED)", flush=True)
            process.terminate()
            # We don't need to wait here, the background task will catch the termination
        except Exception as e:
            print(f"Error terminating process: {e}")

    # Delete scan metadata and results
    await redis_client.delete(f"scan:{scan_id}")
    await redis_client.delete(f"scan:{scan_id}:results")
    
    # Remove from global list
    await redis_client.lrem("scans:list", 0, scan_id)
    
    now_log = datetime.now().strftime("%H:%M:%S")
    print(f"[{now_log}] [AURA-API] 🗑️  SCAN PURGED: {scan_id}")
    
    return {"status": "success", "message": f"Scan {scan_id} deleted"}

SYSTEM_CONFIG = {
    "name": "AURA",
    "slogan": "Cyber Intelligence",
    "version": "v2.5 Stealth",
    "coverage": 87,
    "posture": "Infrastructure integrity is stable. No unauthorized lateral movements detected in the last scan cycle."
}

@app.get("/stats")
async def get_stats():
    # Fetch real counts from Redis
    total_hosts = await redis_client.scard("hosts:list")
    total_scans = await redis_client.llen("scans:list")
    
    # Get vulnerability count (mocked for now but from the real list)
    vulns = [
        {"id": "CVE-2021-44228", "severity": "Critical"},
        {"id": "CVE-2023-23397", "severity": "High"}
    ]
    
    # Measure Redis latency
    import time
    start_time = time.time()
    await redis_client.ping()
    db_latency = round((time.time() - start_time) * 1000, 2)
    
    return {
        "system": SYSTEM_CONFIG,
        "total_hosts": total_hosts,
        "total_scans": total_scans,
        "total_vulnerabilities": len(vulns),
        "db_latency": f"{db_latency}ms",
        "engine_status": "Operational",
        "platform_integrity": "100%",
        "last_sync": datetime.now().strftime("%H:%M:%S")
    }

@app.get("/hosts")
async def get_all_hosts():
    host_ips = await redis_client.smembers("hosts:list")
    if not host_ips:
        return []
        
    hosts = []
    for ip in host_ips:
        host_data = await redis_client.hgetall(f"host:{ip}")
        if host_data:
            # We will eventually append vulnerabilities info here too
            # Using placeholder "vulns": 0 for now
            host_data["vulns"] = 0
            hosts.append(host_data)
            
    return hosts
@app.post("/host/{ip}/notes")
async def update_host_notes(ip: str, data: dict):
    notes = data.get("notes", "")
    await redis_client.hset(f"host:{ip}", "notes", notes)
    
    now_log = datetime.now().strftime("%H:%M:%S")
    print(f"[{now_log}] [AURA-API] 📝 NOTES UPDATED FOR {ip}")
    return {"status": "success"}

@app.post("/host/{ip}/urls")
async def update_host_urls(ip: str, data: dict):
    new_url = data.get("url", "")
    if not new_url:
        return {"error": "URL is required"}
        
    host_data = await redis_client.hgetall(f"host:{ip}")
    current_urls = host_data.get("urls", "")
    url_list = [u.strip() for u in current_urls.split(",") if u.strip()]
    
    if new_url not in url_list:
        url_list.append(new_url)
        await redis_client.hset(f"host:{ip}", "urls", ",".join(url_list))
        
    now_log = datetime.now().strftime("%H:%M:%S")
    print(f"[{now_log}] [AURA-API] 🔗 URL ADDED FOR {ip}: {new_url}")
    return {"status": "success", "urls": ",".join(url_list)}

@app.put("/host/{ip}/hostname")
async def update_host_hostname(ip: str, data: dict):
    new_hostname = data.get("hostname", "-")
    await redis_client.hset(f"host:{ip}", "hostname", new_hostname)
    
    now_log = datetime.now().strftime("%H:%M:%S")
    print(f"[{now_log}] [AURA-API] 📝 HOSTNAME OVERRIDE FOR {ip}: {new_hostname}")
    return {"status": "success", "hostname": new_hostname}

@app.put("/host/{ip}/os")
async def update_host_os(ip: str, data: dict):
    new_os = data.get("os", "-")
    await redis_client.hset(f"host:{ip}", "os", new_os)
    
    now_log = datetime.now().strftime("%H:%M:%S")
    print(f"[{now_log}] [AURA-API] 🖥️  OS OVERRIDE FOR {ip}: {new_os}")
    return {"status": "success", "os": new_os}

@app.put("/host/{ip}/urls")
async def update_host_urls_list(ip: str, data: dict):
    urls = data.get("urls", [])
    if not isinstance(urls, list):
        return {"error": "URLs must be a list"}
        
    await redis_client.hset(f"host:{ip}", "urls", ",".join(urls))
    
    now_log = datetime.now().strftime("%H:%M:%S")
    print(f"[{now_log}] [AURA-API] 🔄 URL LIST UPDATED FOR {ip}")
    return {"status": "success", "urls": ",".join(urls)}
    
@app.get("/alerts")
async def get_security_alerts():
    alerts_raw = await redis_client.lrange("alerts:registry", 0, -1)
    return [json.loads(a) for a in alerts_raw]

@app.delete("/alerts/{alert_id}")
async def dismiss_alert(alert_id: str):
    alerts_raw = await redis_client.lrange("alerts:registry", 0, -1)
    for a in alerts_raw:
        alert = json.loads(a)
        if alert["id"] == alert_id:
            await redis_client.lrem("alerts:registry", 1, a)
            return {"status": "success"}
    return {"status": "error", "message": "Alert not found"}

@app.delete("/host/{ip}")
async def delete_host(ip: str):
    # Get host data first to find MAC for cleanup
    host_data = await redis_client.hgetall(f"host:{ip}")
    if host_data and "mac" in host_data:
        clean_mac = host_data["mac"].split(' ')[0]
        if clean_mac and clean_mac != "-":
            await redis_client.srem(f"mac_ips:{clean_mac}", ip)
            
    # Purge from global list and delete data
    await redis_client.srem("hosts:list", ip)
    await redis_client.delete(f"host:{ip}")
    
    now_log = datetime.now().strftime("%H:%M:%S")
    print(f"[{now_log}] [AURA-API] 🗑️  ENDPOINT PURGED: {ip}")
    
    return {"status": "success", "message": f"Endpoint {ip} removed from registry"}

@app.post("/vulnerability/scan")
async def vulerability_scan(target: str, scanner: str = "nessus"):
    return {"status": "success", "message": f"Vulnerability scan started for {target} using {scanner}"}

@app.get("/vulnerability/results")
async def get_vulnerability_results():
    return [
        {"id": "CVE-2021-44228", "severity": "Critical", "description": "Log4j Remote Code Execution", "host": "192.168.1.10"},
        {"id": "CVE-2023-23397", "severity": "High", "description": "Microsoft Outlook Elevation of Privilege", "host": "192.168.1.20"}
    ]
