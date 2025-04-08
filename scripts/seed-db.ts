import { db } from '../server/db';
import { organisations, learningAreas, type InsertOrganisation, type InsertLearningArea } from '../shared/schema';

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