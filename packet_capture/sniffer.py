"""
Network Packet Sniffer and Simulator Module (packet_capture/sniffer.py)
----------------------------------------------------------------------
Purpose: Captures network traffic using Scapy (if admin privileges and npcap are available)
         or falls back to generating highly realistic simulated traffic logs.
Why: Network monitoring is the foundation of intrusion detection. To guarantee that the application
     works in any environment without complex driver setup, a hybrid simulation fallback is implemented.
"""

import time
import random
from datetime import datetime
import threading
import sys
import os

# Try importing scapy components
try:
    from scapy.all import sniff, IP, TCP, UDP
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False

# Maximum packets to keep in the memory buffer
MAX_BUFFER_SIZE = 100

class PacketSniffer:
    """
    Purpose: Sniffs network packets or simulates traffic, storing packets in a memory buffer.
    """
    def __init__(self):
        """
        Purpose: Initialize packet buffer and status flags.
        """
        self.packet_buffer = []
        self.is_running = False
        self.thread = None
        self.scapy_active = SCAPY_AVAILABLE
        self.lock = threading.Lock()
        
        # Predefined mock IPs for simulations
        self.hospital_ips = [
            "192.168.10.101", "192.168.10.102", "192.168.10.103", # ICU
            "192.168.20.101", "192.168.20.102", "192.168.20.103", # ER
            "192.168.30.101", "192.168.30.102",                   # OT
            "192.168.40.101", "192.168.40.102",                   # Radiology
            "192.168.50.101", "192.168.60.101", "192.168.70.101", # Pharmacy, Lab, Ward
            "192.168.80.101", "192.168.90.101", "192.168.100.101" # Server, Router, Reception
        ]
        self.attacker_ips = [
            "10.0.0.5", "10.0.0.12", "198.51.100.42", "203.0.113.88", "185.190.140.17"
        ]

    def add_packet_to_buffer(self, packet_dict):
        """
        Purpose: Safely append a packet to the buffer and maintain the size limit.
        Input: packet_dict (dict)
        Output: None
        """
        with self.lock:
            self.packet_buffer.append(packet_dict)
            if len(self.packet_buffer) > MAX_BUFFER_SIZE:
                self.packet_buffer.pop(0)

    def get_recent_packets(self, count=50):
        """
        Purpose: Retrieve recent packets from the buffer.
        Input: count (int)
        Output: List of packet dictionaries.
        """
        with self.lock:
            if not self.packet_buffer:
                now_str = datetime.now().strftime("%H:%M:%S")
                for _ in range(min(count, 10)):
                    self.packet_buffer.append({
                        "src_ip": random.choice(self.hospital_ips),
                        "dst_ip": random.choice(self.hospital_ips),
                        "protocol": random.choice(["TCP", "UDP", "HL7/TLS"]),
                        "port": random.choice([443, 8080, 502, 104]),
                        "size": random.randint(128, 1024),
                        "timestamp": now_str,
                        "status": "Normal"
                    })
            return list(self.packet_buffer[-count:])

    def _scapy_packet_callback(self, packet):
        """
        Purpose: Callback function called by Scapy for every sniffed packet.
        Input: Scapy packet object
        Output: None
        Logic: Extracts IP layers, determines protocol, converts to database/frontend log layout.
        """
        if packet.haslayer(IP):
            src_ip = packet[IP].src
            dst_ip = packet[IP].dst
            proto = "OTHER"
            port = 0
            
            if packet.haslayer(TCP):
                proto = "TCP"
                port = packet[TCP].dport
            elif packet.haslayer(UDP):
                proto = "UDP"
                port = packet[UDP].dport
            
            packet_dict = {
                "src_ip": src_ip,
                "dst_ip": dst_ip,
                "protocol": proto,
                "port": port,
                "size": len(packet),
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "status": "Normal"
            }
            
            # Simple heuristic flags for visualization
            if port in (22, 23, 3389, 445) and src_ip in self.attacker_ips:
                packet_dict["status"] = "Flagged"
            
            self.add_packet_to_buffer(packet_dict)

    def _run_scapy_sniffer(self):
        """
        Purpose: Loop for raw packet sniffing using Scapy.
        """
        print("Starting Scapy Sniffer...")
        try:
            # Sniff indefinitely on default interface, calls callback on each IP packet
            sniff(filter="ip", prn=self._scapy_packet_callback, store=0, stop_filter=lambda x: not self.is_running)
        except Exception as e:
            print(f"Scapy Sniffing failed (likely lacks administrator permissions or Npcap): {e}")
            print("Switching to Simulated Fallback Sniffer...")
            self.scapy_active = False
            self._run_simulated_sniffer()

    def _run_simulated_sniffer(self):
        """
        Purpose: Background loop for generating highly realistic mock network packets.
        Input: None
        Output: None
        Logic: Generates packet patterns matching hospital operations and occasional attacks.
        """
        print("Starting Fallback Packet Simulator...")
        current_attack_type = None
        attack_timer = 0
        
        while self.is_running:
            # 1. Periodically alternate attack simulations to showcase ML detection
            if attack_timer <= 0:
                # 15% chance to start an attack simulation, else remain normal
                if random.random() < 0.15:
                    current_attack_type = random.choice(["DDoS", "Port Scan", "Brute Force", "Spoofing", "Botnet"])
                    attack_timer = random.randint(5, 12) # attack lasts 5 to 12 packets
                else:
                    current_attack_type = "Normal"
                    attack_timer = random.randint(5, 15)
            
            # 2. Construct simulated packet according to state
            timestamp_str = datetime.now().strftime("%H:%M:%S")
            
            if current_attack_type == "Normal":
                src = random.choice(self.hospital_ips)
                dst = random.choice(self.hospital_ips)
                while dst == src:
                    dst = random.choice(self.hospital_ips)
                proto = random.choice(["TCP", "UDP"])
                port = random.choice([80, 443, 502, 104, 53, 123])
                size = random.randint(64, 512)
                status = "Normal"
                time_to_sleep = random.uniform(0.5, 1.5)
                
            elif current_attack_type == "DDoS":
                # Fast stream of small packets targeting a specific device
                src = random.choice(self.attacker_ips)
                dst = "192.168.10.102" # ICU Ventilator target
                proto = "TCP"
                port = 80
                size = random.randint(64, 128)
                status = "Flagged"
                time_to_sleep = 0.05 # high frequency
                
            elif current_attack_type == "Port Scan":
                # Single external IP targeting multiple sequential ports
                src = random.choice(self.attacker_ips)
                dst = "192.168.80.101" # Database target
                proto = "TCP"
                # Scan sequential ports
                port = random.randint(20, 1024)
                size = 32
                status = "Flagged"
                time_to_sleep = 0.1
                
            elif current_attack_type == "Brute Force":
                # Repeated connection attempts to SSH/Telnet/RDP ports
                src = random.choice(self.attacker_ips)
                dst = "192.168.90.101" # Router target
                proto = "TCP"
                port = random.choice([22, 23, 3389])
                size = random.randint(128, 256)
                status = "Flagged"
                time_to_sleep = 0.4
                
            elif current_attack_type == "Spoofing":
                # Mimics telemetry manipulation from internal looking IP
                src = "192.168.10.103" # spoofed internal IP
                dst = "192.168.80.101"
                proto = "UDP"
                port = 502 # Modbus protocol
                size = random.randint(512, 1024) # heavy payload containing commands
                status = "Flagged"
                time_to_sleep = 0.8
                
            elif current_attack_type == "Botnet":
                # High-rate bulk payloads exfiltrating database tables
                src = "192.168.80.101" # Database infected machine
                dst = random.choice(self.attacker_ips) # C2 server
                proto = "TCP"
                port = 4444 # backdoor port
                size = random.randint(1000, 1500) # massive data transfer packets
                status = "Flagged"
                time_to_sleep = 0.2

            packet_dict = {
                "src_ip": src,
                "dst_ip": dst,
                "protocol": proto,
                "port": port,
                "size": size,
                "timestamp": timestamp_str,
                "status": status,
                "simulated_attack": current_attack_type if status == "Flagged" else "Normal"
            }
            
            self.add_packet_to_buffer(packet_dict)
            attack_timer -= 1
            time.sleep(time_to_sleep)

    def start(self):
        """
        Purpose: Start the sniffer thread.
        """
        if not self.is_running:
            self.is_running = True
            if self.scapy_active:
                self.thread = threading.Thread(target=self._run_scapy_sniffer, daemon=True)
            else:
                self.thread = threading.Thread(target=self._run_simulated_sniffer, daemon=True)
            self.thread.start()
            print("Sniffer thread spawned.")

    def stop(self):
        """
        Purpose: Gracefully stop the sniffer thread.
        """
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=2)
            print("Sniffer thread stopped.")

if __name__ == "__main__":
    # Test execution
    sniffer = PacketSniffer()
    sniffer.start()
    try:
        for _ in range(10):
            time.sleep(1)
            packets = sniffer.get_recent_packets(5)
            print(f"Captured {len(packets)} packets. Latest: {packets[-1] if packets else 'None'}")
    finally:
        sniffer.stop()
