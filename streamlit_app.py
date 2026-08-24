"""
LesionXpert AI - Clinical Decision-Support Prototype for Oral Potentially Malignant Disorders (OPMD)
Framework: Streamlit | Architecture: ResNet50
"""

import os
import json
from pathlib import Path
import streamlit as st
import numpy as np
from PIL import Image, ImageOps
import tensorflow as tf

st.set_page_config(
    page_title="LesionXpert AI - OPMD Clinical Prototype",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="expanded"
)

MODEL_PATH = "models/resnet50_opmd.keras"
CLASS_INDICES_PATH = "models/class_indices.json"
CLASS_NAMES_DEFAULT = ["Normal", "OCA", "OLK", "OLP", "OSF"]

CLASS_DESCRIPTIONS = {
    "Normal": "Normal oral mucosal tissue without observable dysplastic or inflammatory lesions.",
    "OCA": "Oral Carcinoma / Malignant epithelial neoplasm requiring urgent oncologic review.",
    "OLK": "Oral Leukoplakia — predominantly white plaque of questionable risk.",
    "OLP": "Oral Lichen Planus — chronic inflammatory mucocutaneous condition.",
    "OSF": "Oral Submucous Fibrosis — chronic fibrotic condition associated with betel nut habits."
}

CLINICAL_RECOMMENDATIONS = {
    "Normal": "Routine clinical follow-up during regular dental check-ups.",
    "OCA": "Urgent biopsy and referral to Head & Neck Oncology / Maxillofacial Surgery.",
    "OLK": "Specialist referral for histopathological examination (incisional biopsy) and cessation of risk factors.",
    "OLP": "Clinical and histopathological evaluation; symptomatic management with topical corticosteroids.",
    "OSF": "Complete cessation of areca nut / tobacco habit; nutritional support and surgical evaluation if severe."
}

@st.cache_resource
def load_trained_model():
    if not os.path.exists(MODEL_PATH):
        return None, None, f"Model file not found at '{MODEL_PATH}'. Please ensure 'models/resnet50_opmd.keras' is present."
    try:
        model = tf.keras.models.load_model(MODEL_PATH)
        if os.path.exists(CLASS_INDICES_PATH):
            with open(CLASS_INDICES_PATH, "r") as f:
                raw_map = json.load(f)
                class_names = [raw_map[str(i)] if str(i) in raw_map else raw_map.get(i, f"Class_{i}") for i in range(len(raw_map))]
        else:
            class_names = CLASS_NAMES_DEFAULT
        return model, class_names, None
    except Exception as e:
        return None, None, f"Error loading model: {str(e)}"

def preprocess_image_for_resnet50(pil_image: Image.Image) -> np.ndarray:
    img = ImageOps.exif_transpose(pil_image).convert("RGB")
    img = img.resize((224, 224), Image.Resampling.BILINEAR)
    img_array = np.array(img, dtype=np.float32)
    preprocessed = tf.keras.applications.resnet50.preprocess_input(img_array)
    return np.expand_dims(preprocessed, axis=0)

# Sidebar
st.sidebar.title("🔬 LesionXpert AI")
st.sidebar.caption("Research Prototype — OPMD Assessment")
st.sidebar.markdown("---")

model, class_names, load_error = load_trained_model()
if load_error:
    st.sidebar.error(load_error)
else:
    st.sidebar.success("Model loaded: ResNet50 (5 Classes)")
    with st.sidebar.expander("Model Architecture"):
        st.write(f"**Input:** {model.input_shape}")
        st.write(f"**Output:** {model.output_shape}")
        st.write(f"**Classes:** {', '.join(class_names)}")

# Main Layout
st.title("Oral Potentially Malignant Disorders (OPMD) Classifier")
st.markdown("Upload a clinical photograph of an oral mucosal lesion for AI-assisted classification.")

uploaded_file = st.file_uploader(
    "Choose a clinical photograph (JPG, JPEG, PNG)",
    type=["jpg", "jpeg", "png"]
)

col1, col2 = st.columns([1, 1])

if uploaded_file is not None:
    try:
        image = Image.open(uploaded_file)
        with col1:
            st.subheader("Uploaded Clinical Image")
            st.image(image, use_container_width=True, caption=f"File: {uploaded_file.name}")
        
        with col2:
            st.subheader("AI Analysis & Clinical Support")
            if model is not None:
                with st.spinner("Analyzing lesion features through ResNet50..."):
                    input_tensor = preprocess_image_for_resnet50(image)
                    raw_probabilities = model.predict(input_tensor, verbose=0)[0]
                    pred_idx = int(np.argmax(raw_probabilities))
                    predicted_class = class_names[pred_idx]
                    confidence = float(raw_probabilities[pred_idx])

                st.markdown(f"### AI-Assisted Finding: **{predicted_class}**")
                st.write(f"**Classification Confidence:** {confidence * 100:.1f}%")
                st.progress(min(1.0, max(0.0, confidence)))

                st.markdown(f"**Description:** {CLASS_DESCRIPTIONS.get(predicted_class, 'Oral mucosal finding.')}")
                st.markdown(f"**Recommended Action:** {CLINICAL_RECOMMENDATIONS.get(predicted_class, 'Requires clinical review.')}")

                st.markdown("#### Probability Distribution")
                for idx, cname in enumerate(class_names):
                    prob = float(raw_probabilities[idx])
                    st.write(f"**{cname}:** {prob * 100:.2f}%")
                    st.progress(prob)
            else:
                st.error("Cannot run inference because the model is not loaded.")
    except Exception as e:
        st.error(f"Error processing image: {str(e)}")

# Mandatory Medical Safety Banner
st.markdown("---")
st.warning(
    "⚠️ **Medical Safety Disclaimer:** AI output is intended to support, not replace, professional clinical assessment. "
    "This application does not provide a definitive diagnosis. All findings require comprehensive clinical correlation and biopsy where indicated."
)
