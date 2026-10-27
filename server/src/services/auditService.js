import AuditLog from '../models/AuditLog.js';
import logger from '../config/logger.js';

export async function logAuditEvent({
  userId = null,
  username = 'system',
  action,
  targetType = 'system',
  targetId = null,
  details = {},
  ip = '',
}) {
  try {
    await AuditLog.create({
      userId,
      username,
      action,
      targetType,
      targetId: targetId ? String(targetId) : null,
      details,
      ip,
    });
  } catch (err) {
    logger.warn('Failed to record audit log', { error: err.message, action });
  }
}
