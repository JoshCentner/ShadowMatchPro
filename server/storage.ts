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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private organisations: Map<number, Organisation>;
  private opportunities: Map<number, Opportunity>;
  private applications: Map<number, Application>;
  private successfulApplications: Map<number, SuccessfulApplication>;
  private learningAreas: Map<number, LearningArea>;
  private opportunityLearningAreas: OpportunityLearningArea[];
  
  private userIdCounter: number = 1;
  private organisationIdCounter: number = 1;
  private opportunityIdCounter: number = 1;
  private applicationIdCounter: number = 1;
  private learningAreaIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.organisations = new Map();
    this.opportunities = new Map();
    this.applications = new Map();
    this.successfulApplications = new Map();
    this.learningAreas = new Map();
    this.opportunityLearningAreas = [];
    
    // Initialize with sample organizations and learning areas
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample organisations
    const sampleOrgs: InsertOrganisation[] = [
      { name: "SEEK", shortCode: "SEEK" },
      { name: "REA Group", shortCode: "REA" },
      { name: "Atlassian", shortCode: "ATLSN" }
    ];
    
    sampleOrgs.forEach(org => this.createOrganisation(org));

    // Sample learning areas
    const sampleAreas: InsertLearningArea[] = [
      { name: "Regulatory Compliance" },
      { name: "Agile at Scale" },
      { name: "Innovation" },
      { name: "Sales Leadership" },
      { name: "Content Development" },
      { name: "HR Team Structure" }
    ];
    
    sampleAreas.forEach(area => this.createLearningArea(area));
  }

  // User operations
  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = await this.getUserById(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Organisation operations
  async getOrganisations(): Promise<Organisation[]> {
    return Array.from(this.organisations.values());
  }

  async getOrganisationById(id: number): Promise<Organisation | undefined> {
    return this.organisations.get(id);
  }

  async createOrganisation(org: InsertOrganisation): Promise<Organisation> {
    const id = this.organisationIdCounter++;
    const organisation: Organisation = { ...org, id };
    this.organisations.set(id, organisation);
    return organisation;
  }

  // Opportunity operations
  async getOpportunities(filters?: { organisationId?: number, status?: string, format?: string }): Promise<OpportunityWithDetails[]> {
    let opportunities = Array.from(this.opportunities.values());
    
    // Apply filters if provided
    if (filters) {
      if (filters.organisationId) {
        opportunities = opportunities.filter(opp => opp.organisationId === filters.organisationId);
      }
      if (filters.status) {
        opportunities = opportunities.filter(opp => opp.status === filters.status);
      }
      if (filters.format) {
        opportunities = opportunities.filter(opp => opp.format === filters.format);
      }
    }
    
    // Enhance with organisation and creator details
    const enhancedOpportunities = await Promise.all(
      opportunities.map(async opp => {
        const organisation = await this.getOrganisationById(opp.organisationId);
        const creator = await this.getUserById(opp.createdByUserId);
        const learningAreas = await this.getLearningAreasByOpportunityId(opp.id);
        const applications = await this.getApplicationsByOpportunityId(opp.id);
        const successfulApplication = await this.getSuccessfulApplicationByOpportunityId(opp.id);
        
        let successfulApplicant;
        if (successfulApplication) {
          successfulApplicant = await this.getUserById(successfulApplication.userId);
        }
        
        return {
          ...opp,
          organisation: organisation!,
          creator: creator!,
          learningAreas,
          applications,
          applicationCount: applications.length,
          successfulApplicant
        };
      })
    );
    
    return enhancedOpportunities;
  }

  async getOpportunityById(id: number): Promise<OpportunityWithDetails | undefined> {
    const opp = this.opportunities.get(id);
    if (!opp) return undefined;
    
    const organisation = await this.getOrganisationById(opp.organisationId);
    const creator = await this.getUserById(opp.createdByUserId);
    const learningAreas = await this.getLearningAreasByOpportunityId(opp.id);
    const applications = await this.getApplicationsByOpportunityId(opp.id);
    const successfulApplication = await this.getSuccessfulApplicationByOpportunityId(opp.id);
    
    let successfulApplicant;
    if (successfulApplication) {
      successfulApplicant = await this.getUserById(successfulApplication.userId);
    }
    
    return {
      ...opp,
      organisation: organisation!,
      creator: creator!,
      learningAreas,
      applications,
      applicationCount: applications.length,
      successfulApplicant
    };
  }

  async createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity> {
    const id = this.opportunityIdCounter++;
    const createdAt = new Date();
    
    const newOpportunity: Opportunity = { 
      ...opportunity, 
      id, 
      createdAt 
    };
    
    this.opportunities.set(id, newOpportunity);
    return newOpportunity;
  }

  async updateOpportunity(id: number, opportunityData: Partial<InsertOpportunity>): Promise<Opportunity | undefined> {
    const existingOpp = this.opportunities.get(id);
    if (!existingOpp) return undefined;
    
    const updatedOpp = { ...existingOpp, ...opportunityData };
    this.opportunities.set(id, updatedOpp);
    return updatedOpp;
  }

  async getOpportunitiesByUserId(userId: number): Promise<OpportunityWithDetails[]> {
    const opportunities = Array.from(this.opportunities.values())
      .filter(opp => opp.createdByUserId === userId);
      
    // Enhance with organisation and creator details
    const enhancedOpportunities = await Promise.all(
      opportunities.map(async opp => {
        const organisation = await this.getOrganisationById(opp.organisationId);
        const creator = await this.getUserById(opp.createdByUserId);
        const learningAreas = await this.getLearningAreasByOpportunityId(opp.id);
        const applications = await this.getApplicationsByOpportunityId(opp.id);
        const successfulApplication = await this.getSuccessfulApplicationByOpportunityId(opp.id);
        
        let successfulApplicant;
        if (successfulApplication) {
          successfulApplicant = await this.getUserById(successfulApplication.userId);
        }
        
        return {
          ...opp,
          organisation: organisation!,
          creator: creator!,
          learningAreas,
          applications,
          applicationCount: applications.length,
          successfulApplicant
        };
      })
    );
    
    return enhancedOpportunities;
  }

  // Application operations
  async getApplicationsByOpportunityId(opportunityId: number): Promise<ApplicationWithDetails[]> {
    const applications = Array.from(this.applications.values())
      .filter(app => app.opportunityId === opportunityId);
      
    // Enhance with user and opportunity details
    const enhancedApplications = await Promise.all(
      applications.map(async app => {
        const user = await this.getUserById(app.userId);
        const opportunity = await this.getOpportunityById(app.opportunityId);
        
        return {
          ...app,
          user: user!,
          opportunity: opportunity!
        };
      })
    );
    
    return enhancedApplications;
  }

  async getApplicationsByUserId(userId: number): Promise<ApplicationWithDetails[]> {
    const applications = Array.from(this.applications.values())
      .filter(app => app.userId === userId);
      
    // Enhance with user and opportunity details
    const enhancedApplications = await Promise.all(
      applications.map(async app => {
        const user = await this.getUserById(app.userId);
        const opportunity = await this.getOpportunityById(app.opportunityId);
        
        return {
          ...app,
          user: user!,
          opportunity: opportunity!
        };
      })
    );
    
    return enhancedApplications;
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const id = this.applicationIdCounter++;
    const createdAt = new Date();
    
    const newApplication: Application = { 
      ...application, 
      id, 
      createdAt 
    };
    
    this.applications.set(id, newApplication);
    return newApplication;
  }

  async acceptApplication(data: InsertSuccessfulApplication): Promise<SuccessfulApplication> {
    const acceptedAt = new Date();
    const successfulApp: SuccessfulApplication = { 
      ...data, 
      acceptedAt 
    };
    
    this.successfulApplications.set(data.opportunityId, successfulApp);
    
    // Update opportunity status to filled
    await this.updateOpportunity(data.opportunityId, { status: 'Filled' });
    
    return successfulApp;
  }

  async getSuccessfulApplicationByOpportunityId(opportunityId: number): Promise<SuccessfulApplication | undefined> {
    return this.successfulApplications.get(opportunityId);
  }

  // Learning areas operations
  async getLearningAreas(): Promise<LearningArea[]> {
    return Array.from(this.learningAreas.values());
  }

  async createLearningArea(area: InsertLearningArea): Promise<LearningArea> {
    const id = this.learningAreaIdCounter++;
    const newArea: LearningArea = { ...area, id };
    this.learningAreas.set(id, newArea);
    return newArea;
  }

  async addLearningAreaToOpportunity(data: InsertOpportunityLearningArea): Promise<OpportunityLearningArea> {
    this.opportunityLearningAreas.push(data);
    return data;
  }

  async getLearningAreasByOpportunityId(opportunityId: number): Promise<LearningArea[]> {
    const areaIds = this.opportunityLearningAreas
      .filter(item => item.opportunityId === opportunityId)
      .map(item => item.learningAreaId);
    
    return Array.from(this.learningAreas.values())
      .filter(area => areaIds.includes(area.id));
  }
}

export const storage = new MemStorage();
