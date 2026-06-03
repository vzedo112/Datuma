const express = require('express');
const { requireUser, getUserId, getUserPlan } = require('../middleware/auth');
const { getPlan } = require('../services/plans');
const db = require('../db');

const router = express.Router();

const TEAM_PLANS = new Set(['team', 'enterprise']);

function isValidEmail(s) {
  if (typeof s !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

async function planFor(req) {
  const planKey = await getUserPlan(req);
  return { planKey, plan: getPlan(planKey) };
}

// GET /api/team/members
// Returns pending invites + (stub) accepted-seat count. Team plan only.
router.get('/members', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const { planKey, plan } = await planFor(req);
    if (!TEAM_PLANS.has(planKey)) {
      return res.json({
        allowed: false,
        planKey,
        seatLimit: plan.seats ?? 1,
        invites: [],
      });
    }

    if (!db.isReady()) {
      return res.json({
        allowed: true,
        planKey,
        seatLimit: plan.seats ?? null,
        invites: [],
        persistenceWarning: true,
      });
    }

    const r = await db.query(
      `SELECT id, email, status, created_at, responded_at
         FROM team_invites
        WHERE inviter_id = $1
        ORDER BY created_at DESC
        LIMIT 100`,
      [userId]
    );

    res.json({
      allowed: true,
      planKey,
      seatLimit: plan.seats ?? null,
      invites: r.rows,
    });
  } catch (err) {
    console.error('Team members error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/team/invite
// Body: { email }
// Records a pending invite. The actual invitation email + sign-up linkage
// is wired by the email notification service; this endpoint is the
// persistence + listing layer the UI depends on.
router.post('/invite', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const { planKey, plan } = await planFor(req);
    if (!TEAM_PLANS.has(planKey)) {
      return res.status(402).json({
        error: 'Team invites are a Team-plan feature. Upgrade to invite teammates.',
        code: 'TEAM_REQUIRES_UPGRADE',
        currentPlan: planKey,
      });
    }

    const email = (req.body?.email || '').toString().trim().toLowerCase();
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'A valid email is required.' });
    }

    if (!db.isReady()) {
      return res
        .status(503)
        .json({ error: 'Persistence unavailable — try again in a moment.' });
    }

    // Seat cap: count pending + (eventually) accepted, including the owner.
    const countR = await db.query(
      `SELECT COUNT(*)::int AS n
         FROM team_invites
        WHERE inviter_id = $1
          AND status IN ('pending', 'accepted')`,
      [userId]
    );
    const used = (countR.rows[0]?.n ?? 0) + 1; // +1 for the owner themselves
    if (Number.isFinite(plan.seats) && used >= plan.seats) {
      return res.status(402).json({
        error: `You're at the ${plan.seats}-seat limit for the ${plan.name} plan. Remove a pending invite or contact us about a larger plan.`,
        code: 'SEAT_LIMIT_HIT',
        seatLimit: plan.seats,
      });
    }

    try {
      const r = await db.query(
        `INSERT INTO team_invites (inviter_id, email, status)
         VALUES ($1, $2, 'pending')
         RETURNING id, email, status, created_at, responded_at`,
        [userId, email]
      );
      // Email send happens via emailService.sendTeamInvite (best-effort).
      try {
        const { sendTeamInvite } = require('../services/email');
        await sendTeamInvite({ inviterId: userId, toEmail: email });
      } catch (sendErr) {
        console.warn('[team] invite email skipped:', sendErr.message);
      }
      res.status(201).json({ invite: r.rows[0] });
    } catch (insertErr) {
      // Unique index violation = already-pending invite.
      if (insertErr.code === '23505') {
        return res
          .status(409)
          .json({ error: 'That email already has a pending invite.' });
      }
      throw insertErr;
    }
  } catch (err) {
    console.error('Team invite error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/invite/:id', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid invite id' });
    }
    if (!db.isReady()) {
      return res.status(503).json({ error: 'Persistence unavailable' });
    }
    const r = await db.query(
      `UPDATE team_invites
          SET status = 'revoked', responded_at = NOW()
        WHERE id = $1 AND inviter_id = $2 AND status = 'pending'
        RETURNING id`,
      [id, userId]
    );
    if (r.rowCount === 0) {
      return res.status(404).json({ error: 'Not found or already responded' });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Revoke invite error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
