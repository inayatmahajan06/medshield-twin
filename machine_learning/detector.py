"""
Threat Detector and Explainable AI Module (machine_learning/detector.py)
------------------------------------------------------------------------
Purpose: Loads the pre-trained Random Forest model and uses it to evaluate network traffic
         telemetry. Computes a threat score, prediction confidence, and an explanation
         of why an attack was classified (Explainable AI - XAI).
Why: Provides transparency in threat classification, mapping feature inputs to natural language risk explanations.
"""

import os
import pickle
import numpy as np

# Label mapping for predictions
CLASS_LABELS = {
    0: "Normal",
    1: "DDoS",
    2: "Port Scan",
    3: "Brute Force",
    4: "Spoofing",
    5: "Botnet"
}

# Normal baseline values for features (used to calculate feature deviations for XAI)
NORMAL_BASELINES = {
    "packet_rate": 17.5,
    "packet_size_avg": 288.0,
    "port_entropy": 0.1,
    "failed_logins": 0.05,
    "payload_anomaly": 0.05
}

class ThreatDetector:
    """
    Purpose: Handles threat prediction and generates simple SHAP-like explanations.
    """
    def __init__(self):
        """
        Purpose: Load the serialized Random Forest model from disk.
        Input: None
        """
        self.model = None
        self.fallback_mode = False
        model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "model.pkl"))

        if os.path.exists(model_path):
            try:
                with open(model_path, "rb") as file:
                    self.model = pickle.load(file)
                print("Threat detector model loaded successfully.")
                return
            except Exception as exc:
                print(f"Warning: Could not load model at {model_path}: {exc}. Falling back to heuristic detection.")

        self.fallback_mode = True
        print("Threat detector running in heuristic fallback mode.")

    def _predict_fallback(self, packet_rate, packet_size_avg, port_entropy, failed_logins, payload_anomaly):
        if failed_logins >= 5:
            predicted_class = "Brute Force"
            confidence = 0.89
        elif packet_rate >= 800:
            predicted_class = "DDoS"
            confidence = 0.91
        elif port_entropy >= 0.7:
            predicted_class = "Port Scan"
            confidence = 0.88
        elif payload_anomaly >= 0.6:
            predicted_class = "Spoofing"
            confidence = 0.86
        elif packet_rate >= 200 or packet_size_avg >= 1000:
            predicted_class = "Botnet"
            confidence = 0.84
        else:
            predicted_class = "Normal"
            confidence = 0.79

        threat_score = 0 if predicted_class == "Normal" else int(55 + (confidence * 40))
        explanation_text = self._generate_explanation_text(
            predicted_class, packet_rate, packet_size_avg, port_entropy, failed_logins, payload_anomaly
        )

        return {
            "prediction": predicted_class,
            "confidence": round(confidence * 100, 2),
            "threat_score": threat_score,
            "explanation": explanation_text,
            "feature_contributions": {
                "packet_rate": 25.0,
                "packet_size_avg": 20.0,
                "port_entropy": 20.0,
                "failed_logins": 20.0,
                "payload_anomaly": 15.0,
            },
            "raw_features": {
                "packet_rate": packet_rate,
                "packet_size_avg": packet_size_avg,
                "port_entropy": port_entropy,
                "failed_logins": failed_logins,
                "payload_anomaly": payload_anomaly,
            },
        }

    def predict_threat(self, packet_rate, packet_size_avg, port_entropy, failed_logins, payload_anomaly):
        """
        Purpose: Classify current network telemetry and provide a detailed explanation.
        Input: packet_rate (float), packet_size_avg (float), port_entropy (float), failed_logins (int), payload_anomaly (float)
        Output: A dictionary containing prediction details, confidence, risk score, and feature contributions.
        Logic: 1. Compiles inputs into a feature array and passes it to the Random Forest model.
               2. Retrieves prediction label and confidence probabilities.
               3. If an attack is detected, calculates the feature deviation from normal baseline
                  to explain which features contributed most to the model decision.
               4. Generates a natural language explanation.
        """
        if self.fallback_mode or self.model is None:
            return self._predict_fallback(packet_rate, packet_size_avg, port_entropy, failed_logins, payload_anomaly)

        import pandas as pd
        # Create feature DataFrame matching the training columns:
        features_df = pd.DataFrame(
            [[packet_rate, packet_size_avg, port_entropy, failed_logins, payload_anomaly]],
            columns=["packet_rate", "packet_size_avg", "port_entropy", "failed_logins", "payload_anomaly"]
        )
        
        # 1. Run prediction and retrieve probabilities
        prediction_idx = int(self.model.predict(features_df)[0])
        probabilities = self.model.predict_proba(features_df)[0]
        
        predicted_class = CLASS_LABELS[prediction_idx]
        confidence = float(probabilities[prediction_idx])
        
        # Calculate threat score (risk score)
        # Normal has low risk (0-15%), attacks have higher risk proportional to model confidence
        if prediction_idx == 0:
            threat_score = int(np.random.randint(0, 10))
        else:
            threat_score = int(50 + (confidence * 50)) # scale threat score between 50 and 100 for attacks
            
        # 2. Explainable AI Logic: calculate feature contributions
        # We calculate the absolute deviation from normal baselines, normalized to show percentage contribution.
        deviations = {}
        for feature_name, normal_val in NORMAL_BASELINES.items():
            current_val = {
                "packet_rate": packet_rate,
                "packet_size_avg": packet_size_avg,
                "port_entropy": port_entropy,
                "failed_logins": failed_logins,
                "payload_anomaly": payload_anomaly
            }[feature_name]
            
            # Absolute differences
            if feature_name == "packet_rate":
                # Scale rate down to prevent it dominating other features
                diff = abs(current_val - normal_val) / 20.0 
            elif feature_name == "packet_size_avg":
                diff = abs(current_val - normal_val) / 100.0
            else:
                diff = abs(current_val - normal_val) * 10.0
                
            deviations[feature_name] = max(0.0, diff)
            
        total_deviation = sum(deviations.values())
        
        # Avoid division by zero
        if total_deviation == 0:
            feature_contributions = {k: 20.0 for k in NORMAL_BASELINES.keys()} # equal weight
        else:
            feature_contributions = {
                k: round((v / total_deviation) * 100, 1) for k, v in deviations.items()
            }
            
        # Generate text-based explanation
        explanation_text = self._generate_explanation_text(
            predicted_class, packet_rate, packet_size_avg, port_entropy, failed_logins, payload_anomaly
        )

        return {
            "prediction": predicted_class,
            "confidence": round(confidence * 100, 2),
            "threat_score": threat_score,
            "explanation": explanation_text,
            "feature_contributions": feature_contributions,
            "raw_features": {
                "packet_rate": packet_rate,
                "packet_size_avg": packet_size_avg,
                "port_entropy": port_entropy,
                "failed_logins": failed_logins,
                "payload_anomaly": payload_anomaly
            }
        }

    def _generate_explanation_text(self, predicted_class, packet_rate, packet_size_avg, port_entropy, failed_logins, payload_anomaly):
        """
        Purpose: Create a student-friendly explanation of why the model picked a class.
        """
        if predicted_class == "Normal":
            return "All features fall within normal baseline limits. The traffic pattern represents standard medical telemetry."
        elif predicted_class == "DDoS":
            return f"DDoS flooding detected. Packet rate is extremely high ({packet_rate:.1f} packets/sec), which overloads medical devices."
        elif predicted_class == "Port Scan":
            return f"Port scan detected. The port entropy is high ({port_entropy:.2f}), showing that a single IP is trying to probe multiple ports in a short duration."
        elif predicted_class == "Brute Force":
            return f"Brute force attempt detected. There are multiple failed logins ({failed_logins}) observed, typical of password guessing or credential stuffing on medical consoles."
        elif predicted_class == "Spoofing":
            return f"Packet spoofing detected. The payload anomaly rating is very high ({payload_anomaly:.2f}), suggesting injected shellcode or modified patient sensor metrics."
        elif predicted_class == "Botnet":
            return f"Botnet activity detected. Packet rate is high ({packet_rate:.1f} packets/sec) and combined with large data sizes ({packet_size_avg:.1f} bytes), matching command-and-control behavior."
        return "Unknown network anomaly detected."

if __name__ == "__main__":
    detector = ThreatDetector()
    
    # Test DDoS
    res1 = detector.predict_threat(1500, 100, 0.05, 0, 0.1)
    print("\nTest DDoS:")
    print("Prediction:", res1["prediction"])
    print("Threat Score:", res1["threat_score"])
    print("Explanation:", res1["explanation"])
    print("Contributions:", res1["feature_contributions"])
    
    # Test Normal
    res2 = detector.predict_threat(10, 200, 0.05, 0, 0.05)
    print("\nTest Normal:")
    print("Prediction:", res2["prediction"])
    print("Contributions:", res2["feature_contributions"])
