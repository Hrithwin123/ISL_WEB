# Indian Sign Language (ISL) Recognition System

A real-time Indian Sign Language recognition system using CNN with ResNet50 backbone, capable of recognizing digits (1-9) and letters (A-Z).

## Features

- **Real-time gesture recognition** using webcam
- **CNN model** with ResNet50 transfer learning
- **Data augmentation** with background replacement
- **Live error collection** for model improvement
- **Spell checking** for word formation
- **Hand tracking** using MediaPipe

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Create Directory Structure
```bash
python setup_directories.py
```

### 3. Download Dataset
You need to obtain the Indian Sign Language dataset and organize it as follows:
```
data/indian-sign-language-dataset/Indian/
├── 1/  (images for digit 1)
├── 2/  (images for digit 2)
├── ...
├── A/  (images for letter A)
├── B/  (images for letter B)
└── ... (all letters A-Z)
```

### 4. Add Background Images
Place some background images in the `backgrounds/` folder for data augmentation.

## Usage

### Training the Model
```bash
python train.py
```
This will:
- Load and preprocess the dataset
- Train a CNN model with ResNet50 backbone
- Perform fine-tuning
- Save models as `isl_cnn_model.keras` and `isl_cnn_model_finetuned.keras`

### Live Prediction
```bash
python live_predict.py
```
This starts real-time gesture recognition using your webcam.

### Test Camera
```bash
python test_camera.py
```
Test if your webcam is working properly.

### Label Live Errors
```bash
python label_live_errors.py
```
Manually label captured error images to improve the dataset.

## System Requirements

- **Python**: 3.7+
- **RAM**: 8GB+ (16GB recommended for training)
- **GPU**: NVIDIA GPU with CUDA support (recommended)
- **Webcam**: For live prediction
- **Storage**: At least 5GB for dataset and models

## Model Architecture

- **Base Model**: ResNet50 (pre-trained on ImageNet)
- **Input Size**: 64x64x3
- **Classes**: 35 (digits 1-9 + letters A-Z)
- **Training**: Transfer learning with fine-tuning

## File Structure

```
alpha/
├── data/
│   ├── __init__.py
│   ├── preprocess.py
│   └── indian-sign-language-dataset/
│       └── Indian/
│           ├── 1/, 2/, ..., 9/
│           └── A/, B/, ..., Z/
├── models/
│   └── cnn_model.py
├── backgrounds/
├── live_errors/
├── train.py
├── live_predict.py
├── test_camera.py
├── label_live_errors.py
├── utils.py
├── setup_directories.py
├── requirements.txt
└── README.md
```

## Troubleshooting

### Common Issues

1. **"Cannot open webcam"**: Check if webcam is connected and not in use by another application
2. **Memory errors during training**: Reduce batch size or use smaller input size
3. **Import errors**: Make sure all dependencies are installed correctly
4. **Model not found**: Run training first to generate model files

### Performance Tips

- Use GPU for faster training
- Increase batch size if you have more RAM
- Use data augmentation for better generalization
- Collect and label error cases to improve accuracy

## Dataset Sources

You can find Indian Sign Language datasets on:
- Kaggle
- GitHub repositories
- Academic datasets

Make sure to organize images in the correct directory structure as shown above. 