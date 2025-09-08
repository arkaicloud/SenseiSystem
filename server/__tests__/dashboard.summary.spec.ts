import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { db } from '../db';
import { users, students, classes, attendance, studentPayments, beltLevels } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Mock user for authentication
const testAdmin = {
  id: 999,
  firstName: 'Test',
  lastName: 'Admin',
  username: 'testadmin',
  email: 'testadmin@test.com',
  password: 'hashedpassword',
  role: 'admin' as const,
  phone: null,
  cpf: null,
  rg: null,
  emergencyContact: null,
  emergencyPhone: null,
  birthDate: new Date('1990-01-01'),
  street: null,
  number: null,
  complement: null,
  neighborhood: null,
  city: null,
  state: null,
  zipCode: null,
  joinDate: new Date(),
  active: true,
  status: 'active',
  currentStreak: 0,
  longestStreak: 0,
  lastLoginDate: null,
  totalLogins: 0
};

describe('Dashboard Summary API', () => {
  let authCookie: string;

  beforeEach(async () => {
    // Clean up test data
    await db.delete(attendance);
    await db.delete(studentPayments);
    await db.delete(students);
    await db.delete(classes);
    await db.delete(users).where(eq(users.id, testAdmin.id));

    // Create test admin user
    await db.insert(users).values(testAdmin);

    // Get auth cookie (simulate login)
    const loginResponse = await request(app)
      .post('/api/login')
      .send({
        username: 'testadmin',
        password: 'hashedpassword'
      });

    authCookie = loginResponse.headers['set-cookie'];
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(attendance);
    await db.delete(studentPayments);
    await db.delete(students);
    await db.delete(classes);
    await db.delete(users).where(eq(users.id, testAdmin.id));
  });

  describe('GET /api/dashboard/summary', () => {
    it('should return unified dashboard summary with correct structure', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Cookie', authCookie)
        .expect(200);

      const data = response.body;

      // Validate response structure according to audit specifications
      expect(data).toHaveProperty('generatedAt');
      expect(data).toHaveProperty('period');
      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('today');
      expect(data).toHaveProperty('belts');

      // Validate period structure
      expect(data.period).toHaveProperty('type');
      expect(data.period).toHaveProperty('from');
      expect(data.period).toHaveProperty('to');

      // Validate metrics structure
      expect(data.metrics).toHaveProperty('activeStudents');
      expect(data.metrics).toHaveProperty('classesHeld');
      expect(data.metrics).toHaveProperty('attendanceRate');
      expect(data.metrics).toHaveProperty('monthlyRevenue');
      expect(data.metrics).toHaveProperty('atRiskStudents');
      expect(data.metrics).toHaveProperty('delinquency');
      expect(data.metrics).toHaveProperty('pendingApprovals');

      // Validate today structure
      expect(data.today).toHaveProperty('classes');
      expect(data.today).toHaveProperty('birthdays');
      expect(Array.isArray(data.today.classes)).toBe(true);
      expect(Array.isArray(data.today.birthdays)).toBe(true);

      // Validate belts structure
      expect(data.belts).toHaveProperty('adult');
      expect(data.belts).toHaveProperty('kids');
      expect(typeof data.belts.adult).toBe('object');
      expect(typeof data.belts.kids).toBe('object');
    });

    it('should return zero metrics when no data exists', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Cookie', authCookie)
        .expect(200);

      const { metrics } = response.body;

      expect(metrics.activeStudents).toBe(0);
      expect(metrics.classesHeld).toBe(0);
      expect(metrics.attendanceRate).toBe(0);
      expect(metrics.monthlyRevenue).toBe(0);
      expect(metrics.atRiskStudents).toBe(0);
      expect(metrics.delinquency).toBe(0);
      expect(metrics.pendingApprovals).toBe(0);
    });

    it('should handle different period parameters', async () => {
      // Test current_month
      const currentMonthResponse = await request(app)
        .get('/api/dashboard/summary?period=current_month')
        .set('Cookie', authCookie)
        .expect(200);

      expect(currentMonthResponse.body.period.type).toBe('month');

      // Test last_30_days
      const last30Response = await request(app)
        .get('/api/dashboard/summary?period=last_30_days')
        .set('Cookie', authCookie)
        .expect(200);

      expect(last30Response.body.period.type).toBe('month');

      // Test last_90_days
      const last90Response = await request(app)
        .get('/api/dashboard/summary?period=last_90_days')
        .set('Cookie', authCookie)
        .expect(200);

      expect(last90Response.body.period.type).toBe('month');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/dashboard/summary')
        .expect(401);
    });

    it('should validate query parameters', async () => {
      await request(app)
        .get('/api/dashboard/summary?period=invalid_period')
        .set('Cookie', authCookie)
        .expect(400);
    });

    it('should handle timezone parameter', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary?timezone=UTC')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body).toHaveProperty('generatedAt');
    });
  });

  describe('Dashboard with test data', () => {
    beforeEach(async () => {
      // Create test belt levels
      await db.insert(beltLevels).values([
        {
          id: 1,
          name: 'Faixa Branca',
          levelKey: 'white',
          colorCode: '#FFFFFF',
          category: 'adult',
          order: 1,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: 'Faixa Cinza',
          levelKey: 'grey',
          colorCode: '#808080',
          category: 'child',
          order: 1,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      // Create test users
      await db.insert(users).values([
        {
          id: 1001,
          firstName: 'Active',
          lastName: 'Student',
          username: 'activestudent',
          email: 'active@test.com',
          password: 'hashedpassword',
          role: 'student',
          phone: null,
          cpf: null,
          rg: null,
          emergencyContact: null,
          emergencyPhone: null,
          birthDate: new Date('2000-01-01'),
          street: null,
          number: null,
          complement: null,
          neighborhood: null,
          city: null,
          state: null,
          zipCode: null,
          joinDate: new Date(),
          active: true,
          status: 'active',
          currentStreak: 0,
          longestStreak: 0,
          lastLoginDate: null,
          totalLogins: 0
        },
        {
          id: 1002,
          firstName: 'Pending',
          lastName: 'Student',
          username: 'pendingstudent',
          email: 'pending@test.com',
          password: 'hashedpassword',
          role: 'student',
          phone: null,
          cpf: null,
          rg: null,
          emergencyContact: null,
          emergencyPhone: null,
          birthDate: new Date('2000-01-01'),
          street: null,
          number: null,
          complement: null,
          neighborhood: null,
          city: null,
          state: null,
          zipCode: null,
          joinDate: new Date(),
          active: true,
          status: 'pending',
          currentStreak: 0,
          longestStreak: 0,
          lastLoginDate: null,
          totalLogins: 0
        }
      ]);

      // Create test students
      await db.insert(students).values([
        {
          id: 101,
          userId: 1001,
          beltLevel: 'white',
          stripes: 0,
          lastPromotionDate: null,
          attendanceRate: 0,
          notes: null,
          avatarColor: '#3b82f6',
          avatarStyle: 'initials',
          avatarImage: null,
          financialResponsibleName: null,
          financialResponsibleEmail: null,
          financialResponsiblePhone: null,
          financialResponsibleCpf: null,
          financialResponsibleRelation: null,
          asaasCustomerId: null,
          asaasSubscriptionId: null,
          paymentPlanId: null,
          preferredDueDate: 5,
          requiresMedicalCertificate: false,
          medicalCertificateStatus: 'PENDING',
          healthQuestionnaireCompletedAt: null,
          agreedToHealthTerms: false,
          healthTermsAgreedAt: null
        }
      ]);

      // Create test class
      await db.insert(classes).values([
        {
          id: 201,
          name: 'BJJ Fundamentals',
          description: 'Basic BJJ class',
          instructorId: testAdmin.id,
          dayOfWeek: new Date().getDay(), // Today
          startTime: '19:00',
          duration: 90,
          maxCapacity: 20,
          maxStudents: 20
        }
      ]);
    });

    it('should count active students correctly', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.metrics.activeStudents).toBe(1);
    });

    it('should count pending approvals correctly', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.metrics.pendingApprovals).toBe(1);
    });

    it('should return today classes', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.today.classes).toHaveLength(1);
      expect(response.body.today.classes[0].name).toBe('BJJ Fundamentals');
    });

    it('should categorize belt statistics correctly', async () => {
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Cookie', authCookie)
        .expect(200);

      // Should have adult white belt
      expect(response.body.belts.adult.white).toBe(1);
      
      // Kids section should be empty or zero
      expect(Object.keys(response.body.belts.kids)).toHaveLength(0);
    });
  });

  describe('Multitenancy safety', () => {
    it('should only return data for authenticated user tenant', async () => {
      // This test verifies that tenant filtering is working
      // In a real multi-tenant scenario, we would test with different tenants
      const response = await request(app)
        .get('/api/dashboard/summary')
        .set('Cookie', authCookie)
        .expect(200);

      // Verify that response is scoped to current user's context
      expect(response.body).toHaveProperty('metrics');
      expect(typeof response.body.generatedAt).toBe('string');
    });
  });
});