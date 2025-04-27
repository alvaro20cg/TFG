from flask import Flask, request, jsonify
import cv2
import dlib
import numpy as np
from io import BytesIO
from PIL import Image

app = Flask(__name__)

# Cargar el detector de rostros y el predictor de puntos faciales
face_detector = dlib.get_frontal_face_detector()
landmark_predictor = dlib.shape_predictor("./facedat/shape_predictor_68_face_landmarks.dat")

@app.route('/')
def index():
    return "Server is running, send a POST request to /process"

@app.route('/process', methods=['POST'])
def process_image():
    # Obtener la imagen del cliente
    file = request.files['image']
    img_bytes = file.read()

    # Convertir el archivo de bytes en una imagen
    img = Image.open(BytesIO(img_bytes))
    img = np.array(img)

    # Convertir la imagen a escala de grises
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Detectar rostros en la imagen
    faces = face_detector(gray)

    result = []
    for face in faces:
        # Predecir los puntos faciales
        landmarks = landmark_predictor(gray, face)
        eyes = []

        # Ojos izquierdo (36-41) y derecho (42-47)
        for n in range(36, 42):
            eyes.append((landmarks.part(n).x, landmarks.part(n).y))
        for n in range(42, 48):
            eyes.append((landmarks.part(n).x, landmarks.part(n).y))

        result.append(eyes)

    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)
