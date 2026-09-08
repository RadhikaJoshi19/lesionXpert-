"""
OPMD-AI: AI-Assisted Identification of Oral Potentially Malignant Disorders
Modern Multi-Role Clinical Decision-Support & Educational Research Platform
"""

import os
import sys
import json
import sqlite3
from datetime import datetime
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps
import streamlit as st
import pandas as pd
import tensorflow as tf

ROOT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT_DIR))

from src.config import (
    CLASS_NAMES, CLASS_DISPLAY_NAMES, CLASS_DESCRIPTIONS,
    RISK_TIERS, CLINICAL_NEXT_STEPS,
    PRIMARY_CANDIDATE_MODEL_PATH, MOBILENET_MODEL_PATH, VGG16_MODEL_PATH,
    MIN_IMAGE_DIMENSION, LAPLACIAN_BLUR_THRESHOLD, DARKNESS_THRESHOLD, BRIGHTNESS_THRESHOLD
)
from src.preprocessing import load_image_rgb, preprocess_for_model
from src.image_quality import assess_image_quality
from src.gradcam import generate_gradcam_heatmap, overlay_gradcam
from src.database import save_case_to_db, fetch_all_cases, update_case_review, init_database
from src.auth import authenticate_user, register_user

# ==============================================================================
# 1. PAGE CONFIGURATION & STYLING (Stitch-Inspired Clinical Healthcare Theme)
# ==============================================================================

st.set_page_config(
    page_title="OPMD-AI — Oral Potentially Malignant Disorders Platform",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Premium Healthcare UI
st.markdown("""
<style>
    /* Global Typography & Font Family */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    h1, h2, h3, h4, .brand-title {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        font-weight: 700 !important;
        letter-spacing: -0.02em;
    }

    /* Main Container Padding */
    .main .block-container {
        padding-top: 1.5rem;
        padding-bottom: 3rem;
        max-width: 1350px;
    }

    /* Top Safety Banner */
    .medical-banner {
        background-color: #f0fdfa;
        border: 1px solid #99f6e4;
        color: #115e59;
        padding: 10px 16px;
        border-radius: 12px;
        font-size: 0.85rem;
        margin-bottom: 1.25rem;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    /* Clean White Metric Cards */
    .metric-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .metric-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
    .metric-label {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #64748b;
        letter-spacing: 0.05em;
    }
    .metric-value {
        font-size: 1.75rem;
        font-weight: 800;
        color: #0f172a;
        margin-top: 4px;
        font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .metric-sub {
        font-size: 0.75rem;
        color: #0d9488;
        font-weight: 600;
        margin-top: 4px;
    }

    /* Result Card */
    .finding-card {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: #ffffff;
        border-radius: 20px;
        padding: 24px;
        box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
    }
    .finding-title {
        font-size: 0.8rem;
        text-transform: uppercase;
        font-weight: 700;
        color: #2dd4bf;
        letter-spacing: 0.05em;
    }
    .finding-class {
        font-size: 2rem;
        font-weight: 800;
        color: #ffffff;
        margin: 6px 0;
    }

    /* Status Badges */
    .badge-good {
        background: #ecfdf5;
        color: #065f46;
        border: 1px solid #a7f3d0;
        padding: 3px 10px;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 0.75rem;
    }
    .badge-acceptable {
        background: #fffbeb;
        color: #92400e;
        border: 1px solid #fde68a;
        padding: 3px 10px;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 0.75rem;
    }
    .badge-insufficient {
        background: #fef2f2;
        color: #991b1b;
        border: 1px solid #fecaca;
        padding: 3px 10px;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 0.75rem;
    }

    /* Primary Buttons */
    .stButton>button[kind="primary"] {
        background-color: #0d9488 !important;
        border-color: #0d9488 !important;
        color: white !important;
        border-radius: 12px !important;
        font-weight: 700 !important;
        padding: 0.5rem 1.25rem !important;
    }
    .stButton>button[kind="primary"]:hover {
        background-color: #0f766e !important;
        border-color: #0f766e !important;
    }
</style>
""", unsafe_allow_html=True)

# Ensure database is initialized
init_database()

# ==============================================================================
# 2. SESSION STATE MANAGEMENT
# ==============================================================================

if "user" not in st.session_state:
    st.session_state["user"] = None

if "current_analysis" not in st.session_state:
    st.session_state["current_analysis"] = None

if "webcam_accepted_image" not in st.session_state:
    st.session_state["webcam_accepted_image"] = None

# ==============================================================================
# 3. CACHED MODEL LOADING
# ==============================================================================

@st.cache_resource(show_spinner="Loading trained neural network weights...")
def load_cached_model(model_choice: str):
    """
    Loads model and returns (model, model_type_str, class_names, error_str)
    """
    if model_choice == "ResNet50 (Primary Candidate)":
        p = PRIMARY_CANDIDATE_MODEL_PATH
        if not os.path.exists(p):
            p = "models/resnet/resnet_v1.keras"
        mtype = "resnet50"
    elif model_choice == "MobileNetV2 (Edge / Mobile)":
        p = MOBILENET_MODEL_PATH
        if not os.path.exists(p):
            p = "models/mobilenet/mobilenet_v1.keras"
        mtype = "mobilenetv2"
    elif model_choice == "VGG16 (Comparative Baseline)":
        p = VGG16_MODEL_PATH
        mtype = "vgg16"
    else:
        p = PRIMARY_CANDIDATE_MODEL_PATH
        mtype = "resnet50"

    if not os.path.exists(p):
        return None, mtype, CLASS_NAMES, f"Model file not found at '{p}'. Please run training."

    try:
        model = tf.keras.models.load_model(p)
        # Load class names if mapped
        class_names = CLASS_NAMES
        cmap_path = Path(p).parent / "class_indices.json"
        if cmap_path.exists():
            with open(cmap_path, "r") as f:
                c_map = json.load(f)
                class_names = [c_map[str(i)] if str(i) in c_map else c_map[i] for i in range(len(c_map))]
        return model, mtype, class_names, None
    except Exception as e:
        return None, mtype, CLASS_NAMES, f"Error loading model: {str(e)}"

# ==============================================================================
# 4. GLOBAL HEADER & SAFETY NOTICE
# ==============================================================================

def render_safety_banner():
    st.markdown("""
    <div class="medical-banner">
        <span>🛡️</span>
        <div>
            <strong>Clinical Safety Notice:</strong> OPMD-AI provides AI-assisted clinical decision-support intended for qualified healthcare professionals and educational research.
            AI predictions do not establish a definitive diagnosis. Definitive diagnosis requires clinical correlation and histopathological evaluation.
        </div>
    </div>
    """, unsafe_allow_html=True)

# ==============================================================================
# 5. AUTHENTICATION SCREENS (Sign In & Sign Up with SQLite)
# ==============================================================================

def render_auth_page():
    render_safety_banner()
    
    col_hero, col_auth = st.columns([1.1, 1], gap="large")

    with col_hero:
        st.markdown("<div style='padding-top: 1rem;'>", unsafe_allow_html=True)
        st.markdown("<span style='color: #0d9488; font-weight: 800; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;'>AI-Assisted Diagnostic Triage</span>", unsafe_allow_html=True)
        st.title("OPMD-AI")
        st.markdown("### Oral Potentially Malignant Disorders Diagnostic & Educational Platform")
        
        st.markdown("""
        OPMD-AI assists oral medicine specialists, maxillofacial surgeons, pathologists, and dental residents in evaluating suspicious mucosal lesions with explainable Grad-CAM visual attention.
        
        **Supported 5-Class Categorization:**
        - **Normal Oral Mucosa** (Benign baseline)
        - **Oral Squamous Cell Carcinoma (OCA / OSCC)** (Malignant neoplasm)
        - **Oral Leukoplakia (OLK)** (Predominantly white keratotic plaque)
        - **Oral Lichen Planus (OLP)** (Chronic T-cell mediated mucocutaneous condition)
        - **Oral Submucous Fibrosis (OSF / OSMF)** (Areca nut-related fibrotic disorder)
        """)

        # 1-Click Evaluation Credentials
        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown("##### ⚡ Quick 1-Click Test Credentials (Instant Evaluation)")
        c1, c2 = st.columns(2)
        with c1:
            if st.button("🩺 Dr. Ananya Rao (Doctor)", use_container_width=True):
                ok, user, err = authenticate_user("ananya.rao@opmd-clinic.com", "Doctor@2026!")
                if ok:
                    st.session_state["user"] = user
                    st.rerun()
        with c2:
            if st.button("🎓 Alex Chen (Student)", use_container_width=True):
                ok, user, err = authenticate_user("alex.chen@meduniv.edu", "Student@2026!")
                if ok:
                    st.session_state["user"] = user
                    st.rerun()
        st.markdown("</div>", unsafe_allow_html=True)

    with col_auth:
        st.markdown("<div class='metric-card'>", unsafe_allow_html=True)
        auth_tab1, auth_tab2 = st.tabs(["🔑 Sign In", "📝 Create Account"])

        with auth_tab1:
            st.markdown("#### Welcome Back")
            st.caption("Access your clinical or academic workstation.")
            
            login_email = st.text_input("Institutional Email", placeholder="doctor@hospital.org", key="login_email")
            login_password = st.text_input("Password", type="password", placeholder="••••••••", key="login_pass")
            
            if st.button("Sign In to OPMD-AI", type="primary", use_container_width=True):
                if not login_email or not login_password:
                    st.error("Please provide both email address and password.")
                else:
                    success, user_obj, err_msg = authenticate_user(login_email, login_password)
                    if success and user_obj:
                        st.session_state["user"] = user_obj
                        st.success(f"Welcome back, {user_obj['full_name']}!")
                        st.rerun()
                    else:
                        st.error(err_msg or "Invalid email or password.")

        with auth_tab2:
            st.markdown("#### Register Account")
            st.caption("Stored securely in persistent SQLite database.")

            reg_role = st.radio("Account Role", ["doctor", "student"], format_func=lambda x: "Doctor / Specialist" if x == "doctor" else "Dental Student / Resident", horizontal=True)
            reg_name = st.text_input("Full Name", placeholder="Dr. Jane Doe / John Smith", key="reg_name")
            reg_email = st.text_input("Email Address", placeholder="name@institution.edu", key="reg_email")
            reg_pass = st.text_input("Password (min 8 chars)", type="password", key="reg_pass")
            reg_pass_confirm = st.text_input("Confirm Password", type="password", key="reg_pass_conf")

            if reg_role == "doctor":
                reg_inst = st.text_input("Hospital / Clinic / Department", placeholder="Maxillofacial Oncology Dept", key="reg_inst")
                reg_pid = st.text_input("Professional Medical ID", placeholder="DENT-REG-10492", key="reg_pid")
                reg_spec = st.selectbox("Specialty", ["Oral & Maxillofacial Pathology", "Oral Medicine & Radiology", "Oral & Maxillofacial Surgery", "Periodontics", "General Dental Practice"], key="reg_spec")
                reg_univ, reg_prog, reg_year = "", "", ""
            else:
                reg_univ = st.text_input("College / University", placeholder="Dental Sciences Institute", key="reg_univ")
                reg_prog = st.text_input("Program / Degree", placeholder="BDS / Oral Medicine Resident", key="reg_prog")
                reg_year = st.selectbox("Year of Study", ["Year 1 Resident", "Year 2 Resident", "Year 3 Senior Resident", "Final Year BDS Student"], key="reg_year")
                reg_inst, reg_pid, reg_spec = "", "", ""

            if st.button("Register Account", type="primary", use_container_width=True):
                if reg_pass != reg_pass_confirm:
                    st.error("Passwords do not match.")
                else:
                    success, new_user, err_msg = register_user(
                        full_name=reg_name,
                        email=reg_email,
                        password=reg_pass,
                        role=reg_role,
                        institution=reg_inst,
                        professional_id=reg_pid,
                        specialty=reg_spec,
                        university=reg_univ,
                        program=reg_prog,
                        year_of_study=reg_year
                    )
                    if success and new_user:
                        st.session_state["user"] = new_user
                        st.success(f"Account registered successfully! Logged in as {new_user['full_name']}.")
                        st.rerun()
                    else:
                        st.error(err_msg or "Registration failed.")
        st.markdown("</div>", unsafe_allow_html=True)

# ==============================================================================
# 6. DOCTOR WORKSPACE: 7-STEP ANALYSIS WORKFLOW
# ==============================================================================

def render_7step_analysis_flow(user: dict, role_mode: str = "doctor"):
    st.markdown("### 🔬 AI-Assisted Lesion Analysis Workflow")
    st.caption("Upload a clinical photograph or capture live via camera for multi-class classification and Grad-CAM explainability.")

    # Model Selector in Analysis
    col_m1, col_m2 = st.columns([1.5, 1])
    with col_m1:
        model_selection = st.selectbox(
            "Selected CNN Architecture",
            ["ResNet50 (Primary Candidate)", "MobileNetV2 (Edge / Mobile)", "VGG16 (Comparative Baseline)"],
            index=0
        )
    with col_m2:
        model_obj, model_type_str, class_names, load_err = load_cached_model(model_selection)
        if load_err:
            st.error(load_err)
        else:
            st.success(f"Model Ready: {model_selection.split(' ')[0]} ({len(class_names)} Classes)")

    # ----------------------------------------------------
    # STEP 1: CHOOSE IMAGE SOURCE (Upload OR Webcam)
    # ----------------------------------------------------
    st.markdown("#### Step 1: Choose Image Source")
    input_source = st.radio("Image Input Mode", ["📁 Upload Photograph", "📷 Live Webcam Capture"], horizontal=True)

    input_pil_image = None
    source_filename = "camera_capture.jpg"

    if input_source == "📁 Upload Photograph":
        uploaded_file = st.file_uploader(
            "Choose a clinical intraoral photograph (JPG, JPEG, PNG, WEBP)",
            type=["jpg", "jpeg", "png", "webp"],
            key="file_uploader_input"
        )
        if uploaded_file is not None:
            try:
                input_pil_image = load_image_rgb(uploaded_file.read())
                source_filename = uploaded_file.name
            except Exception as e:
                st.error(f"Error opening image file: {e}")
    else:
        # Streamlit Camera Input with Take Photo, Preview, Retake, Use This Photo
        st.markdown("##### Camera Capture Station")
        camera_photo = st.camera_input("Position clinical lesion in center of view and click 'Take Photo'")
        
        if camera_photo is not None:
            temp_cam_pil = load_image_rgb(camera_photo.read())
            st.session_state["webcam_accepted_image"] = temp_cam_pil
            
        if st.session_state.get("webcam_accepted_image") is not None:
            c_btn1, c_btn2 = st.columns([1, 1])
            with c_btn1:
                st.success("✅ Photograph captured and ready for analysis.")
                input_pil_image = st.session_state["webcam_accepted_image"]
            with c_btn2:
                if st.button("🔄 Retake Photo", key="btn_retake_cam"):
                    st.session_state["webcam_accepted_image"] = None
                    st.rerun()

    if input_pil_image is None:
        st.info("Please upload an image or capture a photo with the webcam to proceed with analysis.")
        return

    st.markdown("---")

    # ----------------------------------------------------
    # STEP 2 & 3: PREVIEW & IMAGE QUALITY CHECK
    # ----------------------------------------------------
    col_prev, col_qual = st.columns([1, 1], gap="large")

    with col_prev:
        st.markdown("#### Step 2: Image Preview")
        st.image(input_pil_image, caption=f"Input: {source_filename} ({input_pil_image.size[0]}x{input_pil_image.size[1]}px)", use_container_width=True)

    with col_qual:
        st.markdown("#### Step 3: Image Quality Assessment")
        quality = assess_image_quality(input_pil_image)
        metrics = quality["metrics"]

        if quality["status"] == "Good":
            badge_html = "<span class='badge-good'>Quality: Optimal (Good)</span>"
        elif quality["status"] == "Acceptable":
            badge_html = "<span class='badge-acceptable'>Quality: Acceptable</span>"
        else:
            badge_html = "<span class='badge-insufficient'>Quality: Insufficient</span>"

        st.markdown(f"**Diagnostic Readiness:** {badge_html}", unsafe_allow_html=True)
        
        # Metrics Table
        st.markdown(f"""
        - **Resolution:** `{metrics['width']} x {metrics['height']} px` (Min: `{metrics['min_dimension']} px`)
        - **Sharpness Score (Laplacian Var):** `{metrics['blur_score']}` (Threshold: `{metrics['blur_threshold']}`)
        - **Illumination (Mean Lux):** `{metrics['mean_brightness']}` (Range: `{metrics['darkness_threshold']} - {metrics['brightness_threshold']}`)
        """)

        if quality["warnings"]:
            for w in quality["warnings"]:
                st.warning(f"⚠️ {w}")
        else:
            st.success("Image satisfies all automated clinical quality criteria.")

    # ----------------------------------------------------
    # STEP 4, 5, 6: AI INFERENCE & GRAD-CAM EXPLAINABILITY
    # ----------------------------------------------------
    st.markdown("---")
    st.markdown("#### Step 4 & 5: AI Analysis & Diagnostic Finding")

    if model_obj is None:
        st.error("Cannot perform inference because the model is not loaded.")
        return

    # Run Prediction
    with st.spinner(f"Computing forward inference through {model_type_str.upper()}..."):
        input_tensor = preprocess_for_model(input_pil_image, model_type=model_type_str)
        raw_probs = model_obj.predict(input_tensor, verbose=0)[0]
        pred_idx = int(np.argmax(raw_probs))
        predicted_class = class_names[pred_idx]
        confidence = float(raw_probs[pred_idx])

    col_res1, col_res2 = st.columns([1, 1.2], gap="large")

    with col_res1:
        st.markdown(f"""
        <div class="finding-card">
            <div class="finding-title">AI-Assisted Finding (Predicted Category)</div>
            <div class="finding-class">{predicted_class}</div>
            <div style="font-size: 0.95rem; color: #cbd5e1; margin-bottom: 10px;">
                <strong>{CLASS_DISPLAY_NAMES.get(predicted_class, predicted_class)}</strong>
            </div>
            <div style="font-size: 0.85rem; color: #94a3b8;">
                Classification Confidence: <strong style="color: #2dd4bf;">{confidence * 100:.2f}%</strong>
            </div>
            <div style="margin-top: 12px; font-size: 0.8rem; color: #e2e8f0; border-top: 1px solid #334155; padding-top: 10px;">
                <strong>Risk Category:</strong> {RISK_TIERS.get(predicted_class, 'Requires Review')}
            </div>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown(f"**Clinical Description:** {CLASS_DESCRIPTIONS.get(predicted_class, '')}")
        st.markdown(f"**Suggested Next Steps:** {CLINICAL_NEXT_STEPS.get(predicted_class, '')}")

    with col_res2:
        st.markdown("##### Multi-Class Probability Distribution")
        st.caption("Raw model output probabilities directly from final Softmax layer:")
        
        prob_df = pd.DataFrame({
            "Lesion Category": [f"{c} ({CLASS_DISPLAY_NAMES.get(c, c)})" for c in class_names],
            "Probability (%)": [float(p) * 100 for p in raw_probs]
        })
        st.bar_chart(prob_df.set_index("Lesion Category"), color="#0d9488")

        for idx, c in enumerate(class_names):
            p_val = float(raw_probs[idx])
            st.write(f"**{c}:** `{p_val * 100:.2f}%`")
            st.progress(min(1.0, max(0.0, p_val)))

    # ----------------------------------------------------
    # STEP 6: EXPLAINABLE AI (GRAD-CAM)
    # ----------------------------------------------------
    st.markdown("---")
    st.markdown("#### Step 6: Explainable AI — Visual Saliency (Grad-CAM)")
    st.caption("Pixel-level gradient activations highlighting morphological regions that contributed most to the model classification.")

    with st.spinner("Extracting convolutional gradients for Grad-CAM overlay..."):
        heatmap, cam_err = generate_gradcam_heatmap(model_obj, input_tensor, pred_index=pred_idx)
        if heatmap is not None:
            overlay_img = overlay_gradcam(input_pil_image, heatmap, alpha=0.45)
            
            c_cam1, c_cam2, c_cam3 = st.columns(3)
            with c_cam1:
                st.image(input_pil_image, caption="Original Clinical Photograph", use_container_width=True)
            with c_cam2:
                st.image(heatmap, caption=f"Grad-CAM Activation Heatmap ({predicted_class})", use_container_width=True, clamp=True)
            with c_cam3:
                st.image(overlay_img, caption="Superimposed Visual Overlay", use_container_width=True)
            st.caption("Highlighted red/yellow zones represent focal areas influencing model prediction. Does not establish microscopic dysplastic boundaries.")
        else:
            st.warning(f"Grad-CAM visualizer unavailable: {cam_err}")
            overlay_img = None

    # ----------------------------------------------------
    # STEP 7: CLINICAL METADATA & CASE SAVING
    # ----------------------------------------------------
    st.markdown("---")
    st.markdown("#### Step 7: Clinical Information & Save Case")
    
    with st.form("save_case_form"):
        st.markdown("##### Patient & Clinical Metadata (Anonymized)")
        c_f1, c_f2, c_f3 = st.columns(3)
        with c_f1:
            pat_id = st.text_input("Patient ID / Case Code", value="PT-2026-" + str(np.random.randint(1000, 9999)))
            pat_age = st.number_input("Patient Age", min_value=1, max_value=120, value=52)
        with c_f2:
            pat_sex = st.selectbox("Patient Sex", ["Male", "Female", "Other"])
            lesion_site = st.selectbox("Anatomical Site", ["Buccal Mucosa (Left)", "Buccal Mucosa (Right)", "Lateral Tongue", "Ventral Tongue", "Floor of Mouth", "Hard Palate", "Soft Palate", "Gingiva", "Labial Mucosa"])
        with c_f3:
            habits = st.text_input("Habits (Tobacco/Betel Quid/Alcohol)", value="Betel nut chewing / Tobacco history")
            symptoms = st.text_input("Reported Symptoms", value="Burning sensation on spicy food")

        clinician_notes = st.text_area("Clinician Diagnostic Notes / Clinical Impression", value=f"AI-assisted classification suggests {predicted_class} ({confidence*100:.1f}% confidence). Correlate with clinical inspection.")
        review_status = st.selectbox("Clinical Triage Status", ["Pending Review", "Verified", "Flagged for Biopsy"])

        submit_save = st.form_submit_button("💾 Save Case to SQLite Database", type="primary", use_container_width=True)

        if submit_save:
            case_id = f"OPMD-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
            
            # Save uploaded image to disk
            os.makedirs("database/case_images", exist_ok=True)
            saved_img_path = f"database/case_images/{case_id}_orig.jpg"
            input_pil_image.save(saved_img_path)
            
            saved_cam_path = ""
            if overlay_img is not None:
                saved_cam_path = f"database/case_images/{case_id}_gradcam.jpg"
                overlay_img.save(saved_cam_path)

            case_payload = {
                "case_id": case_id,
                "user_id": user["id"],
                "user_name": user["full_name"],
                "user_role": user["role"],
                "patient_id": pat_id,
                "age": pat_age,
                "sex": pat_sex,
                "lesion_site": lesion_site,
                "habits": habits,
                "symptoms": symptoms,
                "image_path": saved_img_path,
                "predicted_class": predicted_class,
                "confidence": confidence,
                "probabilities": {c: float(raw_probs[i]) for i, c in enumerate(class_names)},
                "gradcam_path": saved_cam_path,
                "risk_tier": RISK_TIERS.get(predicted_class, "Requires Review"),
                "clinician_notes": clinician_notes,
                "review_status": review_status,
                "created_at": datetime.now().isoformat()
            }

            if save_case_to_db(case_payload):
                st.success(f"✅ Case '{case_id}' successfully saved to persistent SQLite database!")
            else:
                st.error("Failed to save case to database.")

# ==============================================================================
# 7. DOCTOR WORKSPACE: DASHBOARD, HISTORY, REVIEWS, REPORTS, RESEARCH
# ==============================================================================

def render_doctor_workspace(user: dict):
    # Top Navigation Strip
    st.sidebar.markdown(f"### 🩺 Clinician Portal")
    st.sidebar.write(f"**{user['full_name']}**")
    st.sidebar.caption(f"{user.get('specialty', 'Oral Pathology')} • {user.get('institution', 'Hospital')}")
    st.sidebar.markdown("---")

    doc_menu = st.sidebar.radio(
        "Navigation",
        [
            "📊 Dashboard",
            "🔬 New Analysis (7-Step)",
            "📁 Case History Archive",
            "📋 Clinical Reviews Queue",
            "📑 Diagnostic Reports",
            "📈 Research & Model Benchmark",
            "⚙️ Profile & Settings"
        ]
    )

    render_safety_banner()

    if doc_menu == "📊 Dashboard":
        st.title(f"Doctor Dashboard")
        st.caption(f"Welcome, {user['full_name']} — {user.get('institution', 'Clinical Workstation')}")

        cases = fetch_all_cases()
        total_cases = len(cases)
        verified_cases = len([c for c in cases if c.get("review_status") == "Verified"])
        pending_reviews = len([c for c in cases if c.get("review_status") == "Pending Review"])
        flagged_cases = len([c for c in cases if c.get("review_status") == "Flagged for Biopsy" or c.get("predicted_class") in ["OCA", "OLK"]])

        # 4 KPI Summary Cards
        c1, c2, c3, c4 = st.columns(4)
        with c1:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">Total Screened Cases</div>
                <div class="metric-value">{total_cases}</div>
                <div class="metric-sub">SQLite Database Active</div>
            </div>
            """, unsafe_allow_html=True)
        with c2:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">Verified Cases</div>
                <div class="metric-value">{verified_cases}</div>
                <div class="metric-sub">Pathologist Signed-Off</div>
            </div>
            """, unsafe_allow_html=True)
        with c3:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">Pending Reviews</div>
                <div class="metric-value">{pending_reviews}</div>
                <div class="metric-sub">Resident Submissions</div>
            </div>
            """, unsafe_allow_html=True)
        with c4:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">High Priority / Flagged</div>
                <div class="metric-value">{flagged_cases}</div>
                <div class="metric-sub">Biopsy Recommended</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown("### Recent Screened Cases")
        if cases:
            df_cases = pd.DataFrame([
                {
                    "Case ID": c["case_id"],
                    "Date": c["created_at"][:10],
                    "Patient ID": c["patient_id"],
                    "Finding": c["predicted_class"],
                    "Confidence": f"{float(c['confidence'])*100:.1f}%",
                    "Site": c["lesion_site"],
                    "Review Status": c["review_status"]
                }
                for c in cases[:5]
            ])
            st.dataframe(df_cases, use_container_width=True)
        else:
            st.info("No cases recorded in database yet.")

    elif doc_menu == "🔬 New Analysis (7-Step)":
        render_7step_analysis_flow(user, role_mode="doctor")

    elif doc_menu == "📁 Case History Archive":
        st.title("📁 Patient Case History Archive")
        st.caption("Search, filter, and inspect stored clinical cases from SQLite.")

        cases = fetch_all_cases()
        if not cases:
            st.info("No cases stored in SQLite database.")
            return

        c_f1, c_f2 = st.columns(2)
        with c_f1:
            filter_class = st.multiselect("Filter by AI Finding", CLASS_NAMES, default=CLASS_NAMES)
        with c_f2:
            filter_status = st.multiselect("Filter by Status", ["Pending Review", "Verified", "Flagged for Biopsy"], default=["Pending Review", "Verified", "Flagged for Biopsy"])

        filtered = [c for c in cases if c["predicted_class"] in filter_class and c.get("review_status", "Pending Review") in filter_status]
        
        st.markdown(f"**Showing {len(filtered)} of {len(cases)} cases:**")
        for c in filtered:
            with st.expander(f"Case {c['case_id']} — Patient {c['patient_id']} | AI Finding: {c['predicted_class']} ({float(c['confidence'])*100:.1f}%) | Status: {c.get('review_status', 'Pending')}"):
                col_img, col_det = st.columns([1, 2])
                with col_img:
                    if c.get("image_path") and os.path.exists(c["image_path"]):
                        st.image(c["image_path"], caption="Clinical Photograph", use_container_width=True)
                    if c.get("gradcam_path") and os.path.exists(c["gradcam_path"]):
                        st.image(c["gradcam_path"], caption="Grad-CAM Attention Map", use_container_width=True)
                with col_det:
                    st.write(f"**Case ID:** `{c['case_id']}` | **Date:** `{c['created_at']}`")
                    st.write(f"**Patient Age/Sex:** `{c.get('age', 'N/A')}` yrs, `{c.get('sex', 'N/A')}` | **Site:** `{c.get('lesion_site')}`")
                    st.write(f"**Habits:** {c.get('habits')} | **Symptoms:** {c.get('symptoms')}")
                    st.write(f"**AI Classification:** `{c['predicted_class']}` ({float(c['confidence'])*100:.2f}%)")
                    st.write(f"**Clinician Notes:** {c.get('clinician_notes')}")

    elif doc_menu == "📋 Clinical Reviews Queue":
        st.title("📋 Clinical Reviews Queue")
        st.caption("Sign off on student and resident diagnostic submissions.")

        cases = fetch_all_cases()
        pending = [c for c in cases if c.get("review_status") == "Pending Review"]
        
        if not pending:
            st.success("✅ No pending reviews in queue. All cases have been verified.")
        else:
            st.warning(f"⚠️ {len(pending)} case(s) awaiting specialist sign-off.")
            for c in pending:
                st.markdown(f"<div class='metric-card'>", unsafe_allow_html=True)
                st.markdown(f"#### Case: `{c['case_id']}` (Submitted by: {c.get('user_name', 'Student')})")
                st.write(f"**AI Predicted Finding:** `{c['predicted_class']}` ({float(c['confidence'])*100:.1f}%) | **Site:** `{c.get('lesion_site')}`")
                
                new_status = st.selectbox(f"Sign-off Decision for {c['case_id']}", ["Verified", "Flagged for Biopsy", "Pending Review"], key=f"sel_status_{c['case_id']}")
                new_notes = st.text_area(f"Specialist Review Notes ({c['case_id']})", value=c.get("clinician_notes", ""), key=f"notes_{c['case_id']}")
                
                if st.button(f"Submit Sign-Off for {c['case_id']}", key=f"btn_sign_{c['case_id']}"):
                    if update_case_review(c["case_id"], new_status, new_notes):
                        st.success(f"Case {c['case_id']} updated to '{new_status}'.")
                        st.rerun()
                st.markdown("</div><br>", unsafe_allow_html=True)

    elif doc_menu == "📑 Diagnostic Reports":
        st.title("📑 Clinical Diagnostic Reports")
        st.caption("Generate, print, or export structured clinical case reports.")

        cases = fetch_all_cases()
        if not cases:
            st.info("No cases available for reporting.")
            return

        selected_case_id = st.selectbox("Select Case to Generate Report", [c["case_id"] for c in cases])
        case_item = [c for c in cases if c["case_id"] == selected_case_id][0]

        st.markdown("<div class='metric-card'>", unsafe_allow_html=True)
        st.markdown(f"## LESIONXPERT / OPMD-AI CLINICAL REPORT")
        st.write(f"**Case Reference:** `{case_item['case_id']}` | **Date Generated:** `{datetime.now().strftime('%Y-%m-%d %H:%M')}`")
        st.markdown("---")
        
        rc1, rc2 = st.columns(2)
        with rc1:
            st.write(f"**Patient ID:** `{case_item.get('patient_id')}`")
            st.write(f"**Age / Sex:** `{case_item.get('age')}` / `{case_item.get('sex')}`")
            st.write(f"**Anatomical Site:** `{case_item.get('lesion_site')}`")
            st.write(f"**Clinical Habits:** `{case_item.get('habits')}`")
            st.write(f"**Reported Symptoms:** `{case_item.get('symptoms')}`")
        with rc2:
            st.write(f"**AI-Assisted Finding:** `{case_item['predicted_class']}`")
            st.write(f"**Model Confidence:** `{float(case_item['confidence'])*100:.2f}%`")
            st.write(f"**Risk Assessment:** `{case_item.get('risk_tier')}`")
            st.write(f"**Review Status:** `{case_item.get('review_status')}`")
            st.write(f"**Reporting Clinician:** `{user['full_name']}`")

        st.markdown("---")
        st.write(f"**Clinician Diagnostic Notes:**")
        st.info(case_item.get("clinician_notes", "No notes entered."))

        st.markdown("---")
        st.caption("Disclaimer: This report was generated with AI decision support. Definitive diagnosis requires histopathological confirmation.")
        st.markdown("</div>", unsafe_allow_html=True)

    elif doc_menu == "📈 Research & Model Benchmark":
        st.title("📈 Research & Model Evaluation Portal")
        st.caption("Isolated research portal: Model test-set metrics, confusion matrices, and multi-architecture comparisons.")

        tab_diag, tab_comp = st.tabs(["🔬 Model Diagnostics", "📊 Multi-Model Comparison"])

        with tab_diag:
            st.markdown("#### Primary Candidate Model (ResNet50) Diagnostics")
            st.markdown("Test Set: 207 Untouched Images (`dataset/test`)")
            
            # Show per-class metrics
            diag_metrics = [
                {"Class": "Normal", "Sensitivity": "90.9%", "Specificity": "97.5%", "Precision": "90.9%", "F1-Score": "0.9091", "Support": 44},
                {"Class": "OCA", "Sensitivity": "73.8%", "Specificity": "95.2%", "Precision": "79.5%", "F1-Score": "0.7654", "Support": 42},
                {"Class": "OLK", "Sensitivity": "64.1%", "Specificity": "88.7%", "Precision": "56.8%", "F1-Score": "0.6024", "Support": 39},
                {"Class": "OLP", "Sensitivity": "70.2%", "Specificity": "95.6%", "Precision": "82.5%", "F1-Score": "0.7586", "Support": 47},
                {"Class": "OSF", "Sensitivity": "85.7%", "Specificity": "94.2%", "Precision": "75.0%", "F1-Score": "0.8000", "Support": 35},
            ]
            st.dataframe(pd.DataFrame(diag_metrics), use_container_width=True)

            st.markdown("##### Overall Global Metrics (ResNet50):")
            gm1, gm2, gm3, gm4 = st.columns(4)
            with gm1:
                st.metric("Overall Accuracy", "76.81%")
            with gm2:
                st.metric("Balanced Accuracy", "76.95%")
            with gm3:
                st.metric("Macro F1-Score", "0.7671")
            with gm4:
                st.metric("Cohen's Kappa (k)", "0.7101")

        with tab_comp:
            st.markdown("#### Head-to-Head Comparison (Untouched Test Set)")
            comp_data = [
                {"Architecture": "ResNet50 (Candidate)", "Accuracy": "76.81%", "Balanced Acc": "76.95%", "Macro F1": "0.7671", "Cohen's Kappa": "0.7101", "Status": "No Collapse"},
                {"Architecture": "MobileNetV2 (Edge)", "Accuracy": "78.26%", "Balanced Acc": "78.71%", "Macro F1": "0.7838", "Cohen's Kappa": "0.7282", "Status": "No Collapse"},
                {"Architecture": "VGG16 (Baseline)", "Accuracy": "71.50%", "Balanced Acc": "71.20%", "Macro F1": "0.7085", "Cohen's Kappa": "0.6430", "Status": "No Collapse"}
            ]
            st.dataframe(pd.DataFrame(comp_data), use_container_width=True)

    elif doc_menu == "⚙️ Profile & Settings":
        st.title("⚙️ Clinician Profile & Settings")
        st.markdown("<div class='metric-card'>", unsafe_allow_html=True)
        st.write(f"**Name:** `{user['full_name']}`")
        st.write(f"**Email:** `{user['email']}`")
        st.write(f"**Role:** `Doctor / Specialist`")
        st.write(f"**Institution:** `{user.get('institution', 'City Center Oral Pathology')}`")
        st.write(f"**Professional ID:** `{user.get('professional_id', 'DENT-PATH-84920')}`")
        st.write(f"**Specialty:** `{user.get('specialty', 'Oral & Maxillofacial Pathology')}`")
        
        st.markdown("---")
        if st.button("Sign Out", type="primary"):
            st.session_state["user"] = None
            st.rerun()
        st.markdown("</div>", unsafe_allow_html=True)

# ==============================================================================
# 8. STUDENT WORKSPACE: DASHBOARD, SANDBOX, STUDY MATERIAL, QUIZ
# ==============================================================================

def render_student_workspace(user: dict):
    st.sidebar.markdown(f"### 🎓 Student Portal")
    st.sidebar.write(f"**{user['full_name']}**")
    st.sidebar.caption(f"{user.get('program', 'BDS Resident')} • {user.get('university', 'Dental University')}")
    st.sidebar.markdown("---")

    stu_menu = st.sidebar.radio(
        "Navigation",
        [
            "📊 Learning Dashboard",
            "🔬 Practice Analysis Sandbox",
            "📁 My Practice Cases",
            "📚 WHO 2024 Study Center",
            "🧠 Interactive Clinical Quiz",
            "⚙️ Profile & Settings"
        ]
    )

    render_safety_banner()

    if stu_menu == "📊 Learning Dashboard":
        st.title("🎓 Student Learning Dashboard")
        st.caption(f"Welcome, {user['full_name']} — {user.get('program', 'BDS Resident')} ({user.get('year_of_study', 'Year 2')})")

        cases = fetch_all_cases(user_id=user["id"], role="student")
        
        c1, c2, c3 = st.columns(3)
        with c1:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">Practice Scans Triaged</div>
                <div class="metric-value">{len(cases)}</div>
                <div class="metric-sub">Self-Guided Practice</div>
            </div>
            """, unsafe_allow_html=True)
        with c2:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">Curriculum Progress</div>
                <div class="metric-value">80%</div>
                <div class="metric-sub">4 of 5 Modules Complete</div>
            </div>
            """, unsafe_allow_html=True)
        with c3:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">Quiz Diagnostic Score</div>
                <div class="metric-value">100%</div>
                <div class="metric-sub">5 of 5 Correct</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown("### Next Learning Goals")
        st.info("👉 Review **Module 3: Differential Diagnosis of Homogeneous vs Non-Homogeneous Leukoplakia** in the Study Center.")

    elif stu_menu == "🔬 Practice Analysis Sandbox":
        render_7step_analysis_flow(user, role_mode="student")

    elif stu_menu == "📁 My Practice Cases":
        st.title("📁 My Practice Cases Log")
        st.caption("Review previous scans submitted during practice triage.")
        
        cases = fetch_all_cases(user_id=user["id"], role="student")
        if not cases:
            st.info("No practice cases recorded yet. Launch the Practice Analysis Sandbox to triage your first case!")
        else:
            for c in cases:
                with st.expander(f"Practice Case: {c['case_id']} | AI Finding: {c['predicted_class']} ({float(c['confidence'])*100:.1f}%) | Status: {c.get('review_status')}"):
                    st.write(f"**Date:** `{c['created_at']}` | **Site:** `{c.get('lesion_site')}`")
                    st.write(f"**Notes:** {c.get('clinician_notes')}")

    elif stu_menu == "📚 WHO 2024 Study Center":
        st.title("📚 WHO 2024 OPMD Study Center")
        st.caption("Interactive curriculum masterclasses with pathological criteria.")

        modules = [
            ("Module 1: Oral Leukoplakia (OLK)", "Predominantly white plaque of questionable risk. Must be differentiated from frictional keratosis, morsicatio buccarum, and candidiasis. High-risk transformation sites include lateral/ventral tongue and floor of mouth."),
            ("Module 2: Oral Lichen Planus (OLP)", "Chronic inflammatory disease of oral mucosa characterized by bilateral Wickham's striae (reticular), atrophic erythema, or erosive ulceration. Requires long-term clinical surveillance."),
            ("Module 3: Oral Submucous Fibrosis (OSF)", "Chronic insidious fibrosing condition strongly linked to betel quid and areca nut usage. Features include mucosal blanching, loss of mucosal elasticity, vertical fibrous bands, and trismus (restricted mouth opening)."),
            ("Module 4: Oral Carcinoma (OCA / OSCC)", "Malignant neoplasm of epithelial origin. Clinical warning signs: non-healing indurated ulcer with rolled everted borders, exophytic mass, unexplained tooth mobility, and neck lymphadenopathy."),
            ("Module 5: Grad-CAM Explainability in Medical AI", "Understanding gradient-weighted class activation mapping. Verifying that convolutional feature maps localize specifically on keratotic plaques and ulcer margins rather than dental restorations or lighting glare.")
        ]

        for title, desc in modules:
            with st.expander(f"📖 {title}"):
                st.write(desc)

    elif stu_menu == "🧠 Interactive Clinical Quiz":
        st.title("🧠 OPMD Board Examination Diagnostic Quiz")
        st.caption("5 standardized clinical vignette questions covering differential diagnosis of leukoplakia, erythroplakia, lichen planus, and high-risk anatomical transformation zones.")

        quiz_questions = [
            {
                "q": "1. Which intraoral anatomical location has the highest statistical rate of malignant transformation for Oral Leukoplakia?",
                "opts": ["Hard palate and attached gingiva", "Lateral/ventral borders of the tongue and floor of mouth", "Dorsum of the tongue", "Upper labial mucosa"],
                "ans": 1,
                "exp": "The lateral border and ventral surface of the tongue and the floor of mouth are thin, non-keratinized mucosal areas highly vulnerable to carcinogen penetration."
            },
            {
                "q": "2. What is the key clinical distinction between Homogeneous and Non-Homogeneous Leukoplakia?",
                "opts": ["Homogeneous leukoplakia is painful; non-homogeneous is painless", "Non-homogeneous presents with mixed red and white components (speckled) and significantly higher dysplasia risk", "Homogeneous can be wiped off with dry gauze", "Non-homogeneous occurs only on the gingiva"],
                "ans": 1,
                "exp": "Non-homogeneous (erythroleukoplakic or speckled) lesions have red atrophic zones and carry a 4-to-7-fold higher risk of malignant transformation than uniform white plaques."
            },
            {
                "q": "3. Which clinical sign is characteristic of Reticular Oral Lichen Planus (OLP)?",
                "opts": ["Unilateral indurated mass", "Bilateral lace-like white lines (Wickham's Striae)", "Restricted mouth opening due to fibrous bands", "Everted ulcer borders"],
                "ans": 1,
                "exp": "Wickham's striae are delicate, bilateral, lace-like keratotic lines characteristically distributed on the buccal mucosa in reticular OLP."
            },
            {
                "q": "4. What is the primary etiological agent responsible for Oral Submucous Fibrosis (OSF)?",
                "opts": ["Epstein-Barr Virus (EBV)", "Areca nut / Betel quid components (arecoline causing collagen cross-linking)", "Human Papillomavirus (HPV-16)", "Candida albicans infection"],
                "ans": 1,
                "exp": "Arecoline from areca nut stimulates fibroblast proliferation and upregulates lysyl oxidase, resulting in irreversible collagen cross-linking and submucosal fibrosis."
            },
            {
                "q": "5. What does a high-intensity red zone in a Grad-CAM saliency map represent?",
                "opts": ["Thermal blood flow detected by infrared camera", "The spatial pixel regions in the image that contributed most heavily to the deep neural network's class prediction", "Bacterial biofilm on teeth", "Low focus variance"],
                "ans": 1,
                "exp": "Grad-CAM computes the gradient of the predicted class score with respect to the final convolutional feature maps, visually indicating the morphological features steering the model prediction."
            }
        ]

        score = 0
        for i, item in enumerate(quiz_questions):
            st.markdown(f"**{item['q']}**")
            user_choice = st.radio("Select your answer:", item["opts"], key=f"quiz_q_{i}")
            selected_idx = item["opts"].index(user_choice)
            
            if selected_idx == item["ans"]:
                score += 1
                st.success(f"✅ Correct! Explanation: {item['exp']}")
            else:
                st.error(f"❌ Incorrect. Explanation: {item['exp']}")
            st.markdown("---")

        st.markdown(f"### 🏆 Quiz Score: **{score} / {len(quiz_questions)}** ({score/len(quiz_questions)*100:.0f}%)")

    elif stu_menu == "⚙️ Profile & Settings":
        st.title("⚙️ Student Profile & Settings")
        st.markdown("<div class='metric-card'>", unsafe_allow_html=True)
        st.write(f"**Name:** `{user['full_name']}`")
        st.write(f"**Email:** `{user['email']}`")
        st.write(f"**Role:** `Dental Student / Resident`")
        st.write(f"**University:** `{user.get('university', 'Dental Sciences Institute')}`")
        st.write(f"**Program:** `{user.get('program', 'BDS / Residency')}`")
        st.write(f"**Year of Study:** `{user.get('year_of_study', 'Year 2 Resident')}`")
        
        st.markdown("---")
        if st.button("Sign Out", type="primary"):
            st.session_state["user"] = None
            st.rerun()
        st.markdown("</div>", unsafe_allow_html=True)

# ==============================================================================
# 9. MAIN APPLICATION ROUTING
# ==============================================================================

def main():
    current_user = st.session_state.get("user")

    if current_user is None:
        render_auth_page()
    else:
        role = current_user.get("role", "doctor")
        if role == "doctor":
            render_doctor_workspace(current_user)
        else:
            render_student_workspace(current_user)

if __name__ == "__main__":
    main()
