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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
SCAN_INTENSITIES = {
    "fast": "-F -PE -n -T4 --osscan-limit --max-retries 1 --host-timeout 10s",
    "deep": "-p- -PE -n -A -T4 --host-timeout 5m",
    "stealth": "-sS -Pn -n -T4 --host-timeout 1m",
    "ping_sweep": "-sn -PE -n -T4 --max-retries 1 --host-timeout 10s",
    "os_detection": "-O -sV -PE -n --osscan-guess -T4 --host-timeout 30s",
    "aggressive": "-A -p- -PE -n -T5 --script default,banner,vuln --host-timeout 5m",
    "script_audit": "-sV -sC -PE -n --script auth,discovery,safe -T4 --host-timeout 3m"
}

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
    nmap_args = SCAN_INTENSITIES.get(intensity_key, SCAN_INTENSITIES["fast"])
    
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
                mac_addr = nm[host]['addresses'].get('mac', 'Unknown')
                vendor = nm[host]['vendor'].get(mac_addr, '')
                mac_full = f"{mac_addr} ({vendor})" if vendor else mac_addr
                
                # OS extraction
                os_info = "Unknown"
                os_match_list = nm[host].get('osmatch', [])
                if os_match_list:
                    os_info = os_match_list[0].get('name', 'Unknown')
                
                host_info = {
                    "ip": host, 
                    "mac": mac_full,
                    "os": os_info,
                    "ports": ", ".join(open_ports_list) or "No open ports found",
                    "status": state
                }
                results.append(host_info)
                print(f"[AURA-HOST] {host} | MAC: {mac_addr} | Ports: {host_info['ports']}", flush=True)

        except Exception as parse_err:
            print(f"[AURA-WARN] ⚠️ Python-nmap parsing failed: {str(parse_err)}. Falling back to direct XML scraping.", flush=True)
            
        # Fallback / Direct scraping if results are empty or python-nmap failed
        if not results:
            print(f"[AURA-DEBUG] Starting direct XML scraping fallback...", flush=True)
            root_xml = ET.fromstring(xml_output)
            for host_node in root_xml.findall('host'):
                ip = "Unknown"
                mac = "Unknown"
                vendor = ""
                
                # Extract IPs and MACs
                for addr in host_node.findall('address'):
                    addr_type = addr.get('addrtype')
                    if addr_type == 'ipv4':
                        ip = addr.get('addr')
                    elif addr_type == 'mac':
                        mac = addr.get('addr')
                        vendor = addr.get('vendor', '')
                
                if ip == "Unknown": continue
                
                # Extract Ports
                ports_found = []
                for port_node in host_node.findall('.//port'):
                    state = port_node.find('state')
                    if state is not None and state.get('state') == 'open':
                        ports_found.append(port_node.get('portid'))
                
                # Extract OS (if available)
                os_name = "Unknown"
                os_node = host_node.find('.//osmatch')
                if os_node is not None:
                    os_name = os_node.get('name', 'Unknown')
                
                mac_display = f"{mac} ({vendor})" if vendor else mac
                
                host_info = {
                    "ip": ip,
                    "mac": mac_display,
                    "os": os_name,
                    "ports": ", ".join(ports_found) or "No open ports found",
                    "status": "up"
                }
                results.append(host_info)
                print(f"[AURA-SCRAPE] {ip} | MAC: {mac} | Ports: {host_info['ports']}", flush=True)
                
        # Final persistence (Aura Registry)
        for host_info in results:
            host_ip = host_info['ip']
            await redis_client.sadd("hosts:list", host_ip)
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

@app.post("/vulnerability/scan")
async def vulerability_scan(target: str, scanner: str = "nessus"):
    return {"status": "success", "message": f"Vulnerability scan started for {target} using {scanner}"}

@app.get("/vulnerability/results")
async def get_vulnerability_results():
    return [
        {"id": "CVE-2021-44228", "severity": "Critical", "description": "Log4j Remote Code Execution", "host": "192.168.1.10"},
        {"id": "CVE-2023-23397", "severity": "High", "description": "Microsoft Outlook Elevation of Privilege", "host": "192.168.1.20"}
    ]
