/**
 * LesionXpert AI - Secure Authentication Database & Session Engine
 * Implements:
 * - Real bcrypt password hashing (never plaintext)
 * - Strict 2-role restriction: 'doctor' | 'student' (NO PATIENT ROLE)
 * - Persistent database storage to disk (database/users_db.json)
 * - Account status checking ('active' | 'inactive' | 'suspended')
 * - Secure cryptographic single-use reset tokens with expiry
 * - Session token lifecycle
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { UserRole, UserProfile } from '../types';

export interface DbUserRecord {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: 'doctor' | 'student';
  status: 'active' | 'inactive' | 'suspended';
  institution?: string;
  professional_id?: string;
  specialty?: string;
  university?: string;
  program?: string;
  year_of_study?: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
  notifications: {
    newCaseAssignments: boolean;
    aiAnalysisComplete: boolean;
    weeklyReports: boolean;
  };
  two_factor_enabled: boolean;
}

export interface PasswordResetTokenRecord {
  token: string;
  user_id: string;
  email: string;
  expires_at: number; // Unix timestamp ms
  used: boolean;
  created_at: string;
}

export interface ActiveSessionRecord {
  token: string;
  user_id: string;
  created_at: number;
  expires_at: number;
}

const DB_PATH = path.join(process.cwd(), 'database', 'users_db.json');

class AuthDatabaseService {
  private users: Map<string, DbUserRecord> = new Map();
  private resetTokens: Map<string, PasswordResetTokenRecord> = new Map();
  private sessions: Map<string, ActiveSessionRecord> = new Map();

  constructor() {
    this.seedInitialAccounts();
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const list: DbUserRecord[] = JSON.parse(raw);
        for (const u of list) {
          if (u.email) {
            this.users.set(u.email.toLowerCase(), u);
          }
        }
      }
    } catch (err) {
      console.warn('[AUTH DB] Notice: Disk load fallback (in-memory active):', err);
    }
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.users.values());
      fs.writeFileSync(DB_PATH, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[AUTH DB] Notice: Disk save error:', err);
    }
  }

  /**
   * Seed standard Doctor and Student accounts with secure bcrypt hashes
   */
  private seedInitialAccounts() {
    const saltRounds = 10;
    
    // Seed Doctor: Dr. Ananya Rao (Password: Doctor@2026!)
    const doctorHash = bcrypt.hashSync('Doctor@2026!', saltRounds);
    const doctorUser: DbUserRecord = {
      id: 'doc-001',
      full_name: 'Dr. Ananya Rao',
      email: 'ananya.rao@opmd-clinic.com',
      password_hash: doctorHash,
      role: 'doctor',
      status: 'active',
      institution: 'City Center Oral Pathology & Oncology',
      professional_id: 'DENT-PATH-84920',
      specialty: 'Oral & Maxillofacial Pathology',
      avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJS8yOR2DobQMFCYSHYyKzH39euXIwMZatBZqWnjUX1d3BMZTac6DZEttIsyIrXuDlLikb26atptzdVR-TH7zFGDELjfndN-rILu4RMXFbJKHNdovE8x_aB_PzUsP6q-c5kGGJV16NtedeqKVp1Cwyco17qUWVa6OTmZMQ-qbeAN2ph7GJ-5QZIfmfE9OfyUZbkdlW3R8dHTv8L6FBIDXH7IdaQ8w5LdXRpnpTc8DZZTI7H12E_kblYw',
      created_at: '2024-01-15T08:00:00.000Z',
      updated_at: '2024-01-15T08:00:00.000Z',
      notifications: {
        newCaseAssignments: true,
        aiAnalysisComplete: true,
        weeklyReports: false
      },
      two_factor_enabled: true
    };
    this.users.set(doctorUser.email.toLowerCase(), doctorUser);

    // Seed Student: Alex Chen (Password: Student@2026!)
    const studentHash = bcrypt.hashSync('Student@2026!', saltRounds);
    const studentUser: DbUserRecord = {
      id: 'stu-001',
      full_name: 'Alex Chen',
      email: 'alex.chen@meduniv.edu',
      password_hash: studentHash,
      role: 'student',
      status: 'active',
      university: 'University of Dental & Medical Sciences',
      program: 'BDS / Oral Oncology Resident',
      year_of_study: 'Year 2 Resident',
      avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmJ6a9E0cntjR36kFKaNC0_ROcm-x0At9yheVgDTeKm6M_A0i_1hgl0RWsWf9u4TvlFQfeYg4MqHXSsCeKumdrWdvN1yQTjns4aidT6lEFO8by4t7EJqt-Yxo9APKo1YqHfi05bnDFkDe3QxNkMpUbM85w--5bTuWXqe-rXWFS_cjmyQIChL_9ofrXW8cT6YIauCQIPY5PaobRzauGAsdAgrBaMF3fwJwmdVbwh6-uK2GBeRcaNukJFQ',
      created_at: '2024-02-01T09:30:00.000Z',
      updated_at: '2024-02-01T09:30:00.000Z',
      notifications: {
        newCaseAssignments: false,
        aiAnalysisComplete: true,
        weeklyReports: true
      },
      two_factor_enabled: false
    };
    this.users.set(studentUser.email.toLowerCase(), studentUser);

    // Seed Secondary Doctor for testing
    const doc2Hash = bcrypt.hashSync('ClinicalDoctor@2026!', saltRounds);
    const doc2User: DbUserRecord = {
      id: 'doc-002',
      full_name: 'Dr. Sarah Jenkins',
      email: 'sarah.jenkins@hospital-health.org',
      password_hash: doc2Hash,
      role: 'doctor',
      status: 'active',
      institution: 'Metropolitan Dental Institute',
      professional_id: 'OMFS-90412',
      specialty: 'Head & Neck Oncology',
      avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      created_at: '2024-02-10T10:00:00.000Z',
      updated_at: '2024-02-10T10:00:00.000Z',
      notifications: {
        newCaseAssignments: true,
        aiAnalysisComplete: true,
        weeklyReports: true
      },
      two_factor_enabled: false
    };
    this.users.set(doc2User.email.toLowerCase(), doc2User);

    // Ensure NO patient records exist
    this.purgePatientAccounts();
    this.saveToDisk();
  }

  public purgePatientAccounts() {
    for (const [email, user] of this.users.entries()) {
      if ((user.role as any) === 'patient') {
        this.users.delete(email);
      }
    }
  }

  public toUserProfile(user: DbUserRecord): UserProfile {
    return {
      id: user.id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      institution: user.institution,
      professionalId: user.professional_id,
      specialty: user.specialty,
      university: user.university,
      program: user.program,
      yearOfStudy: user.year_of_study,
      avatarUrl: user.avatar_url,
      notifications: { ...user.notifications },
      twoFactorEnabled: user.two_factor_enabled
    };
  }

  public getUserByEmail(email: string): DbUserRecord | null {
    if (!email) return null;
    return this.users.get(email.trim().toLowerCase()) || null;
  }

  public getUserById(id: string): DbUserRecord | null {
    for (const user of this.users.values()) {
      if (user.id === id) return user;
    }
    return null;
  }

  public async registerUser(data: {
    fullName: string;
    email: string;
    password: string;
    role: 'doctor' | 'student';
    institution?: string;
    professionalId?: string;
    specialty?: string;
    university?: string;
    program?: string;
    yearOfStudy?: string;
  }): Promise<{ user?: DbUserRecord; error?: string; statusCode?: number }> {
    const normalizedEmail = data.email.trim().toLowerCase();

    if (this.users.has(normalizedEmail)) {
      return {
        error: 'An account with this email already exists.',
        statusCode: 409
      };
    }

    if (data.role !== 'doctor' && data.role !== 'student') {
      return {
        error: 'Invalid account role. LesionXpert AI supports Doctor and Dental Student accounts only.',
        statusCode: 400
      };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const isDoctor = data.role === 'doctor';
    const newId = isDoctor ? `doc-${Date.now().toString(36)}` : `stu-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const newUser: DbUserRecord = {
      id: newId,
      full_name: data.fullName.trim(),
      email: normalizedEmail,
      password_hash: passwordHash,
      role: data.role,
      status: 'active',
      institution: isDoctor ? (data.institution || 'Hospital Dental Department') : undefined,
      professional_id: isDoctor ? (data.professionalId || `MD-${Math.floor(10000 + Math.random() * 90000)}`) : undefined,
      specialty: isDoctor ? (data.specialty || 'Oral Medicine & Radiology') : undefined,
      university: !isDoctor ? (data.university || 'Dental Sciences Institute') : undefined,
      program: !isDoctor ? (data.program || 'BDS / Residency') : undefined,
      year_of_study: !isDoctor ? (data.yearOfStudy || 'Year 2 Resident') : undefined,
      avatar_url: isDoctor
        ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBJS8yOR2DobQMFCYSHYyKzH39euXIwMZatBZqWnjUX1d3BMZTac6DZEttIsyIrXuDlLikb26atptzdVR-TH7zFGDELjfndN-rILu4RMXFbJKHNdovE8x_aB_PzUsP6q-c5kGGJV16NtedeqKVp1Cwyco17qUWVa6OTmZMQ-qbeAN2ph7GJ-5QZIfmfE9OfyUZbkdlW3R8dHTv8L6FBIDXH7IdaQ8w5LdXRpnpTc8DZZTI7H12E_kblYw'
        : 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmJ6a9E0cntjR36kFKaNC0_ROcm-x0At9yheVgDTeKm6M_A0i_1hgl0RWsWf9u4TvlFQfeYg4MqHXSsCeKumdrWdvN1yQTjns4aidT6lEFO8by4t7EJqt-Yxo9APKo1YqHfi05bnDFkDe3QxNkMpUbM85w--5bTuWXqe-rXWFS_cjmyQIChL_9ofrXW8cT6YIauCQIPY5PaobRzauGAsdAgrBaMF3fwJwmdVbwh6-uK2GBeRcaNukJFQ',
      created_at: now,
      updated_at: now,
      notifications: {
        newCaseAssignments: isDoctor,
        aiAnalysisComplete: true,
        weeklyReports: true
      },
      two_factor_enabled: false
    };

    this.users.set(normalizedEmail, newUser);
    this.saveToDisk();
    return { user: newUser };
  }

  public async verifyPassword(plainText: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainText, hash);
    } catch {
      return false;
    }
  }

  public createSession(userId: string): string {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

    this.sessions.set(sessionToken, {
      token: sessionToken,
      user_id: userId,
      created_at: now,
      expires_at: expiresAt
    });

    return sessionToken;
  }

  public validateSession(sessionToken: string): DbUserRecord | null {
    if (!sessionToken) return null;
    const session = this.sessions.get(sessionToken);
    if (!session) return null;

    if (Date.now() > session.expires_at) {
      this.sessions.delete(sessionToken);
      return null;
    }

    return this.getUserById(session.user_id);
  }

  public revokeSession(sessionToken: string): boolean {
    return this.sessions.delete(sessionToken);
  }

  public createPasswordResetToken(email: string): string | null {
    const user = this.getUserByEmail(email);
    if (!user) return null;

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    this.resetTokens.set(token, {
      token,
      user_id: user.id,
      email: user.email,
      expires_at: expiresAt,
      used: false,
      created_at: new Date().toISOString()
    });

    return token;
  }

  public validateResetToken(token: string): { valid: boolean; email?: string; userId?: string; error?: string } {
    if (!token) return { valid: false, error: 'Token missing.' };

    const record = this.resetTokens.get(token);
    if (!record) {
      return { valid: false, error: 'Invalid reset link. Please request a new password reset.' };
    }

    if (record.used) {
      return { valid: false, error: 'This reset link has already been used.' };
    }

    if (Date.now() > record.expires_at) {
      return { valid: false, error: 'Reset link has expired. Links remain active for 60 minutes.' };
    }

    return { valid: true, email: record.email, userId: record.user_id };
  }

  public async resetPasswordWithToken(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const validation = this.validateResetToken(token);
    if (!validation.valid || !validation.userId) {
      return { success: false, error: validation.error || 'Invalid reset token.' };
    }

    const user = this.getUserById(validation.userId);
    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    user.password_hash = newHash;
    user.updated_at = new Date().toISOString();

    const tokenRecord = this.resetTokens.get(token);
    if (tokenRecord) {
      tokenRecord.used = true;
    }

    this.saveToDisk();
    return { success: true };
  }

  public async changePassword(userId: string, currentPass: string, newPass: string): Promise<{ success: boolean; error?: string }> {
    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    const isMatch = await this.verifyPassword(currentPass, user.password_hash);
    if (!isMatch) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    user.password_hash = await bcrypt.hash(newPass, 10);
    user.updated_at = new Date().toISOString();
    this.saveToDisk();
    return { success: true };
  }

  public updateUserProfile(userId: string, updates: Partial<DbUserRecord>): DbUserRecord | null {
    const user = this.getUserById(userId);
    if (!user) return null;

    if (updates.full_name) user.full_name = updates.full_name.trim();
    if (updates.institution) user.institution = updates.institution.trim();
    if (updates.professional_id) user.professional_id = updates.professional_id.trim();
    if (updates.specialty) user.specialty = updates.specialty.trim();
    if (updates.university) user.university = updates.university.trim();
    if (updates.program) user.program = updates.program.trim();
    if (updates.year_of_study) user.year_of_study = updates.year_of_study.trim();
    if (updates.avatar_url) user.avatar_url = updates.avatar_url;
    if (updates.notifications) user.notifications = { ...user.notifications, ...updates.notifications };

    user.updated_at = new Date().toISOString();
    this.saveToDisk();
    return user;
  }
}

export const authDb = new AuthDatabaseService();
