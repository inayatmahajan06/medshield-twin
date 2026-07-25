"""
IoMT Device Telemetry Simulator Module (digital_twin/simulator.py)
-----------------------------------------------------------------
Purpose: Periodically simulates physical health readings and network logs for connected IoMT devices.
         Randomly simulates device offline states, network latency, and cyber attacks to feed the threat detector.
Why: Smart hospitals rely on IoMT telemetry. To create a fully operational Digital Twin visualization,
     we simulate physical data and security state changes in real time.
"""

import time
import random
import threading
import sys
import os
from datetime import datetime

# Adjust paths to import database manager and ML threat detector
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from database.db_manager import get_devices, update_device_telemetry, add_alert, add_log
from machine_learning.detector import ThreatDetector
from packet_capture.sniffer import PacketSniffer

class HospitalSimulator:
    """
    Purpose: Loops over all database-seeded devices and updates their clinical values and security status.
    """
    def __init__(self, sniffer=None):
        """
        Purpose: Initialize threat detector, packet sniffer, and state variables.
        """
        self.detector = ThreatDetector()
        self.sniffer = sniffer if sniffer else PacketSniffer()
        self.is_running = False
        self.thread = None
        self.attack_in_progress = False
        self.current_target_device = None
        self.current_attack_type = None

    def tick(self):
        """
        Purpose: Run a single iteration of the simulation.
        Input: None
        Output: None
        Logic: 1. Fetches all devices from the database.
               2. Randomly decides whether to trigger or clear an attack.
               3. For each device, computes realistic sensor values (fluctuating slightly).
               4. If an attack is active on a device, overrides normal sensor values with anomalies.
               5. Evaluates simulated metrics using the ML detector, generating database alerts.
               6. Updates the database record with the new clinical telemetry.
        """
        try:
            devices = get_devices()
        except Exception as e:
            print(f"Error fetching devices: {e}")
            return
            
        # 1. Check for active attacks from the packet sniffer
        recent_packets = self.sniffer.get_recent_packets(15)
        flagged_attack = None
        
        for pkt in recent_packets:
            if pkt.get("status") == "Flagged" and pkt.get("simulated_attack") != "Normal":
                flagged_attack = pkt["simulated_attack"]
                # Match destination IP to a device in our list
                dst_ip = pkt["dst_ip"]
                for dev in devices:
                    if dev["ip_address"] == dst_ip:
                        self.current_target_device = dev["id"]
                        self.current_attack_type = flagged_attack
                        self.attack_in_progress = True
                        break
        
        # 2. Randomly inject attacks if no sniffer attack is active (10% chance)
        if not self.attack_in_progress and random.random() < 0.10:
            target = random.choice(devices)
            # Don't attack safe devices that are offline
            if target["status"] != "Offline":
                self.current_target_device = target["id"]
                self.current_attack_type = random.choice(["DDoS", "Port Scan", "Brute Force", "Spoofing", "Botnet"])
                self.attack_in_progress = True
                
                # Log attack injection
                add_log("System Log", f"Simulating attack injection: {self.current_attack_type} on {target['name']} ({target['id']})")
        
        # 3. Handle clearing of attacks (15% chance to clear in a tick)
        if self.attack_in_progress and random.random() < 0.15:
            # Revert target device status
            target_id = self.current_target_device
            self.attack_in_progress = False
            self.current_target_device = None
            self.current_attack_type = None
            
            # Reset target device status in DB to Online/Safe
            for dev in devices:
                if dev["id"] == target_id:
                    update_device_telemetry(target_id, 75, 36.5, "120/80", status="Online", risk_score=0)
                    add_log("System Log", f"Attack cleared on device {dev['name']} ({target_id}). Device restored to Online state.")
                    break

        # 4. Process telemetry and status for each device
        for device in devices:
            dev_id = device["id"]
            name = device["name"]
            status = device["status"]
            risk_score = device["risk_score"]
            
            # Default normal sensor readings
            hr = 75
            temp = 36.5
            bp = "120/80"
            
            # Random device failure (offline status) (2% chance)
            if status != "Under Attack" and random.random() < 0.02:
                update_device_telemetry(dev_id, 0, 0.0, "0/0", status="Offline", risk_score=0)
                add_log("Device Log", f"Device {name} ({dev_id}) went Offline.", "Connection timed out.")
                continue
                
            # Random device recovery from offline (10% chance if offline)
            if status == "Offline" and random.random() < 0.10:
                update_device_telemetry(dev_id, 75, 36.5, "120/80", status="Online", risk_score=0)
                add_log("Device Log", f"Device {name} ({dev_id}) came back Online.", "Handshake established.")
                continue
                
            if status == "Offline":
                continue # Skip processing details for offline devices

            # Generate sensor data based on device types
            if "ECG" in name or "Monitor" in name:
                hr = int(random.normalvariate(75, 5))
                temp = round(random.normalvariate(36.8, 0.3), 1)
                bp = f"{int(random.normalvariate(120, 8))}/{int(random.normalvariate(80, 5))}"
            elif "Ventilator" in name:
                hr = int(random.normalvariate(80, 4))
                temp = round(random.normalvariate(36.5, 0.2), 1)
                bp = f"{int(random.normalvariate(115, 6))}/{int(random.normalvariate(75, 4))}"
            elif "Pump" in name:
                hr = int(random.normalvariate(70, 3))
                temp = round(random.normalvariate(37.0, 0.1), 1)
                bp = "120/80" # pumps don't read BP but we simulate it
            else:
                hr = int(random.normalvariate(75, 6))
                temp = round(random.normalvariate(36.7, 0.2), 1)
                bp = "120/80"

            # 5. Apply anomalies if this device is the target of an active attack
            if self.attack_in_progress and dev_id == self.current_target_device:
                status = "Under Attack"
                
                # Create clinical anomalies depending on the attack type
                if self.current_attack_type == "DDoS":
                    hr = random.choice([0, 180]) # cardiac arrest or tachycardia
                    temp = 39.5 # overheating simulator
                    bp = "0/0"
                    risk_score = min(100, risk_score + 15)
                    
                elif self.current_attack_type == "Spoofing":
                    hr = random.randint(140, 160)
                    temp = 41.2 # critical fever
                    bp = "190/110" # hypertensive crisis spoofed data
                    risk_score = min(100, risk_score + 10)
                    
                elif self.current_attack_type == "Botnet":
                    # Botnets leak data but maintain physical status usually
                    risk_score = min(100, risk_score + 8)
                    
                elif self.current_attack_type == "Brute Force":
                    # Console lockouts
                    risk_score = min(100, risk_score + 5)
                
                # Check features via the Machine Learning module
                # Let's map our simulated attack types to the exact packet features our ML model detects:
                pkt_rate, pkt_size, port_ent, failed_l, payload_anom = 10, 200, 0.05, 0, 0.05
                if self.current_attack_type == "DDoS":
                    pkt_rate, pkt_size = 1500, 64
                elif self.current_attack_type == "Port Scan":
                    pkt_rate, port_ent, pkt_size = 300, 0.95, 32
                elif self.current_attack_type == "Brute Force":
                    failed_l = 15
                elif self.current_attack_type == "Spoofing":
                    payload_anom, pkt_size = 0.85, 800
                elif self.current_attack_type == "Botnet":
                    pkt_rate, pkt_size, payload_anom = 600, 1400, 0.5
                
                # Run threat prediction
                detection_res = self.detector.predict_threat(pkt_rate, pkt_size, port_ent, failed_l, payload_anom)
                
                # Add alert if prediction flags an attack
                if detection_res["prediction"] != "Normal" and random.random() < 0.30: # throttle alert spam
                    add_alert(
                        device_id=dev_id,
                        severity="Critical" if self.current_attack_type in ("DDoS", "Spoofing") else "High",
                        message=f"AI Threat Detected: {detection_res['prediction']} on {name}. ML Confidence: {detection_res['confidence']}% - {detection_res['explanation']}"
                    )
                    
                    # Store event on the Blockchain!
                    # Load blockchain and write log
                    from blockchain.blockchain import Blockchain
                    blockchain = Blockchain()
                    blockchain.add_block({
                        "event_type": "Attack Alert",
                        "device_id": dev_id,
                        "device_name": name,
                        "attack_detected": detection_res["prediction"],
                        "confidence": detection_res["confidence"],
                        "risk_score": detection_res["threat_score"]
                    }, "Security Analyst")
            else:
                # If not under attack and risk score is high, slowly decay it back to 0 (normal recovery)
                if risk_score > 0:
                    risk_score = max(0, risk_score - 2)
                    if risk_score == 0 and status == "Under Attack":
                        status = "Online"

            # 6. Save updated telemetry
            update_device_telemetry(dev_id, hr, temp, bp, status, risk_score)

    def _loop(self):
        """
        Purpose: Loop execution in the background thread.
        """
        print("Hospital Simulator Background Thread Starting...")
        while self.is_running:
            self.tick()
            time.sleep(3) # Tick every 3 seconds

    def start(self):
        """
        Purpose: Launch background simulation thread.
        """
        if not self.is_running:
            self.is_running = True
            self.sniffer.start()
            self.thread = threading.Thread(target=self._loop, daemon=True)
            self.thread.start()
            print("Hospital Simulator started.")

    def stop(self):
        """
        Purpose: Stop background simulation and packet sniffer.
        """
        self.is_running = False
        self.sniffer.stop()
        if self.thread:
            self.thread.join(timeout=2)
            print("Hospital Simulator stopped.")

if __name__ == "__main__":
    # Test script runs for a few cycles
    sim = HospitalSimulator()
    sim.start()
    try:
        for i in range(5):
            time.sleep(3)
            devices = get_devices()
            print(f"Cycle {i+1} completed. ICU-ECG-01 stats: HR={devices[0]['heart_rate']}, status={devices[0]['status']}")
    finally:
        sim.stop()
