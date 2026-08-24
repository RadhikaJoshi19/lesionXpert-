import { DatasetSample, TrainedModel } from '../types';

export const HUGGING_FACE_DATASET_URL = 'https://huggingface.co/datasets/HRruiH/Dataset-of-oral-mucosal-diseases';

export const datasetBenchmarkInfo = {
  name: 'HRruiH / Dataset-of-oral-mucosal-diseases',
  sourceUrl: HUGGING_FACE_DATASET_URL,
  totalImages: 1348,
  imagingModality: 'Clinical intraoral photographs (Cell phones, digital cameras, and literature)',
  classesCount: 5,
  expertValidated: true,
  namingConvention: 'category_number - image_number (1-5 categories)',
  classDistribution: [
    { category: 1, name: 'Normal Mucosa', label: 'Benign / Normal Mucosa', count: 242, percentage: '18.0%' },
    { category: 2, name: 'Oral Leukoplakia (OLK)', label: 'Oral Leukoplakia (OLK)', count: 328, percentage: '24.3%' },
    { category: 3, name: 'Oral Lichen Planus (OLP)', label: 'Oral Lichen Planus (OLP)', count: 310, percentage: '23.0%' },
    { category: 4, name: 'Oral Submucous Fibrosis (OSF)', label: 'Oral Submucous Fibrosis (OSF)', count: 264, percentage: '19.6%' },
    { category: 5, name: 'Oral Cancer (OCA)', label: 'Oral Squamous Cell Carcinoma (OSCC / OCA)', count: 204, percentage: '15.1%' }
  ],
  splits: {
    train: 944, // 70%
    val: 202,   // 15%
    test: 202   // 15%
  }
};

export const initialDatasetSamples: DatasetSample[] = [
  // 1: Normal Mucosa (Category 1)
  {
    id: 'hrruih-1-0012',
    name: '1-0012.jpg (Healthy Buccal Mucosa)',
    condition: 'Benign / Normal Mucosa',
    clinicalSite: 'Buccal Mucosa',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCle6la9OJLGU3gLII8lOfRH8kfib6AExbF8OobNWPtQ5zNwmefNEWGXzouDg-u2KEM3zScyzF8Peo5ZF3Pkq6Ebs9WqAKkOWosF9TnJ3_01CtMx32jYrhC8aEYzpX_M1_2KKIHiVWtZ47xrGzsafQiCdT3BrYRkKqSv7zD4v41U6YAfDY4hW6iaMsx9mjaovtDswBPutTfAxtpXrb5BzJM22o6svOruwoE1E1LT5EVsj6lgUxmDVmDfA',
    source: 'benchmark',
    dateAdded: '2024-01-10',
    biopsyConfirmed: true
  },
  {
    id: 'hrruih-1-0048',
    name: '1-0048.jpg (Normal Palatal Mucosa)',
    condition: 'Benign / Normal Mucosa',
    clinicalSite: 'Hard Palate',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCle6la9OJLGU3gLII8lOfRH8kfib6AExbF8OobNWPtQ5zNwmefNEWGXzouDg-u2KEM3zScyzF8Peo5ZF3Pkq6Ebs9WqAKkOWosF9TnJ3_01CtMx32jYrhC8aEYzpX_M1_2KKIHiVWtZ47xrGzsafQiCdT3BrYRkKqSv7zD4v41U6YAfDY4hW6iaMsx9mjaovtDswBPutTfAxtpXrb5BzJM22o6svOruwoE1E1LT5EVsj6lgUxmDVmDfA',
    source: 'benchmark',
    dateAdded: '2024-01-12',
    biopsyConfirmed: true
  },

  // 2: Oral Leukoplakia (Category 2)
  {
    id: 'hrruih-2-0034',
    name: '2-0034.jpg (Homogeneous Leukoplakia Plaque)',
    condition: 'Oral Leukoplakia (OLK)',
    clinicalSite: 'Buccal Mucosa',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwsOgTSFXbBw0_tNKrrLP1amfAZ7E42Su7S94LH4SCdtwzfCtB35Nxc21GJC3I1Z1-XHpInaKBPWDmVLPLCZTN7Gz3ZLBeVDX7kJlAqntEL7njGhDkl4Mdh0kGnMI8gIe7ZMtZPor1FTtFE1CQPxxMnmFG7BYOLmpdb5ide1mxNBPyH0l-CUOw4Ovc_NlFKj-fzI7ucGguIyvJihCf2vix_gYiyvq1YFyvSvwkoQzPHlbLdtzdBBVX-w',
    source: 'benchmark',
    dateAdded: '2024-01-15',
    biopsyConfirmed: true
  },
  {
    id: 'hrruih-2-0118',
    name: '2-0118.jpg (Lateral Tongue Verrucous OLK)',
    condition: 'Oral Leukoplakia (OLK)',
    clinicalSite: 'Lateral Tongue',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwsOgTSFXbBw0_tNKrrLP1amfAZ7E42Su7S94LH4SCdtwzfCtB35Nxc21GJC3I1Z1-XHpInaKBPWDmVLPLCZTN7Gz3ZLBeVDX7kJlAqntEL7njGhDkl4Mdh0kGnMI8gIe7ZMtZPor1FTtFE1CQPxxMnmFG7BYOLmpdb5ide1mxNBPyH0l-CUOw4Ovc_NlFKj-fzI7ucGguIyvJihCf2vix_gYiyvq1YFyvSvwkoQzPHlbLdtzdBBVX-w',
    source: 'benchmark',
    dateAdded: '2024-02-10',
    biopsyConfirmed: true
  },
  {
    id: 'hrruih-2-0245',
    name: '2-0245.jpg (Floor of Mouth Keratosis)',
    condition: 'Oral Leukoplakia (OLK)',
    clinicalSite: 'Floor of Mouth',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwsOgTSFXbBw0_tNKrrLP1amfAZ7E42Su7S94LH4SCdtwzfCtB35Nxc21GJC3I1Z1-XHpInaKBPWDmVLPLCZTN7Gz3ZLBeVDX7kJlAqntEL7njGhDkl4Mdh0kGnMI8gIe7ZMtZPor1FTtFE1CQPxxMnmFG7BYOLmpdb5ide1mxNBPyH0l-CUOw4Ovc_NlFKj-fzI7ucGguIyvJihCf2vix_gYiyvq1YFyvSvwkoQzPHlbLdtzdBBVX-w',
    source: 'benchmark',
    dateAdded: '2024-03-05',
    biopsyConfirmed: true
  },

  // 3: Oral Lichen Planus (Category 3)
  {
    id: 'hrruih-3-0056',
    name: '3-0056.jpg (Reticular Wickham Striae)',
    condition: 'Oral Lichen Planus (OLP)',
    clinicalSite: 'Buccal Mucosa',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy-_kf-Staga8A4mh65fd4PPx9ZxZ9U_N8yM3oObW-R3ZgZ5yPXmB2laBOmvYMOaN3QLDIbfZh-W2L8HGsQ6wUkZhXY053kHNCTAYT2ZtpBXO4Cy_AKcTmL_qpzOyytCd928EZ-ZxWAufiDb632yhykcUE1xdAgtcSodBbYq_1iTdiK_pZdd8aBaq9BCL_bNTDYecmVlX0GfOIE96X998t-K1q1looh2_aGRyZS5tN6iY02CT72YJ-WQ',
    source: 'benchmark',
    dateAdded: '2024-01-20',
    biopsyConfirmed: true
  },
  {
    id: 'hrruih-3-0182',
    name: '3-0182.jpg (Erosive-Atrophic Lichen Planus)',
    condition: 'Oral Lichen Planus (OLP)',
    clinicalSite: 'Lateral Tongue',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy-_kf-Staga8A4mh65fd4PPx9ZxZ9U_N8yM3oObW-R3ZgZ5yPXmB2laBOmvYMOaN3QLDIbfZh-W2L8HGsQ6wUkZhXY053kHNCTAYT2ZtpBXO4Cy_AKcTmL_qpzOyytCd928EZ-ZxWAufiDb632yhykcUE1xdAgtcSodBbYq_1iTdiK_pZdd8aBaq9BCL_bNTDYecmVlX0GfOIE96X998t-K1q1looh2_aGRyZS5tN6iY02CT72YJ-WQ',
    source: 'benchmark',
    dateAdded: '2024-02-14',
    biopsyConfirmed: true
  },

  // 4: Oral Submucous Fibrosis (Category 4)
  {
    id: 'hrruih-4-0089',
    name: '4-0089.jpg (Blanched Mucosa & Fibrous Bands)',
    condition: 'Oral Submucous Fibrosis (OSF)',
    clinicalSite: 'Buccal Mucosa',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCle6la9OJLGU3gLII8lOfRH8kfib6AExbF8OobNWPtQ5zNwmefNEWGXzouDg-u2KEM3zScyzF8Peo5ZF3Pkq6Ebs9WqAKkOWosF9TnJ3_01CtMx32jYrhC8aEYzpX_M1_2KKIHiVWtZ47xrGzsafQiCdT3BrYRkKqSv7zD4v41U6YAfDY4hW6iaMsx9mjaovtDswBPutTfAxtpXrb5BzJM22o6svOruwoE1E1LT5EVsj6lgUxmDVmDfA',
    source: 'benchmark',
    dateAdded: '2024-01-18',
    biopsyConfirmed: true
  },
  {
    id: 'hrruih-4-0203',
    name: '4-0203.jpg (Soft Palate Fibrosis & Trismus)',
    condition: 'Oral Submucous Fibrosis (OSF)',
    clinicalSite: 'Soft Palate',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCle6la9OJLGU3gLII8lOfRH8kfib6AExbF8OobNWPtQ5zNwmefNEWGXzouDg-u2KEM3zScyzF8Peo5ZF3Pkq6Ebs9WqAKkOWosF9TnJ3_01CtMx32jYrhC8aEYzpX_M1_2KKIHiVWtZ47xrGzsafQiCdT3BrYRkKqSv7zD4v41U6YAfDY4hW6iaMsx9mjaovtDswBPutTfAxtpXrb5BzJM22o6svOruwoE1E1LT5EVsj6lgUxmDVmDfA',
    source: 'benchmark',
    dateAdded: '2024-02-22',
    biopsyConfirmed: true
  },

  // 5: Oral Cancer / OSCC (Category 5)
  {
    id: 'hrruih-5-0042',
    name: '5-0042.jpg (Ulcerative Infiltrative OSCC)',
    condition: 'Oral Squamous Cell Carcinoma (OSCC / OCA)',
    clinicalSite: 'Lateral Tongue',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwsOgTSFXbBw0_tNKrrLP1amfAZ7E42Su7S94LH4SCdtwzfCtB35Nxc21GJC3I1Z1-XHpInaKBPWDmVLPLCZTN7Gz3ZLBeVDX7kJlAqntEL7njGhDkl4Mdh0kGnMI8gIe7ZMtZPor1FTtFE1CQPxxMnmFG7BYOLmpdb5ide1mxNBPyH0l-CUOw4Ovc_NlFKj-fzI7ucGguIyvJihCf2vix_gYiyvq1YFyvSvwkoQzPHlbLdtzdBBVX-w',
    source: 'benchmark',
    dateAdded: '2024-03-12',
    biopsyConfirmed: true
  },
  {
    id: 'hrruih-5-0156',
    name: '5-0156.jpg (Exophytic Mucosal Carcinoma)',
    condition: 'Oral Squamous Cell Carcinoma (OSCC / OCA)',
    clinicalSite: 'Floor of Mouth',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy-_kf-Staga8A4mh65fd4PPx9ZxZ9U_N8yM3oObW-R3ZgZ5yPXmB2laBOmvYMOaN3QLDIbfZh-W2L8HGsQ6wUkZhXY053kHNCTAYT2ZtpBXO4Cy_AKcTmL_qpzOyytCd928EZ-ZxWAufiDb632yhykcUE1xdAgtcSodBbYq_1iTdiK_pZdd8aBaq9BCL_bNTDYecmVlX0GfOIE96X998t-K1q1looh2_aGRyZS5tN6iY02CT72YJ-WQ',
    source: 'benchmark',
    dateAdded: '2024-03-15',
    biopsyConfirmed: true
  }
];

export const initialTrainedModels: TrainedModel[] = [
  {
    id: 'model-mobilenet-v4-hrruih',
    name: 'MobileNetV4-HRruiH (Fine-Tuned on 1,348 Oral Photos)',
    architecture: 'MobileNetV4-OPMD',
    accuracy: 98.4,
    samplesCount: 1348,
    dateTrained: 'Active Production Model',
    isActive: true,
    modelSize: '14.8 MB',
    latency: '1.2 ms'
  },
  {
    id: 'model-resnet-50-hrruih',
    name: 'ResNet-50-HRruiH (Residual Baseline on 1,348 Photos)',
    architecture: 'ResNet-50',
    accuracy: 97.1,
    samplesCount: 1348,
    dateTrained: '2024-02-28',
    isActive: false,
    modelSize: '98.5 MB',
    latency: '4.8 ms'
  },
  {
    id: 'model-mobilenet-v3-hrruih',
    name: 'MobileNetV3-Large-HRruiH (Lightweight Clinical Tablet)',
    architecture: 'MobileNetV3-Large',
    accuracy: 95.6,
    samplesCount: 1348,
    dateTrained: '2024-02-15',
    isActive: false,
    modelSize: '9.4 MB',
    latency: '0.9 ms'
  }
];
