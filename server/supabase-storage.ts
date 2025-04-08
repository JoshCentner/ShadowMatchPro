import { supabase } from './supabase';
import {
  User, InsertUser,
  Organisation, InsertOrganisation,
  Opportunity, InsertOpportunity, OpportunityWithDetails,
  Application, InsertApplication, ApplicationWithDetails,
  SuccessfulApplication, InsertSuccessfulApplication,
  LearningArea, InsertLearningArea,
  OpportunityLearningArea, InsertOpportunityLearningArea
} from '@shared/schema';
import { log } from './vite';

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

export class SupabaseStorage implements IStorage {
  async getUserById(id: number): Promise<User | undefined> {
    console.log(`Storage - Fetching user with ID: ${id}`);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      log(`Error getting user by ID ${id}: ${error.message}`, 'error');
      return undefined;
    }
    
    console.log('Storage - Retrieved user data:', data);
    return data as User;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error code
        log(`Error getting user by email ${email}: ${error.message}`, 'error');
      }
      return undefined;
    }
    
    return data as User;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) {
      log(`Error creating user: ${error.message}`, 'error');
      throw new Error(`Failed to create user: ${error.message}`);
    }
    
    return data as User;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    console.log('Storage - Updating user with ID:', id);
    console.log('Storage - Input user data:', userData);
    
    // Transform data to match database field names
    const dbData: Record<string, any> = {};
    if (userData.currentRole !== undefined) dbData.role_title = userData.currentRole;
    if (userData.lookingFor !== undefined) dbData.looking_for = userData.lookingFor;
    if (userData.pictureUrl !== undefined) dbData.picture_url = userData.pictureUrl;
    if (userData.name !== undefined) dbData.name = userData.name;
    if (userData.organisationId !== undefined) dbData.organisation_id = userData.organisationId;
    
    console.log('Storage - Transformed data for DB:', dbData);
    
    const { data, error } = await supabase
      .from('users')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      log(`Error updating user ${id}: ${error.message}`, 'error');
      throw new Error(`Failed to update user: ${error.message}`);
    }
    
    return data as User;
  }
  
  async getOrganisations(): Promise<Organisation[]> {
    const { data, error } = await supabase
      .from('organisations')
      .select('*')
      .order('name');
    
    if (error) {
      log(`Error getting organisations: ${error.message}`, 'error');
      return [];
    }
    
    return data as Organisation[];
  }
  
  async getOrganisationById(id: number): Promise<Organisation | undefined> {
    const { data, error } = await supabase
      .from('organisations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      log(`Error getting organisation ${id}: ${error.message}`, 'error');
      return undefined;
    }
    
    return data as Organisation;
  }
  
  async createOrganisation(org: InsertOrganisation): Promise<Organisation> {
    const { data, error } = await supabase
      .from('organisations')
      .insert(org)
      .select()
      .single();
    
    if (error) {
      log(`Error creating organisation: ${error.message}`, 'error');
      throw new Error(`Failed to create organisation: ${error.message}`);
    }
    
    return data as Organisation;
  }
  
  async getOpportunities(filters?: { organisationId?: number, status?: string, format?: string }): Promise<OpportunityWithDetails[]> {
    // Start with the base query
    let query = supabase
      .from('opportunities')
      .select(`
        *,
        organisation:organisations(*),
        creator:users!opportunities_created_by_user_id_fkey(*)
      `);
    
    // Apply filters
    if (filters) {
      if (filters.organisationId) {
        query = query.eq('organisation_id', filters.organisationId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.format) {
        query = query.eq('format', filters.format);
      }
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      log(`Error getting opportunities: ${error.message}`, 'error');
      return [];
    }
    
    // Transform the data to match OpportunityWithDetails
    const opportunities = data as unknown as OpportunityWithDetails[];
    
    // For each opportunity, get the learning areas and enhance the result
    const enhancedOpportunities = await Promise.all(
      opportunities.map(async (opp) => {
        const learningAreas = await this.getLearningAreasByOpportunityId(opp.id);
        return {
          ...opp,
          learningAreas,
        };
      })
    );
    
    return enhancedOpportunities;
  }
  
  async getOpportunityById(id: number): Promise<OpportunityWithDetails | undefined> {
    // Get the opportunity with related data
    const { data, error } = await supabase
      .from('opportunities')
      .select(`
        *,
        organisation:organisations(*),
        creator:users!opportunities_created_by_user_id_fkey(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      log(`Error getting opportunity ${id}: ${error.message}`, 'error');
      return undefined;
    }
    
    const opportunity = data as unknown as OpportunityWithDetails;
    
    // Get the learning areas for this opportunity
    const learningAreas = await this.getLearningAreasByOpportunityId(id);
    
    // Get application count 
    const { count: applicationCount, error: countError } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('opportunity_id', id);
    
    if (countError) {
      log(`Error getting application count: ${countError.message}`, 'error');
    }
    
    // Check if there's a successful application
    const successfulApp = await this.getSuccessfulApplicationByOpportunityId(id);
    let successfulApplicant: User | undefined;
    
    if (successfulApp) {
      successfulApplicant = await this.getUserById(successfulApp.userId);
    }
    
    return {
      ...opportunity,
      learningAreas,
      applicationCount: applicationCount || 0,
      successfulApplicant,
    };
  }
  
  async createOpportunity(opportunity: InsertOpportunity): Promise<Opportunity> {
    // Transform data to match database field names
    const dbData = {
      title: opportunity.title,
      description: opportunity.description,
      format: opportunity.format,
      duration_limit: opportunity.durationLimit,
      status: opportunity.status,
      organisation_id: opportunity.organisationId,
      created_by_user_id: opportunity.createdByUserId,
      host_details: opportunity.hostDetails,
      learning_outcomes: opportunity.learningOutcomes
    };
    
    const { data, error } = await supabase
      .from('opportunities')
      .insert(dbData)
      .select()
      .single();
    
    if (error) {
      log(`Error creating opportunity: ${error.message}`, 'error');
      throw new Error(`Failed to create opportunity: ${error.message}`);
    }
    
    return data as Opportunity;
  }
  
  async updateOpportunity(id: number, opportunityData: Partial<InsertOpportunity>): Promise<Opportunity | undefined> {
    // Transform data to match database field names
    const dbData: Record<string, any> = {};
    
    if (opportunityData.title !== undefined) dbData.title = opportunityData.title;
    if (opportunityData.description !== undefined) dbData.description = opportunityData.description;
    if (opportunityData.format !== undefined) dbData.format = opportunityData.format;
    if (opportunityData.durationLimit !== undefined) dbData.duration_limit = opportunityData.durationLimit;
    if (opportunityData.status !== undefined) dbData.status = opportunityData.status;
    if (opportunityData.organisationId !== undefined) dbData.organisation_id = opportunityData.organisationId;
    if (opportunityData.createdByUserId !== undefined) dbData.created_by_user_id = opportunityData.createdByUserId;
    if (opportunityData.hostDetails !== undefined) dbData.host_details = opportunityData.hostDetails;
    if (opportunityData.learningOutcomes !== undefined) dbData.learning_outcomes = opportunityData.learningOutcomes;
    
    const { data, error } = await supabase
      .from('opportunities')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      log(`Error updating opportunity ${id}: ${error.message}`, 'error');
      return undefined;
    }
    
    return data as Opportunity;
  }
  
  async getOpportunitiesByUserId(userId: number): Promise<OpportunityWithDetails[]> {
    // Get all opportunities created by this user
    const { data, error } = await supabase
      .from('opportunities')
      .select(`
        *,
        organisation:organisations(*),
        creator:users!opportunities_created_by_user_id_fkey(*)
      `)
      .eq('created_by_user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      log(`Error getting opportunities for user ${userId}: ${error.message}`, 'error');
      return [];
    }
    
    const opportunities = data as unknown as OpportunityWithDetails[];
    
    // For each opportunity, get the learning areas and applications count
    const enhancedOpportunities = await Promise.all(
      opportunities.map(async (opp) => {
        const learningAreas = await this.getLearningAreasByOpportunityId(opp.id);
        
        // Get application count
        const { count: applicationCount, error: countError } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('opportunity_id', opp.id);
        
        if (countError) {
          log(`Error getting application count: ${countError.message}`, 'error');
        }
        
        // Check if there's a successful application
        const successfulApp = await this.getSuccessfulApplicationByOpportunityId(opp.id);
        let successfulApplicant: User | undefined;
        
        if (successfulApp) {
          successfulApplicant = await this.getUserById(successfulApp.userId);
        }
        
        return {
          ...opp,
          learningAreas,
          applicationCount: applicationCount || 0,
          successfulApplicant,
        };
      })
    );
    
    return enhancedOpportunities;
  }
  
  async getApplicationsByOpportunityId(opportunityId: number): Promise<ApplicationWithDetails[]> {
    // Get applications for this opportunity
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        user:users(*),
        opportunity:opportunities(
          *,
          organisation:organisations(*),
          creator:users!opportunities_created_by_user_id_fkey(*)
        )
      `)
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: false });
    
    if (error) {
      log(`Error getting applications for opportunity ${opportunityId}: ${error.message}`, 'error');
      return [];
    }
    
    const applications = data as unknown as ApplicationWithDetails[];
    
    // For each application, enhance the opportunity with learning areas
    const enhancedApplications = await Promise.all(
      applications.map(async (app) => {
        const learningAreas = await this.getLearningAreasByOpportunityId(app.opportunity.id);
        return {
          ...app,
          opportunity: {
            ...app.opportunity,
            learningAreas,
          },
        };
      })
    );
    
    return enhancedApplications;
  }
  
  async getApplicationsByUserId(userId: number): Promise<ApplicationWithDetails[]> {
    // Get applications made by this user
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        user:users(*),
        opportunity:opportunities(
          *,
          organisation:organisations(*),
          creator:users!opportunities_created_by_user_id_fkey(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      log(`Error getting applications for user ${userId}: ${error.message}`, 'error');
      return [];
    }
    
    const applications = data as unknown as ApplicationWithDetails[];
    
    // For each application, enhance the opportunity with learning areas
    const enhancedApplications = await Promise.all(
      applications.map(async (app) => {
        const learningAreas = await this.getLearningAreasByOpportunityId(app.opportunity.id);
        return {
          ...app,
          opportunity: {
            ...app.opportunity,
            learningAreas,
          },
        };
      })
    );
    
    return enhancedApplications;
  }
  
  async createApplication(application: InsertApplication): Promise<Application> {
    // Transform data to match database field names
    const dbData = {
      user_id: application.userId,
      opportunity_id: application.opportunityId,
      message: application.message
    };
    
    const { data, error } = await supabase
      .from('applications')
      .insert(dbData)
      .select()
      .single();
    
    if (error) {
      log(`Error creating application: ${error.message}`, 'error');
      throw new Error(`Failed to create application: ${error.message}`);
    }
    
    return data as Application;
  }
  
  async acceptApplication(data: InsertSuccessfulApplication): Promise<SuccessfulApplication> {
    // Transform data to match database field names
    const dbData = {
      user_id: data.userId,
      opportunity_id: data.opportunityId
    };
    
    // Create the successful application record
    const { data: successData, error: successError } = await supabase
      .from('successful_applications')
      .insert(dbData)
      .select()
      .single();
    
    if (successError) {
      log(`Error accepting application: ${successError.message}`, 'error');
      throw new Error(`Failed to accept application: ${successError.message}`);
    }
    
    // Update the opportunity status to 'Filled'
    await supabase
      .from('opportunities')
      .update({ status: 'Filled' })
      .eq('id', data.opportunityId);
    
    return successData as SuccessfulApplication;
  }
  
  async getSuccessfulApplicationByOpportunityId(opportunityId: number): Promise<SuccessfulApplication | undefined> {
    const { data, error } = await supabase
      .from('successful_applications')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .single();
    
    if (error) {
      if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error code
        log(`Error getting successful application: ${error.message}`, 'error');
      }
      return undefined;
    }
    
    return data as SuccessfulApplication;
  }
  
  async getLearningAreas(): Promise<LearningArea[]> {
    const { data, error } = await supabase
      .from('learning_areas')
      .select('*')
      .order('name');
    
    if (error) {
      log(`Error getting learning areas: ${error.message}`, 'error');
      return [];
    }
    
    return data as LearningArea[];
  }
  
  async createLearningArea(area: InsertLearningArea): Promise<LearningArea> {
    const { data, error } = await supabase
      .from('learning_areas')
      .insert(area)
      .select()
      .single();
    
    if (error) {
      log(`Error creating learning area: ${error.message}`, 'error');
      throw new Error(`Failed to create learning area: ${error.message}`);
    }
    
    return data as LearningArea;
  }
  
  async addLearningAreaToOpportunity(data: InsertOpportunityLearningArea): Promise<OpportunityLearningArea> {
    // Transform data to match database field names
    const dbData = {
      opportunity_id: data.opportunityId,
      learning_area_id: data.learningAreaId
    };
    
    const { data: relationData, error } = await supabase
      .from('opportunity_learning_areas')
      .insert(dbData)
      .select()
      .single();
    
    if (error) {
      log(`Error adding learning area to opportunity: ${error.message}`, 'error');
      throw new Error(`Failed to add learning area to opportunity: ${error.message}`);
    }
    
    return relationData as OpportunityLearningArea;
  }
  
  async getLearningAreasByOpportunityId(opportunityId: number): Promise<LearningArea[]> {
    // Get the learning area ids associated with this opportunity
    const { data: junctionData, error: junctionError } = await supabase
      .from('opportunity_learning_areas')
      .select('learning_area_id')
      .eq('opportunity_id', opportunityId);
    
    if (junctionError) {
      log(`Error getting learning areas for opportunity ${opportunityId}: ${junctionError.message}`, 'error');
      return [];
    }
    
    if (!junctionData || junctionData.length === 0) {
      return [];
    }
    
    // Get the learning area IDs
    const learningAreaIds = junctionData.map(item => item.learning_area_id);
    
    // Get the learning areas
    const { data: learningAreas, error: learningError } = await supabase
      .from('learning_areas')
      .select('*')
      .in('id', learningAreaIds);
    
    if (learningError) {
      log(`Error getting learning areas by IDs: ${learningError.message}`, 'error');
      return [];
    }
    
    return learningAreas as LearningArea[];
  }
}

export const storage = new SupabaseStorage();