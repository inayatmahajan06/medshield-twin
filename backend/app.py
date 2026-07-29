"""
Flask API Backend Server (backend/app.py)
----------------------------------------
Purpose: The main entry point for the Python Flask backend. Defines REST endpoints,
         manages active sessions (Flask-Login), and runs background threads
         for the IoMT simulator and packet capture sniffer.
Why: Serves as the middle tier in our three-tier architecture, linking the SQL database,
     ML models, and Blockchain code to the React frontend.
"""

import os
import sys
import threading
from datetime import datetime

from flask import Flask, request, jsonify, send_file, session
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user

# Add project root directory to Python path for cross-directory imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database.db_manager import (
    get_db_connection, register_user, authenticate_user, add_log,
    get_devices, get_alerts, get_logs, update_device_telemetry, tamper_blockchain_db,
    ensure_db_initialized
)
from blockchain.blockchain import Blockchain
from digital_twin.simulator import HospitalSimulator
from packet_capture.sniffer import PacketSniffer
from reports.generator import generate_security_report

# Initialize Flask App
app = Flask(__name__)
app.secret_key = "medshield_super_secure_key_123" # Required for session encryption

# Configure CORS dynamically for credentials and Vercel/local origins
CORS(app, supports_credentials=True, origins=r".*")

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        return response

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response

@app.errorhandler(500)
def handle_500_error(e):
    if request.path.startswith("/api/"):
        return jsonify({"success": False, "error": "Internal Server Error", "message": str(e)}), 500
    return "Internal Server Error", 500

@app.errorhandler(404)
def handle_404_error(e):
    if request.path.startswith("/api/"):
        return jsonify({"success": False, "error": "Not Found", "message": "Endpoint not found"}), 404
    return "Not Found", 404

# --- Flask-Login Configuration ---
login_manager = LoginManager()
login_manager.init_app(app)

class User(UserMixin):
    """
    Purpose: User class that matches Flask-Login's expectations.
    """
    def __init__(self, id, username, role):
        self.id = id
        self.username = username
        self.role = role

@login_manager.user_loader
def load_user(user_id):
    """
    Purpose: Flask-Login callback to retrieve user details from the database by ID.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, role FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return User(row['id'], row['username'], row['role'])
    return None

# Global references for Background Sniffer and Simulator
sniffer = PacketSniffer()
simulator = HospitalSimulator(sniffer)

# Default configuration settings
system_settings = {
    "scan_interval": 3, # seconds
    "ai_threshold": 80, # percentage confidence
    "email_alerts_enabled": True
}

# --- Helper: Check Roles ---
def require_role(allowed_roles):
    """
    Purpose: Helper to restrict access based on user role (Admin, Analyst, Guest).
    """
    if not current_user.is_authenticated:
        return False
    return current_user.role in allowed_roles


# --- Health and Authentication API Routes ---

@app.route("/", methods=["GET"])
def api_root():
    return jsonify({"status": "ok", "service": "MedShield Twin API"})

@app.route("/api/health", methods=["GET"])
def api_health():
    return jsonify({"status": "ok", "database": "ready", "ml": "ready"})

@app.route("/api/auth/register", methods=["POST"])
def api_register():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")
    role = data.get("role", "Guest") # default to guest
    
    if not username or not password:
        return jsonify({"success": False, "message": "Missing username or password"}), 400
        
    if role not in ("Admin", "Security Analyst", "Guest"):
        return jsonify({"success": False, "message": "Invalid role specified"}), 400
        
    success = register_user(username, password, role)
    if success:
        add_log("User Log", f"New user registered: {username} ({role})")
        return jsonify({"success": True, "message": "Registration successful!"})
    else:
        return jsonify({"success": False, "message": "Username already exists"}), 400

@app.route("/api/auth/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        return jsonify({"success": False, "message": "Missing username or password"}), 400
        
    user_row = authenticate_user(username, password)
    if user_row:
        user = User(user_row['id'], user_row['username'], user_row['role'])
        login_user(user)
        add_log("User Log", f"User logged in: {username} ({user_row['role']})")
        
        # Log to blockchain as audit trail!
        blockchain = Blockchain()
        blockchain.add_block({
            "event_type": "User Login",
            "username": username,
            "role": user_row['role']
        }, user_row['role'])

        return jsonify({
            "success": True,
            "user": {
                "username": user.username,
                "role": user.role
            }
        })
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route("/api/auth/logout", methods=["POST"])
def api_logout():
    if current_user.is_authenticated:
        username = current_user.username
        role = current_user.role
        
        # Log to blockchain
        blockchain = Blockchain()
        blockchain.add_block({
            "event_type": "User Logout",
            "username": username
        }, role)
        
        add_log("User Log", f"User logged out: {username}")
        logout_user()
    return jsonify({"success": True, "message": "Logged out successfully"})

@app.route("/api/auth/current", methods=["GET"])
def api_current_user():
    if current_user.is_authenticated:
        return jsonify({
            "authenticated": True,
            "user": {
                "username": current_user.username,
                "role": current_user.role
            }
        })
    return jsonify({"authenticated": False})


# --- Digital Twin & Devices API Routes ---

@app.route("/api/devices", methods=["GET"])
def api_get_devices():
    devices = get_devices()
    return jsonify(devices)

@app.route("/api/devices", methods=["POST"])
def api_add_device():
    # Only Admin can add devices
    if not require_role(["Admin"]):
        return jsonify({"success": False, "message": "Access Denied: Admin role required"}), 403
        
    data = request.get_json(silent=True) or {}
    dev_id = data.get("id")
    name = data.get("name")
    room = data.get("room")
    ip = data.get("ip_address")
    mac = data.get("mac_address")
    firmware = data.get("firmware_version", "v1.0.0")
    
    if not dev_id or not name or not room or not ip or not mac:
        return jsonify({"success": False, "message": "Missing required fields"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        cursor.execute("""
            INSERT INTO devices (id, name, room, ip_address, mac_address, firmware_version, status, risk_score, connected_since, last_activity, heart_rate, temperature, blood_pressure)
            VALUES (?, ?, ?, ?, ?, ?, 'Online', 0, ?, ?, 75, 36.5, '120/80')
        """, (dev_id, name, room, ip, mac, firmware, now_str, now_str))
        conn.commit()
        
        add_log("System Log", f"Device added: {name} ({dev_id}) in {room} by Admin")
        
        # Log to Blockchain
        blockchain = Blockchain()
        blockchain.add_block({
            "event_type": "Device Added",
            "device_id": dev_id,
            "device_name": name,
            "room": room
        }, current_user.role)

        return jsonify({"success": True, "message": "Device added successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400
    finally:
        conn.close()

@app.route("/api/devices/<device_id>", methods=["DELETE"])
def api_delete_device(device_id):
    if not require_role(["Admin"]):
        return jsonify({"success": False, "message": "Access Denied: Admin role required"}), 403
        
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check if device exists
        cursor.execute("SELECT name FROM devices WHERE id = ?", (device_id,))
        device = cursor.fetchone()
        if not device:
            return jsonify({"success": False, "message": "Device not found"}), 404
            
        cursor.execute("DELETE FROM devices WHERE id = ?", (device_id,))
        conn.commit()
        
        add_log("System Log", f"Device deleted: {device['name']} ({device_id}) by Admin")
        
        # Log to Blockchain
        blockchain = Blockchain()
        blockchain.add_block({
            "event_type": "Device Deleted",
            "device_id": device_id,
            "device_name": device["name"]
        }, current_user.role)

        return jsonify({"success": True, "message": "Device deleted successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400
    finally:
        conn.close()


# --- Live Network Packets Routes ---

@app.route("/api/packets", methods=["GET"])
def api_get_packets():
    limit = request.args.get("limit", 50, type=int)
    packets = sniffer.get_recent_packets(limit)
    return jsonify(packets)


# --- Alerts and Logs API Routes ---

@app.route("/api/alerts", methods=["GET"])
def api_get_alerts():
    limit = request.args.get("limit", 50, type=int)
    alerts = get_alerts(limit)
    return jsonify(alerts)

@app.route("/api/logs", methods=["GET"])
def api_get_logs():
    log_type = request.args.get("type")
    limit = request.args.get("limit", 100, type=int)
    logs = get_logs(log_type, limit)
    return jsonify(logs)


# --- Blockchain Ledger API Routes ---

@app.route("/api/blockchain", methods=["GET"])
def api_get_blockchain():
    blockchain = Blockchain()
    chain_dicts = [block.to_dict() for block in blockchain.chain]
    return jsonify(chain_dicts)

@app.route("/api/blockchain/verify", methods=["GET"])
def api_verify_blockchain():
    blockchain = Blockchain()
    audit = blockchain.verify_chain()
    return jsonify(audit)

@app.route("/api/blockchain/tamper", methods=["POST"])
def api_tamper_blockchain():
    # Only Admin or Analyst roles can access test tamper tool for demonstration
    if not require_role(["Admin", "Security Analyst"]):
        return jsonify({"success": False, "message": "Access Denied"}), 403
        
    data = request.get_json(silent=True) or {}
    block_index = data.get("block_index")
    tampered_data = data.get("data")
    
    if block_index is None or not tampered_data:
        return jsonify({"success": False, "message": "Missing block_index or data"}), 400
        
    success = tamper_blockchain_db(block_index, tampered_data)
    if success:
        return jsonify({"success": True, "message": f"Block {block_index} tampered in database."})
    return jsonify({"success": False, "message": "Tampering failed."}), 400


# --- PDF Reports API Routes ---

@app.route("/api/reports/download", methods=["GET"])
def api_download_report():
    # Guests cannot generate reports
    if not require_role(["Admin", "Security Analyst"]):
        return jsonify({"success": False, "message": "Access Denied: Read-only access"}), 403
        
    user_name = current_user.username if current_user.is_authenticated else "System Analyst"
    
    # Target path inside backend folder or /tmp on Vercel
    if os.environ.get("VERCEL"):
        report_pdf_path = "/tmp/hospital_security_report.pdf"
    else:
        report_pdf_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "hospital_security_report.pdf"))
    
    # Generate
    generate_security_report(report_pdf_path, user_name)
    
    # Log report generation to database and Blockchain
    add_log("User Log", f"Security Audit Report generated by {user_name}")
    blockchain = Blockchain()
    blockchain.add_block({
        "event_type": "Security Report Generated",
        "generated_by": user_name
    }, current_user.role)

    return send_file(report_pdf_path, as_attachment=True, download_name="hospital_security_report.pdf")


# --- System Settings Routes ---

@app.route("/api/settings", methods=["GET", "POST"])
def api_settings():
    global system_settings
    if request.method == "POST":
        if not require_role(["Admin"]):
            return jsonify({"success": False, "message": "Admin privileges required"}), 403
        data = request.get_json(silent=True) or {}
        system_settings["scan_interval"] = int(data.get("scan_interval", system_settings["scan_interval"]))
        system_settings["ai_threshold"] = int(data.get("ai_threshold", system_settings["ai_threshold"]))
        system_settings["email_alerts_enabled"] = bool(data.get("email_alerts_enabled", system_settings["email_alerts_enabled"]))
        
        add_log("System Log", f"System Settings updated: Scan Interval={system_settings['scan_interval']}s, AI Threshold={system_settings['ai_threshold']}%")
        return jsonify({"success": True, "settings": system_settings})
        
    return jsonify(system_settings)

@app.route("/api/ml/predict", methods=["POST"])
def api_ml_predict():
    data = request.get_json(silent=True) or {}
    packet_rate = float(data.get("packet_rate", 10))
    packet_size_avg = float(data.get("packet_size_avg", 200))
    port_entropy = float(data.get("port_entropy", 0.05))
    failed_logins = int(data.get("failed_logins", 0))
    payload_anomaly = float(data.get("payload_anomaly", 0.05))
    
    res = simulator.detector.predict_threat(packet_rate, packet_size_avg, port_entropy, failed_logins, payload_anomaly)
    return jsonify(res)

@app.route("/api/simulation/start-attack", methods=["POST"])
def api_start_attack():
    # Only Admin or Analyst can trigger simulation attacks
    if not require_role(["Admin", "Security Analyst"]):
        return jsonify({"success": False, "message": "Access Denied"}), 403
        
    data = request.get_json(silent=True) or {}
    device_id = data.get("device_id")
    attack_type = data.get("attack_type")
    
    if not device_id or not attack_type:
        return jsonify({"success": False, "message": "Missing device_id or attack_type"}), 400
        
    # Check if device exists
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM devices WHERE id = ?", (device_id,))
    device = cursor.fetchone()
    conn.close()
    
    if not device:
        return jsonify({"success": False, "message": "Device not found"}), 404
        
    # Inject directly into simulator
    simulator.current_target_device = device_id
    simulator.current_attack_type = attack_type
    simulator.attack_in_progress = True
    
    add_log("System Log", f"MANUAL SIMULATION INITIATED: {attack_type} on {device['name']} ({device_id})")
    
    return jsonify({"success": True, "message": f"Simulating {attack_type} on {device['name']}."})


# --- Startup and Shutdown Hooks ---

def start_background_threads():
    """
    Purpose: Spawn sniffer and simulator daemon threads safely (skip on Vercel serverless).
    """
    if os.environ.get("VERCEL"):
        print("Running in Vercel Serverless environment; skipping persistent background threads.")
        return

    try:
        simulator.start()
        print("Background simulation threads initialized.")
    except Exception as e:
        print(f"Background simulation thread init warning: {e}")

# Initialize the database and start background threads once the app is imported.
ensure_db_initialized()
start_background_threads()

if __name__ == "__main__":
    # Host on all interfaces, port 5000
    try:
        app.run(host="0.0.0.0", port=5000, debug=False)
    finally:
        # Stop background threads when flask is terminated
        simulator.stop()
