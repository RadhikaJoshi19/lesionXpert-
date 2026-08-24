import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { authDb, DbUserRecord } from './src/services/authDatabase';
import { sendPasswordResetEmail } from './src/services/emailService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extended Express Request with Authenticated User
export interface AuthenticatedRequest extends Request {
  user?: DbUserRecord;
  sessionToken?: string;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser and Cookie Parser
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ extended: true, limit: '30mb' }));
  app.use(cookieParser(process.env.SESSION_SECRET || 'lesionxpert-secret-2026'));

  // Session Token Extractor Middleware
  const extractUserSession = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies && req.cookies.lesionxpert_session) {
      token = req.cookies.lesionxpert_session;
    }

    if (token) {
      const user = authDb.validateSession(token);
      if (user && user.status === 'active') {
        req.user = user;
        req.sessionToken = token;
      }
    }
    next();
  };

  app.use(extractUserSession);

  // RBAC Middleware: Require Authentication
  const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in to access this clinical resource.'
      });
    }
    if (req.user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Your account is currently unavailable. Please contact the administrator.'
      });
    }
    next();
  };

  // RBAC Middleware: Require Doctor Role
  const requireDoctor = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }
    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        error: 'Access restricted to authorized Doctor / Specialist accounts only.'
      });
    }
    next();
  };

  // RBAC Middleware: Require Dental Student Role
  const requireStudent = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Access restricted to Dental Student / Resident accounts only.'
      });
    }
    next();
  };

  // Password validation helper
  const validatePasswordStrength = (pass: string): { valid: boolean; error?: string } => {
    if (!pass || pass.length < 8) {
      return { valid: false, error: 'Password must contain at least 8 characters.' };
    }
    if (!/[A-Z]/.test(pass)) {
      return { valid: false, error: 'Password must contain at least one uppercase letter.' };
    }
    if (!/[a-z]/.test(pass)) {
      return { valid: false, error: 'Password must contain at least one lowercase letter.' };
    }
    if (!/[0-9]/.test(pass)) {
      return { valid: false, error: 'Password must contain at least one number.' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) {
      return { valid: false, error: 'Password must contain at least one special character.' };
    }
    return { valid: true };
  };

  // Email format validator
  const validateEmailFormat = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // ========================================================
  // AUTHENTICATION ROUTES (NO PATIENT ROLE ALLOWED)
  // ========================================================

  // POST /api/auth/register
  app.post('/api/auth/register', async (req, res) => {
    try {
      const {
        fullName,
        email,
        password,
        confirmPassword,
        role,
        institution,
        professionalId,
        specialty,
        university,
        program,
        yearOfStudy
      } = req.body;

      if (!fullName || !fullName.trim()) {
        return res.status(400).json({ success: false, error: 'Full Name is required.' });
      }

      if (!email || !validateEmailFormat(email)) {
        return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
      }

      if (role !== 'doctor' && role !== 'student') {
        return res.status(400).json({
          success: false,
          error: 'Invalid account role. LesionXpert AI supports Doctor and Dental Student accounts only.'
        });
      }

      const passCheck = validatePasswordStrength(password);
      if (!passCheck.valid) {
        return res.status(400).json({ success: false, error: passCheck.error });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ success: false, error: 'Passwords do not match.' });
      }

      // Execute registration with bcrypt hash
      const result = await authDb.registerUser({
        fullName,
        email,
        password,
        role,
        institution,
        professionalId,
        specialty,
        university,
        program,
        yearOfStudy
      });

      if (result.error || !result.user) {
        return res.status(result.statusCode || 400).json({
          success: false,
          error: result.error || 'Registration failed.'
        });
      }

      // Create session
      const sessionToken = authDb.createSession(result.user.id);
      res.cookie('lesionxpert_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      const userProfile = authDb.toUserProfile(result.user);
      return res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        token: sessionToken,
        user: userProfile
      });
    } catch (err: any) {
      console.error('[AUTH REGISTER ERROR]:', err);
      return res.status(500).json({
        success: false,
        error: 'Unable to complete registration. Please try again.'
      });
    }
  });

  // POST /api/auth/login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Please enter both email address and password.'
        });
      }

      const user = authDb.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Unable to sign in. Please check your credentials and try again.'
        });
      }

      // Check account status
      if (user.status === 'inactive' || user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          error: 'Your account is currently unavailable. Please contact the administrator.'
        });
      }

      // Verify bcrypt password hash
      const isValidPassword = await authDb.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Unable to sign in. Please check your credentials and try again.'
        });
      }

      // Ensure no patient role has slipped through
      if (user.role !== 'doctor' && user.role !== 'student') {
        return res.status(403).json({
          success: false,
          error: 'Invalid clinical role. Access denied.'
        });
      }

      // Create session
      const sessionToken = authDb.createSession(user.id);
      res.cookie('lesionxpert_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      const userProfile = authDb.toUserProfile(user);
      return res.json({
        success: true,
        message: 'Authentication successful.',
        token: sessionToken,
        user: userProfile
      });
    } catch (err: any) {
      console.error('[AUTH LOGIN ERROR]:', err);
      return res.status(500).json({
        success: false,
        error: 'Authentication failed due to server error. Please try again.'
      });
    }
  });

  // POST /api/auth/logout
  app.post('/api/auth/logout', (req: AuthenticatedRequest, res: Response) => {
    if (req.sessionToken) {
      authDb.destroySession(req.sessionToken);
    }
    res.clearCookie('lesionxpert_session');
    return res.json({ success: true, message: 'Signed out successfully.' });
  });

  // GET /api/auth/me
  app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, authenticated: false });
    }
    return res.json({
      success: true,
      authenticated: true,
      user: authDb.toUserProfile(req.user)
    });
  });

  // POST /api/auth/forgot-password
  app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email || !validateEmailFormat(email)) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid email address.'
        });
      }

      const user = authDb.getUserByEmail(email);
      let devResetUrl: string | undefined;

      // Only generate token if user exists, but ALWAYS return the same generic message
      if (user && user.status === 'active') {
        const token = authDb.createPasswordResetToken(user.email);
        if (token) {
          const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
          const result = await sendPasswordResetEmail(user.email, user.full_name, token, appUrl);
          devResetUrl = result.devResetUrl;
        }
      }

      return res.json({
        success: true,
        message: 'If an account exists for this email, password reset instructions have been sent.',
        devResetUrl // safely available in dev testing
      });
    } catch (err: any) {
      console.error('[AUTH FORGOT PASSWORD ERROR]:', err);
      return res.status(500).json({
        success: false,
        error: 'Unable to process reset request.'
      });
    }
  });

  // POST /api/auth/verify-reset-token
  app.post('/api/auth/verify-reset-token', (req: Request, res: Response) => {
    const { token } = req.body;
    const result = authDb.verifyResetToken(token);
    if (!result.valid) {
      return res.status(400).json({
        valid: false,
        error: result.reason || 'Invalid or expired reset token.'
      });
    }
    return res.json({
      valid: true,
      email: result.email
    });
  });

  // POST /api/auth/reset-password
  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    try {
      const { token, newPassword, confirmPassword } = req.body;

      if (!token) {
        return res.status(400).json({ success: false, error: 'Reset token is required.' });
      }

      const passCheck = validatePasswordStrength(newPassword);
      if (!passCheck.valid) {
        return res.status(400).json({ success: false, error: passCheck.error });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, error: 'Passwords do not match.' });
      }

      const result = await authDb.resetPassword(token, newPassword);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error || 'Password reset failed.'
        });
      }

      return res.json({
        success: true,
        message: 'Your password has been successfully reset. Please sign in with your new credentials.'
      });
    } catch (err: any) {
      console.error('[AUTH RESET PASSWORD ERROR]:', err);
      return res.status(500).json({
        success: false,
        error: 'Unable to reset password due to server error.'
      });
    }
  });

  // POST /api/auth/change-password (Authenticated)
  app.post('/api/auth/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;
      const user = req.user!;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'All password fields are required.' });
      }

      const passCheck = validatePasswordStrength(newPassword);
      if (!passCheck.valid) {
        return res.status(400).json({ success: false, error: passCheck.error });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, error: 'New passwords do not match.' });
      }

      const result = await authDb.changePassword(user.id, currentPassword, newPassword);
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }

      return res.json({
        success: true,
        message: 'Password updated successfully.'
      });
    } catch (err: any) {
      console.error('[AUTH CHANGE PASSWORD ERROR]:', err);
      return res.status(500).json({ success: false, error: 'Unable to update password.' });
    }
  });

  // PUT /api/auth/profile (Authenticated)
  app.put('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const updates = req.body;

      const updated = authDb.updateProfile(user.id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'User profile not found.' });
      }

      return res.json({
        success: true,
        message: 'Profile updated successfully.',
        user: authDb.toUserProfile(updated)
      });
    } catch (err: any) {
      console.error('[AUTH PROFILE UPDATE ERROR]:', err);
      return res.status(500).json({ success: false, error: 'Unable to update profile.' });
    }
  });

  // ========================================================
  // ROLE-PROTECTED API ROUTES
  // ========================================================

  // Doctor-Only Route Example: Clinical Review Queue & High Risk Cases
  app.get('/api/doctor/dashboard-summary', requireDoctor, (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      role: 'doctor',
      doctorId: req.user!.id,
      doctorName: req.user!.full_name,
      pendingBiopsies: 3,
      urgentReviews: 2,
      lastAudit: new Date().toISOString()
    });
  });

  // Dental Student-Only Route Example: Study Center & Academic Mastery
  app.get('/api/student/study-summary', requireStudent, (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      role: 'student',
      studentId: req.user!.id,
      studentName: req.user!.full_name,
      completedModules: 2,
      quizScoreAverage: 92.5,
      studyStreakDays: 5
    });
  });

  // Initialize Gemini AI Client lazy singleton
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    if (!aiClient) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
    return aiClient;
  }

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'LesionXpert AI',
      activeModel: activeTrainedModel,
      serverTime: new Date().toISOString()
    });
  });

  // Active Model State
  let activeTrainedModel: 'mobilenet' | 'resnet' = (process.env.ACTIVE_MODEL as any) || 'mobilenet';

  // GET /api/models - Lists available models, versions, and training status
  app.get('/api/models', (_req, res) => {
    const modelsList = [
      {
        id: 'mobilenet',
        architecture: 'MobileNetV2',
        version: 'mobilenetv2_v1',
        inputSize: '224x224x3',
        numClasses: 7,
        isActive: activeTrainedModel === 'mobilenet',
        isAvailable: fs.existsSync(path.join(process.cwd(), 'models/mobilenet/mobilenet_v1.keras')),
        weightsPath: 'models/mobilenet/mobilenet_v1.keras',
        metadata: fs.existsSync(path.join(process.cwd(), 'models/mobilenet/metadata.json'))
          ? JSON.parse(fs.readFileSync(path.join(process.cwd(), 'models/mobilenet/metadata.json'), 'utf-8'))
          : null
      },
      {
        id: 'resnet',
        architecture: 'ResNet50',
        version: 'resnet50_v1',
        inputSize: '224x224x3',
        numClasses: 7,
        isActive: activeTrainedModel === 'resnet',
        isAvailable: fs.existsSync(path.join(process.cwd(), 'models/resnet/resnet_v1.keras')),
        weightsPath: 'models/resnet/resnet_v1.keras',
        metadata: fs.existsSync(path.join(process.cwd(), 'models/resnet/metadata.json'))
          ? JSON.parse(fs.readFileSync(path.join(process.cwd(), 'models/resnet/metadata.json'), 'utf-8'))
          : null
      }
    ];

    res.json({
      success: true,
      activeModel: activeTrainedModel,
      models: modelsList
    });
  });

  // POST /api/models/select - Switches active model without modifying frontend code
  app.post('/api/models/select', (req, res) => {
    const { model } = req.body;
    if (!model) {
      return res.status(400).json({ success: false, error: 'Model identifier required ("mobilenet" or "resnet").' });
    }

    const normalized = model.toLowerCase().includes('resnet') ? 'resnet' : 'mobilenet';
    activeTrainedModel = normalized;

    const weightsPath = path.join(process.cwd(), `models/${normalized}/${normalized}_v1.keras`);
    const isAvailable = fs.existsSync(weightsPath);

    return res.json({
      success: true,
      message: `Active model switched to ${normalized === 'mobilenet' ? 'MobileNetV2' : 'ResNet50'}`,
      activeModel: activeTrainedModel,
      isAvailable
    });
  });

  // GET /api/analytics/dataset-report
  app.get('/api/analytics/dataset-report', (_req, res) => {
    const reportPath = path.join(process.cwd(), 'reports/dataset_report.json');
    if (fs.existsSync(reportPath)) {
      const data = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
      return res.json({ success: true, available: true, data });
    }
    return res.json({
      success: true,
      available: false,
      message: 'Dataset audit report not generated yet. Run: python ml/dataset_inspector.py'
    });
  });

  // GET /api/analytics/model-comparison
  app.get('/api/analytics/model-comparison', (_req, res) => {
    const compPath = path.join(process.cwd(), 'reports/model_comparison.csv');
    if (fs.existsSync(compPath)) {
      const content = fs.readFileSync(compPath, 'utf-8');
      const lines = content.trim().split('\n');
      const headers = lines[0].split(',');
      const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h.trim()] = values[i]?.trim();
        });
        return obj;
      });
      return res.json({ success: true, available: true, comparison: rows });
    }
    return res.json({
      success: true,
      available: false,
      comparison: [],
      message: 'Model comparison not available yet. Train both models and run: python ml/compare_models.py'
    });
  });

  // GET /api/analytics/per-class
  app.get('/api/analytics/per-class', (_req, res) => {
    const metricsPath = path.join(process.cwd(), 'reports/per_class_metrics.csv');
    if (fs.existsSync(metricsPath)) {
      const content = fs.readFileSync(metricsPath, 'utf-8');
      const lines = content.trim().split('\n');
      const headers = lines[0].split(',');
      const rows = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => {
          obj[h.trim()] = values[i]?.trim();
        });
        return obj;
      });
      return res.json({ success: true, available: true, metrics: rows });
    }
    return res.json({
      success: true,
      available: false,
      metrics: [],
      message: 'Per-class metrics not available yet. Run: python ml/evaluate.py'
    });
  });

  // POST /api/predict - Unified Prediction Endpoint connected to real ML pipeline
  app.post('/api/predict', async (req, res) => {
    try {
      const {
        imageUrl,
        modelName,
        clinicalSite = 'Buccal Mucosa',
        habits = [],
        symptomDuration = '',
        patientAge = 45,
        patientSex = 'Male'
      } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ success: false, error: 'Missing image input parameter (imageUrl).' });
      }

      const targetModel = (modelName || activeTrainedModel).toLowerCase().includes('resnet') ? 'resnet' : 'mobilenet';
      const weightsPath = path.join(process.cwd(), `models/${targetModel}/${targetModel}_v1.keras`);

      // Check if trained model weights exist
      if (!fs.existsSync(weightsPath)) {
        return res.status(404).json({
          success: false,
          error: 'Selected model is not currently available.',
          targetModel: targetModel === 'mobilenet' ? 'MobileNetV2' : 'ResNet50',
          help: `To train this model on mouth_data, execute: python ml/train.py --model ${targetModel}`
        });
      }

      // Save input image to temp file for Python inference
      const tempDir = path.join(process.cwd(), 'reports', 'temp_inferences');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const tempImgPath = path.join(tempDir, `infer_${Date.now()}.jpg`);

      if (imageUrl.startsWith('data:')) {
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(tempImgPath, Buffer.from(base64Data, 'base64'));
      } else if (fs.existsSync(imageUrl)) {
        fs.copyFileSync(imageUrl, tempImgPath);
      } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        const fetchRes = await fetch(imageUrl);
        const buffer = Buffer.from(await fetchRes.arrayBuffer());
        fs.writeFileSync(tempImgPath, buffer);
      } else {
        return res.status(400).json({ success: false, error: 'Invalid or inaccessible image input.' });
      }

      // Execute Python prediction tool
      const { execFile } = await import('child_process');
      const { promisify } = await import('util');
      const execFileAsync = promisify(execFile);

      try {
        const { stdout, stderr } = await execFileAsync('python', [
          path.join(process.cwd(), 'predict.py'),
          tempImgPath,
          '--model',
          targetModel,
          '--json'
        ], { timeout: 30000 });

        // Clean up temp file
        try { fs.unlinkSync(tempImgPath); } catch (_) {}

        const parsedResult = JSON.parse(stdout.trim());
        return res.json(parsedResult);
      } catch (pyErr: any) {
        try { fs.unlinkSync(tempImgPath); } catch (_) {}
        console.error('[PYTHON INFERENCE ERROR]:', pyErr?.stderr || pyErr?.message || pyErr);
        return res.status(500).json({
          success: false,
          error: `Inference execution error: ${pyErr?.message || 'Python subprocess error'}`
        });
      }
    } catch (err: any) {
      console.error('[API PREDICT ERROR]:', err);
      return res.status(500).json({ success: false, error: 'Inference processing error.' });
    }
  });

  // Helper for resilient Gemini API calls with backoff and candidate model fallback
  async function generateContentWithFallback(ai: GoogleGenAI, requestPayload: any): Promise<any> {
    const candidateModels = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let lastError: any = null;

    for (const model of candidateModels) {
      // Try up to 2 attempts per candidate model with backoff
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            ...requestPayload,
            model
          });
          if (response && response.text) {
            return response;
          }
        } catch (err: any) {
          lastError = err;
          const status = err?.status || err?.code || (err?.error && err.error.code);
          const isTransient = status === 503 || status === 429 || status === 500 || err?.message?.includes('high demand') || err?.message?.includes('UNAVAILABLE') || err?.message?.includes('Resource exhausted');
          
          console.warn(`[GEMINI ANALYSIS] Attempt ${attempt} failed on model ${model} (status: ${status || 'unknown'}):`, err?.message || err);
          
          if (isTransient && attempt < 2) {
            // Wait with backoff before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt + Math.floor(Math.random() * 300)));
            continue;
          }
          // If transient and finished attempts for this model, break inner loop to try next candidate model
          if (isTransient) {
            break;
          } else {
            // Non-transient error (e.g. invalid request format), throw directly
            throw err;
          }
        }
      }
    }
    throw lastError || new Error('All model candidates failed or are unavailable');
  }

  // POST /api/analyze-lesion
  app.post('/api/analyze-lesion', async (req, res) => {
    try {
      const {
        imageUrl,
        clinicalSite = 'Buccal Mucosa',
        habits = [],
        symptomDuration = '',
        patientAge = 45,
        patientSex = 'Male',
        modelArchitecture = 'MobileNetV4-OPMD'
      } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ error: 'Missing imageUrl parameter' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        // Return fallback indicator so client can run localized feature extractor
        return res.json({ fallbackRequired: true, reason: 'GEMINI_API_KEY not configured' });
      }

      // Format image for Gemini
      let imagePart: { inlineData: { mimeType: string; data: string } } | null = null;

      if (imageUrl.startsWith('data:')) {
        const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          imagePart = {
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          };
        }
      } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        try {
          const fetchRes = await fetch(imageUrl);
          const arrayBuffer = await fetchRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const contentType = fetchRes.headers.get('content-type') || 'image/jpeg';
          imagePart = {
            inlineData: {
              mimeType: contentType,
              data: buffer.toString('base64')
            }
          };
        } catch (fetchErr) {
          console.warn('Could not fetch external image for Gemini, delegating:', fetchErr);
        }
      }

      if (!imagePart) {
        return res.json({ fallbackRequired: true, reason: 'Invalid image format for multimodal analysis' });
      }

      const promptText = `You are a world-class Oral Medicine Specialist and Maxillofacial Diagnostic Pathologist evaluating an intraoral clinical photograph alongside the HRruiH oral mucosal diseases benchmark standard for LesionXpert AI.

Patient Profile:
- Anatomical Site: ${clinicalSite}
- Patient Demographics: ${patientAge}yo, ${patientSex}
- Habit History: ${habits.length > 0 ? habits.join(', ') : 'None / Non-smoker'}
- Clinical Symptoms: ${symptomDuration || 'Routine examination'}
- Neural Classifier: ${modelArchitecture}

DIAGNOSTIC MANDATE:
1. Examine the image carefully. DO NOT default to Oral Leukoplakia (OLK).
2. If the image depicts healthy pink/coral mucosa, normal anatomical papillae, normal tongue dorsum, healthy gingiva, normal palate, or teeth/oral structures without pathological lesions, you MUST diagnose "Benign / Normal Mucosa" with high confidence (e.g. 85-98%) and recommend "Routine Monitoring".
3. If true pathognomonic lesion signs exist, classify accurately into one of the following:
   - "Benign / Normal Mucosa": Uniform pink/salmon hue, moist glistening texture, absence of keratotic plaques, striae, or ulceration.
   - "Oral Leukoplakia (OLK)": Distinct, non-scrapable, thick or homogeneous white plaque/hyperkeratosis with clear borders.
   - "Oral Lichen Planus (OLP)": Reticular lace-like Wickham's striae, papular, or erosive erythematous background.
   - "Oral Submucous Fibrosis (OSF)": Subepithelial blanching/marble pallor, palpable fibrous bands, loss of mucosal elasticity.
   - "Oral Erythroplakia": Fiery velvety red, well-demarcated patch with high dysplasia risk.
   - "Oral Squamous Cell Carcinoma (OSCC / OCA)": Exophytic growth, induration, rolled everted borders, deep persistent ulceration.

Provide a comprehensive, objective diagnostic output adhering strictly to the structured schema.`;

      const response = await generateContentWithFallback(ai, {
        contents: {
          parts: [
            imagePart,
            { text: promptText }
          ]
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              primaryFinding: {
                type: Type.STRING,
                description: 'Must be one of: "Benign / Normal Mucosa", "Oral Leukoplakia (OLK)", "Oral Lichen Planus (OLP)", "Oral Submucous Fibrosis (OSF)", "Oral Erythroplakia", "Oral Squamous Cell Carcinoma (OSCC / OCA)"'
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Confidence percentage between 60.0 and 99.5'
              },
              probabilityDistribution: {
                type: Type.ARRAY,
                description: 'Probabilities across 5 benchmark diagnostic categories summing to ~100%',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    condition: { type: Type.STRING },
                    code: { type: Type.STRING },
                    percentage: { type: Type.NUMBER },
                    risk: { type: Type.STRING, description: '"low", "moderate", or "high"' }
                  },
                  required: ['condition', 'code', 'percentage', 'risk']
                }
              },
              gradCamRegion: {
                type: Type.OBJECT,
                description: 'Estimated coordinates of salient visual region (0 to 100 percentages)',
                properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  radius: { type: Type.NUMBER },
                  intensity: { type: Type.NUMBER }
                },
                required: ['x', 'y', 'radius', 'intensity']
              },
              recommendedAction: {
                type: Type.STRING,
                description: 'One of: "Routine Monitoring", "2-Week Followup", "Biopsy Recommended", "Surgical Referral", "Educational Case"'
              },
              clinicalExplanation: {
                type: Type.STRING,
                description: 'Detailed objective morphological rationale explaining mucosal coloration, surface texture, margins, and why the lesion or normal mucosa was identified.'
              },
              extractedFeatures: {
                type: Type.OBJECT,
                properties: {
                  keratinizationScore: { type: Type.NUMBER, description: '0 to 100 score' },
                  erythemaScore: { type: Type.NUMBER, description: '0 to 100 score' },
                  fibroticIndex: { type: Type.NUMBER, description: '0 to 100 score' },
                  reticularPattern: { type: Type.BOOLEAN },
                  ulcerationIndex: { type: Type.NUMBER, description: '0 to 100 score' }
                },
                required: ['keratinizationScore', 'erythemaScore', 'fibroticIndex', 'reticularPattern', 'ulcerationIndex']
              }
            },
            required: [
              'primaryFinding',
              'confidence',
              'probabilityDistribution',
              'gradCamRegion',
              'recommendedAction',
              'clinicalExplanation',
              'extractedFeatures'
            ]
          }
        }
      });

      let responseText = response.text || '';
      if (!responseText) {
        return res.json({ fallbackRequired: true, reason: 'Empty response from vision model' });
      }

      // Strip markdown code fences if present
      if (responseText.includes('```json')) {
        responseText = responseText.replace(/```json\s*|\s*```/g, '').trim();
      } else if (responseText.includes('```')) {
        responseText = responseText.replace(/```\s*|\s*```/g, '').trim();
      }

      const parsedPrediction = JSON.parse(responseText);
      return res.json(parsedPrediction);
    } catch (err: any) {
      console.warn('API Warning in /api/analyze-lesion:', err?.message || err);
      return res.json({ fallbackRequired: true, reason: err?.message || 'Vision model temporarily unavailable, engaging client fallback.' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LesionXpert AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

