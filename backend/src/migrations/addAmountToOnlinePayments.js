require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mysql = require('mysql2/promise');

async function addAmountColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sales_expense_db',
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('Updating online_payments table...');

    // Add amount_received column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE online_payments
        ADD COLUMN amount_received DECIMAL(12, 2) AFTER payment_type
      `);
      console.log('✓ amount_received column added');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✓ amount_received column already exists');
      } else {
        throw error;
      }
    }

    // Update payment_type ENUM to include Cash
    try {
      await connection.execute(`
        ALTER TABLE online_payments
        MODIFY COLUMN payment_type ENUM('Cash', 'UPI', 'Bank Transfer', 'Cheque')
      `);
      console.log('✓ payment_type ENUM updated to include Cash');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME' || error.message.includes('Syntax error')) {
        console.log('✓ payment_type ENUM already updated');
      } else {
        throw error;
      }
    }

    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the migration
addAmountColumn()
  .then(() => {
    console.log('✓ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
