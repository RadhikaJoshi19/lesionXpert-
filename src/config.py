"""
OPMD-AI: Global Configuration & Clinical Terminology Registry
"""

from pathlib import Path

# Clinical Class Names (Standard Alphabetical 5-Class Problem)
CLASS_NAMES = ["Normal", "OCA", "OLK", "OLP", "OSF"]

CLASS_DISPLAY_NAMES = {
    "Normal": "Normal Oral Mucosa",
    "OCA": "Oral Squamous Cell Carcinoma (OCA / OSCC)",
    "OLK": "Oral Leukoplakia",
    "OLP": "Oral Lichen Planus (OLP)",
    "OSF": "Oral Submucous Fibrosis (OSMF / OSF)"
}

CLASS_DESCRIPTIONS = {
    "Normal": "Normal oral mucosal tissue without observable dysplastic, inflammatory, or malignant features.",
    "OCA": "Oral Carcinoma / Malignant epithelial neoplasm presenting as indurated ulceration, exophytic mass, or verrucous growth.",
    "OLK": "Oral Leukoplakia — predominantly white keratotic plaque of questionable risk that cannot be characterized clinically or pathologically as any other disease.",
    "OLP": "Oral Lichen Planus — chronic T-cell-mediated inflammatory mucocutaneous condition, often presenting with reticular Wickham striae or atrophic/erosive erythema.",
    "OSF": "Oral Submucous Fibrosis — chronic insidious fibrotic condition of the oral cavity linked to areca nut/betel quid chewing, causing mucosal blanching and trismus."
}

RISK_TIERS = {
    "Normal": "Low / Routine Monitoring",
    "OCA": "High Priority Clinical Evaluation",
    "OLK": "Requires Clinical Correlation & Specialist Review",
    "OLP": "Requires Clinical Correlation & Symptom Monitoring",
    "OSF": "Requires Clinical Correlation & Habit Cessation"
}

CLINICAL_NEXT_STEPS = {
    "Normal": "Continue routine periodic dental examinations. Encourage maintainance of good oral hygiene.",
    "OCA": "Urgent referral to Oral & Maxillofacial Surgery / Head & Neck Oncology for definitive histopathological incisional biopsy.",
    "OLK": "Referral to oral medicine/pathology specialist for diagnostic biopsy consideration; complete elimination of tobacco and alcohol risk factors; 14-day re-evaluation.",
    "OLP": "Comprehensive clinical examination of bilateral mucosa; symptom-directed topical management; periodic surveillance for atrophic/erosive changes.",
    "OSF": "Immediate and total cessation of areca nut, gutkha, and tobacco habits; nutritional therapy; measurement of inter-incisal opening; surgical consult if severe."
}

# Image Quality Thresholds (Documented for Clinical Transparency)
MIN_IMAGE_DIMENSION = 150  # Minimum width and height in pixels
LAPLACIAN_BLUR_THRESHOLD = 60.0  # Variance of Laplacian below this indicates excessive blur
DARKNESS_THRESHOLD = 30.0  # Mean grayscale intensity below this indicates under-illumination
BRIGHTNESS_THRESHOLD = 235.0  # Mean grayscale intensity above this indicates over-exposure / flash washout

# Default Model Paths
PRIMARY_CANDIDATE_MODEL_PATH = "models/resnet50_opmd.keras"
MOBILENET_MODEL_PATH = "models/mobilenetv2_opmd.keras"
VGG16_MODEL_PATH = "models/vgg16_opmd.keras"
CLASS_INDICES_PATH = "models/class_indices.json"
DATABASE_PATH = "database/opmd_cases.db"
