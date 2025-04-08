import { Router, type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./supabase-storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertOpportunitySchema, 
  insertApplicationSchema, 
  insertSuccessfulApplicationSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  const apiRouter = Router();
  app.use("/api", apiRouter);

  // Expose environment variables to the client
  app.get("/api/config", (_req: Request, res: Response) => {
    res.json({
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
    });
  });

  // =====================
  // AUTH ROUTES
  // =====================
  
  // Register user (simulate Google auth for MVP)
  apiRouter.post("/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(200).json(existingUser);
      }
      
      const newUser = await storage.createUser(userData);
      return res.status(201).json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to register user" });
    }
  });

  // Google Sign In handler
  apiRouter.post("/auth/google-signin", async (req: Request, res: Response) => {
    try {
      const { email, name, pictureUrl } = req.body;
      
      if (!email || !name) {
        return res.status(400).json({ message: 'Email and name are required' });
      }
      
      // Check if user already exists
      let user = await storage.getUserByEmail(email);
      
      if (user) {
        // If user exists, update their profile if needed
        const needsUpdate = 
          (pictureUrl && user.pictureUrl !== pictureUrl) || 
          (user.name !== name);
        
        if (needsUpdate) {
          const updateData: Partial<typeof user> = {};
          
          if (pictureUrl && user.pictureUrl !== pictureUrl) {
            updateData.pictureUrl = pictureUrl;
          }
          
          if (user.name !== name) {
            updateData.name = name;
          }
          
          const updatedUser = await storage.updateUser(user.id, updateData);
          if (updatedUser) {
            user = updatedUser;
          }
        }
        
        return res.json(user);
      }
      
      // Create new user - organization will be set during first profile visit
      const newUser = await storage.createUser({
        email,
        name,
        pictureUrl
      });
      
      res.json(newUser);
    } catch (error: any) {
      console.error('Error in Google sign-in:', error);
      res.status(500).json({ message: 'Failed to authenticate with Google' });
    }
  });

  // Get current user
  apiRouter.get("/auth/me", async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const user = await storage.getUserById(parseInt(userId));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Update user profile
  apiRouter.put("/users/:id", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    
    try {
      const userData = insertUserSchema.partial().parse(req.body);
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to update user" });
    }
  });

  // =====================
  // ORGANISATION ROUTES
  // =====================
  
  // Get all organisations
  apiRouter.get("/organisations", async (_req: Request, res: Response) => {
    try {
      const organisations = await storage.getOrganisations();
      return res.status(200).json(organisations);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get organisations" });
    }
  });

  // =====================
  // OPPORTUNITY ROUTES
  // =====================
  
  // Get all opportunities with optional filters
  apiRouter.get("/opportunities", async (req: Request, res: Response) => {
    try {
      const filters = {
        organisationId: req.query.organisationId ? parseInt(req.query.organisationId as string) : undefined,
        status: req.query.status as string | undefined,
        format: req.query.format as string | undefined
      };
      
      const opportunities = await storage.getOpportunities(filters);
      return res.status(200).json(opportunities);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get opportunities" });
    }
  });

  // Get opportunity by ID
  apiRouter.get("/opportunities/:id", async (req: Request, res: Response) => {
    try {
      const opportunityId = parseInt(req.params.id);
      const opportunity = await storage.getOpportunityById(opportunityId);
      
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      return res.status(200).json(opportunity);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get opportunity" });
    }
  });

  // Create opportunity
  apiRouter.post("/opportunities", async (req: Request, res: Response) => {
    try {
      const opportunityData = insertOpportunitySchema.parse(req.body);
      const newOpportunity = await storage.createOpportunity(opportunityData);
      
      // Add learning areas if provided
      if (req.body.learningAreaIds && Array.isArray(req.body.learningAreaIds)) {
        for (const areaId of req.body.learningAreaIds) {
          await storage.addLearningAreaToOpportunity({
            opportunityId: newOpportunity.id,
            learningAreaId: areaId
          });
        }
      }
      
      return res.status(201).json(newOpportunity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid opportunity data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create opportunity" });
    }
  });

  // Update opportunity
  apiRouter.put("/opportunities/:id", async (req: Request, res: Response) => {
    try {
      const opportunityId = parseInt(req.params.id);
      const opportunityData = insertOpportunitySchema.partial().parse(req.body);
      
      const updatedOpportunity = await storage.updateOpportunity(opportunityId, opportunityData);
      
      if (!updatedOpportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      return res.status(200).json(updatedOpportunity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid opportunity data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to update opportunity" });
    }
  });

  // Get opportunities created by user
  apiRouter.get("/users/:id/opportunities", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const opportunities = await storage.getOpportunitiesByUserId(userId);
      return res.status(200).json(opportunities);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get user opportunities" });
    }
  });

  // =====================
  // APPLICATION ROUTES
  // =====================
  
  // Get applications for an opportunity
  apiRouter.get("/opportunities/:id/applications", async (req: Request, res: Response) => {
    try {
      const opportunityId = parseInt(req.params.id);
      const applications = await storage.getApplicationsByOpportunityId(opportunityId);
      return res.status(200).json(applications);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get applications" });
    }
  });

  // Get applications made by a user
  apiRouter.get("/users/:id/applications", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const applications = await storage.getApplicationsByUserId(userId);
      return res.status(200).json(applications);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get user applications" });
    }
  });

  // Create application
  apiRouter.post("/applications", async (req: Request, res: Response) => {
    try {
      const applicationData = insertApplicationSchema.parse(req.body);
      
      // Check if opportunity exists and is open
      const opportunity = await storage.getOpportunityById(applicationData.opportunityId);
      
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      if (opportunity.status !== 'Open') {
        return res.status(400).json({ message: "Cannot apply to a non-open opportunity" });
      }
      
      // Check if user has already applied
      const existingApplications = await storage.getApplicationsByOpportunityId(applicationData.opportunityId);
      const alreadyApplied = existingApplications.some(app => app.user.id === applicationData.userId);
      
      if (alreadyApplied) {
        return res.status(400).json({ message: "You have already applied to this opportunity" });
      }
      
      const newApplication = await storage.createApplication(applicationData);
      return res.status(201).json(newApplication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to create application" });
    }
  });

  // Accept an application
  apiRouter.post("/applications/accept", async (req: Request, res: Response) => {
    try {
      const acceptData = insertSuccessfulApplicationSchema.parse(req.body);
      
      // Check if opportunity exists
      const opportunity = await storage.getOpportunityById(acceptData.opportunityId);
      
      if (!opportunity) {
        return res.status(404).json({ message: "Opportunity not found" });
      }
      
      // Check if already accepted an application
      const existingAccepted = await storage.getSuccessfulApplicationByOpportunityId(acceptData.opportunityId);
      
      if (existingAccepted) {
        return res.status(400).json({ message: "An application has already been accepted for this opportunity" });
      }
      
      const successfulApplication = await storage.acceptApplication(acceptData);
      return res.status(201).json(successfulApplication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      return res.status(500).json({ message: "Failed to accept application" });
    }
  });

  // =====================
  // LEARNING AREAS ROUTES
  // =====================
  
  // Get all learning areas
  apiRouter.get("/learning-areas", async (_req: Request, res: Response) => {
    try {
      const areas = await storage.getLearningAreas();
      return res.status(200).json(areas);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get learning areas" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
