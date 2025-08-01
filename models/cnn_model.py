from tensorflow.keras.applications import ResNet50
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.optimizers import Adam

def build_cnn_model(input_shape, num_classes):
    base_model = ResNet50(input_shape=input_shape, include_top=False, weights='imagenet')
    base_model.trainable = False  # Freeze base model

    model = Sequential([
        base_model,
        GlobalAveragePooling2D(),
        Dense(256, activation='relu'),
        Dropout(0.5),
        Dense(num_classes, activation='softmax')
    ])
    model.compile(optimizer=Adam(learning_rate=0.001),
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])
    return model

class CNNModel:
    def __init__(self, input_shape, num_classes):
        self.input_shape = input_shape
        self.num_classes = num_classes
        self.model = build_cnn_model(input_shape, num_classes)

    def train(self, train_data, validation_data, epochs, callbacks=None):
        history = self.model.fit(
            train_data,
            validation_data=validation_data,
            epochs=epochs,
            callbacks=callbacks
        )
        return history

    def evaluate(self, test_data):
        return self.model.evaluate(test_data)

    def predict(self, x):
        return self.model.predict(x)

    def save(self, filepath):
        self.model.save(filepath)

    def load(self, filepath):
        from tensorflow.keras.models import load_model
        self.model = load_model(filepath)

    def unfreeze_base(self):
        self.model.layers[0].trainable = True