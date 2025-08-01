from utils import predict_live_gesture, load_model
import os

# Load your trained model
model = load_model("./isl_cnn_model.keras/")  # Path must match your saved model (note the trailing slash for directory)

# Define your class names in the SAME order as used during training
class_names = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
    'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U',
    'V', 'W', 'X', 'Y', 'Z'
]

# Make sure input_size matches your model's expected input (height, width)
input_size = (64, 64)

# Start live gesture prediction
predict_live_gesture(model, class_names, input_size=input_size)