"""
Database Manager Module (database/db_manager.py)
-----------------------------------------------
Purpose: Manages SQLite database connection, table initialization, user authentication helper queries,
         device states, alert histories, activity logs, and blockchain data persistence.
Why: A local relational database is required to store application state, log events, and persist blockchain blocks.
"""

import os
import sqlite3
import bcrypt
from datetime import datetime

def get_db_path():
    """Returns DB path dynamically, falling back to /tmp on Vercel or read-only environments."""
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        return "/tmp/hospital.db"
    base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "hospital.db"))
    try:
        if not os.path.exists(base_path):
            with open(base_path, "a") as f:
                pass
    except (PermissionError, OSError):
        return "/tmp/hospital.db"
    return base_path

def ensure_db_initialized():
    """Create the SQLite schema and seed data once per process."""
    db_path = get_db_path()
    if not os.path.exists(db_path):
        init_db()
        return True

    conn = _raw_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            init_db()
            return True
    except Exception as exc:
        print(f"DB initialization check failed: {exc}")
    finally:
        conn.close()
    return True


def _raw_db_connection():
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def get_db_connection():
    """
    Purpose: Establish and return a connection to the SQLite database.
    Input: None
    Output: sqlite3.Connection object
    Logic: Connects to the database and ensures tables are initialized if needed.
    """
    conn = _raw_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            conn.close()
            init_db()
            conn = _raw_db_connection()
    except Exception as e:
        print(f"DB auto-init check error: {e}")
    return conn

def init_db():
    """
    Purpose: Initialize the SQLite database by creating all necessary tables and seeding default records.
    Input: None
    Output: None
    Logic: Runs SQL DDL commands to create tables: users, devices, alerts, logs, and blockchain_store.
           Then seeds default users (Admin, Analyst, Guest) and 10 rooms of IoMT devices.
    """
    conn = _raw_db_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('Admin', 'Security Analyst', 'Guest')) NOT NULL
    )
    """)

    # 2. Devices Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS devices (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        room TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        mac_address TEXT NOT NULL,
        firmware_version TEXT NOT NULL,
        status TEXT CHECK(status IN ('Online', 'Offline', 'Under Attack', 'Safe', 'Maintenance')) NOT NULL,
        risk_score INTEGER DEFAULT 0,
        connected_since TEXT NOT NULL,
        last_activity TEXT NOT NULL,
        heart_rate INTEGER,
        temperature REAL,
        blood_pressure TEXT
    )
    """)

    # 3. Alerts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT,
        severity TEXT CHECK(severity IN ('Critical', 'High', 'Medium', 'Low')) NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        resolved INTEGER DEFAULT 0,
        FOREIGN KEY (device_id) REFERENCES devices(id)
    )
    """)

    # 4. Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_type TEXT CHECK(log_type IN ('User Log', 'Attack Log', 'Device Log', 'Blockchain Log', 'System Log')) NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        details TEXT
    )
    """)

    # 5. Blockchain Store Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS blockchain_store (
        block_index INTEGER PRIMARY KEY,
        timestamp TEXT NOT NULL,
        data TEXT NOT NULL,
        previous_hash TEXT NOT NULL,
        current_hash TEXT NOT NULL,
        signature TEXT NOT NULL
    )
    """)

    conn.commit()

    # Seed initial users if they do not exist
    seed_users(cursor)

    # Seed initial IoMT devices if they do not exist
    seed_devices(cursor)

    conn.commit()
    conn.close()
    print("Database initialized successfully.")

def seed_users(cursor):
    """
    Purpose: Register default users with secure bcrypt hashed passwords if the database is empty.
    Input: sqlite3.Cursor object
    Output: None
    Logic: Checks if any user exists. If not, hashes passwords and inserts Admin, Security Analyst, and Guest.
    """
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        # Default credentials for evaluation:
        # admin / admin123
        # analyst / analyst123
        # guest / guest123
        default_users = [
            ("admin", "admin123", "Admin"),
            ("analyst", "analyst123", "Security Analyst"),
            ("guest", "guest123", "Guest")
        ]
        for username, password, role in default_users:
            salt = bcrypt.gensalt()
            password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
            cursor.execute(
                "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                (username, password_hash, role)
            )
        print("Default users seeded.")

def seed_devices(cursor):
    """
    Purpose: Seed initial IoMT devices in the 10 hospital rooms to simulate digital twin.
    Input: sqlite3.Cursor object
    Output: None
    Logic: Inserts predefined smart medical devices for each room with realistic IP/MAC details.
    """
    cursor.execute("SELECT COUNT(*) FROM devices")
    if cursor.fetchone()[0] == 0:
        # Room list: Reception, Emergency Room, ICU, Operation Theatre, Radiology, Pharmacy, Laboratory, General Ward, Server Room, Network Control Room
        devices = [
            # ICU
            ("ICU-ECG-01", "ECG Monitor", "ICU", "192.168.10.101", "00:50:56:A1:B2:C3", "v1.2.4", "Online", 0),
            ("ICU-VEN-01", "Smart Ventilator", "ICU", "192.168.10.102", "00:50:56:A1:B2:C4", "v2.0.1", "Online", 5),
            ("ICU-PMP-01", "Infusion Pump", "ICU", "192.168.10.103", "00:50:56:A1:B2:C5", "v1.0.8", "Online", 0),
            # Emergency Room
            ("ER-MON-01", "Patient Monitor", "Emergency Room", "192.168.20.101", "00:50:56:B1:C2:D3", "v3.1.0", "Online", 10),
            ("ER-BPS-01", "Blood Pressure Sensor", "Emergency Room", "192.168.20.102", "00:50:56:B1:C2:D4", "v1.1.2", "Online", 0),
            ("ER-OXY-01", "Oxygen Sensor", "Emergency Room", "192.168.20.103", "00:50:56:B1:C2:D5", "v1.0.2", "Online", 0),
            # Operation Theatre
            ("OT-ANS-01", "Anesthesia Machine", "Operation Theatre", "192.168.30.101", "00:50:56:C1:D2:E3", "v4.0.2", "Online", 0),
            ("OT-SYS-01", "Surgical Navigation System", "Operation Theatre", "192.168.30.102", "00:50:56:C1:D2:E4", "v2.2.1", "Online", 0),
            # Radiology
            ("RAD-MRI-01", "MRI Controller", "Radiology", "192.168.40.101", "00:50:56:D1:E2:F3", "v5.6.1", "Online", 0),
            ("RAD-XRY-01", "X-Ray Modality", "Radiology", "192.168.40.102", "00:50:56:D1:E2:F4", "v3.2.0", "Online", 0),
            # Pharmacy
            ("PHR-DIS-01", "Automated Drug Dispenser", "Pharmacy", "192.168.50.101", "00:50:56:E1:F2:A3", "v1.9.4", "Online", 0),
            # Laboratory
            ("LAB-ANA-01", "Blood Analyzer", "Laboratory", "192.168.60.101", "00:50:56:F1:A2:B3", "v2.1.1", "Online", 0),
            # General Ward
            ("GW-BED-01", "Smart Bed Sensor", "General Ward", "192.168.70.101", "00:50:56:A2:B3:C4", "v1.0.0", "Online", 0),
            # Server Room
            ("SRV-DB-01", "Hospital Core Database", "Server Room", "192.168.80.101", "00:50:56:B2:C3:D4", "v10.4.1", "Online", 0),
            # Network Control Room
            ("NET-RTR-01", "Main Firewall Router", "Network Control Room", "192.168.90.101", "00:50:56:C2:D3:E4", "v15.2.1", "Online", 0),
            # Reception
            ("REC-KIOSK-01", "Check-in Kiosk", "Reception", "192.168.100.101", "00:50:56:D2:E3:F4", "v1.4.2", "Online", 0)
        ]
        
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for device_id, name, room, ip, mac, firmware, status, risk in devices:
            cursor.execute("""
            INSERT INTO devices (id, name, room, ip_address, mac_address, firmware_version, status, risk_score, connected_since, last_activity, heart_rate, temperature, blood_pressure)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (device_id, name, room, ip, mac, firmware, status, risk, now_str, now_str, 75, 36.5, "120/80"))
        print("Default devices seeded.")

def register_user(username, password, role):
    """
    Purpose: Register a new user securely with bcrypt password hashing.
    Input: username (str), password (str), role (str)
    Output: True if successful, False if username already exists
    Logic: Uses bcrypt to hash password, then inserts user into database.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    try:
        cursor.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            (username, password_hash, role)
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def authenticate_user(username, password):
    """
    Purpose: Validate a user login using bcrypt hashing.
    Input: username (str), password (str)
    Output: User Row (sqlite3.Row) if successful, None otherwise
    Logic: Fetches user by username. Validates hashed password using bcrypt.checkpw.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        if bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return user
    return None

def add_log(log_type, message, details=None):
    """
    Purpose: Log an event in the database for auditing and forensic reporting.
    Input: log_type (str), message (str), details (str, optional)
    Output: None
    Logic: Inserts log parameters with a current timestamp.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        "INSERT INTO logs (log_type, message, timestamp, details) VALUES (?, ?, ?, ?)",
        (log_type, message, now_str, details)
    )
    conn.commit()
    conn.close()

def add_alert(device_id, severity, message):
    """
    Purpose: Record a cyber threat or hardware alert.
    Input: device_id (str), severity (str), message (str)
    Output: None
    Logic: Inserts alert details, updates the device's status to 'Under Attack' or 'Maintenance' if appropriate,
           and flags an entry in the system log.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Insert alert
    cursor.execute(
        "INSERT INTO alerts (device_id, severity, message, timestamp) VALUES (?, ?, ?, ?)",
        (device_id, severity, message, now_str)
    )
    
    # Adjust device status and risk scores based on alert severity
    risk_bump = {"Critical": 40, "High": 25, "Medium": 10, "Low": 5}.get(severity, 0)
    device_status = "Under Attack" if severity in ("Critical", "High") else "Maintenance"
    
    cursor.execute("""
        UPDATE devices 
        SET status = ?, 
            risk_score = MIN(100, risk_score + ?),
            last_activity = ?
        WHERE id = ?
    """, (device_status, risk_bump, now_str, device_id))
    
    conn.commit()
    conn.close()
    
    # Also record in log
    add_log("Attack Log" if severity in ("Critical", "High") else "System Log", f"ALERT ({severity}): {message}", f"Device ID: {device_id}")

def get_devices():
    """
    Purpose: Retrieve all devices and their metrics.
    Input: None
    Output: List of dicts representing all devices.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM devices")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_device_telemetry(device_id, heart_rate, temperature, blood_pressure, status=None, risk_score=None):
    """
    Purpose: Update sensor readings of simulated IoMT device.
    Input: device_id (str), heart_rate (int), temperature (float), blood_pressure (str), status (str), risk_score (int)
    Output: None
    Logic: Modifies device parameters in SQL and updates last_activity time.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if status is not None and risk_score is not None:
        cursor.execute("""
            UPDATE devices 
            SET heart_rate = ?, temperature = ?, blood_pressure = ?, status = ?, risk_score = ?, last_activity = ?
            WHERE id = ?
        """, (heart_rate, temperature, blood_pressure, status, risk_score, now_str, device_id))
    else:
        cursor.execute("""
            UPDATE devices 
            SET heart_rate = ?, temperature = ?, blood_pressure = ?, last_activity = ?
            WHERE id = ?
        """, (heart_rate, temperature, blood_pressure, now_str, device_id))
        
    conn.commit()
    conn.close()

def get_alerts(limit=50):
    """
    Purpose: Get a list of recent alerts.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_logs(log_type=None, limit=100):
    """
    Purpose: Retrieve system/attack logs, optionally filtering by type.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    if log_type:
        cursor.execute("SELECT * FROM logs WHERE log_type = ? ORDER BY timestamp DESC LIMIT ?", (log_type, limit))
    else:
        cursor.execute("SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def tamper_blockchain_db(block_index, tampered_data):
    """
    Purpose: Deliberately tamper with a block's data in the database.
             This demonstrates how a database administrator or hacker could bypass standard checks,
             but the Blockchain cryptographic hashing immediately catches the manipulation.
    Input: block_index (int), tampered_data (str)
    Output: True if successfully tampered
    Logic: Updates the raw text stored in the SQLite database without updating the hashes,
           effectively breaking the cryptographic link.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE blockchain_store
        SET data = ?
        WHERE block_index = ?
    """, (tampered_data, block_index))
    conn.commit()
    conn.close()
    add_log("System Log", f"TAMPER SIMULATION: Block {block_index} text was updated directly in database", f"New data: {tampered_data}")
    return True

if __name__ == "__main__":
    ensure_db_initialized()
else:
    ensure_db_initialized()
