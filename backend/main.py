import json
import asyncio
import os
import uuid
import nmap
from datetime import datetime
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import redis.asyncio as redis

app = FastAPI(title="AiScanner API", description="CISO Security Analysis Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

async def perform_nmap_scan(target: str, scan_id: str):
    await redis_client.hset(f"scan:{scan_id}", "status", "running")
    try:
        def run_scan():
            nm = nmap.PortScanner()
            nm.scan(hosts=target, arguments='-F -T4 --osscan-limit')
            return nm
        
        nm = await asyncio.to_thread(run_scan)
        
        results = []
        now = datetime.utcnow().isoformat()
        
        for host in nm.all_hosts():
            host_info = {"ip": host, "mac": "Unknown", "os": "Unknown", "ports": "None", "status": nm[host].state()}
            
            if 'mac' in nm[host]['addresses']:
                host_info["mac"] = nm[host]['addresses']['mac']
            
            if 'osmatch' in nm[host] and len(nm[host]['osmatch']) > 0:
                host_info["os"] = nm[host]['osmatch'][0]['name']
                
            if 'tcp' in nm[host]:
                open_ports = [str(port) for port in nm[host]['tcp'].keys() if nm[host]['tcp'][port]['state'] == 'open']
                host_info["ports"] = ", ".join(open_ports) if open_ports else "None"
                
            results.append(host_info)
            
            # Centralized Database Update
            await redis_client.sadd("hosts:list", host)
            await redis_client.hset(f"host:{host}", mapping={
                "ip": host,
                "mac": host_info["mac"],
                "os": host_info["os"],
                "ports": host_info["ports"],
                "status": host_info["status"],
                "last_seen": now
            })
            
        await redis_client.set(f"scan:{scan_id}:results", json.dumps(results))
        # Update summary finding counts
        await redis_client.hset(f"scan:{scan_id}", mapping={"status": "completed", "hosts_found": len(results)})
        
    except Exception as e:
        await redis_client.hset(f"scan:{scan_id}", mapping={"status": "error", "error_msg": str(e)})

@app.get("/")
async def root():
    return {"message": "AiScanner Platform API"}

@app.post("/scan/network")
async def scan_network(target: str, background_tasks: BackgroundTasks):
    scan_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    # Create scan metadata in a Hash
    scan_meta = {
        "id": scan_id,
        "target": target,
        "status": "queued",
        "started_at": now,
        "hosts_found": 0
    }
    await redis_client.hset(f"scan:{scan_id}", mapping=scan_meta)
    
    # Add to a global list of scans (store the ID)
    await redis_client.lpush("scans:list", scan_id)
    
    background_tasks.add_task(perform_nmap_scan, target, scan_id)
    return {"status": "success", "message": f"Network scan started for {target}", "scan_id": scan_id}

@app.get("/scan/history")
async def get_scan_history():
    # Get all scan IDs
    scan_ids = await redis_client.lrange("scans:list", 0, -1)
    if not scan_ids:
        return []
    
    # Fetch details for each scan
    scans = []
    for sid in scan_ids:
        meta = await redis_client.hgetall(f"scan:{sid}")
        if meta:
            scans.append(meta)
            
    return scans

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
