"""
OPMD-AI: Global Configuration & Clinical Terminology Registry
Taxonomy includes Normal Oral Mucosa + 6 Core OPMD Lesion Classes (aligned with SMART-OM Dataset Standards):
0. Normal Oral Mucosa (Normal)
1. Oral Leukoplakia (OLK)
2. Oral Submucous Fibrosis (OSF)
3. Oral Lichen Planus (OLP)
4. Erythroplakia (ERY)
5. Actinic Cheilitis (AC)
6. Chronic Hyperplastic Candidiasis (CHC)
"""

from pathlib import Path

# Primary Diagnostic Classes (Normal + 6 OPMD Lesions)
CLASS_NAMES = ["Normal", "OLK", "OSF", "OLP", "ERY", "AC", "CHC"]

CLASS_DISPLAY_NAMES = {
    "Normal": "Normal Oral Mucosa (Healthy / Non-Pathological)",
    "OLK": "Oral Leukoplakia (Keratotic White Plaque)",
    "OSF": "Oral Submucous Fibrosis (Fibrotic Mucosal Blanching)",
    "OLP": "Oral Lichen Planus (Reticular / Atrophic Striae)",
    "ERY": "Erythroplakia (High-Risk Erythematous Plaque)",
    "AC": "Actinic Cheilitis (Solar / Actinic Lip Dysplasia)",
    "CHC": "Chronic Hyperplastic Candidiasis (Candidal Leukoplakia)",
    # Backward compatibility
    "OCA": "Oral Squamous Cell Carcinoma (Malignant / Suspicious)"
}

CLASS_DESCRIPTIONS = {
    "Normal": "Normal, healthy oral mucosal tissue without observable hyperkeratosis, dysplasia, or fibrotic striations.",
    "OLK": "Predominantly white keratotic plaque of questionable risk that cannot be characterized clinically or pathologically as any other disorder. Features hyperkeratosis and variable epithelial dysplasia.",
    "OSF": "Chronic progressive fibrotic disease linked to areca nut/betel quid chewing. Presents with mucosal blanching, loss of mucosal elasticity, vertical fibrous bands, and progressive trismus.",
    "OLP": "Chronic autoimmune T-cell-mediated mucocutaneous disorder presenting as bilateral lace-like Wickham's striae, atrophic erythematous patches, or painful erosive ulcerations.",
    "ERY": "Fiery red, velvety, sharply demarcated mucosal patch carrying high dysplasia risk; over 85-90% demonstrate severe dysplasia or carcinoma in situ at biopsy.",
    "AC": "Premalignant condition of the lower lip vermilion border caused by chronic solar ultraviolet (UV) radiation. Manifests with loss of lip border definition, scaling, and persistent erythema.",
    "CHC": "Firm, non-scrapable white keratotic plaques invaded by Candida fungal hyphae, typically situated at the labial commissures or buccal mucosa.",
    "OCA": "Invasive epithelial malignancy presenting with rolled indurated borders and persistent ulceration."
}

RISK_TIERS = {
    "Normal": "Healthy / Low Risk (Routine Periodic Screening)",
    "OLK": "Moderate to High Risk (Specialist Triage & Biopsy Consideration)",
    "OSF": "High Risk (Immediate Habit Cessation & Trismus Management)",
    "OLP": "Moderate Risk (Symptom-Directed Therapy & Long-term Surveillance)",
    "ERY": "Critical High Priority (Urgent Diagnostic Incisional Biopsy)",
    "AC": "High Priority (UV Photoprotection & Histopathological Evaluation)",
    "CHC": "Moderate Risk (14-Day Antifungal Trial & Re-Evaluation)",
    "OCA": "Critical High Priority (Urgent Oncology & Surgical Referral)"
}

CLINICAL_NEXT_STEPS = {
    "Normal": "Continue routine periodic dental examinations. Encourage maintainance of good oral hygiene.",
    "OLK": "Inspect high-risk sites (lateral tongue, floor of mouth); eliminate tobacco/alcohol exposure; arrange specialist biopsy triage for non-homogeneous plaques.",
    "OSF": "Immediate and total cessation of areca nut, gutkha, and tobacco; prescribe antioxidant therapy; monitor inter-incisal mouth opening.",
    "OLP": "Bilateral mucosal examination; symptom-directed topical corticosteroids for erosive/atrophic forms; periodic surveillance for dysplastic changes.",
    "ERY": "Immediate referral to Oral & Maxillofacial Pathology / Oncology for diagnostic incisional biopsy; avoid empirical delays.",
    "AC": "Prescribe strict UV lip balm protection (SPF 50+); biopsy areas of persistent induration or ulceration to rule out squamous cell carcinoma.",
    "CHC": "Initiate 14-day antifungal regimen (topical clotrimazole / oral fluconazole); ensure denture hygiene; mandatory biopsy if lesion fails to resolve.",
    "OCA": "Urgent referral to Head & Neck Oncology for staging and definitive histopathological biopsy."
}

# SMART-OM Standard 8 Intraoral Anatomical Sites
SMART_OM_ANATOMICAL_SITES = [
    "Dorsal Tongue (DT)",
    "Ventral Tongue & Floor of Mouth (VT)",
    "Left Buccal Mucosa (LB)",
    "Right Buccal Mucosa (RB)",
    "Lower Lip Vermilion Border (LL)",
    "Upper Lip (UL)",
    "Upper Dental Arch & Palate (UA)",
    "Lower Dental Arch & Gingiva (LA)"
]

# Image Quality Thresholds
MIN_IMAGE_DIMENSION = 150
LAPLACIAN_BLUR_THRESHOLD = 60.0
DARKNESS_THRESHOLD = 30.0
BRIGHTNESS_THRESHOLD = 235.0

# Model Paths
PRIMARY_CANDIDATE_MODEL_PATH = "models/resnet50_opmd.keras"
MOBILENET_MODEL_PATH = "models/mobilenetv2_opmd.keras"
VGG16_MODEL_PATH = "models/vgg16_opmd.keras"
CLASS_INDICES_PATH = "models/class_indices.json"
DATABASE_PATH = "database/opmd_cases.db"
