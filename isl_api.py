from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import io
from PIL import Image
import mediapipe as mp
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.models import load_model
import os

app = Flask(__name__)
CORS(app)

# Global variables for model and processing
model = None
class_names = None
mp_hands = None
hands = None

def initialize_model():
    """Initialize the model and MediaPipe hands detector"""
    global model, class_names, mp_hands, hands
    
    # Load model
    model = load_model("./isl_cnn_model.keras/")
    
    # Define class names (same order as training)
    class_names = [
        '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
        'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U',
        'V', 'W', 'X', 'Y', 'Z'
    ]
    
    # Initialize MediaPipe
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=True, 
        max_num_hands=2, 
        min_detection_confidence=0.5
    )

def process_image_for_prediction(image_data, input_size=(64, 64)):
    """
    Process image data and return prediction results
    
    Args:
        image_data: Base64 encoded image
        input_size: Target size for model input
    
    Returns:
        dict: Prediction results with gesture, confidence, and hand detection info
    """
    try:
        # Remove data URL prefix if present
        if image_data.startswith('data:image'):
            image_data = image_data.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        h, w, _ = frame.shape
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(frame_rgb)
        
        if not results.multi_hand_landmarks:
            return {
                'gesture': None,
                'confidence': 0.0,
                'hand_detected': False,
                'message': 'No hand detected'
            }
        
        # Extract hand region
        x_coords = []
        y_coords = []
        for hand_landmarks in results.multi_hand_landmarks:
            for lm in hand_landmarks.landmark:
                x_coords.append(int(lm.x * w))
                y_coords.append(int(lm.y * h))
        
        x_min, x_max = min(x_coords), max(x_coords)
        y_min, y_max = min(y_coords), max(y_coords)
        
        padding = 40
        x1 = max(0, x_min - padding)
        y1 = max(0, y_min - padding)
        x2 = min(w, x_max + padding)
        y2 = min(h, y_max + padding)
        hand_img = frame[y1:y2, x1:x2]
        
        min_hand_size = 32
        if hand_img.shape[0] < min_hand_size or hand_img.shape[1] < min_hand_size:
            return {
                'gesture': None,
                'confidence': 0.0,
                'hand_detected': True,
                'message': 'Hand too small'
            }
        
        # Preprocess for model
        hand_img_resized = cv2.resize(hand_img, input_size)
        hand_img_rgb = cv2.cvtColor(hand_img_resized, cv2.COLOR_BGR2RGB)
        img_array = np.expand_dims(hand_img_rgb, axis=0)
        img_array = preprocess_input(img_array)
        
        # Make prediction
        preds = model.predict(img_array, verbose=0)
        pred_idx = np.argmax(preds)
        confidence = float(np.max(preds))
        gesture = class_names[pred_idx]
        
        return {
            'gesture': gesture,
            'confidence': confidence,
            'hand_detected': True,
            'message': 'Prediction successful',
            'hand_bbox': [x1, y1, x2, y2]
        }
        
    except Exception as e:
        return {
            'gesture': None,
            'confidence': 0.0,
            'hand_detected': False,
            'message': f'Error: {str(e)}'
        }

@app.route('/api/predict', methods=['POST'])
def predict():
    """API endpoint for gesture prediction"""
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        image_data = data['image']
        result = process_image_for_prediction(image_data)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy', 
        'model_loaded': model is not None,
        'service': 'isl-prediction-api'
    })

if __name__ == '__main__':
    print("Initializing ISL model...")
    initialize_model()
    print("Model loaded successfully!")
    print("Starting Flask API server on port 5001...")
    app.run(debug=True, host='0.0.0.0', port=5001) 