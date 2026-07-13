import pg from 'pg';
import fs from 'fs';

// Connect to Supabase database and export all public schema tables
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.nzevdzkirznlagightap:OHDC4g1FE08MA8K8@aws-0-eu-west-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function dump() {
  await client.connect();
  console.log('Connected to database');

  let sql = `-- Coturne Database Export\n-- Generated: ${new Date().toISOString()}\n-- Project: nzevdzkirznlagightap\n\n`;

  // Get all tables in public schema
  const tablesRes = await client.query(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  `);

  const tables = tablesRes.rows.map(r => r.tablename);
  console.log('Tables found:', tables.join(', '));

  for (const table of tables) {
    console.log(`Exporting ${table}...`);
    
    // Get column info
    const colRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [table]);
    
    const columns = colRes.rows.map(r => r.column_name);
    
    // Get rows
    const rowsRes = await client.query(`SELECT * FROM public."${table}"`);
    
    if (rowsRes.rows.length === 0) {
      sql += `-- Table ${table}: empty\n\n`;
      continue;
    }

    sql += `-- Table: ${table} (${rowsRes.rows.length} rows)\n`;
    
    for (const row of rowsRes.rows) {
      const vals = columns.map(col => {
        const v = row[col];
        if (v === null) return 'NULL';
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
        if (typeof v === 'number') return v;
        if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
        return `'${String(v).replace(/'/g, "''")}'`;
      });
      sql += `INSERT INTO public."${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`;
    }
    sql += '\n';
  }

  fs.writeFileSync('database.sql', sql, 'utf8');
  console.log(`Done! database.sql written (${(fs.statSync('database.sql').size / 1024).toFixed(1)} KB)`);
  await client.end();
}

dump().catch(e => { console.error(e); process.exit(1); });
