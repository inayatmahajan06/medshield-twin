"""
Educational Blockchain Module (blockchain/blockchain.py)
--------------------------------------------------------
Purpose: Implements a simple educational blockchain using pure Python classes.
Why: Demonstrates how important records (e.g. login events, patient records, detected attacks)
     can be protected against tampering. When any block data changes, its hash changes,
     breaking the link to all subsequent blocks.
"""

import hashlib
import json
from datetime import datetime
import sys
import os

# Adjust paths to import database manager
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from database.db_manager import get_db_connection

class Block:
    """
    Purpose: Represents a single Block in the educational Blockchain.
    Why: Each block binds historical data, a timestamp, a reference to the previous block,
         and a digital verification hash.
    """
    def __init__(self, index, timestamp, data, previous_hash, hash_val=None, signature=""):
        """
        Input: index (int), timestamp (str), data (str/dict), previous_hash (str), hash_val (str, optional), signature (str)
        Output: Block instance
        """
        self.index = index
        self.timestamp = timestamp
        self.data = data  # The payload (e.g., "Attack Detected on ICU-VEN-01", "User admin logged in")
        self.previous_hash = previous_hash
        self.signature = signature  # Educational digital signature
        self.hash = hash_val if hash_val else self.calculate_hash()

    def calculate_hash(self):
        """
        Purpose: Compute the SHA-256 cryptographic hash of this block's contents.
        Input: None
        Output: 64-character hexadecimal SHA-256 string
        Logic: Concatenates index, timestamp, JSON string of data, previous_hash, and signature,
               then hashes the combined string using hashlib.sha256.
        """
        # We convert the block data to a sorted JSON string to ensure consistent hashing
        data_string = json.dumps(self.data, sort_keys=True)
        block_string = f"{self.index}{self.timestamp}{data_string}{self.previous_hash}{self.signature}"
        return hashlib.sha256(block_string.encode('utf-8')).hexdigest()

    def to_dict(self):
        """
        Purpose: Convert the block object to a dictionary representation.
        """
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
            "hash": self.hash,
            "signature": self.signature
        }


class Blockchain:
    """
    Purpose: Represents the Blockchain sequence itself.
    Why: Handles appending new records, loading history from the database,
         and verifying block-by-block integrity.
    """
    def __init__(self):
        """
        Purpose: Initialize a blockchain by syncing from SQLite or generating a genesis block.
        Input: None
        Output: Blockchain instance
        """
        self.chain = []
        self.load_chain_from_db()
        
        # If the blockchain is empty in the database, initialize it with a Genesis Block
        if len(self.chain) == 0:
            self.create_genesis_block()

    def create_genesis_block(self):
        """
        Purpose: Create and save the first block in the blockchain.
        Input: None
        Output: Block object
        Logic: The genesis block has an index of 0, standard data, and a dummy previous hash ("0").
        """
        genesis_block = Block(
            index=0,
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            data="Genesis Block: Hospital Twin Security System Online",
            previous_hash="0",
            signature="SYSTEM_INIT_KEY"
        )
        self.chain.append(genesis_block)
        self.save_block_to_db(genesis_block)
        return genesis_block

    def get_latest_block(self):
        """
        Purpose: Retrieve the most recently added block in the chain.
        Output: Block object
        """
        return self.chain[-1]

    def add_block(self, event_data, user_role):
        """
        Purpose: Append a new event to the blockchain, securing it cryptographically.
        Input: event_data (str or dict), user_role (str)
        Output: The created Block object
        Logic: 1. Fetches the latest block to obtain its hash (becomes the new block's previous_hash).
               2. Simulates a Digital Signature by hashing the role + event_data (educational visualization).
               3. Computes the current block's SHA-256 hash.
               4. Appends to memory list and persists in the SQLite database.
        """
        latest_block = self.get_latest_block()
        new_index = latest_block.index + 1
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Create an educational digital signature
        # In a real blockchain, this would use a private key.
        # Here, we use the user's role to sign the hash of the data to keep it understandable.
        signature_payload = f"ROLE:{user_role}-DATA:{json.dumps(event_data)}"
        simulated_signature = hashlib.sha256(signature_payload.encode('utf-8')).hexdigest()[:16].upper()

        new_block = Block(
            index=new_index,
            timestamp=timestamp,
            data=event_data,
            previous_hash=latest_block.hash,
            signature=f"SIG_{user_role}_{simulated_signature}"
        )
        
        self.chain.append(new_block)
        self.save_block_to_db(new_block)
        
        # Log this blockchain write in system logs
        from database.db_manager import add_log
        add_log("Blockchain Log", f"Added Block {new_index} (Type: {user_role})", f"Hash: {new_block.hash}")
        
        return new_block

    def verify_chain(self):
        """
        Purpose: Cryptographically audit the entire blockchain.
        Input: None
        Output: dict with status ('Valid' or 'Tampered') and list of details/errors.
        Logic: 1. Compares the hash of each block with its calculated hash (detects cell-level editing).
               2. Compares a block's previous_hash with the actual hash of the previous block.
               3. If any check fails, returns details of where the chain was broken.
        """
        # Reload chain from database to capture any direct edits made in SQL tables (tampering)
        self.load_chain_from_db()
        
        errors = []
        # Loop through the chain starting from the second block (index 1)
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i-1]

            # Rule 1: Validate block hash matches its contents
            if current.hash != current.calculate_hash():
                errors.append(f"Block {current.index} has been altered! Current Hash does not match recalculated hash.")

            # Rule 2: Validate current previous_hash matches the preceding block's actual hash
            if current.previous_hash != previous.hash:
                errors.append(f"Chain broken at Block {current.index}! Previous Hash does not match Block {previous.index}'s Hash.")

        if errors:
            return {"status": "Tampered", "errors": errors}
        return {"status": "Valid", "errors": []}

    def load_chain_from_db(self):
        """
        Purpose: Fetch persisted blocks from the SQLite database.
        Input: None
        Output: None
        Logic: Query blockchain_store, sort by block_index, and populate the in-memory chain.
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM blockchain_store ORDER BY block_index ASC")
        rows = cursor.fetchall()
        conn.close()

        self.chain = []
        for row in rows:
            # Parse stored json data if it was stringified
            try:
                data = json.loads(row['data'])
            except json.JSONDecodeError:
                data = row['data']

            block = Block(
                index=row['block_index'],
                timestamp=row['timestamp'],
                data=data,
                previous_hash=row['previous_hash'],
                hash_val=row['current_hash'],
                signature=row['signature']
            )
            self.chain.append(block)

    def save_block_to_db(self, block):
        """
        Purpose: Insert a new Block record into the SQLite database.
        Input: Block object
        Output: None
        """
        conn = get_db_connection()
        cursor = conn.cursor()
        data_str = json.dumps(block.data) if isinstance(block.data, (dict, list)) else block.data
        cursor.execute("""
            INSERT OR REPLACE INTO blockchain_store (block_index, timestamp, data, previous_hash, current_hash, signature)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (block.index, block.timestamp, data_str, block.previous_hash, block.hash, block.signature))
        conn.commit()
        conn.close()

if __name__ == "__main__":
    blockchain = Blockchain()
    print("Verification result before tampering:", blockchain.verify_chain())
    
    # Simple self-test code
    blockchain.add_block("Test Event A", "Admin")
    blockchain.add_block("Test Event B", "Security Analyst")
    print("Verification result after adding blocks:", blockchain.verify_chain())
