import cv2
import numpy as np
from tensorflow.keras.applications.resnet50 import preprocess_input
from spellchecker import SpellChecker  # for pyspellchecker, this is correct
import mediapipe as mp
import time
from collections import deque, Counter
import os

def save_model(model, filepath):
    model.save(filepath)

def load_model(filepath):
    from tensorflow.keras.models import load_model
    return load_model(filepath)

def log_message(message):
    import logging
    logging.basicConfig(level=logging.INFO)
    logging.info(message)

def visualize_results(history):
    import matplotlib.pyplot as plt

    plt.plot(history.history['accuracy'], label='accuracy')
    plt.plot(history.history['val_accuracy'], label='val_accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    plt.show()

def predict_live_gesture(model, class_names, input_size=(64, 64)):
    spell = SpellChecker()
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Cannot open webcam")
        return

    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(static_image_mode=False, max_num_hands=2, min_detection_confidence=0.5)
    mp_draw = mp.solutions.drawing_utils

    print("Press 'q' to quit.")
    word_buffer = ""
    last_pred = ""
    last_time = time.time()
    pred_buffer = deque(maxlen=7)

    error_dir = os.path.join(os.path.dirname(__file__), "live_errors")
    os.makedirs(error_dir, exist_ok=True)
    existing_errors = [f for f in os.listdir(error_dir) if f.startswith("error_") and f.endswith(".png")]
    error_count = len(existing_errors) + 1

    last_hand_position = None
    stagnant_start_time = None
    no_hand_start_time = None
    STAGNANT_THRESHOLD = 1  # seconds

    def positions_close(pos1, pos2, tol=5):
        return all(abs(a - b) <= tol for a, b in zip(pos1, pos2))

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Failed to grab frame (camera disconnected or busy)")
                break

            h, w, _ = frame.shape
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(frame_rgb)

            display_text = "Detecting..."

            if results.multi_hand_landmarks:
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
                    continue

                if hand_img.size != 0:
                    hand_img_resized = cv2.resize(hand_img, input_size)
                    hand_img_rgb = cv2.cvtColor(hand_img_resized, cv2.COLOR_BGR2RGB)
                    img_array = np.expand_dims(hand_img_rgb, axis=0)
                    img_array = preprocess_input(img_array)
                    preds = model.predict(img_array)
                    pred_idx = np.argmax(preds)
                    confidence = float(np.max(preds))
                    current_pred = class_names[pred_idx]

                    pred_buffer.append(current_pred)
                    if len(pred_buffer) == pred_buffer.maxlen:
                        smoothed_pred = Counter(pred_buffer).most_common(1)[0][0]
                    else:
                        smoothed_pred = current_pred

                    # --- Prediction logic ---
                    if smoothed_pred and confidence > 0.5 and time.time() - last_time > 2.0:
                        word_buffer += smoothed_pred
                        last_pred = smoothed_pred
                        last_time = time.time()

                    display_text = f"{smoothed_pred} ({confidence:.2f})"

                    if confidence > 0.5:
                        error_img_path = os.path.join(error_dir, f"error_{error_count}.png")
                        cv2.imwrite(error_img_path, hand_img_resized)
                        error_count += 1

                cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
            else:
                # No hand detected
                if no_hand_start_time is None:
                    no_hand_start_time = time.time()
                elif time.time() - no_hand_start_time > STAGNANT_THRESHOLD:
                    if not word_buffer.endswith(" "):
                        # Autocorrect previous word before adding space
                        words = word_buffer.strip().split(" ")
                        if words and words[-1]:
                            corrected = spell.correction(words[-1])
                            if corrected is None:
                                corrected = ""
                            words[-1] = corrected
                            # Filter out None values before joining
                            words = [w for w in words if w is not None]
                            word_buffer = " ".join(words) + " "
                        else:
                            word_buffer += " "
                        print("Space added due to no hand motion.")
                    no_hand_start_time = None  # Reset timer after adding space

            cv2.putText(frame, f"Word: {word_buffer}", (10, 80), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 128, 0), 2)
            cv2.putText(frame, display_text, (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

            # --- Draw 3x3 grid lines ---
            grid_color = (255, 255, 255)  # White
            thickness = 1
            cv2.line(frame, (w // 3, 0), (w // 3, h), grid_color, thickness)
            cv2.line(frame, (2 * w // 3, 0), (2 * w // 3, h), grid_color, thickness)
            cv2.line(frame, (0, h // 3), (w, h // 3), grid_color, thickness)
            cv2.line(frame, (0, 2 * h // 3), (w, 2 * h // 3), grid_color, thickness)


            cv2.imshow("Live Gesture Prediction", frame)

            # --- Key handling ---
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == 13:  # Enter key
                word_buffer = ""
                last_pred = ""
                pred_buffer.clear()
                print("New sentence/word started.")
    except Exception as e:
        print(f"Exception occurred: {e}")
    finally:
        cap.release()
        cv2.destroyAllWindows()