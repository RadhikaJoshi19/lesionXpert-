import { AnalysisCase, StudyModule, UserProfile } from '../types';

export const initialDoctorProfile: UserProfile = {
  id: 'doc-001',
  name: 'Dr. Ananya Rao',
  email: 'ananya.rao@opmd-clinic.com',
  role: 'doctor',
  clinicalRole: 'Senior Oral Pathologist',
  institution: 'City Center Oral Pathology & Oncology',
  professionalId: 'DENT-PATH-84920',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJS8yOR2DobQMFCYSHYyKzH39euXIwMZatBZqWnjUX1d3BMZTac6DZEttIsyIrXuDlLikb26atptzdVR-TH7zFGDELjfndN-rILu4RMXFbJKHNdovE8x_aB_PzUsP6q-c5kGGJV16NtedeqKVp1Cwyco17qUWVa6OTmZMQ-qbeAN2ph7GJ-5QZIfmfE9OfyUZbkdlW3R8dHTv8L6FBIDXH7IdaQ8w5LdXRpnpTc8DZZTI7H12E_kblYw',
  notifications: {
    newCaseAssignments: true,
    aiAnalysisComplete: true,
    weeklyReports: false
  },
  twoFactorEnabled: true
};

export const initialStudentProfile: UserProfile = {
  id: 'stu-001',
  name: 'Alex Chen',
  email: 'alex.chen@meduniv.edu',
  role: 'student',
  university: 'University of Medical Sciences',
  program: 'BDS / Oral Oncology Resident',
  yearOfStudy: 'Final Year / Intern',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmJ6a9E0cntjR36kFKaNC0_ROcm-x0At9yheVgDTeKm6M_A0i_1hgl0RWsWf9u4TvlFQfeYg4MqHXSsCeKumdrWdvN1yQTjns4aidT6lEFO8by4t7EJqt-Yxo9APKo1YqHfi05bnDFkDe3QxNkMpUbM85w--5bTuWXqe-rXWFS_cjmyQIChL_9ofrXW8cT6YIauCQIPY5PaobRzauGAsdAgrBaMF3fwJwmdVbwh6-uK2GBeRcaNukJFQ',
  notifications: {
    newCaseAssignments: false,
    aiAnalysisComplete: true,
    weeklyReports: true
  },
  twoFactorEnabled: false
};

export const sampleCases: AnalysisCase[] = [
  {
    id: 'case-8942',
    caseNumber: 'OPMD-2023-8942',
    patientId: 'PT-2023-8492',
    patientName: 'John Doe',
    patientAge: 45,
    patientSex: 'Male',
    habits: ['Tobacco Smoking (10y)', 'Occasional Alcohol'],
    clinicalSite: 'Buccal Mucosa',
    symptomDuration: '3 months, asymptomatic white patch',
    date: 'Oct 24, 2023',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwsOgTSFXbBw0_tNKrrLP1amfAZ7E42Su7S94LH4SCdtwzfCtB35Nxc21GJC3I1Z1-XHpInaKBPWDmVLPLCZTN7Gz3ZLBeVDX7kJlAqntEL7njGhDkl4Mdh0kGnMI8gIe7ZMtZPor1FTtFE1CQPxxMnmFG7BYOLmpdb5ide1mxNBPyH0l-CUOw4Ovc_NlFKj-fzI7ucGguIyvJihCf2vix_gYiyvq1YFyvSvwkoQzPHlbLdtzdBBVX-w',
    status: 'Review Pending',
    priority: 'High Priority',
    primaryFinding: 'Oral Leukoplakia (OLK)',
    confidence: 94.2,
    probabilityDistribution: [
      { condition: 'OLK (Oral Leukoplakia)', code: 'OLK', percentage: 94.2, risk: 'high' },
      { condition: 'OLP (Oral Lichen Planus)', code: 'OLP', percentage: 3.8, risk: 'moderate' },
      { condition: 'OSF (Oral Submucous Fibrosis)', code: 'OSF', percentage: 1.5, risk: 'moderate' },
      { condition: 'OCA (Oral Cancer)', code: 'OCA', percentage: 0.4, risk: 'high' },
      { condition: 'Normal Mucosa', code: 'NORM', percentage: 0.1, risk: 'low' }
    ],
    gradCamRegion: { x: 48, y: 46, radius: 28, intensity: 0.95 },
    recommendedAction: 'Biopsy Recommended',
    reportType: 'Clinical Diagnostic'
  },
  {
    id: 'case-8921',
    caseNumber: 'OPMD-8921',
    patientId: 'PT-2023-8921',
    patientName: 'Ramesh Kumar',
    patientAge: 52,
    patientSex: 'Male',
    habits: ['Betel Quid / Areca Nut (15y)'],
    clinicalSite: 'Buccal Mucosa',
    symptomDuration: '6 months, restricted mouth opening',
    date: 'Oct 24, 2023',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCle6la9OJLGU3gLII8lOfRH8kfib6AExbF8OobNWPtQ5zNwmefNEWGXzouDg-u2KEM3zScyzF8Peo5ZF3Pkq6Ebs9WqAKkOWosF9TnJ3_01CtMx32jYrhC8aEYzpX_M1_2KKIHiVWtZ47xrGzsafQiCdT3BrYRkKqSv7zD4v41U6YAfDY4hW6iaMsx9mjaovtDswBPutTfAxtpXrb5BzJM22o6svOruwoE1E1LT5EVsj6lgUxmDVmDfA',
    status: 'Review Pending',
    priority: 'High Priority',
    primaryFinding: 'Oral Submucous Fibrosis (OSF)',
    confidence: 94.0,
    probabilityDistribution: [
      { condition: 'OSF (Oral Submucous Fibrosis)', code: 'OSF', percentage: 94.0, risk: 'high' },
      { condition: 'OLK (Oral Leukoplakia)', code: 'OLK', percentage: 3.5, risk: 'moderate' },
      { condition: 'OLP (Oral Lichen Planus)', code: 'OLP', percentage: 1.8, risk: 'moderate' },
      { condition: 'OCA (Oral Cancer)', code: 'OCA', percentage: 0.5, risk: 'high' },
      { condition: 'Normal Mucosa', code: 'NORM', percentage: 0.2, risk: 'low' }
    ],
    gradCamRegion: { x: 52, y: 50, radius: 30, intensity: 0.92 },
    recommendedAction: 'Biopsy Recommended',
    reportType: 'Clinical Diagnostic'
  },
  {
    id: 'case-8919',
    caseNumber: 'OPMD-8919',
    patientId: 'PT-2023-8919',
    patientName: 'Sunita Sharma',
    patientAge: 39,
    patientSex: 'Female',
    habits: ['Non-smoker', 'No Betel Quid'],
    clinicalSite: 'Lateral Tongue',
    symptomDuration: '1 month, burning sensation with spicy food',
    date: 'Oct 23, 2023',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy-_kf-Staga8A4mh65fd4PPx9ZxZ9U_N8yM3oObW-R3ZgZ5yPXmB2laBOmvYMOaN3QLDIbfZh-W2L8HGsQ6wUkZhXY053kHNCTAYT2ZtpBXO4Cy_AKcTmL_qpzOyytCd928EZ-ZxWAufiDb632yhykcUE1xdAgtcSodBbYq_1iTdiK_pZdd8aBaq9BCL_bNTDYecmVlX0GfOIE96X998t-K1q1looh2_aGRyZS5tN6iY02CT72YJ-WQ',
    status: 'Review Pending',
    priority: 'Routine Review',
    primaryFinding: 'Oral Lichen Planus (OLP)',
    confidence: 82.4,
    probabilityDistribution: [
      { condition: 'OLP (Oral Lichen Planus)', code: 'OLP', percentage: 82.4, risk: 'moderate' },
      { condition: 'OLK (Oral Leukoplakia)', code: 'OLK', percentage: 11.2, risk: 'moderate' },
      { condition: 'Normal / Benign', code: 'NORM', percentage: 4.8, risk: 'low' },
      { condition: 'Erythroplakia', code: 'ERY', percentage: 1.2, risk: 'high' },
      { condition: 'OCA (Oral Cancer)', code: 'OCA', percentage: 0.4, risk: 'high' }
    ],
    gradCamRegion: { x: 45, y: 55, radius: 24, intensity: 0.85 },
    recommendedAction: '2-Week Followup',
    reportType: 'Clinical Diagnostic'
  },
  {
    id: 'case-887',
    caseNumber: 'OP-2023-887',
    patientId: 'PT-2023-887',
    patientName: 'Marcus Vance',
    patientAge: 61,
    patientSex: 'Male',
    habits: ['Cigarette Smoking (25y)', 'Alcohol'],
    clinicalSite: 'Lateral Tongue',
    symptomDuration: '5 months, non-healing keratotic plaque',
    date: 'Oct 22, 2023',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwsOgTSFXbBw0_tNKrrLP1amfAZ7E42Su7S94LH4SCdtwzfCtB35Nxc21GJC3I1Z1-XHpInaKBPWDmVLPLCZTN7Gz3ZLBeVDX7kJlAqntEL7njGhDkl4Mdh0kGnMI8gIe7ZMtZPor1FTtFE1CQPxxMnmFG7BYOLmpdb5ide1mxNBPyH0l-CUOw4Ovc_NlFKj-fzI7ucGguIyvJihCf2vix_gYiyvq1YFyvSvwkoQzPHlbLdtzdBBVX-w',
    status: 'Completed',
    priority: 'Completed',
    primaryFinding: 'Oral Leukoplakia (OLK)',
    confidence: 88.6,
    probabilityDistribution: [
      { condition: 'OLK (Oral Leukoplakia)', code: 'OLK', percentage: 88.6, risk: 'high' },
      { condition: 'Oral Erythroplakia', code: 'ERY', percentage: 7.2, risk: 'high' },
      { condition: 'OLP (Oral Lichen Planus)', code: 'OLP', percentage: 2.8, risk: 'moderate' },
      { condition: 'OCA (Oral Cancer)', code: 'OCA', percentage: 1.0, risk: 'high' },
      { condition: 'Normal Mucosa', code: 'NORM', percentage: 0.4, risk: 'low' }
    ],
    gradCamRegion: { x: 50, y: 48, radius: 26, intensity: 0.88 },
    reviewedBy: 'Dr. Ananya Rao',
    reviewedAt: 'Oct 22, 2023',
    clinicalNotes: 'Homogeneous leukoplakia verified. Incisional biopsy scheduled to rule out dysplastic alterations.',
    recommendedAction: 'Biopsy Recommended',
    reportType: 'Clinical Diagnostic'
  },
  {
    id: 'case-8904',
    caseNumber: 'OPMD-8904',
    patientId: 'PT-2023-8904',
    patientName: 'Devi Patel',
    patientAge: 48,
    patientSex: 'Female',
    habits: ['No tobacco', 'Mild spice irritation'],
    clinicalSite: 'Hard Palate',
    symptomDuration: '2 weeks, mild redness',
    date: 'Oct 20, 2023',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy-_kf-Staga8A4mh65fd4PPx9ZxZ9U_N8yM3oObW-R3ZgZ5yPXmB2laBOmvYMOaN3QLDIbfZh-W2L8HGsQ6wUkZhXY053kHNCTAYT2ZtpBXO4Cy_AKcTmL_qpzOyytCd928EZ-ZxWAufiDb632yhykcUE1xdAgtcSodBbYq_1iTdiK_pZdd8aBaq9BCL_bNTDYecmVlX0GfOIE96X998t-K1q1looh2_aGRyZS5tN6iY02CT72YJ-WQ',
    status: 'Requires Review',
    priority: 'Low Confidence',
    primaryFinding: 'Benign / Normal Mucosa',
    confidence: 45.0,
    probabilityDistribution: [
      { condition: 'Indeterminate / Reactive Erythema', code: 'REACT', percentage: 45.0, risk: 'low' },
      { condition: 'Oral Lichen Planus (OLP)', code: 'OLP', percentage: 29.5, risk: 'moderate' },
      { condition: 'Oral Erythroplakia', code: 'ERY', percentage: 18.2, risk: 'high' },
      { condition: 'Normal Mucosa', code: 'NORM', percentage: 7.3, risk: 'low' }
    ],
    gradCamRegion: { x: 50, y: 50, radius: 22, intensity: 0.55 },
    recommendedAction: '2-Week Followup',
    reportType: 'Educational Case'
  },
  {
    id: 'case-edu-104',
    caseNumber: 'EDU-104',
    patientId: 'STUDY-MS-104',
    patientName: 'Subject M.S.',
    patientAge: 29,
    patientSex: 'Female',
    habits: ['None'],
    clinicalSite: 'Buccal Mucosa',
    symptomDuration: 'Incidental finding during routine dental checkup',
    date: 'Oct 22, 2023',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCle6la9OJLGU3gLII8lOfRH8kfib6AExbF8OobNWPtQ5zNwmefNEWGXzouDg-u2KEM3zScyzF8Peo5ZF3Pkq6Ebs9WqAKkOWosF9TnJ3_01CtMx32jYrhC8aEYzpX_M1_2KKIHiVWtZ47xrGzsafQiCdT3BrYRkKqSv7zD4v41U6YAfDY4hW6iaMsx9mjaovtDswBPutTfAxtpXrb5BzJM22o6svOruwoE1E1LT5EVsj6lgUxmDVmDfA',
    status: 'Completed',
    priority: 'Completed',
    primaryFinding: 'Benign / Normal Mucosa',
    confidence: 88.0,
    probabilityDistribution: [
      { condition: 'Benign Leukoedema', code: 'BENIGN', percentage: 88.0, risk: 'low' },
      { condition: 'Frictional Keratosis', code: 'KERAT', percentage: 9.0, risk: 'low' },
      { condition: 'Oral Leukoplakia', code: 'OLK', percentage: 3.0, risk: 'moderate' }
    ],
    gradCamRegion: { x: 50, y: 50, radius: 20, intensity: 0.6 },
    reviewedBy: 'Dr. Sarah Jenkins',
    reviewedAt: 'Oct 22, 2023',
    clinicalNotes: 'Educational study case demonstrating classic leukoedema resolving upon stretching mucosal wall.',
    recommendedAction: 'Educational Case',
    reportType: 'Educational Case'
  }
];

export const sampleStudyModules: StudyModule[] = [
  {
    id: 'mod-1',
    title: 'Introduction to OPMD',
    category: 'Core Pathway',
    description: 'A comprehensive foundational module covering the etiology, epidemiology, and clinical presentation of Oral Potentially Malignant Disorders.',
    progress: 100,
    icon: 'school',
    badge: 'Core Pathway',
    readTime: '15 min read',
    completed: true,
    sections: [
      {
        title: '1. What are Oral Potentially Malignant Disorders (OPMDs)?',
        content: 'OPMDs encompass clinical conditions that carry an elevated statistically proven risk for malignant transformation into oral squamous cell carcinoma (OSCC). As classified by the World Health Organization (WHO), key entities include Oral Leukoplakia (OLK), Oral Lichen Planus (OLP), Oral Submucous Fibrosis (OSF), and Oral Erythroplakia.',
        keyPoints: [
          'High prevalence in regions with tobacco, betel quid, and areca nut habits',
          'Early optical detection significantly improves 5-year survival rates',
          'Biopsy remains the gold standard, with AI serving as a triage aid'
        ]
      },
      {
        title: '2. High-Risk Anatomical Sites',
        content: 'Lesions occurring on the lateral and ventral borders of the tongue, floor of the mouth, and soft palate/tonsillar pillar complex carry a substantially higher risk of epithelial dysplasia and malignant conversion compared to buccal mucosa or hard palate lesions.',
        keyPoints: [
          'Lateral tongue: Highest transformation risk',
          'Floor of mouth: Thin non-keratinized epithelium permits chemical carcinogen permeation',
          'Speckled / erythroleukoplakic areas require immediate incisional biopsy'
        ]
      }
    ]
  },
  {
    id: 'mod-2',
    title: 'AI in Clinical Practice',
    category: 'AI Technology',
    description: 'Learn how to interpret diagnostic confidence scores and integrate AI screening into existing clinical workflows.',
    progress: 65,
    icon: 'memory',
    readTime: '20 min read',
    completed: false,
    sections: [
      {
        title: '1. Convolutional Neural Networks & Grad-CAM',
        content: 'OPMD-AI utilizes deep vision architectures trained on thousands of histologically confirmed intraoral photographs. Gradient-weighted Class Activation Mapping (Grad-CAM) computes gradients of the score for class c with respect to feature activation maps, highlighting the specific spatial patterns that triggered the AI inference.',
        keyPoints: [
          'Grad-CAM heatmaps highlight focal areas of keratosis or mucosal ulceration',
          'Red/amber regions indicate highest algorithmic weight',
          'Confidence scores below 70% automatically trigger secondary manual clinician review'
        ]
      }
    ]
  },
  {
    id: 'mod-3',
    title: 'Morphological Features of Leukoplakia',
    category: 'Pathology',
    description: 'Detailed visual analysis of homogenous vs non-homogenous leukoplakia and risk stratification.',
    progress: 0,
    icon: 'microbiology',
    readTime: '12 min read',
    completed: false,
    sections: [
      {
        title: '1. Homogeneous vs. Non-Homogeneous Subtypes',
        content: 'Homogeneous leukoplakia presents as uniform, flat, thin, shallowly fissured white plaques. Non-homogeneous subtypes (erythroleukoplakia, nodular, verrucous) exhibit uneven textures, reddish spots, or exophytic projections and have a 4 to 7 times higher risk of malignant progression.',
        keyPoints: [
          'Cannot be rubbed or scraped off with gauze',
          'Speckled leukoplakia warrants multi-site incisional biopsy',
          'Elimination of tobacco/irritants tested over a mandatory 2-week observation interval'
        ]
      }
    ]
  },
  {
    id: 'mod-4',
    title: 'Understanding Lichen Planus',
    category: 'Clinical Skills',
    description: 'Differentiating reticular, erosive, and plaque-like lichen planus from other mucosal lesions.',
    progress: 25,
    icon: 'coronavirus',
    readTime: '14 min read',
    completed: false,
    sections: [
      {
        title: '1. Pathognomonic Features & Wickham’s Striae',
        content: 'Oral Lichen Planus (OLP) is a chronic T-cell mediated inflammatory disease. Reticular OLP characteristically presents with lace-like white keratotic lines (Wickham’s striae) predominantly on bilateral buccal mucosa, while erosive/atrophic forms cause painful epithelial desquamation.',
        keyPoints: [
          'Bilateral and symmetrical distribution is a hallmark of OLP',
          'Erosive forms require topical corticosteroid management and close oncological surveillance',
          'Desquamative gingivitis is commonly associated with OLP and mucous membrane pemphigoid'
        ]
      }
    ]
  }
];

export const samplePresetImages = [
  {
    id: 'sample-norm',
    name: 'Normal Healthy Oral Mucosa (Category 1)',
    site: 'Buccal Mucosa',
    finding: 'Benign / Normal Mucosa',
    confidence: 96.5,
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCle6la9OJLGU3gLII8lOfRH8kfib6AExbF8OobNWPtQ5zNwmefNEWGXzouDg-u2KEM3zScyzF8Peo5ZF3Pkq6Ebs9WqAKkOWosF9TnJ3_01CtMx32jYrhC8aEYzpX_M1_2KKIHiVWtZ47xrGzsafQiCdT3BrYRkKqSv7zD4v41U6YAfDY4hW6iaMsx9mjaovtDswBPutTfAxtpXrb5BzJM22o6svOruwoE1E1LT5EVsj6lgUxmDVmDfA'
  },
  {
    id: 'sample-olk',
    name: 'Buccal Mucosa - Leukoplakia (OLK, Category 2)',
    site: 'Buccal Mucosa',
    finding: 'Oral Leukoplakia (OLK)',
    confidence: 94.2,
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwsOgTSFXbBw0_tNKrrLP1amfAZ7E42Su7S94LH4SCdtwzfCtB35Nxc21GJC3I1Z1-XHpInaKBPWDmVLPLCZTN7Gz3ZLBeVDX7kJlAqntEL7njGhDkl4Mdh0kGnMI8gIe7ZMtZPor1FTtFE1CQPxxMnmFG7BYOLmpdb5ide1mxNBPyH0l-CUOw4Ovc_NlFKj-fzI7ucGguIyvJihCf2vix_gYiyvq1YFyvSvwkoQzPHlbLdtzdBBVX-w'
  },
  {
    id: 'sample-olp',
    name: 'Lateral Tongue - Lichen Planus (OLP, Category 3)',
    site: 'Lateral Tongue',
    finding: 'Oral Lichen Planus (OLP)',
    confidence: 89.4,
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy-_kf-Staga8A4mh65fd4PPx9ZxZ9U_N8yM3oObW-R3ZgZ5yPXmB2laBOmvYMOaN3QLDIbfZh-W2L8HGsQ6wUkZhXY053kHNCTAYT2ZtpBXO4Cy_AKcTmL_qpzOyytCd928EZ-ZxWAufiDb632yhykcUE1xdAgtcSodBbYq_1iTdiK_pZdd8aBaq9BCL_bNTDYecmVlX0GfOIE96X998t-K1q1looh2_aGRyZS5tN6iY02CT72YJ-WQ'
  },
  {
    id: 'sample-osf',
    name: 'Palatal Mucosa - Submucous Fibrosis (OSF, Category 4)',
    site: 'Soft Palate',
    finding: 'Oral Submucous Fibrosis (OSF)',
    confidence: 94.0,
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCle6la9OJLGU3gLII8lOfRH8kfib6AExbF8OobNWPtQ5zNwmefNEWGXzouDg-u2KEM3zScyzF8Peo5ZF3Pkq6Ebs9WqAKkOWosF9TnJ3_01CtMx32jYrhC8aEYzpX_M1_2KKIHiVWtZ47xrGzsafQiCdT3BrYRkKqSv7zD4v41U6YAfDY4hW6iaMsx9mjaovtDswBPutTfAxtpXrb5BzJM22o6svOruwoE1E1LT5EVsj6lgUxmDVmDfA'
  }
];
