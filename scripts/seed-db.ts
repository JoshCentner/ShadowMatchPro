import { db } from '../server/db';
import { organisations, learningAreas, opportunities, type InsertOrganisation, type InsertLearningArea, type InsertOpportunity } from '../shared/schema';

async function seedDatabase() {
  console.log('Starting database seeding...');

  // Seed organisations
  const orgs: InsertOrganisation[] = [
    { name: "SEEK", shortCode: "SEEK" },
    { name: "REA Group", shortCode: "REA" },
    { name: "Carsales", shortCode: "CARS" },
    { name: "Xero", shortCode: "XERO" },
    { name: "Culture Amp", shortCode: "CAMP" },
    { name: "MYOB", shortCode: "MYOB" },
    { name: "Australia Post", shortCode: "APOST" }
  ];

  console.log('Seeding organisations...');
  for (const org of orgs) {
    try {
      await db.insert(organisations).values(org).onConflictDoNothing({ target: organisations.name });
    } catch (err) {
      console.error(`Error seeding organisation ${org.name}:`, err);
    }
  }

  // Seed learning areas
  const areas: InsertLearningArea[] = [
    { name: "Regulatory Compliance" },
    { name: "Agile at Scale" },
    { name: "Innovation" },
    { name: "Sales Leadership" },
    { name: "Content Development" },
    { name: "HR Team Structure" },
    { name: "Engineering Practices" },
    { name: "Product Management" },
    { name: "UX Research" },
    { name: "Data Science" }
  ];

  console.log('Seeding learning areas...');
  for (const area of areas) {
    try {
      await db.insert(learningAreas).values(area).onConflictDoNothing({ target: learningAreas.name });
    } catch (err) {
      console.error(`Error seeding learning area ${area.name}:`, err);
    }
  }

  const opportunities: InsertOpportunity[] = [
    {
      title: "Platform Product Management Shadowing at SEEK",
      description: "Join Leon, Principal Product Manager in Platforms at SEEK, for an immersive shadowing experience. This is an opportunity to get direct exposure to our product team and understand how platform product decisions are made at scale. Ideal for those in platform roles looking to expand their perspective.",
      format: "In-Person",
      duration_limit: "2 Days",
      status: "Open",
      organisation_id: 1,
      created_by_user_id: 1,
      host_details: "You'll be shadowing Leon - Principal Product Manager in Platforms at SEEK",
      learning_outcomes: "Platform product strategy, stakeholder management, technical product decisions"
    },
    {
      title: "Lead Engineering Experience at REA Group",
      description: "Shadow Sarah, Engineering Director at REA Group, to understand the challenges and strategies in leading large engineering teams. Get insights into technical leadership, team management, and architectural decision-making at scale.",
      format: "Hybrid",
      duration_limit: "2 Days",
      status: "Open",
      organisation_id: 2,
      created_by_user_id: 1,
      host_details: "You'll be shadowing Sarah - Engineering Director at REA Group",
      learning_outcomes: "Engineering leadership, team management, technical strategy"
    },
    {
      title: "Growth Hacking Deep Dive at Carsales",
      description: "Join Michael, Head of Growth at Carsales, for an immersive look into data-driven growth strategies. Learn about A/B testing, user acquisition, and conversion optimization in a leading digital marketplace.",
      format: "In-Person",
      duration_limit: "1 Day",
      status: "Open",
      organisation_id: 3,
      created_by_user_id: 1,
      host_details: "You'll be shadowing Michael - Head of Growth at Carsales",
      learning_outcomes: "Growth metrics, experimentation frameworks, user acquisition strategies"
    },
    {
      title: "UX Design Process at Xero",
      description: "Experience the day-to-day of Emma, Senior UX Designer at Xero. Understand how user-centered design principles are applied in financial software and how design decisions impact millions of users.",
      format: "In-Person",
      duration_limit: "2 Days",
      status: "Open",
      organisation_id: 4,
      created_by_user_id: 1,
      host_details: "You'll be shadowing Emma - Senior UX Designer at Xero",
      learning_outcomes: "UX methodologies, design systems, user testing"
    },
    {
      title: "Customer Research at Culture Amp",
      description: "Join Rachel, Lead Customer Researcher at Culture Amp, to learn how customer insights drive product decisions. Experience first-hand how research is conducted and translated into actionable insights.",
      format: "Hybrid",
      duration_limit: "2 Half-Days",
      status: "Open",
      organisation_id: 5,
      created_by_user_id: 1,
      host_details: "You'll be shadowing Rachel - Lead Customer Researcher at Culture Amp",
      learning_outcomes: "Research methodologies, customer interviewing, insights analysis"
    },
    {
      title: "Business Strategy Analysis at MYOB",
      description: "Shadow David, Senior Strategy Analyst at MYOB, to understand how strategic decisions are made in a leading accounting software company. Learn about market analysis, competitive positioning, and strategic planning.",
      format: "In-Person",
      duration_limit: "2 Days",
      status: "Open",
      organisation_id: 6,
      created_by_user_id: 1,
      host_details: "You'll be shadowing David - Senior Strategy Analyst at MYOB",
      learning_outcomes: "Strategic analysis, market research, business planning"
    },
    {
      title: "Business Analysis at Australia Post",
      description: "Join Lisa, Senior Business Analyst at Australia Post, for an inside look at how business and technical requirements are gathered and translated in a large-scale digital transformation environment.",
      format: "Hybrid",
      duration_limit: "2 Days",
      status: "Open",
      organisation_id: 7,
      created_by_user_id: 1,
      host_details: "You'll be shadowing Lisa - Senior Business Analyst at Australia Post",
      learning_outcomes: "Requirements gathering, stakeholder management, process optimization"
    }
  ];

  console.log('Seeding opportunities...');
  for (const opp of opportunities) {
    try {
      await db.insert(opportunities).values(opp).onConflictDoNothing({ target: opportunities.title });
    } catch (err) {
      console.error(`Error seeding opportunity ${opp.title}:`, err);
    }
  }


  console.log('Database seeding completed!');
}

seedDatabase()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error seeding database:', err);
    process.exit(1);
  });