import { pgTable, text, serial, integer, boolean, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const formatEnum = pgEnum('format', ['In-Person', 'Online', 'Hybrid']);
export const statusEnum = pgEnum('status', ['Open', 'Closed', 'Filled']);
export const durationEnum = pgEnum('duration', ['1 Hour', 'Half-Day', '1 Day', '2 Half-Days', '2 Days']);

// Organisations table
export const organisations = pgTable("organisations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  shortCode: varchar("short_code", { length: 10 }).notNull(),
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  organisationId: integer("organisation_id").references(() => organisations.id),
  currentRole: text("current_role"),
  lookingFor: text("looking_for"),
  isAuthenticated: boolean("is_authenticated").default(true),
  pictureUrl: text("picture_url").notNull(),
});

// Opportunities table
export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  format: formatEnum("format").notNull(),
  durationLimit: durationEnum("duration_limit").notNull(),
  status: statusEnum("status").default('Open').notNull(),
  organisationId: integer("organisation_id").references(() => organisations.id).notNull(),
  createdByUserId: integer("created_by_user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  hostDetails: text("host_details"),
  learningOutcomes: text("learning_outcomes"),
});

// Applications table
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  opportunityId: integer("opportunity_id").references(() => opportunities.id).notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Successful applications table
export const successfulApplications = pgTable("successful_applications", {
  opportunityId: integer("opportunity_id").references(() => opportunities.id).primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
});

// Learning areas table (for checkboxes)
export const learningAreas = pgTable("learning_areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Opportunity learning areas (many-to-many)
export const opportunityLearningAreas = pgTable("opportunity_learning_areas", {
  opportunityId: integer("opportunity_id").references(() => opportunities.id).notNull(),
  learningAreaId: integer("learning_area_id").references(() => learningAreas.id).notNull(),
});

// Define relations
export const organisationsRelations = relations(organisations, ({ many }) => ({
  users: many(users),
  opportunities: many(opportunities)
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [users.organisationId],
    references: [organisations.id]
  }),
  createdOpportunities: many(opportunities, { relationName: "creator" }),
  applications: many(applications)
}));

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [opportunities.organisationId],
    references: [organisations.id]
  }),
  creator: one(users, {
    fields: [opportunities.createdByUserId],
    references: [users.id],
    relationName: "creator"
  }),
  applications: many(applications),
  successfulApplication: one(successfulApplications),
  learningAreaLinks: many(opportunityLearningAreas)
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id]
  }),
  opportunity: one(opportunities, {
    fields: [applications.opportunityId],
    references: [opportunities.id]
  })
}));

export const successfulApplicationsRelations = relations(successfulApplications, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [successfulApplications.opportunityId],
    references: [opportunities.id]
  }),
  user: one(users, {
    fields: [successfulApplications.userId],
    references: [users.id]
  })
}));

export const learningAreasRelations = relations(learningAreas, ({ many }) => ({
  opportunityLinks: many(opportunityLearningAreas)
}));

export const opportunityLearningAreasRelations = relations(opportunityLearningAreas, ({ one }) => ({
  opportunity: one(opportunities, {
    fields: [opportunityLearningAreas.opportunityId],
    references: [opportunities.id]
  }),
  learningArea: one(learningAreas, {
    fields: [opportunityLearningAreas.learningAreaId],
    references: [learningAreas.id]
  })
}));

// Insert schemas
export const insertOrganisationSchema = createInsertSchema(organisations);
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertOpportunitySchema = createInsertSchema(opportunities).omit({ id: true, createdAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, createdAt: true });
export const insertSuccessfulApplicationSchema = createInsertSchema(successfulApplications).omit({ acceptedAt: true });
export const insertLearningAreaSchema = createInsertSchema(learningAreas).omit({ id: true });
export const insertOpportunityLearningAreaSchema = createInsertSchema(opportunityLearningAreas);

// Types
export type Organisation = typeof organisations.$inferSelect;
export type InsertOrganisation = z.infer<typeof insertOrganisationSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type SuccessfulApplication = typeof successfulApplications.$inferSelect;
export type InsertSuccessfulApplication = z.infer<typeof insertSuccessfulApplicationSchema>;

export type LearningArea = typeof learningAreas.$inferSelect;
export type InsertLearningArea = z.infer<typeof insertLearningAreaSchema>;

export type OpportunityLearningArea = typeof opportunityLearningAreas.$inferSelect;
export type InsertOpportunityLearningArea = z.infer<typeof insertOpportunityLearningAreaSchema>;

// Extended types with related data
export type OpportunityWithDetails = Opportunity & {
  organisation: Organisation;
  creator: User;
  learningAreas: LearningArea[];
  hostUser?: User;
  applications?: Application[];
  applicationCount?: number;
  successfulApplicant?: User;
};

export type ApplicationWithDetails = Application & {
  user: User;
  opportunity: OpportunityWithDetails;
};
