require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mysql = require('mysql2/promise');

async function addUnitColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sales_expense_db',
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('Adding unit column to sales_line_items...');
    await connection.execute(`
      ALTER TABLE sales_line_items
      ADD COLUMN unit VARCHAR(20) DEFAULT 'Units' AFTER product_name
    `);
    console.log('✓ Unit column added successfully');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✓ Unit column already exists');
    } else {
      console.error('Error adding column:', error.message);
      throw error;
    }
  } finally {
    await connection.end();
  }
}

// Run the migration
addUnitColumn()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
