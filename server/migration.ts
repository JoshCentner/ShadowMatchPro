import { supabase } from './supabase';
import { log } from './vite';

/**
 * Creates all the necessary tables in Supabase if they don't exist.
 * Note: With Supabase, tables are typically created in the dashboard or using migrations.
 * This function primarily checks for existence and attempts to add any missing tables.
 */
export async function migrateDatabase() {
  try {
    log('Starting database verification...', 'express');
    
    // Verify tables exist or create them if possible
    await verifyOrganisationsTable();
    await verifyUsersTable();
    await verifyLearningAreasTable();
    await verifyOpportunitiesTable();
    await verifyApplicationsTable();
    await verifySuccessfulApplicationsTable();
    await verifyOpportunityLearningAreasTable();
    
    log('Database verification completed successfully!', 'express');
    return true;
  } catch (error: any) {
    log(`Database verification failed: ${error.message}`, 'error');
    return false;
  }
}

async function verifyOrganisationsTable() {
  // Check if the table exists
  const { error: checkError } = await supabase.from('organisations').select('*').limit(1);
  
  if (checkError) {
    if (checkError.code === '42P01') { // Table does not exist error code
      log('organisations table does not exist. This should be created in the Supabase dashboard', 'warning');
    } else {
      log(`Error checking organisations table: ${checkError.message}`, 'warning');
    }
    return false;
  } else {
    log('organisations table verified', 'express');
    return true;
  }
}

async function verifyUsersTable() {
  // Check if the table exists
  const { error: checkError } = await supabase.from('users').select('*').limit(1);
  
  if (checkError) {
    if (checkError.code === '42P01') { // Table does not exist error code
      log('users table does not exist. This should be created in the Supabase dashboard', 'warning');
    } else {
      log(`Error checking users table: ${checkError.message}`, 'warning');
    }
    return false;
  } else {
    log('users table verified', 'express');
    return true;
  }
}

async function verifyLearningAreasTable() {
  // Check if the table exists
  const { error: checkError } = await supabase.from('learning_areas').select('*').limit(1);
  
  if (checkError) {
    if (checkError.code === '42P01') { // Table does not exist error code
      log('learning_areas table does not exist. This should be created in the Supabase dashboard', 'warning');
    } else {
      log(`Error checking learning_areas table: ${checkError.message}`, 'warning');
    }
    return false;
  } else {
    log('learning_areas table verified', 'express');
    return true;
  }
}

async function verifyOpportunitiesTable() {
  // Check if the table exists
  const { error: checkError } = await supabase.from('opportunities').select('*').limit(1);
  
  if (checkError) {
    if (checkError.code === '42P01') { // Table does not exist error code
      log('opportunities table does not exist. This should be created in the Supabase dashboard', 'warning');
    } else {
      log(`Error checking opportunities table: ${checkError.message}`, 'warning');
    }
    return false;
  } else {
    log('opportunities table verified', 'express');
    return true;
  }
}

async function verifyApplicationsTable() {
  // Check if the table exists
  const { error: checkError } = await supabase.from('applications').select('*').limit(1);
  
  if (checkError) {
    if (checkError.code === '42P01') { // Table does not exist error code
      log('applications table does not exist. This should be created in the Supabase dashboard', 'warning');
    } else {
      log(`Error checking applications table: ${checkError.message}`, 'warning');
    }
    return false;
  } else {
    log('applications table verified', 'express');
    return true;
  }
}

async function verifySuccessfulApplicationsTable() {
  // Check if the table exists
  const { error: checkError } = await supabase.from('successful_applications').select('*').limit(1);
  
  if (checkError) {
    if (checkError.code === '42P01') { // Table does not exist error code
      log('successful_applications table does not exist. This should be created in the Supabase dashboard', 'warning');
    } else {
      log(`Error checking successful_applications table: ${checkError.message}`, 'warning');
    }
    return false;
  } else {
    log('successful_applications table verified', 'express');
    return true;
  }
}

async function verifyOpportunityLearningAreasTable() {
  // Check if the table exists
  const { error: checkError } = await supabase.from('opportunity_learning_areas').select('*').limit(1);
  
  if (checkError) {
    if (checkError.code === '42P01') { // Table does not exist error code
      log('opportunity_learning_areas table does not exist. This should be created in the Supabase dashboard', 'warning');
    } else {
      log(`Error checking opportunity_learning_areas table: ${checkError.message}`, 'warning');
    }
    return false;
  } else {
    log('opportunity_learning_areas table verified', 'express');
    return true;
  }
}



/**
 * Seeds the database with initial data
 */
export async function seedDatabase() {
  try {
    log('Starting database seeding...', 'express');
    
    // Seed organisations
    await seedOrganisations();
    
    // Seed learning areas
    await seedLearningAreas();
    
    log('Database seeding completed successfully!', 'express');
    return true;
  } catch (error: any) {
    log(`Database seeding failed: ${error.message}`, 'error');
    return false;
  }
}

async function seedOrganisations() {
  // Check if organisations table is empty
  const { data: existingOrgs, error } = await supabase
    .from('organisations')
    .select('id')
    .limit(1);
  
  if (error) throw error;
  
  if (!existingOrgs || existingOrgs.length === 0) {
    // Seed sample organisations
    const organisations = [
      { name: 'SEEK', short_code: 'SEEK' },
      { name: 'REA Group', short_code: 'REA' },
      { name: 'Atlassian', short_code: 'TEAM' },
      { name: 'Canva', short_code: 'CANVA' },
      { name: 'Xero', short_code: 'XRO' }
    ];
    
    const { error: insertError } = await supabase
      .from('organisations')
      .insert(organisations);
    
    if (insertError) throw insertError;
    
    log('Seeded organisations table with sample data', 'express');
  } else {
    log('Organisations table already has data, skipping seed', 'express');
  }
}

async function seedLearningAreas() {
  // Check if learning_areas table is empty
  const { data: existingAreas, error } = await supabase
    .from('learning_areas')
    .select('id')
    .limit(1);
  
  if (error) throw error;
  
  if (!existingAreas || existingAreas.length === 0) {
    // Seed sample learning areas
    const learningAreas = [
      { name: 'Regulatory Compliance' },
      { name: 'Agile at Scale' },
      { name: 'Innovation' },
      { name: 'Sales Leadership' },
      { name: 'Content Development' },
      { name: 'HR Team Structure' },
      { name: 'Product Management' },
      { name: 'Engineering Practices' },
      { name: 'UX Design' },
      { name: 'Analytics' },
      { name: 'Marketing Strategy' },
      { name: 'Executive Leadership' }
    ];
    
    const { error: insertError } = await supabase
      .from('learning_areas')
      .insert(learningAreas);
    
    if (insertError) throw insertError;
    
    log('Seeded learning_areas table with sample data', 'express');
  } else {
    log('Learning areas table already has data, skipping seed', 'express');
  }
}