import os

def create_directory_structure():
    """Create the required directory structure for the ISL recognition system"""
    
    # Create main directories
    directories = [
        "data",
        "data/indian-sign-language-dataset",
        "data/indian-sign-language-dataset/Indian",
        "backgrounds",
        "live_errors"
    ]
    
    # Create class directories for digits 1-9 and letters A-Z
    for digit in range(1, 10):
        directories.append(f"data/indian-sign-language-dataset/Indian/{digit}")
    
    for letter in range(ord('A'), ord('Z') + 1):
        directories.append(f"data/indian-sign-language-dataset/Indian/{chr(letter)}")
    
    # Create all directories
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"Created directory: {directory}")
    
    print("\nDirectory structure created successfully!")
    print("\nNext steps:")
    print("1. Download the Indian Sign Language dataset")
    print("2. Place images in the appropriate class folders")
    print("3. Add some background images to the 'backgrounds' folder")
    print("4. Install dependencies: pip install -r requirements.txt")
    print("5. Run: python train.py")

if __name__ == "__main__":
    create_directory_structure() 