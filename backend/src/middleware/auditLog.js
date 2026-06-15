const pool = require('../config/database');
const { AUDIT_ACTIONS } = require('../config/constants');

const auditLog = async (userId, action, tableName, recordId, oldValues = null, newValues = null, ipAddress = null) => {
  try {
    const connection = await pool.getConnection();
    await connection.execute(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        tableName,
        recordId,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress,
      ]
    );
    connection.release();
  } catch (error) {
    console.error('Audit logging error:', error);
  }
};

const auditLogMiddleware = (req, res, next) => {
  const originalSend = res.send;
  req.auditLog = auditLog;

  res.send = function (data) {
    res.send = originalSend;
    return res.send(data);
  };

  next();
};

module.exports = { auditLog, auditLogMiddleware };
