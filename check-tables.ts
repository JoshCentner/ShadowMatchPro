
import { supabase } from './server/supabase';

async function checkTables() {
  console.log('Checking tables in Supabase...');
  
  const tables = ['organisations', 'users', 'opportunities', 'applications', 'learning_areas'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('count(*)')
      .single();
      
    if (error) {
      console.error(`Error with table ${table}:`, error.message);
    } else {
      console.log(`Table ${table} exists with ${data.count} rows`);
    }
  }
}

checkTables()
  .catch(console.error)
  .finally(() => process.exit());
