import { 
  users, organisations, opportunities, applications, successfulApplications, 
  learningAreas, opportunityLearningAreas,
  type User, type InsertUser,
  type Organisation, type InsertOrganisation,
  type Opportunity, type InsertOpportunity, type OpportunityWithDetails,
  type Application, type InsertApplication, type ApplicationWithDetails,
  type SuccessfulApplication, type InsertSuccessfulApplication,
  type LearningArea, type InsertLearningArea,
  type OpportunityLearningArea, type InsertOpportunityLearningArea
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Organisation operations
  getOrganisations(): Promise<Organisation[]>;
  getOrganisationById(id: number): Promise<Organisation | undefined>;
  createOrganisation(org: InsertOrganisation): Promise<Organisation>;
  
  // Opportunity operations
  getOpportunities(filters?: { organisationId?: number, status?: string, format?: string }): Promise<OpportunityWithDetails[]>;
  getOpportunityById(id: number): Promise<OpportunityWithDetails | undefined>;
  createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity>;
  updateOpportunity(id: number, opportunity: Partial<InsertOpportunity>): Promise<Opportunity | undefined>;
  getOpportunitiesByUserId(userId: number): Promise<OpportunityWithDetails[]>;
  
  // Application operations
  getApplicationsByOpportunityId(opportunityId: number): Promise<ApplicationWithDetails[]>;
  getApplicationsByUserId(userId: number): Promise<ApplicationWithDetails[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  acceptApplication(data: InsertSuccessfulApplication): Promise<SuccessfulApplication>;
  getSuccessfulApplicationByOpportunityId(opportunityId: number): Promise<SuccessfulApplication | undefined>;
  
  // Learning areas operations
  getLearningAreas(): Promise<LearningArea[]>;
  createLearningArea(area: InsertLearningArea): Promise<LearningArea>;
  addLearningAreaToOpportunity(data: InsertOpportunityLearningArea): Promise<OpportunityLearningArea>;
  getLearningAreasByOpportunityId(opportunityId: number): Promise<LearningArea[]>;
}

// Database implementation of storage interface
export class DatabaseStorage implements IStorage {
  // User operations
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values({
      ...user,
      organisationId: user.organisationId ?? null,
      currentRole: user.currentRole ?? null,
      lookingFor: user.lookingFor ?? null,
      isAuthenticated: user.isAuthenticated ?? true,
      pictureUrl: user.pictureUrl ?? null
    }).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Organisation operations
  async getOrganisations(): Promise<Organisation[]> {
    return await db.select().from(organisations);
  }

  async getOrganisationById(id: number): Promise<Organisation | undefined> {
    const [org] = await db.select().from(organisations).where(eq(organisations.id, id));
    return org;
  }

  async createOrganisation(org: InsertOrganisation): Promise<Organisation> {
    const [newOrg] = await db.insert(organisations).values(org).returning();
    return newOrg;
  }

  // Opportunity operations
  async getOpportunities(filters?: { organisationId?: number, status?: string, format?: string }): Promise<OpportunityWithDetails[]> {
    // For now, just get all opportunities and filter in memory
    // This avoids TypeScript errors with complex where clauses
    const allOpps = await db
      .select()
      .from(opportunities)
      .orderBy(desc(opportunities.createdAt));
    
    // Apply filters in memory if needed
    let opps = allOpps;
    if (filters) {
      opps = allOpps.filter(opp => {
        let match = true;
        if (filters.organisationId !== undefined) {
          match = match && opp.organisationId === filters.organisationId;
        }
        if (filters.status !== undefined) {
          match = match && opp.status === filters.status;
        }
        if (filters.format !== undefined) {
          match = match && opp.format === filters.format;
        }
        return match;
      });
    }
    
    // Enhance with details
    return await Promise.all(opps.map(async (opp) => {
      return await this.enhanceOpportunityWithDetails(opp);
    }));
  }

  async getOpportunityById(id: number): Promise<OpportunityWithDetails | undefined> {
    const [opp] = await db.select().from(opportunities).where(eq(opportunities.id, id));
    if (!opp) return undefined;
    
    return await this.enhanceOpportunityWithDetails(opp);
  }

  async createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity> {
    const [newOpp] = await db.insert(opportunities).values({
      ...opportunity,
      status: opportunity.status || 'Open',
      hostDetails: opportunity.hostDetails || null,
      learningOutcomes: opportunity.learningOutcomes || null
    }).returning();
    return newOpp;
  }

  async updateOpportunity(id: number, opportunityData: Partial<InsertOpportunity>): Promise<Opportunity | undefined> {
    const [updatedOpp] = await db
      .update(opportunities)
      .set(opportunityData)
      .where(eq(opportunities.id, id))
      .returning();
    return updatedOpp;
  }

  async getOpportunitiesByUserId(userId: number): Promise<OpportunityWithDetails[]> {
    const opps = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.createdByUserId, userId))
      .orderBy(desc(opportunities.createdAt));
    
    // Enhance with details
    return await Promise.all(opps.map(async (opp) => {
      return await this.enhanceOpportunityWithDetails(opp);
    }));
  }

  // Application operations
  async getApplicationsByOpportunityId(opportunityId: number): Promise<ApplicationWithDetails[]> {
    const apps = await db
      .select()
      .from(applications)
      .where(eq(applications.opportunityId, opportunityId))
      .orderBy(desc(applications.createdAt));
    
    return await Promise.all(apps.map(async (app) => {
      return await this.enhanceApplicationWithDetails(app);
    }));
  }

  async getApplicationsByUserId(userId: number): Promise<ApplicationWithDetails[]> {
    const apps = await db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.createdAt));
    
    return await Promise.all(apps.map(async (app) => {
      return await this.enhanceApplicationWithDetails(app);
    }));
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const [newApp] = await db.insert(applications).values({
      ...application,
      message: application.message || null
    }).returning();
    return newApp;
  }

  async acceptApplication(data: InsertSuccessfulApplication): Promise<SuccessfulApplication> {
    // Insert successful application
    const [successfulApp] = await db.insert(successfulApplications).values(data).returning();
    
    // Update opportunity status to filled
    await this.updateOpportunity(data.opportunityId, { status: 'Filled' });
    
    return successfulApp;
  }

  async getSuccessfulApplicationByOpportunityId(opportunityId: number): Promise<SuccessfulApplication | undefined> {
    const [successfulApp] = await db
      .select()
      .from(successfulApplications)
      .where(eq(successfulApplications.opportunityId, opportunityId));
    
    return successfulApp;
  }

  // Learning areas operations
  async getLearningAreas(): Promise<LearningArea[]> {
    return await db.select().from(learningAreas);
  }

  async createLearningArea(area: InsertLearningArea): Promise<LearningArea> {
    const [newArea] = await db.insert(learningAreas).values(area).returning();
    return newArea;
  }

  async addLearningAreaToOpportunity(data: InsertOpportunityLearningArea): Promise<OpportunityLearningArea> {
    const [link] = await db.insert(opportunityLearningAreas).values(data).returning();
    return link;
  }

  async getLearningAreasByOpportunityId(opportunityId: number): Promise<LearningArea[]> {
    // First, get the learning area IDs linked to this opportunity
    const links = await db
      .select()
      .from(opportunityLearningAreas)
      .where(eq(opportunityLearningAreas.opportunityId, opportunityId));
    
    if (links.length === 0) {
      return [];
    }
    
    // Then, get the actual learning areas
    const learningAreaIds = links.map(link => link.learningAreaId);
    return await db
      .select()
      .from(learningAreas)
      .where(inArray(learningAreas.id, learningAreaIds));
  }

  // Helper methods
  private async enhanceOpportunityWithDetails(opp: Opportunity): Promise<OpportunityWithDetails> {
    const [organisation] = await db
      .select()
      .from(organisations)
      .where(eq(organisations.id, opp.organisationId));
    
    const [creator] = await db
      .select()
      .from(users)
      .where(eq(users.id, opp.createdByUserId));
    
    const learningAreas = await this.getLearningAreasByOpportunityId(opp.id);
    const applications = await this.getApplicationsByOpportunityId(opp.id);
    const successfulApplication = await this.getSuccessfulApplicationByOpportunityId(opp.id);
    
    let successfulApplicant;
    if (successfulApplication) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, successfulApplication.userId));
      successfulApplicant = user;
    }
    
    return {
      ...opp,
      organisation,
      creator,
      learningAreas,
      applications,
      applicationCount: applications.length,
      successfulApplicant
    };
  }

  private async enhanceApplicationWithDetails(app: Application): Promise<ApplicationWithDetails> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, app.userId));
    
    const opportunity = await this.getOpportunityById(app.opportunityId);
    
    return {
      ...app,
      user,
      opportunity: opportunity!
    };
  }
}

export const storage = new DatabaseStorage();