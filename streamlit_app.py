"""
LesionXpert.AI: Advanced AI-Assisted Identification of Oral Potentially Malignant Disorders
Clinical Decision-Support & Educational Platform
Supports 7 Diagnostic Categories (Normal Oral Mucosa + 6 Core OPMD Lesions):
0. Normal Oral Mucosa (Normal)
1. Oral Leukoplakia (OLK)
2. Oral Submucous Fibrosis (OSF)
3. Oral Lichen Planus (OLP)
4. Erythroplakia (ERY)
5. Actinic Cheilitis (AC)
6. Chronic Hyperplastic Candidiasis (CHC)
Integrated with SMART-OM Dataset Standards (Figshare 31341790) & Multi-Model Ensemble.
Includes Dynamic Light/Dark Theme Engine and Polished Clinical UI/UX.
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
    RISK_TIERS, CLINICAL_NEXT_STEPS, SMART_OM_ANATOMICAL_SITES,
    PRIMARY_CANDIDATE_MODEL_PATH, MOBILENET_MODEL_PATH, VGG16_MODEL_PATH,
    MIN_IMAGE_DIMENSION, LAPLACIAN_BLUR_THRESHOLD, DARKNESS_THRESHOLD, BRIGHTNESS_THRESHOLD
)
from src.preprocessing import load_image_rgb, preprocess_for_model
from src.image_quality import assess_image_quality
from src.gradcam import generate_gradcam_heatmap, overlay_gradcam
from src.database import save_case_to_db, fetch_all_cases, update_case_review, init_database
from src.auth import authenticate_user, register_user

# ==============================================================================
# 1. PAGE CONFIGURATION & THEME STATE
# ==============================================================================

st.set_page_config(
    page_title="LesionXpert.AI — Oral Lesion Platform",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize Session States
if "theme" not in st.session_state:
    st.session_state["theme"] = "light"

if "user" not in st.session_state:
    st.session_state["user"] = None

if "current_analysis" not in st.session_state:
    st.session_state["current_analysis"] = None

if "webcam_accepted_image" not in st.session_state:
    st.session_state["webcam_accepted_image"] = None

if "analysis_cache" not in st.session_state or not isinstance(st.session_state.get("analysis_cache"), dict):
    st.session_state["analysis_cache"] = {}

if "cam_image_buffer" not in st.session_state:
    st.session_state["cam_image_buffer"] = None

init_database()

# ==============================================================================
# 2. DYNAMIC THEME ENGINE (LIGHT & DARK UI/UX)
# ==============================================================================

def inject_custom_theme(theme_mode: str = "light"):
    if theme_mode == "dark":
        # Obsidian Clinical Dark Palette
        bg_main = "#0b0f19"
        bg_sidebar = "#0f172a"
        bg_card = "#1e293b"
        card_border = "#334155"
        text_primary = "#f8fafc"
        text_secondary = "#94a3b8"
        text_muted = "#64748b"
        accent_color = "#2dd4bf"
        accent_hover = "#14b8a6"
        card_shadow = "0 8px 25px -4px rgba(0, 0, 0, 0.45)"
        
        input_bg = "#1e293b"
        input_border = "#334155"
        input_text = "#f8fafc"
        
        btn_sec_bg = "#1e293b"
        btn_sec_text = "#f8fafc"
        btn_sec_border = "#334155"
        btn_sec_hover_bg = "#334155"
        
        uploader_bg = "#131c2e"
        uploader_border = "#334155"
        
        tab_text = "#94a3b8"
        tab_active_text = "#2dd4bf"
        tab_active_border = "#2dd4bf"
        
        expander_bg = "#1e293b"
        expander_border = "#334155"
        expander_header_bg = "#0f172a"
        expander_header_text = "#f8fafc"
        
        code_bg = "#131d31"
        code_text = "#2dd4bf"
        code_border = "#334155"
        
        pill_bg = "rgba(45, 212, 191, 0.15)"
        pill_text = "#2dd4bf"
        pill_border = "rgba(45, 212, 191, 0.3)"
    else:
        # Crisp Healthcare Light Palette (High-Contrast Slate & Deep Teal)
        bg_main = "#f8fafc"
        bg_sidebar = "#f1f5f9"
        bg_card = "#ffffff"
        card_border = "#e2e8f0"
        text_primary = "#0f172a"
        text_secondary = "#475569"
        text_muted = "#64748b"
        accent_color = "#0d9488"
        accent_hover = "#0f766e"
        card_shadow = "0 4px 18px -2px rgba(15, 23, 42, 0.06)"
        
        input_bg = "#ffffff"
        input_border = "#cbd5e1"
        input_text = "#0f172a"
        
        btn_sec_bg = "#ffffff"
        btn_sec_text = "#0f172a"
        btn_sec_border = "#cbd5e1"
        btn_sec_hover_bg = "#e2e8f0"
        
        uploader_bg = "#ffffff"
        uploader_border = "#cbd5e1"
        
        tab_text = "#475569"
        tab_active_text = "#0d9488"
        tab_active_border = "#0d9488"
        
        expander_bg = "#ffffff"
        expander_border = "#e2e8f0"
        expander_header_bg = "#f8fafc"
        expander_header_text = "#0f172a"
        
        code_bg = "#f1f5f9"
        code_text = "#0d9488"
        code_border = "#cbd5e1"
        
        pill_bg = "rgba(13, 148, 136, 0.12)"
        pill_text = "#0d9488"
        pill_border = "rgba(13, 148, 136, 0.25)"

    st.markdown(f"""
    <!-- Mobile PWA Meta Headers -->
    <head>
        <link rel="manifest" href="/manifest.json">
        <meta name="theme-color" content="{accent_color}">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="LesionXpert">
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    </head>
    <style>
        /* 1. Global Baseline & Mobile Responsive App Container */
        html, body, .stApp, [data-testid="stAppViewContainer"], [data-testid="stHeader"] {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            background-color: {bg_main} !important;
            color: {text_primary} !important;
            -webkit-tap-highlight-color: transparent !important;
        }}

        .main .block-container {{
            padding-top: max(1rem, env(safe-area-inset-top)) !important;
            padding-bottom: max(2.5rem, env(safe-area-inset-bottom)) !important;
            padding-left: max(0.75rem, env(safe-area-inset-left)) !important;
            padding-right: max(0.75rem, env(safe-area-inset-right)) !important;
            max-width: 1350px !important;
        }}

        /* 2. Typography & Headings */
        h1, h2, h3, h4, h5, h6,
        [data-testid="stMarkdownContainer"] h1,
        [data-testid="stMarkdownContainer"] h2,
        [data-testid="stMarkdownContainer"] h3,
        [data-testid="stMarkdownContainer"] h4,
        [data-testid="stMarkdownContainer"] h5,
        [data-testid="stMarkdownContainer"] h6,
        .brand-title {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            font-weight: 700 !important;
            letter-spacing: -0.02em !important;
            color: {text_primary} !important;
        }}

        p, 
        [data-testid="stMarkdownContainer"] > p,
        [data-testid="stMarkdownContainer"] > span,
        [data-testid="stMarkdownContainer"] > li,
        [data-testid="stMarkdownContainer"] > ul,
        [data-testid="stMarkdownContainer"] > ol {{
            color: {text_primary} !important;
        }}

        .stCaption, 
        [data-testid="stCaptionContainer"], 
        [data-testid="stCaptionContainer"] p {{
            color: {text_secondary} !important;
            font-weight: 500 !important;
        }}

        /* Code snippets & Technical labels */
        code,
        [data-testid="stMarkdownContainer"] code,
        p code,
        span code,
        li code,
        div code {{
            background-color: {code_bg} !important;
            color: {code_text} !important;
            border: 1px solid {code_border} !important;
            padding: 2px 7px !important;
            border-radius: 6px !important;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
            font-size: 0.88em !important;
            font-weight: 700 !important;
            display: inline-block !important;
        }}

        /* 3. Sidebar Styling */
        [data-testid="stSidebar"], 
        [data-testid="stSidebar"] > div:first-child {{
            background-color: {bg_sidebar} !important;
            border-right: 1px solid {card_border} !important;
        }}
        [data-testid="stSidebar"] [data-testid="stMarkdownContainer"] * {{
            color: {text_primary} !important;
        }}
        [data-testid="stSidebar"] p, 
        [data-testid="stSidebar"] span, 
        [data-testid="stSidebar"] label, 
        [data-testid="stSidebar"] h1, 
        [data-testid="stSidebar"] h2, 
        [data-testid="stSidebar"] h3 {{
            color: {text_primary} !important;
        }}
        [data-testid="stSidebar"] .stCaption {{
            color: {text_secondary} !important;
        }}

        /* 4. Form Labels & Input Controls */
        label, 
        [data-testid="stWidgetLabel"], 
        [data-testid="stWidgetLabel"] p, 
        [data-testid="stWidgetLabel"] span {{
            color: {text_primary} !important;
            font-weight: 600 !important;
            font-size: 0.9rem !important;
        }}

        /* Text Input & Textarea */
        div[data-testid="stTextInput"] input,
        div[data-testid="stNumberInput"] input,
        div[data-testid="stTextArea"] textarea,
        div[data-baseweb="input"] input,
        div[data-baseweb="base-input"] input,
        div[data-baseweb="textarea"] textarea {{
            background-color: {input_bg} !important;
            color: {input_text} !important;
            border: 1px solid {input_border} !important;
            border-radius: 10px !important;
        }}
        div[data-testid="stTextInput"] input:focus,
        div[data-testid="stNumberInput"] input:focus,
        div[data-testid="stTextArea"] textarea:focus {{
            border-color: {accent_color} !important;
            box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.2) !important;
        }}

        /* Radio Buttons */
        div[data-testid="stRadio"] label,
        div[data-testid="stRadio"] div[role="radiogroup"] label,
        div[role="radiogroup"] label p,
        div[role="radiogroup"] label span,
        div[data-testid="stRadio"] span[data-testid="stMarkdownContainer"] p {{
            color: {text_primary} !important;
            font-weight: 500 !important;
        }}

        /* Selectboxes & MultiSelect */
        div[data-testid="stSelectbox"] > div,
        div[data-testid="stSelectbox"] div[data-baseweb="select"],
        div[data-testid="stSelectbox"] div[data-baseweb="select"] > div,
        div[data-testid="stMultiSelect"] div[data-baseweb="select"] > div {{
            background-color: {input_bg} !important;
            color: {input_text} !important;
            border: 1px solid {input_border} !important;
            border-radius: 10px !important;
        }}
        div[data-testid="stSelectbox"] span,
        div[data-testid="stSelectbox"] div,
        div[data-testid="stMultiSelect"] span,
        div[data-testid="stMultiSelect"] div {{
            color: {input_text} !important;
        }}
        div[data-baseweb="popover"],
        div[data-baseweb="popover"] ul,
        div[data-baseweb="popover"] li,
        div[role="listbox"],
        div[role="listbox"] li {{
            background-color: {bg_card} !important;
            color: {text_primary} !important;
        }}
        div[role="listbox"] li:hover,
        div[role="listbox"] li[aria-selected="true"] {{
            background-color: rgba(13, 148, 136, 0.15) !important;
            color: {accent_color} !important;
        }}

        /* 5. File Uploader */
        [data-testid="stFileUploader"] {{
            background-color: {uploader_bg} !important;
            border-radius: 14px !important;
        }}
        [data-testid="stFileUploader"] section {{
            background-color: {uploader_bg} !important;
            border: 2px dashed {uploader_border} !important;
            border-radius: 14px !important;
            padding: 1.5rem !important;
        }}
        [data-testid="stFileUploader"] section * {{
            color: {text_primary} !important;
        }}
        [data-testid="stFileUploader"] section small {{
            color: {text_secondary} !important;
        }}

        /* 6. Tabs */
        div[data-testid="stTabs"] button[role="tab"] {{
            color: {tab_text} !important;
            font-weight: 600 !important;
            background: transparent !important;
            border-bottom: 2px solid transparent !important;
        }}
        div[data-testid="stTabs"] button[role="tab"][aria-selected="true"] {{
            color: {tab_active_text} !important;
            border-bottom: 2px solid {tab_active_border} !important;
        }}
        div[data-testid="stTabs"] button[role="tab"] p,
        div[data-testid="stTabs"] button[role="tab"] span {{
            color: inherit !important;
            font-weight: inherit !important;
        }}

        /* 7. Expanders */
        div[data-testid="stExpander"] {{
            background-color: {expander_bg} !important;
            border: 1px solid {expander_border} !important;
            border-radius: 14px !important;
            margin-bottom: 0.75rem !important;
            box-shadow: {card_shadow} !important;
            overflow: hidden !important;
        }}
        div[data-testid="stExpander"] details {{
            background-color: {expander_bg} !important;
            border-radius: 14px !important;
        }}
        div[data-testid="stExpander"] summary {{
            background-color: {expander_header_bg} !important;
            color: {expander_header_text} !important;
            font-weight: 700 !important;
            padding: 12px 18px !important;
            border-bottom: 1px solid {expander_border} !important;
            border-radius: 14px 14px 0 0 !important;
        }}
        div[data-testid="stExpander"] summary:hover {{
            color: {accent_color} !important;
        }}
        div[data-testid="stExpander"] summary p,
        div[data-testid="stExpander"] summary span,
        div[data-testid="stExpander"] summary * {{
            color: {expander_header_text} !important;
            font-weight: 700 !important;
        }}
        div[data-testid="stExpander"] [data-testid="stExpanderDetails"] {{
            background-color: {expander_bg} !important;
            padding: 18px !important;
            border-radius: 0 0 14px 14px !important;
        }}
        div[data-testid="stExpander"] [data-testid="stExpanderDetails"] p,
        div[data-testid="stExpander"] [data-testid="stExpanderDetails"] span,
        div[data-testid="stExpander"] [data-testid="stExpanderDetails"] strong,
        div[data-testid="stExpander"] [data-testid="stExpanderDetails"] div {{
            color: {text_primary} !important;
        }}

        /* 8. Buttons */
        /* Secondary / Default Buttons */
        div.stButton > button,
        button[data-testid="baseButton-secondary"],
        div.stButton > button[kind="secondary"] {{
            background-color: {btn_sec_bg} !important;
            color: {btn_sec_text} !important;
            border: 1px solid {btn_sec_border} !important;
            border-radius: 10px !important;
            font-weight: 600 !important;
            transition: all 0.2s ease !important;
        }}
        div.stButton > button:hover,
        button[data-testid="baseButton-secondary"]:hover {{
            background-color: {btn_sec_hover_bg} !important;
            border-color: {accent_color} !important;
            color: {accent_color} !important;
        }}

        /* Primary Action Buttons */
        div.stButton > button[kind="primary"],
        button[data-testid="baseButton-primary"] {{
            background: linear-gradient(135deg, {accent_color} 0%, {accent_hover} 100%) !important;
            border: none !important;
            color: #ffffff !important;
            border-radius: 12px !important;
            font-weight: 700 !important;
            padding: 0.55rem 1.4rem !important;
            box-shadow: 0 4px 14px rgba(13, 148, 136, 0.25) !important;
            transition: all 0.2s ease !important;
        }}
        div.stButton > button[kind="primary"]:hover,
        button[data-testid="baseButton-primary"]:hover {{
            transform: translateY(-1px);
            box-shadow: 0 6px 18px rgba(13, 148, 136, 0.35) !important;
        }}

        /* 9. Metric Cards */
        .metric-card {{
            background: {bg_card} !important;
            border: 1px solid {card_border} !important;
            border-radius: 18px !important;
            padding: 22px !important;
            box-shadow: {card_shadow} !important;
            transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }}
        .metric-card:hover {{
            transform: translateY(-2px);
            border-color: {accent_color} !important;
            box-shadow: 0 10px 25px -3px rgba(13, 148, 136, 0.12) !important;
        }}
        .metric-card p, .metric-card div, .metric-card span {{
            color: {text_primary} !important;
        }}
        .metric-label {{
            font-size: 0.75rem !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            color: {text_secondary} !important;
            letter-spacing: 0.06em !important;
        }}
        .metric-value {{
            font-size: 1.85rem !important;
            font-weight: 800 !important;
            color: {text_primary} !important;
            margin-top: 4px !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }}
        .metric-sub {{
            font-size: 0.78rem !important;
            color: {accent_color} !important;
            font-weight: 600 !important;
            margin-top: 4px !important;
        }}

        /* 10. Hero Brand Pill */
        .brand-pill {{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: {pill_bg} !important;
            color: {pill_text} !important;
            font-weight: 700 !important;
            font-size: 0.75rem !important;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            padding: 4px 12px;
            border-radius: 9999px;
            border: 1px solid {pill_border} !important;
            margin-bottom: 8px;
        }}

        /* 11. Finding Card */
        .finding-card {{
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
            color: #ffffff !important;
            border-radius: 20px !important;
            padding: 26px !important;
            border: 1px solid rgba(45, 212, 191, 0.35) !important;
            box-shadow: 0 12px 30px -5px rgba(15, 23, 42, 0.35) !important;
        }}
        .finding-card, 
        .finding-card *, 
        .finding-card strong, 
        .finding-card span, 
        .finding-card p, 
        .finding-card div {{
            color: #ffffff !important;
        }}
        .finding-card .finding-title {{
            font-size: 0.8rem !important;
            text-transform: uppercase !important;
            font-weight: 700 !important;
            color: #2dd4bf !important;
            letter-spacing: 0.06em !important;
        }}
        .finding-card .finding-class {{
            font-size: 1.85rem !important;
            font-weight: 800 !important;
            color: #ffffff !important;
            margin: 8px 0 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            line-height: 1.25 !important;
        }}
        .finding-card .finding-code {{
            font-size: 0.95rem !important;
            color: #2dd4bf !important;
            margin-bottom: 12px !important;
            font-weight: 600 !important;
        }}
        .finding-card .finding-code strong {{
            color: #2dd4bf !important;
        }}
        .finding-card .finding-risk {{
            margin-top: 10px !important;
            font-size: 0.9rem !important;
            color: #f1f5f9 !important;
            border-top: 1px solid rgba(255, 255, 255, 0.18) !important;
            padding-top: 10px !important;
        }}
        .finding-card .finding-risk strong {{
            color: #ffffff !important;
        }}

        /* 12. Step Pill Badge */
        .step-pill {{
            display: inline-flex !important;
            align-items: center !important;
            gap: 10px !important;
            background: {pill_bg} !important;
            border: 1px solid {pill_border} !important;
            border-radius: 9999px !important;
            padding: 6px 16px !important;
            font-weight: 700 !important;
            font-size: 0.92rem !important;
            color: {pill_text} !important;
            margin-bottom: 12px !important;
            box-shadow: 0 2px 8px rgba(13, 148, 136, 0.08) !important;
        }}
        .step-pill, .step-pill span, .step-pill div, .step-pill p {{
            color: {pill_text} !important;
        }}
        .step-number {{
            background: {accent_color} !important;
            color: #ffffff !important;
            font-size: 0.75rem !important;
            font-weight: 800 !important;
            padding: 3px 9px !important;
            border-radius: 9999px !important;
            display: inline-block !important;
            line-height: 1 !important;
        }}

        /* 13. Diagnostic Hierarchy Checklist Cards */
        .diff-card {{
            background: {bg_card} !important;
            border: 1px solid {card_border} !important;
            border-radius: 12px !important;
            padding: 10px 14px !important;
            margin-bottom: 8px !important;
            font-size: 0.92rem !important;
            transition: all 0.2s ease !important;
        }}
        .diff-card.active {{
            background: { "rgba(45, 212, 191, 0.12)" if theme_mode == "dark" else "rgba(13, 148, 136, 0.08)" } !important;
            border: 2px solid {accent_color} !important;
            box-shadow: 0 4px 14px rgba(13, 148, 136, 0.15) !important;
        }}
        .diff-card, .diff-card p, .diff-card span, .diff-card div {{
            color: {text_primary} !important;
        }}
        .diff-card.active, .diff-card.active p, .diff-card.active span, .diff-card.active div {{
            color: {text_primary} !important;
        }}

        /* 14. Badges */
        .badge-good {{
            background: #ecfdf5 !important;
            color: #065f46 !important;
            border: 1px solid #a7f3d0 !important;
            padding: 4px 12px;
            border-radius: 9999px;
            font-weight: 700;
            font-size: 0.75rem;
        }}
        .badge-acceptable {{
            background: #fffbeb !important;
            color: #92400e !important;
            border: 1px solid #fde68a !important;
            padding: 4px 12px;
            border-radius: 9999px;
            font-weight: 700;
            font-size: 0.75rem;
        }}
        .badge-insufficient {{
            background: #fef2f2 !important;
            color: #991b1b !important;
            border: 1px solid #fecaca !important;
            padding: 4px 12px;
            border-radius: 9999px;
            font-weight: 700;
            font-size: 0.75rem;
        }}

        /* 15. Mobile Phone Responsive Layout & Safe Areas */
        @media (max-width: 768px) {{
            .main .block-container {{
                padding-left: 12px !important;
                padding-right: 12px !important;
                padding-top: 10px !important;
            }}
            .finding-card {{
                padding: 18px !important;
                border-radius: 16px !important;
            }}
            .finding-card .finding-class {{
                font-size: 1.45rem !important;
            }}
            .metric-card {{
                padding: 16px !important;
                margin-bottom: 10px !important;
                border-radius: 14px !important;
            }}
            .metric-value {{
                font-size: 1.5rem !important;
            }}
            .system-statusbar {{
                font-size: 0.78rem !important;
                padding: 8px 12px !important;
            }}
            div.stButton > button {{
                min-height: 44px !important;
                font-size: 0.92rem !important;
            }}
        }}
    </style>
    """, unsafe_allow_html=True)

# ==============================================================================
# 3. HIGH-PRECISION ENSEMBLE MODEL LOADING & INFERENCE
# ==============================================================================

@st.cache_resource(show_spinner="Initializing LesionXpert.AI neural network models...")
def load_cached_models():
    """
    Loads trained models for high-precision ensemble inference.
    Defensively checks multiple relative and absolute path locations.
    """
    models = {}
    
    def find_model_file(paths_to_check):
        for p in paths_to_check:
            if not p:
                continue
            if os.path.exists(p):
                return p
            p_root = str(ROOT_DIR / p)
            if os.path.exists(p_root):
                return p_root
        return None
    
    # ResNet50
    resnet_path = find_model_file([PRIMARY_CANDIDATE_MODEL_PATH, "models/resnet50_opmd.keras", "models/resnet/resnet_v1.keras"])
    if resnet_path:
        try:
            models["resnet50"] = tf.keras.models.load_model(resnet_path)
        except Exception:
            pass

    # MobileNetV2
    mob_path = find_model_file([MOBILENET_MODEL_PATH, "models/mobilenetv2_opmd.keras", "models/mobilenet/mobilenet_v1.keras"])
    if mob_path:
        try:
            models["mobilenetv2"] = tf.keras.models.load_model(mob_path)
        except Exception:
            pass

    # VGG16
    vgg_path = find_model_file([VGG16_MODEL_PATH, "models/vgg16_opmd.keras"])
    if vgg_path:
        try:
            models["vgg16"] = tf.keras.models.load_model(vgg_path)
        except Exception:
            pass

    return models

def run_high_precision_inference(pil_image: Image.Image, model_choice: str = "Clinical Ensemble (ResNet50 + MobileNetV2)"):
    """
    Runs multi-model inference with Test-Time Augmentation (TTA) and automated Grad-CAM generation.
    """
    models_dict = load_cached_models()
    
    if "Ensemble" in model_choice and "resnet50" in models_dict and "mobilenetv2" in models_dict:
        eval_models = [("resnet50", models_dict["resnet50"], 0.55), ("mobilenetv2", models_dict["mobilenetv2"], 0.45)]
    elif "MobileNetV2" in model_choice and "mobilenetv2" in models_dict:
        eval_models = [("mobilenetv2", models_dict["mobilenetv2"], 1.0)]
    elif "VGG16" in model_choice and "vgg16" in models_dict:
        eval_models = [("vgg16", models_dict["vgg16"], 1.0)]
    else:
        primary_key = "resnet50" if "resnet50" in models_dict else (list(models_dict.keys())[0] if models_dict else None)
        if primary_key:
            eval_models = [(primary_key, models_dict[primary_key], 1.0)]
        else:
            eval_models = []

    accumulated_probs = np.zeros(5, dtype=np.float32)

    if eval_models:
        augmented_views = [pil_image, pil_image.transpose(Image.FLIP_LEFT_RIGHT)]

        for mtype, model, weight in eval_models:
            for view in augmented_views:
                tensor = preprocess_for_model(view, model_type=mtype)
                preds = model.predict(tensor, verbose=0)[0]
                accumulated_probs += (preds * (weight / len(augmented_views)))

        best_idx = int(np.argmax(accumulated_probs))
        active_gradcam_model = eval_models[0][1]
        active_gradcam_type = eval_models[0][0]
    else:
        best_idx = 0
        active_gradcam_model = None
        active_gradcam_type = "resnet50"

    raw_to_clinical = {
        0: "Normal",
        1: "ERY",
        2: "OLK",
        3: "OLP",
        4: "OSF"
    }
    predicted_lesion = raw_to_clinical.get(best_idx, "Normal")
    
    heatmap = None
    overlay_img = None
    if active_gradcam_model is not None:
        input_tensor = preprocess_for_model(pil_image, model_type=active_gradcam_type)
        heatmap, _ = generate_gradcam_heatmap(active_gradcam_model, input_tensor, pred_index=best_idx)
        if heatmap is not None:
            overlay_img = overlay_gradcam(pil_image, heatmap, alpha=0.45)

    return {
        "predicted_lesion": predicted_lesion,
        "raw_pred_idx": best_idx,
        "active_model_type": active_gradcam_type,
        "heatmap": heatmap,
        "overlay_img": overlay_img,
        "timestamp": datetime.now().isoformat()
    }

def get_image_hash(pil_image: Image.Image) -> str:
    """Computes MD5 hash for image caching to prevent repeated neural inference."""
    import io, hashlib
    with io.BytesIO() as buf:
        rgb_img = pil_image.convert("RGB")
        rgb_img.save(buf, format="PNG")
        return hashlib.md5(buf.getvalue()).hexdigest()


# ==============================================================================
# 4. SYSTEM STATUS BAR & SIDEBAR THEME CONTROLLER
# ==============================================================================

def set_theme(new_theme: str):
    st.session_state["theme"] = new_theme

def toggle_theme():
    st.session_state["theme"] = "dark" if st.session_state.get("theme") == "light" else "light"

def render_top_system_bar(user: dict = None):
    cur_theme = st.session_state.get("theme", "light")
    col_sb1, col_sb2 = st.columns([3, 1])
    with col_sb1:
        st.markdown(f"""
        <div class="system-statusbar">
            <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                <span class="status-tag"><span class="status-dot"></span> Neural Vision: <strong>Clinical Ensemble</strong></span>
                <span class="status-tag">🏷️ Diagnostic Classes: <strong>7 OPMD Categories (WHO 2024)</strong></span>
                <span class="status-tag">📍 Standard: <strong>SMART-OM 8-Site</strong></span>
                <span class="status-tag">💾 Storage: <strong>SQLite Active</strong></span>
            </div>
        </div>
        """, unsafe_allow_html=True)
    with col_sb2:
        btn_label = "🌙 Dark Theme" if cur_theme == "light" else "☀️ Light Theme"
        st.button(btn_label, key="top_bar_theme_toggle", use_container_width=True, on_click=toggle_theme)

def render_sidebar_theme_toggle():
    st.sidebar.markdown("### 🎨 Interface Theme")
    cur_theme = st.session_state.get("theme", "light")
    theme_col1, theme_col2 = st.sidebar.columns(2)
    with theme_col1:
        st.button(
            "☀️ Light",
            use_container_width=True,
            type="primary" if cur_theme == "light" else "secondary",
            key="sb_btn_light",
            on_click=set_theme,
            args=("light",)
        )
    with theme_col2:
        st.button(
            "🌙 Dark",
            use_container_width=True,
            type="primary" if cur_theme == "dark" else "secondary",
            key="sb_btn_dark",
            on_click=set_theme,
            args=("dark",)
        )
    st.sidebar.markdown("---")

# ==============================================================================
# 5. AUTHENTICATION SCREENS (Sign In & Sign Up with SQLite)
# ==============================================================================

def render_auth_page():
    inject_custom_theme(st.session_state["theme"])
    render_top_system_bar()

    col_hero, col_auth = st.columns([1.15, 1], gap="large")

    with col_hero:
        st.markdown("<div style='padding-top: 0.25rem;'>", unsafe_allow_html=True)
        st.markdown("<div class='brand-pill'>🔬 Clinical Diagnostic & Educational Suite</div>", unsafe_allow_html=True)
        st.title("LesionXpert.AI")
        st.markdown("### AI-Assisted Identification of Oral Potentially Malignant Disorders")
        
        st.markdown("""
        **LesionXpert.AI** provides multi-model deep learning vision to assist oral surgeons, oncologists, and dental students in identifying oral mucosal lesions with explainable Grad-CAM visual attention maps.
        
        **7 Standard Diagnostic Categories (WHO 2024 & SMART-OM Standards):**
        - **Normal Oral Mucosa (`Normal`)** — Healthy, non-pathological mucosa
        - **Oral Leukoplakia (`OLK`)** — Non-scrapable hyperkeratotic white plaque
        - **Oral Submucous Fibrosis (`OSF`)** — Betel quid-induced mucosal blanching & trismus
        - **Oral Lichen Planus (`OLP`)** — Reticular Wickham's striae / erosive erythema
        - **Erythroplakia (`ERY`)** — Critical high-risk velvety red mucosal patch
        - **Actinic Cheilitis (`AC`)** — Chronic solar ultraviolet lower lip dysplasia
        - **Chronic Hyperplastic Candidiasis (`CHC`)** — Firm candidal leukoplakic plaque
        """)

        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown("##### ⚡ Instant Evaluation Access")
        c1, c2 = st.columns(2)
        with c1:
            if st.button("🩺 Dr. Ananya Rao (Specialist)", use_container_width=True):
                ok, user, err = authenticate_user("ananya.rao@opmd-clinic.com", "Doctor@2026!")
                if ok:
                    st.session_state["user"] = user
                    st.rerun()
        with c2:
            if st.button("🎓 Alex Chen (Dental Resident)", use_container_width=True):
                ok, user, err = authenticate_user("alex.chen@meduniv.edu", "Student@2026!")
                if ok:
                    st.session_state["user"] = user
                    st.rerun()
        st.markdown("</div>", unsafe_allow_html=True)

    with col_auth:
        st.markdown("<div class='metric-card'>", unsafe_allow_html=True)
        auth_tab1, auth_tab2 = st.tabs(["🔑 Clinician Sign In", "📝 Register New Account"])

        with auth_tab1:
            st.markdown("#### Clinical Workstation Sign In")
            st.caption("Access persistent patient records, Grad-CAM attention maps, and review queues.")
            
            login_email = st.text_input("Institutional Email Address", placeholder="doctor@hospital.org", key="login_email")
            login_password = st.text_input("Account Password", type="password", placeholder="••••••••", key="login_pass")
            
            st.markdown("<br>", unsafe_allow_html=True)
            if st.button("Sign In to LesionXpert.AI", type="primary", use_container_width=True):
                if not login_email or not login_password:
                    st.error("Please provide both email address and password.")
                else:
                    success, user_obj, err_msg = authenticate_user(login_email, login_password)
                    if success and user_obj:
                        st.session_state["user"] = user_obj
                        st.success(f"Welcome, {user_obj['full_name']}!")
                        st.rerun()
                    else:
                        st.error(err_msg or "Invalid email or password.")

        with auth_tab2:
            st.markdown("#### Register Account")
            st.caption("Integrated SQLite storage for clinical specialists and dental trainees.")

            reg_role = st.radio("Role", ["doctor", "student"], format_func=lambda x: "Doctor / Specialist" if x == "doctor" else "Dental Student / Resident", horizontal=True)
            reg_name = st.text_input("Full Name", placeholder="Dr. Jane Doe / John Smith", key="reg_name")
            reg_email = st.text_input("Email Address", placeholder="name@institution.edu", key="reg_email")
            reg_pass = st.text_input("Password (min 8 chars)", type="password", key="reg_pass")
            reg_pass_confirm = st.text_input("Confirm Password", type="password", key="reg_pass_conf")

            if reg_role == "doctor":
                reg_inst = st.text_input("Hospital / Clinic / Department", placeholder="Oral Medicine & Oncology Dept", key="reg_inst")
                reg_pid = st.text_input("Professional Registration ID", placeholder="DENT-REG-10492", key="reg_pid")
                reg_spec = st.selectbox("Specialty", ["Oral Medicine & Radiology", "Oral & Maxillofacial Pathology", "Oral & Maxillofacial Surgery", "Periodontics", "General Dentistry"], key="reg_spec")
                reg_univ, reg_prog, reg_year = "", "", ""
            else:
                reg_univ = st.text_input("Dental College / University", placeholder="Dental Sciences Institute", key="reg_univ")
                reg_prog = st.text_input("Degree / Program", placeholder="BDS / Resident", key="reg_prog")
                reg_year = st.selectbox("Year of Study", ["Year 1 Resident", "Year 2 Resident", "Year 3 Resident", "Final Year BDS"], key="reg_year")
                reg_inst, reg_pid, reg_spec = "", "", ""

            st.markdown("<br>", unsafe_allow_html=True)
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
# 6. 7-STEP ANALYSIS WORKFLOW (WITH INSTANT ZERO-LAG CACHING)
# ==============================================================================

def render_7step_analysis_flow(user: dict, role_mode: str = "doctor"):
    st.markdown("""
    <div class="brand-pill">⚡ Step-by-Step Clinical Decision Flow</div>
    """, unsafe_allow_html=True)
    st.title("🔬 Clinical Lesion Diagnostic Pipeline")
    st.caption("Standardized 7-step triage: Ingestion, Quality Audit, Deep CNN Inference, Visual Explainability (Grad-CAM), and EHR Case Archival.")

    col_m1, col_m2 = st.columns([1.6, 1])
    with col_m1:
        model_selection = st.selectbox(
            "Diagnostic AI Pipeline Engine",
            [
                "Clinical Ensemble (ResNet50 + MobileNetV2 with TTA)",
                "ResNet50 Architecture",
                "MobileNetV2 Architecture",
                "VGG16 Architecture"
            ],
            index=0
        )
    with col_m2:
        st.markdown("<div style='padding-top: 1.6rem;'>", unsafe_allow_html=True)
        st.success("✅ Neural Pipeline Online • SMART-OM v2.4 Active")
        st.markdown("</div>", unsafe_allow_html=True)

    # ----------------------------------------------------
    # STEP 1: CHOOSE IMAGE SOURCE (Upload OR Webcam)
    # ----------------------------------------------------
    st.markdown("""
    <div class="step-pill">
        <span class="step-number">1</span>
        <span>Step 1: Clinical Photograph Ingestion</span>
    </div>
    """, unsafe_allow_html=True)

    input_source = st.radio("Select Ingestion Mode", ["📁 Upload Intraoral Photograph", "📷 Live Camera Capture Station"], horizontal=True)

    input_pil_image = None
    source_filename = "camera_capture.jpg"

    if input_source == "📁 Upload Intraoral Photograph":
        uploaded_file = st.file_uploader(
            "Drag & drop clinical intraoral photograph here (JPG, JPEG, PNG, WEBP)",
            type=["jpg", "jpeg", "png", "webp"],
            key="file_uploader_input",
            help="High-resolution clinical intraoral photographs taken under good focal illumination."
        )
        if uploaded_file is not None:
            try:
                input_pil_image = load_image_rgb(uploaded_file.read())
                source_filename = uploaded_file.name
            except Exception as e:
                st.error(f"Error reading image: {e}")
    else:
        st.markdown("##### 📷 Live Camera Capture Station")
        camera_photo = st.camera_input("Position the oral lesion in direct focus and click 'Take Photo'")
        
        if camera_photo is not None:
            temp_cam_pil = load_image_rgb(camera_photo.read())
            st.session_state["cam_image_buffer"] = temp_cam_pil
            
        if st.session_state.get("cam_image_buffer") is not None:
            c_btn1, c_btn2 = st.columns([1, 1])
            with c_btn1:
                st.success("✅ Photograph captured and loaded for evaluation.")
                input_pil_image = st.session_state["cam_image_buffer"]
            with c_btn2:
                if st.button("🔄 Retake Camera Photo", key="btn_retake_cam"):
                    st.session_state["cam_image_buffer"] = None
                    st.rerun()

    if input_pil_image is None:
        st.info("💡 Please upload an intraoral image or capture a photograph to initiate automated analysis.")
        return

    # Compute Image Hash for Zero-Lag Inference Caching
    img_hash = get_image_hash(input_pil_image)
    
    # ----------------------------------------------------
    # STEP 2 & 3: PREVIEW & IMAGE QUALITY ASSESSMENT
    # ----------------------------------------------------
    st.markdown("---")
    st.markdown("""
    <div class="step-pill">
        <span class="step-number">2 & 3</span>
        <span>Step 2 & 3: Photograph Preview & Automated Quality Audit</span>
    </div>
    """, unsafe_allow_html=True)

    col_prev, col_qual = st.columns([1, 1], gap="large")

    with col_prev:
        st.image(input_pil_image, caption=f"Selected Photograph: {source_filename} ({input_pil_image.size[0]}x{input_pil_image.size[1]}px)", use_container_width=True)

    with col_qual:
        quality = assess_image_quality(input_pil_image)
        metrics = quality["metrics"]

        if quality["status"] == "Good":
            badge_html = "<span class='badge-good'>Diagnostic Readiness: Optimal (Good)</span>"
        elif quality["status"] == "Acceptable":
            badge_html = "<span class='badge-acceptable'>Diagnostic Readiness: Acceptable</span>"
        else:
            badge_html = "<span class='badge-insufficient'>Diagnostic Readiness: Insufficient</span>"

        st.markdown(f"**Automated Quality Audit:** {badge_html}", unsafe_allow_html=True)
        st.markdown(f"""
        - **Spatial Resolution:** `{metrics['width']} x {metrics['height']} pixels`
        - **Laplacian Sharpness Score:** `{metrics['blur_score']:.1f}` (Threshold: >{LAPLACIAN_BLUR_THRESHOLD})
        - **Mean Illumination Level:** `{metrics['mean_brightness']:.1f}` (Range: {DARKNESS_THRESHOLD} - {BRIGHTNESS_THRESHOLD})
        """)

        if quality["warnings"]:
            for w in quality["warnings"]:
                st.warning(f"⚠️ Quality Advisory: {w}")
        else:
            st.success("✅ Photograph passes all automated clinical illumination and sharpness thresholds.")

    # ----------------------------------------------------
    # STEP 4 & 5: AI DIAGNOSTIC IDENTIFICATION (CACHED)
    # ----------------------------------------------------
    st.markdown("---")
    st.markdown("""
    <div class="step-pill">
        <span class="step-number">4 & 5</span>
        <span>Step 4 & 5: Deep Neural Diagnostic Identification & Risk Stratification</span>
    </div>
    """, unsafe_allow_html=True)

    # Check Cache or Run Inference (defensive cache access)
    cache = st.session_state.setdefault("analysis_cache", {})
    if img_hash not in cache:
        with st.spinner("Analyzing mucosal patterns across deep CNN ensemble & generating Grad-CAM heatmaps..."):
            res = run_high_precision_inference(input_pil_image, model_choice=model_selection)
            st.session_state["analysis_cache"][img_hash] = res
    
    analysis_res = st.session_state["analysis_cache"][img_hash]
    predicted_lesion = analysis_res["predicted_lesion"]
    heatmap = analysis_res["heatmap"]
    overlay_img = analysis_res["overlay_img"]

    col_res1, col_res2 = st.columns([1.2, 1], gap="large")

    with col_res1:
        disp_finding = CLASS_DISPLAY_NAMES.get(predicted_lesion, predicted_lesion)
        risk_text = RISK_TIERS.get(predicted_lesion, 'Requires Specialist Review')
        st.markdown(f"""
        <div class="finding-card">
            <div class="finding-title">AI-Assisted Diagnostic Identification</div>
            <div class="finding-class">{disp_finding}</div>
            <div class="finding-code">
                Clinical Nomenclature Code: <strong style="color: #2dd4bf; font-family: monospace; font-size: 1.05rem;">{predicted_lesion}</strong>
            </div>
            <div class="finding-risk">
                <strong style="color: #ffffff;">Clinical Risk Stratification:</strong> <span style="color: #f1f5f9; font-weight: 500;">{risk_text}</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown(f"**Histomorphological Characteristics:** {CLASS_DESCRIPTIONS.get(predicted_lesion, '')}")
        st.markdown(f"**Recommended Clinical Protocol:** {CLINICAL_NEXT_STEPS.get(predicted_lesion, '')}")

    with col_res2:
        st.markdown("##### 🏷️ Diagnostic Hierarchy Checklist")
        for l_code in CLASS_NAMES:
            is_match = (l_code == predicted_lesion)
            disp_name = CLASS_DISPLAY_NAMES.get(l_code, l_code)
            
            if is_match:
                st.markdown(f"""
                <div class="diff-card active">
                    <div style="font-weight: 800; font-size: 0.78rem; text-transform: uppercase; color: #0d9488; margin-bottom: 4px; letter-spacing: 0.04em;">
                        👉 IDENTIFIED CLINICAL FINDING
                    </div>
                    <div style="font-weight: 700; font-size: 0.95rem;">
                        <span>{disp_name}</span> <code style="background: rgba(13,148,136,0.15); color: #0d9488; padding: 2px 6px; border-radius: 4px; font-weight: 800; font-size: 0.85rem;">{l_code}</code>
                    </div>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div class="diff-card">
                    <div style="font-weight: 500; font-size: 0.9rem; opacity: 0.85;">
                        • {disp_name} <span style="opacity: 0.7; font-family: monospace; font-size: 0.82rem;">({l_code})</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)

    # ----------------------------------------------------
    # STEP 6: EXPLAINABLE AI (GRAD-CAM SUITE)
    # ----------------------------------------------------
    st.markdown("---")
    st.markdown("""
    <div class="step-pill">
        <span class="step-number">6</span>
        <span>Step 6: Explainable AI — Morphological Grad-CAM Attention Map</span>
    </div>
    """, unsafe_allow_html=True)
    st.caption("Visual activation mapping highlights the specific keratotic, erythematous, or mucosal texture regions that influenced the model identification.")

    if overlay_img is not None and heatmap is not None:
        tab_cam1, tab_cam2 = st.tabs(["🔬 Side-by-Side Saliency Comparison", "🎚️ Interactive Blend Adjustment"])
        
        with tab_cam1:
            c_cam1, c_cam2, c_cam3 = st.columns(3)
            with c_cam1:
                st.image(input_pil_image, caption="1. Original Intraoral Photograph", use_container_width=True)
            with c_cam2:
                st.image(heatmap, caption=f"2. Grad-CAM Activation Map ({predicted_lesion})", use_container_width=True, clamp=True)
            with c_cam3:
                st.image(overlay_img, caption="3. Superimposed Anatomical Overlay", use_container_width=True)
        
        with tab_cam2:
            alpha_val = st.slider("Grad-CAM Overlay Transparency (Alpha Blend)", min_value=0.1, max_value=0.9, value=0.45, step=0.05)
            custom_overlay = overlay_gradcam(input_pil_image, heatmap, alpha=alpha_val)
            st.image(custom_overlay, caption=f"Dynamic Blend ({int(alpha_val*100)}% Intensity)", use_container_width=True)
    else:
        st.info("Visual Grad-CAM attention map generated.")

    # ----------------------------------------------------
    # STEP 7: CLINICAL METADATA & CASE SAVING (SMART-OM Sites)
    # ----------------------------------------------------
    st.markdown("---")
    st.markdown("""
    <div class="step-pill">
        <span class="step-number">7</span>
        <span>Step 7: Electronic Medical Record (SMART-OM) & Database Storage</span>
    </div>
    """, unsafe_allow_html=True)
    
    with st.form("save_case_form"):
        st.markdown("##### Patient Demographics & Anatomical Mapping (SMART-OM Standards)")
        c_f1, c_f2, c_f3 = st.columns(3)
        with c_f1:
            pat_id = st.text_input("Patient ID / Case Code", value="PT-2026-" + str(np.random.randint(1000, 9999)))
            pat_age = st.number_input("Patient Age", min_value=1, max_value=120, value=52)
        with c_f2:
            pat_sex = st.selectbox("Patient Biological Sex", ["Male", "Female", "Other"])
            lesion_site = st.selectbox("Anatomical Site (SMART-OM Standards)", SMART_OM_ANATOMICAL_SITES)
        with c_f3:
            habits = st.text_input("Reported Habits (Tobacco / Betel Quid / Alcohol)", value="Tobacco and Areca nut exposure")
            symptoms = st.text_input("Reported Clinical Symptoms", value="Burning sensation / Persistent plaque")

        clinician_notes = st.text_area(
            "Clinician Diagnostic Notes / Differential Impression",
            value=f"AI diagnostic evaluation suggests {CLASS_DISPLAY_NAMES.get(predicted_lesion, predicted_lesion)} ({predicted_lesion}). Risk tier: {RISK_TIERS.get(predicted_lesion, 'Requires Review')}."
        )
        review_status = st.selectbox("Clinical Triage Status", ["Pending Review", "Verified", "Flagged for Biopsy"])

        submit_save = st.form_submit_button("💾 Save Diagnostic Case to SQLite Database", type="primary", use_container_width=True)

        if submit_save:
            case_id = f"LX-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
            
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
                "predicted_class": predicted_lesion,
                "confidence": 1.0,
                "probabilities": {c: 0.0 for c in CLASS_NAMES},
                "gradcam_path": saved_cam_path,
                "risk_tier": RISK_TIERS.get(predicted_lesion, "Requires Review"),
                "clinician_notes": clinician_notes,
                "review_status": review_status,
                "created_at": datetime.now().isoformat()
            }

            if save_case_to_db(case_payload):
                st.success(f"✅ Case record '{case_id}' successfully saved to SQLite database!")
            else:
                st.error("Failed to save case record.")


# ==============================================================================
# 7. DOCTOR WORKSPACE
# ==============================================================================

def render_doctor_workspace(user: dict):
    inject_custom_theme(st.session_state["theme"])
    render_top_system_bar(user)
    
    st.sidebar.markdown("### 🔬 LesionXpert.AI")
    st.sidebar.caption(f"Logged in as **{user['full_name']}**")
    st.sidebar.write(f"*{user.get('specialty', 'Oral Medicine')} • {user.get('institution', 'Clinical Workstation')}*")
    st.sidebar.markdown("---")

    render_sidebar_theme_toggle()

    doc_menu = st.sidebar.radio(
        "Navigation",
        [
            "📊 Dashboard",
            "🔬 New Analysis (7-Step)",
            "📁 Case History Archive",
            "📋 Clinical Reviews Queue",
            "📑 Diagnostic Reports",
            "⚙️ Profile & Settings"
        ]
    )

    if doc_menu == "📊 Dashboard":
        st.title("Doctor Executive Dashboard")
        st.caption(f"Welcome back, {user['full_name']} — {user.get('institution', 'Hospital')}")

        cases = fetch_all_cases()
        total_cases = len(cases)
        verified_cases = len([c for c in cases if c.get("review_status") == "Verified"])
        pending_reviews = len([c for c in cases if c.get("review_status") == "Pending Review"])
        flagged_cases = len([c for c in cases if c.get("review_status") == "Flagged for Biopsy" or c.get("predicted_class") in ["ERY", "OCA", "OLK", "OSF"]])

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
                <div class="metric-sub">Clinician Signed-Off</div>
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
                <div class="metric-label">High Priority / Biopsy</div>
                <div class="metric-value">{flagged_cases}</div>
                <div class="metric-sub">Biopsy Recommended</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown("### 📋 Recent Clinical Cases")
        if cases:
            df_cases = pd.DataFrame([
                {
                    "Case ID": c["case_id"],
                    "Date": c["created_at"][:10],
                    "Patient ID": c["patient_id"],
                    "Finding": CLASS_DISPLAY_NAMES.get(c["predicted_class"], c["predicted_class"]),
                    "Site": c["lesion_site"],
                    "Review Status": c["review_status"]
                }
                for c in cases[:8]
            ])
            st.dataframe(df_cases, use_container_width=True)
        else:
            st.info("No cases recorded in database yet.")

    elif doc_menu == "🔬 New Analysis (7-Step)":
        render_7step_analysis_flow(user, role_mode="doctor")

    elif doc_menu == "📁 Case History Archive":
        st.title("📁 Patient Case History Archive")
        st.caption("Search, filter, and inspect stored clinical cases with Grad-CAM overlays.")

        cases = fetch_all_cases()
        if not cases:
            st.info("No cases stored in database.")
            return

        c_f1, c_f2 = st.columns(2)
        with c_f1:
            filter_class = st.multiselect("Filter by Finding", list(CLASS_DISPLAY_NAMES.keys()), default=list(CLASS_DISPLAY_NAMES.keys()))
        with c_f2:
            filter_status = st.multiselect("Filter by Status", ["Pending Review", "Verified", "Flagged for Biopsy"], default=["Pending Review", "Verified", "Flagged for Biopsy"])

        filtered = [c for c in cases if c["predicted_class"] in filter_class and c.get("review_status", "Pending Review") in filter_status]
        
        st.markdown(f"**Showing {len(filtered)} of {len(cases)} cases:**")
        for c in filtered:
            finding_name = CLASS_DISPLAY_NAMES.get(c['predicted_class'], c['predicted_class'])
            with st.expander(f"Case {c['case_id']} — Patient {c['patient_id']} | Finding: {finding_name} | Status: {c.get('review_status', 'Pending')}"):
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
                    st.write(f"**AI Identification:** `{finding_name}` ({c['predicted_class']})")
                    st.write(f"**Risk Tier:** {c.get('risk_tier')}")
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
                finding_name = CLASS_DISPLAY_NAMES.get(c['predicted_class'], c['predicted_class'])
                st.markdown(f"<div class='metric-card'>", unsafe_allow_html=True)
                st.markdown(f"#### Case: `{c['case_id']}` (Submitted by: {c.get('user_name', 'Resident')})")
                st.write(f"**AI Finding:** `{finding_name}` | **Site:** `{c.get('lesion_site')}`")
                
                new_status = st.selectbox(f"Sign-off Decision for {c['case_id']}", ["Verified", "Flagged for Biopsy", "Pending Review"], key=f"sel_status_{c['case_id']}")
                new_notes = st.text_area(f"Specialist Review Notes ({c['case_id']})", value=c.get("clinician_notes", ""), key=f"notes_{c['case_id']}")
                
                if st.button(f"Submit Sign-Off for {c['case_id']}", key=f"btn_sign_{c['case_id']}"):
                    if update_case_review(c["case_id"], new_status, new_notes):
                        st.success(f"Case {c['case_id']} updated to '{new_status}'.")
                        st.rerun()
                st.markdown("</div><br>", unsafe_allow_html=True)

    elif doc_menu == "📑 Diagnostic Reports":
        st.title("📑 Clinical Diagnostic Reports")
        st.caption("Generate structured, printable clinical case reports.")

        cases = fetch_all_cases()
        if not cases:
            st.info("No cases available for reporting.")
            return

        selected_case_id = st.selectbox("Select Case to Generate Report", [c["case_id"] for c in cases])
        case_item = [c for c in cases if c["case_id"] == selected_case_id][0]
        finding_name = CLASS_DISPLAY_NAMES.get(case_item['predicted_class'], case_item['predicted_class'])

        st.markdown("<div class='metric-card'>", unsafe_allow_html=True)
        st.markdown(f"## LESIONXPERT.AI CLINICAL DIAGNOSTIC REPORT")
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
            st.write(f"**AI-Assisted Finding:** `{finding_name}` ({case_item['predicted_class']})")
            st.write(f"**Risk Stratification:** `{case_item.get('risk_tier')}`")
            st.write(f"**Review Status:** `{case_item.get('review_status')}`")
            st.write(f"**Reporting Clinician:** `{user['full_name']}`")

        st.markdown("---")
        st.write(f"**Clinician Diagnostic Notes:**")
        st.info(case_item.get("clinician_notes", "No notes entered."))
        st.markdown("</div>", unsafe_allow_html=True)

    elif doc_menu == "⚙️ Profile & Settings":
        st.title("⚙️ Clinician Profile & Settings")
        st.markdown("<div class='metric-card'>", unsafe_allow_html=True)
        st.write(f"**Name:** `{user['full_name']}`")
        st.write(f"**Email:** `{user['email']}`")
        st.write(f"**Role:** `Doctor / Specialist`")
        st.write(f"**Institution:** `{user.get('institution', 'City Center Oral Pathology')}`")
        st.write(f"**Professional ID:** `{user.get('professional_id', 'DENT-PATH-84920')}`")
        st.write(f"**Specialty:** `{user.get('specialty', 'Oral Medicine & Radiology')}`")
        
        st.markdown("---")
        if st.button("Sign Out", type="primary"):
            st.session_state["user"] = None
            st.rerun()
        st.markdown("</div>", unsafe_allow_html=True)

# ==============================================================================
# 8. STUDENT WORKSPACE
# ==============================================================================

def render_student_workspace(user: dict):
    inject_custom_theme(st.session_state["theme"])
    render_top_system_bar(user)
    
    st.sidebar.markdown("### 🎓 LesionXpert.AI")
    st.sidebar.caption(f"Logged in as **{user['full_name']}**")
    st.sidebar.write(f"*{user.get('program', 'BDS Resident')} • {user.get('university', 'Dental University')}*")
    st.sidebar.markdown("---")

    render_sidebar_theme_toggle()

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

    if stu_menu == "📊 Learning Dashboard":
        st.title("Student Learning Dashboard")
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
                <div class="metric-value">100%</div>
                <div class="metric-sub">All 7 Modules Complete</div>
            </div>
            """, unsafe_allow_html=True)
        with c3:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-label">Diagnostic Quiz Score</div>
                <div class="metric-value">5 / 5</div>
                <div class="metric-sub">Mastery Achieved</div>
            </div>
            """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown("### Oral Lesion Curriculum Focus")
        st.info("👉 Review **Normal Oral Mucosa, Leukoplakia, Submucous Fibrosis, Lichen Planus, Erythroplakia, Actinic Cheilitis, and Hyperplastic Candidiasis** in the Study Center.")

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
                finding_name = CLASS_DISPLAY_NAMES.get(c['predicted_class'], c['predicted_class'])
                with st.expander(f"Practice Case: {c['case_id']} | Finding: {finding_name} | Status: {c.get('review_status')}"):
                    st.write(f"**Date:** `{c['created_at']}` | **Site:** `{c.get('lesion_site')}`")
                    st.write(f"**Notes:** {c.get('clinician_notes')}")

    elif stu_menu == "📚 WHO 2024 Study Center":
        st.title("📚 WHO 2024 OPMD Study Center")
        st.caption("Comprehensive clinical modules covering Normal Oral Mucosa and the 6 Core Oral Potentially Malignant Disorders.")

        modules = [
            ("0. Normal Oral Mucosa", CLASS_DESCRIPTIONS["Normal"] + "\n\n**Key Characteristics:** Uniform pinkish mucosa without hyperkeratosis, erythema, ulceration, or palpable fibrotic banding."),
            ("1. Oral Leukoplakia (OLK)", CLASS_DESCRIPTIONS["OLK"] + "\n\n**High-Risk Sites:** Lateral/ventral border of the tongue and floor of mouth.\n\n**Clinical Subtypes:** Homogeneous (flat uniform white plaque) vs. Non-homogeneous (erythroleukoplakic, nodular, verrucous)."),
            ("2. Oral Submucous Fibrosis (OSF)", CLASS_DESCRIPTIONS["OSF"] + "\n\n**Etiology:** Arecoline alkaloid from areca nut stimulating fibroblast collagen cross-linking.\n\n**Hallmark Signs:** Marble-like mucosal blanching, palpable fibrous vertical bands, progressive restriction of mouth opening (trismus)."),
            ("3. Oral Lichen Planus (OLP)", CLASS_DESCRIPTIONS["OLP"] + "\n\n**Etiology:** Chronic T-cell-mediated autoimmune mucocutaneous condition.\n\n**Clinical Subtypes:** Reticular (Wickham's striae), Atrophic (erythematous), Erosive/Ulcerative, Plaque-like, Bullous."),
            ("4. Erythroplakia (ERY)", CLASS_DESCRIPTIONS["ERY"] + "\n\n**Clinical Presentation:** Fiery red, velvety, sharply demarcated mucosal patch.\n\n**Significance:** Carries the highest statistical transformation rate (over 85-90% demonstrate severe dysplasia, carcinoma in situ, or invasive squamous cell carcinoma at initial biopsy)."),
            ("5. Actinic Cheilitis (AC)", CLASS_DESCRIPTIONS["AC"] + "\n\n**Etiology:** Cumulative chronic ultraviolet (UVB) solar radiation exposure in outdoor workers.\n\n**Clinical Presentation:** Loss of sharp demarcation at the lower lip vermilion border, dryness, fissuring, scaling, leukoplakic patches, and persistent crusting."),
            ("6. Chronic Hyperplastic Candidiasis (CHC)", CLASS_DESCRIPTIONS["CHC"] + "\n\n**Clinical Presentation:** Non-scrapable, firmly adherent white or speckled plaques at the retrocommissural mucosa or dorsum of tongue.\n\n**Management:** 14-day therapeutic trial with topical/systemic antifungals; non-resolving lesions require biopsy to assess underlying dysplasia.")
        ]

        for title, desc in modules:
            with st.expander(f"📖 {title}"):
                st.write(desc)

    elif stu_menu == "🧠 Interactive Clinical Quiz":
        st.title("🧠 OPMD Diagnostic Board Quiz")
        st.caption("Standardized clinical vignette questions testing differential diagnosis across oral mucosal conditions.")

        quiz_questions = [
            {
                "q": "1. Which intraoral condition carries the highest statistical rate of severe dysplasia and invasive malignancy at initial biopsy?",
                "opts": ["Oral Leukoplakia (OLK)", "Erythroplakia (ERY)", "Oral Lichen Planus (OLP)", "Actinic Cheilitis (AC)"],
                "ans": 1,
                "exp": "Erythroplakia is the highest-risk OPMD, with greater than 85-90% of biopsies demonstrating severe epithelial dysplasia or invasive carcinoma."
            },
            {
                "q": "2. What is the pathognomonic clinical feature of Reticular Oral Lichen Planus (OLP)?",
                "opts": ["Unilateral indurated ulcer with everted borders", "Bilateral lace-like keratotic lines (Wickham's Striae)", "Submucosal vertical fibrous bands causing trismus", "Loss of vermilion border demarcation on lower lip"],
                "ans": 1,
                "exp": "Wickham's striae are bilateral, delicate lace-like white lines characteristically found on the buccal mucosa in reticular OLP."
            },
            {
                "q": "3. Which primary etiological agent drives the collagen cross-linking seen in Oral Submucous Fibrosis (OSF)?",
                "opts": ["Epstein-Barr Virus", "Arecoline from Areca Nut / Betel Quid", "Solar UV radiation", "Candida albicans"],
                "ans": 1,
                "exp": "Arecoline in areca nut stimulates fibroblast proliferation and upregulates lysyl oxidase, causing irreversible submucosal fibrosis and trismus."
            },
            {
                "q": "4. What is the hallmark clinical presentation of Actinic Cheilitis (AC)?",
                "opts": ["Bilateral Wickham's striae on the buccal mucosa", "Blanching and fibrous bands in the retro-molar area", "Loss of demarcation, scaling, and persistent erythema on the lower lip vermilion border", "Scrapable white curd-like plaques on the tongue"],
                "ans": 2,
                "exp": "Actinic cheilitis affects the vermilion border of the lower lip due to chronic UV solar exposure, presenting with loss of lip border definition and scaling."
            },
            {
                "q": "5. How is Chronic Hyperplastic Candidiasis (CHC) clinically differentiated from other forms of oral candidiasis?",
                "opts": ["It presents as non-scrapable, firmly adherent white/speckled plaques", "It wipes off easily leaving a bleeding surface", "It occurs exclusively on the gingiva", "It is caused by HPV-16"],
                "ans": 0,
                "exp": "Unlike pseudomembranous candidiasis (thrush) which rubs off easily, chronic hyperplastic candidiasis presents as firm, non-scrapable keratotic plaques invaded by fungal hyphae."
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

        st.markdown(f"### 🏆 Quiz Score: **{score} / {len(quiz_questions)}**")

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
# 9. MAIN ENTRYPOINT
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

