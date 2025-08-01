import os
import cv2
import shutil

# Path to your live_errors and main dataset
live_errors_dir = os.path.join(os.path.dirname(__file__), "live_errors")
dataset_dir = os.path.join(os.path.dirname(__file__), "data", "indian-sign-language-dataset", "Indian")

files = sorted([f for f in os.listdir(live_errors_dir) if f.endswith(".png")])

for filename in files:
    img_path = os.path.join(live_errors_dir, filename)
    img = cv2.imread(img_path)
    display_img = cv2.resize(img, (256, 256), interpolation=cv2.INTER_NEAREST)  # Resize for better visibility
    cv2.imshow("Label Image (press A-Z, 1-9, - to delete, * to quit)", display_img)
    key = cv2.waitKey(0)
    key_char = chr(key).upper() if 0 <= key <= 255 else ''

    if key_char in [str(i) for i in range(1, 10)] + [chr(c) for c in range(ord('A'), ord('Z')+1)]:
        class_name = key_char
        class_dir = os.path.join(dataset_dir, class_name)
        os.makedirs(class_dir, exist_ok=True)
        shutil.move(img_path, os.path.join(class_dir, filename))
        print(f"Moved {filename} to {class_name}")
    elif key == ord('*'):
        break
    elif key == ord('-') or key == 3014656:
        os.remove(img_path)
        print(f"Deleted {filename}")
    else:
        print("Invalid key, skipping...")

    cv2.destroyAllWindows()

print("Labeling complete.")