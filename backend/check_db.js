const mysql = require('mysql2/promise');

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'givecentral',
      password: 'givecentral_password',
      database: 'sales_expense_db'
    });
    
    // Check users
    const [users] = await connection.execute('SELECT user_id, email FROM users LIMIT 5');
    console.log('=== USERS ===');
    console.log(JSON.stringify(users, null, 2));
    
    if (users.length > 0) {
      const userId = users[0].user_id;
      
      // Check sales
      const [sales] = await connection.execute('SELECT COUNT(*) as count, SUM(total_amount) as total FROM sales_entries WHERE user_id = ?', [userId]);
      console.log(`\n=== SALES FOR USER ${userId} ===`);
      console.log(`Count: ${sales[0].count}, Total: ${sales[0].total}`);
      
      // Check expenses
      const [expenses] = await connection.execute('SELECT COUNT(*) as count, SUM(amount) as total FROM expenses WHERE user_id = ?', [userId]);
      console.log(`\n=== EXPENSES FOR USER ${userId} ===`);
      console.log(`Count: ${expenses[0].count}, Total: ${expenses[0].total}`);
      
      // Check cash book
      const [cash] = await connection.execute('SELECT COUNT(*) as count FROM cash_book WHERE user_id = ?', [userId]);
      console.log(`\n=== CASH BOOK FOR USER ${userId} ===`);
      console.log(`Count: ${cash[0].count}`);
    }
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
