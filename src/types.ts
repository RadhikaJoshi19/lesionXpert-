export type UserRole = 'doctor' | 'student';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clinicalRole?: string;
  institution?: string;
  professionalId?: string;
  specialty?: string;
  university?: string;
  program?: string;
  yearOfStudy?: string;
  avatarUrl: string;
  notifications: {
    newCaseAssignments: boolean;
    aiAnalysisComplete: boolean;
    weeklyReports: boolean;
  };
  twoFactorEnabled: boolean;
}

export type OpmdCondition = 
  | 'Oral Leukoplakia (OLK)'
  | 'Oral Lichen Planus (OLP)'
  | 'Oral Submucous Fibrosis (OSF)'
  | 'Oral Erythroplakia'
  | 'Oral Squamous Cell Carcinoma (OSCC / OCA)'
  | 'Benign / Normal Mucosa';

export type PriorityLevel = 'High Priority' | 'Routine Review' | 'Low Confidence' | 'Completed';

export type ModelArchitecture = 
  | 'MobileNetV4-OPMD'
  | 'MobileNetV3-Large'
  | 'MobileNet-Custom'
  | 'ResNet-50'
  | 'EfficientNet-B0';

export interface DatasetSample {
  id: string;
  name: string;
  condition: OpmdCondition;
  clinicalSite: string;
  imageUrl: string;
  source: 'uploaded' | 'benchmark';
  dateAdded: string;
  biopsyConfirmed?: boolean;
}

export interface TrainingConfig {
  architecture: ModelArchitecture;
  epochs: number;
  batchSize: number;
  learningRate: number;
  optimizer: 'AdamW' | 'SGD' | 'RMSprop';
  augmentations: {
    clahe: boolean;
    rotation: boolean;
    flip: boolean;
    colorJitter: boolean;
  };
  trainSplit: number; // e.g. 75 (%)
}

export interface EpochMetric {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  trainAcc: number;
  valAcc: number;
}

export interface TrainingResult {
  modelId: string;
  modelName: string;
  architecture: ModelArchitecture;
  accuracy: number;
  sensitivity: number;
  specificity: number;
  f1Score: number;
  latencyMs: number;
  modelSizeMb: number;
  totalSamples: number;
  trainedAt: string;
  history: EpochMetric[];
  confusionMatrix: {
    classes: string[];
    matrix: number[][]; // [row=actual, col=predicted]
  };
}

export interface TrainedModel {
  id: string;
  name: string;
  architecture: ModelArchitecture;
  accuracy: number;
  samplesCount: number;
  dateTrained: string;
  isActive: boolean;
  modelSize: string;
  latency: string;
}

export interface AnalysisCase {
  id: string;
  caseNumber: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientSex: 'Male' | 'Female' | 'Other';
  habits: string[];
  clinicalSite: 'Buccal Mucosa' | 'Lateral Tongue' | 'Floor of Mouth' | 'Hard Palate' | 'Soft Palate' | 'Labial Mucosa' | 'Gingiva';
  symptomDuration: string;
  date: string;
  imageUrl: string;
  status: 'Review Pending' | 'Completed' | 'Requires Review';
  priority: PriorityLevel;
  primaryFinding: OpmdCondition;
  confidence: number;
  modelUsed?: string;
  probabilityDistribution: {
    condition: string;
    code: string;
    percentage: number;
    risk: 'high' | 'moderate' | 'low';
  }[];
  gradCamRegion: {
    x: number; // %
    y: number; // %
    radius: number; // %
    intensity: number;
  };
  clinicalNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  recommendedAction?: 'Biopsy Recommended' | 'Surgical Referral' | '2-Week Followup' | 'Routine Monitoring' | 'Educational Case';
  reportType: 'Clinical Diagnostic' | 'Educational Case';
}

export interface StudyModule {
  id: string;
  title: string;
  category: 'Core Pathway' | 'AI Technology' | 'Pathology' | 'Clinical Skills';
  description: string;
  progress: number;
  icon: string;
  badge?: string;
  readTime: string;
  completed: boolean;
  sections: {
    title: string;
    content: string;
    keyPoints?: string[];
  }[];
}
