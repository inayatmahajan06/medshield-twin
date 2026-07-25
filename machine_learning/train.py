"""
Machine Learning Training Module (machine_learning/train.py)
-----------------------------------------------------------
Purpose: Generates a realistic synthetic IoMT network attack dataset and trains a
         Random Forest classifier using scikit-learn to classify cybersecurity threats.
Why: Trains a classification model to categorize network traffic types into normal telemetry and distinct attack classes.
"""

import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

# Output file paths
DATASET_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "iomt_dataset.csv"))
MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "model.pkl"))

def generate_synthetic_dataset(num_samples=2500):
    """
    Purpose: Programmatically generate an IoMT network intrusion dataset containing normal and attack records.
    Input: num_samples (int) - size of the dataset.
    Output: pandas.DataFrame containing the dataset.
    Logic: Generates synthetic numerical features based on predefined distributions for each class:
           0: Normal, 1: DDoS, 2: Port Scan, 3: Brute Force, 4: Spoofing, 5: Botnet.
    """
    np.random.seed(42)
    
    # Feature columns:
    # 1. packet_rate (packets per second)
    # 2. packet_size_avg (average bytes per packet)
    # 3. port_entropy (uniformity of ports targeted; higher = more scanning)
    # 4. failed_logins (failed login attempts count)
    # 5. payload_anomaly (percentage of weird characters in payload: 0.0 to 1.0)
    
    data = []
    
    # We distribute classes relatively evenly
    samples_per_class = num_samples // 6
    
    for class_label in range(6):
        for _ in range(samples_per_class):
            if class_label == 0:  # Normal
                packet_rate = np.random.uniform(5, 30)
                packet_size_avg = np.random.uniform(64, 512)
                port_entropy = np.random.uniform(0.0, 0.2)
                failed_logins = np.random.choice([0, 1], p=[0.95, 0.05])
                payload_anomaly = np.random.uniform(0.0, 0.1)
                
            elif class_label == 1:  # DDoS
                packet_rate = np.random.uniform(500, 2000)
                packet_size_avg = np.random.uniform(64, 128) # standard small ping/DDoS packets
                port_entropy = np.random.uniform(0.0, 0.1)
                failed_logins = 0
                payload_anomaly = np.random.uniform(0.0, 0.2)
                
            elif class_label == 2:  # Port Scan
                packet_rate = np.random.uniform(100, 400)
                packet_size_avg = np.random.uniform(32, 64) # tiny probe packets
                port_entropy = np.random.uniform(0.8, 1.0) # targeting many ports
                failed_logins = 0
                payload_anomaly = np.random.uniform(0.0, 0.1)
                
            elif class_label == 3:  # Brute Force
                packet_rate = np.random.uniform(10, 50)
                packet_size_avg = np.random.uniform(128, 256)
                port_entropy = np.random.uniform(0.0, 0.2)
                failed_logins = np.random.randint(5, 30) # multiple authentication attempts
                payload_anomaly = np.random.uniform(0.0, 0.2)
                
            elif class_label == 4:  # Spoofing
                packet_rate = np.random.uniform(20, 80)
                packet_size_avg = np.random.uniform(256, 1024)
                port_entropy = np.random.uniform(0.0, 0.3)
                failed_logins = np.random.choice([0, 1])
                payload_anomaly = np.random.uniform(0.6, 1.0) # suspicious shellcodes/commands
                
            elif class_label == 5:  # Botnet
                packet_rate = np.random.uniform(200, 800)
                packet_size_avg = np.random.uniform(512, 1500) # bulky exfiltration packets
                port_entropy = np.random.uniform(0.3, 0.7)
                failed_logins = np.random.randint(0, 3)
                payload_anomaly = np.random.uniform(0.3, 0.7)
                
            data.append([packet_rate, packet_size_avg, port_entropy, failed_logins, payload_anomaly, class_label])

    columns = ["packet_rate", "packet_size_avg", "port_entropy", "failed_logins", "payload_anomaly", "label"]
    df = pd.DataFrame(data, columns=columns)
    
    # Shuffle dataset
    df = df.sample(frac=1).reset_index(drop=True)
    df.to_csv(DATASET_PATH, index=False)
    print(f"Generated synthetic dataset with {len(df)} records at {DATASET_PATH}")
    return df

def train_model():
    """
    Purpose: Load the generated CSV dataset, train a Random Forest, and serialize the model.
    Input: None
    Output: None
    Logic: Splits dataset into features (X) and label (y).
           Trains RandomForestClassifier with 50 estimators (simple and fast).
           Evaluates the accuracy and saves the model using standard python pickle.
    """
    df = generate_synthetic_dataset()
    
    X = df.drop(columns=["label"])
    y = df["label"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=50, max_depth=8, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model Training Complete. Accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:\n", classification_report(y_test, y_pred))
    
    # Save the model
    with open(MODEL_PATH, "wb") as file:
        pickle.dump(model, file)
    print(f"Serialized model saved to {MODEL_PATH}")

if __name__ == "__main__":
    train_model()
