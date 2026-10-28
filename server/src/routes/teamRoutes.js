import express from 'express';
import TeamMember from '../models/TeamMember.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';

const router = express.Router();

// GET /api/team
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const query = req.user && req.user.role !== 'admin' ? { invitedBy: req.user._id } : {};
    const members = await TeamMember.find(query).sort({ createdAt: 1 });
    res.json({ success: true, data: members });
  } catch (err) {
    next(err);
  }
});

const VALID_ROLES = ['Owner', 'Admin', 'Editor', 'Viewer'];

// POST /api/team/invite
router.post('/invite', authenticateToken, async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'viewer') {
      return res.status(403).json({ success: false, error: 'Forbidden: Viewer cannot invite team members.' });
    }

    const { name, email, role = 'Editor' } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required.' });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, error: `Invalid role. Allowed roles: ${VALID_ROLES.join(', ')}` });
    }

    const initials = name
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'TM';

    const member = await TeamMember.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      status: 'Invited',
      initials,
      invitedBy: req.user._id,
    });

    await logAuditEvent({
      userId: req.user._id,
      username: req.user.username,
      action: 'TEAM_MEMBER_INVITE',
      targetType: 'user',
      targetId: member._id,
      details: { name: member.name, email: member.email, role: member.role },
      ip: req.ip,
    });

    res.status(201).json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/team/:id
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'viewer') {
      return res.status(403).json({ success: false, error: 'Forbidden: Viewer cannot remove team members.' });
    }

    const filter = { _id: req.params.id };
    if (req.user && req.user.role !== 'admin') {
      filter.invitedBy = req.user._id;
    }
    const member = await TeamMember.findOneAndDelete(filter);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Team member not found' });
    }

    await logAuditEvent({
      userId: req.user._id,
      username: req.user.username,
      action: 'TEAM_MEMBER_REMOVE',
      targetType: 'user',
      targetId: req.params.id,
      details: { name: member.name, email: member.email },
      ip: req.ip,
    });

    res.json({ success: true, message: `Member "${member.name}" removed successfully` });
  } catch (err) {
    next(err);
  }
});

// PUT /api/team/:id/role
router.put('/:id/role', authenticateToken, async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'viewer') {
      return res.status(403).json({ success: false, error: 'Forbidden: Viewer cannot change member roles.' });
    }

    const { role } = req.body;
    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, error: `Invalid role. Allowed roles: ${VALID_ROLES.join(', ')}` });
    }

    const filter = { _id: req.params.id };
    if (req.user && req.user.role !== 'admin') {
      filter.invitedBy = req.user._id;
    }

    const member = await TeamMember.findOneAndUpdate(
      filter,
      { role },
      { new: true, runValidators: true }
    );
    if (!member) {
      return res.status(404).json({ success: false, error: 'Team member not found' });
    }
    res.json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
});

export default router;
