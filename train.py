from data.preprocess import resize_images, normalize_data, get_images_and_labels
from models.cnn_model import CNNModel
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report
from tensorflow.keras.utils import image_dataset_from_directory
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.optimizers import Adam
import numpy as np
import tensorflow as tf
import albumentations as A
import cv2
import random
from tensorflow.keras.utils import img_to_array

def main():
    try:
        # Set paths
        data_dir = os.path.join("data", "indian-sign-language-dataset", "Indian")

        # Use image_dataset_from_directory for efficient loading
        image_size = (64, 64)
        batch_size = 32

        train_dataset = image_dataset_from_directory(
            data_dir,
            validation_split=0.2,
            subset="training",
            seed=42,
            image_size=image_size,
            batch_size=batch_size,
            label_mode='int'
        )
        val_dataset = image_dataset_from_directory(
            data_dir,
            validation_split=0.2,
            subset="validation",
            seed=42,
            image_size=image_size,
            batch_size=batch_size,
            label_mode='int'
        )

        # Add this block to count samples
        train_count = 0
        for _ in train_dataset.unbatch():
            train_count += 1

        val_count = 0
        for _ in val_dataset.unbatch():
            val_count += 1

        print(f"Train sample count: {train_count}")
        print(f"Validation sample count: {val_count}")

        # Now use these counts for steps_per_epoch and validation_steps
        steps_per_epoch = int(np.ceil(train_count / batch_size))
        validation_steps = int(np.ceil(val_count / batch_size))

        # Get class names BEFORE mapping
        class_names = train_dataset.class_names
        num_classes = len(class_names)
        input_shape = (64, 64, 3)

        # Map preprocess
        #train_dataset = train_dataset.map(preprocess)
        #val_dataset = val_dataset.map(preprocess)

        # Data augmentation
        data_augmentation = tf.keras.Sequential([
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.1),
            tf.keras.layers.RandomZoom(0.1),
            tf.keras.layers.RandomBrightness(0.1)
        ])

        def augment(image, label):
            image = data_augmentation(image)
            return image, label

        # After creating train_dataset and val_dataset
        train_dataset = train_dataset.unbatch()
        val_dataset = val_dataset.unbatch()

        # Background augmentation 
        train_dataset = train_dataset.map(tf_albumentations_augment, num_parallel_calls=tf.data.AUTOTUNE)
        # Keras data augmentation
        train_dataset = train_dataset.map(augment)
        # Preprocessing
        train_dataset = train_dataset.map(preprocess)
        val_dataset = val_dataset.map(preprocess)

        # Rebatch
        train_dataset = train_dataset.batch(batch_size)
        val_dataset = val_dataset.batch(batch_size)

        # Debug: Check shape and dtype
        for img, lbl in train_dataset.take(1):
            print(img.shape, img.dtype)

        # Build model
        model = CNNModel(input_shape, num_classes)
        model.model.summary()

        early_stop = EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True)

        # Train model
        history = model.model.fit(
            train_dataset,
            validation_data=val_dataset,
            epochs=30,
            callbacks=[early_stop],
            steps_per_epoch=steps_per_epoch,
            validation_steps=validation_steps
        )

        # Evaluate and report
        val_images = []
        val_labels = []
        for batch_images, batch_labels in val_dataset:
            val_images.append(batch_images)
            val_labels.append(batch_labels)
        val_images = np.concatenate(val_images)
        val_labels = np.concatenate(val_labels)

        y_pred = np.argmax(model.predict(val_images), axis=1)

        cm = confusion_matrix(val_labels, y_pred)
        plt.figure(figsize=(12, 10))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=class_names, yticklabels=class_names)
        plt.xlabel('Predicted')
        plt.ylabel('True')
        plt.title('Confusion Matrix')
        plt.show()

        print("\nClassification Report:\n", classification_report(val_labels, y_pred, target_names=class_names))

        # Print overall accuracy
        accuracy = np.mean(val_labels == y_pred)
        print(f"\nOverall Accuracy: {accuracy:.4f}")

        # Save model
        model.save("isl_cnn_model.keras")

        print("\nTraining complete. Model saved as isl_cnn_model.keras.")

        # Fine-tuning step
        print("\nStarting fine-tuning...")
        model.unfreeze_base()  # Unfreeze ResNet base

        # Add this re-compile step with lower learning rate
        model.model.compile(
            optimizer=Adam(learning_rate=1e-5),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )

        history_ft = model.model.fit(
            train_dataset,
            validation_data=val_dataset,
            epochs=5,  # Fine-tune for a few epochs
            callbacks=[early_stop],
            steps_per_epoch=steps_per_epoch,
            validation_steps=validation_steps
        )

        # Evaluate after fine-tuning
        val_images = []
        val_labels = []
        for batch_images, batch_labels in val_dataset:
            val_images.append(batch_images)
            val_labels.append(batch_labels)
        val_images = np.concatenate(val_images)
        val_labels = np.concatenate(val_labels)

        y_pred = np.argmax(model.predict(val_images), axis=1)
        print("\nFine-tuning Classification Report:\n", classification_report(val_labels, y_pred, target_names=class_names))
        accuracy = np.mean(val_labels == y_pred)
        print(f"\nFine-tuning Overall Accuracy: {accuracy:.4f}")

        # Save fine-tuned model
        model.save("isl_cnn_model_finetuned.keras")
        print("\nFine-tuned model saved as isl_cnn_model_finetuned.keras.")

    except Exception as e:
        print("An error occurred during training or evaluation:", str(e))

def preprocess(image, label):
    image = preprocess_input(image)
    return image, label

backgrounds_dir = "backgrounds"
background_files = [os.path.join(backgrounds_dir, f) for f in os.listdir(backgrounds_dir)]

def random_background(image):
    # image: numpy array (H, W, 3)
    bg_path = random.choice(background_files)
    bg = cv2.imread(bg_path)
    bg = cv2.resize(bg, (image.shape[1], image.shape[0]))
    # Simple mask: treat black as background (you can improve this with segmentation)
    mask = np.all(image == [0,0,0], axis=-1)  # shape (H, W)
    image[mask, :] = bg[mask, :]  # apply mask to all channels
    return image

def albumentations_augment(image, label):
    image = image.numpy()
    image = random_background(image)
    image = image.astype(np.float32)
    return image, label

def tf_albumentations_augment(image, label):
    image, label = tf.py_function(
        albumentations_augment, [image, label], [tf.float32, tf.int32]
    )
    image.set_shape([64, 64, 3])  # Set shape explicitly
    label.set_shape([])
    return image, label


if __name__ == "__main__":
    main()