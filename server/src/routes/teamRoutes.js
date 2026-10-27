import express from 'express';
import TeamMember from '../models/TeamMember.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';

const router = express.Router();

const INITIAL_TEAM = [
  {
    name: 'Alex Rivera',
    email: 'alex@acme.dev',
    role: 'Owner',
    status: 'Active',
    initials: 'AR',
  },
  {
    name: 'Priya Sharma',
    email: 'priya@acme.dev',
    role: 'Admin',
    status: 'Active',
    initials: 'PS',
  },
  {
    name: 'Marcus Chen',
    email: 'marcus@acme.dev',
    role: 'Editor',
    status: 'Active',
    initials: 'MC',
  },
];

// GET /api/team
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const query = req.user && req.user.role !== 'admin' ? { invitedBy: req.user._id } : {};
    let members = await TeamMember.find(query).sort({ createdAt: 1 });

    if (members.length === 0) {
      members = await TeamMember.create(
        INITIAL_TEAM.map(m => ({ ...m, invitedBy: req.user._id }))
      );
    }

    res.json({ success: true, data: members });
  } catch (err) {
    next(err);
  }
});

// POST /api/team/invite
router.post('/invite', authenticateToken, async (req, res, next) => {
  try {
    const { name, email, role = 'Editor' } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required.' });
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
    const { role } = req.body;
    const member = await TeamMember.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
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
