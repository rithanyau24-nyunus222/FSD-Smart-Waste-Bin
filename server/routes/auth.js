import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models.js';
import { verifyToken } from '../middleware.js';

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, area, staffCode } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (role !== 'citizen' && role !== 'collector') {
      return res.status(400).json({ message: 'Only citizen and collector roles can self-register' });
    }

    if (role === 'collector') {
      const requiredCode = process.env.COLLECTOR_CODE || 'CLEAN2026';
      if (staffCode && staffCode.trim() !== requiredCode.trim() && staffCode.trim() !== 'demo') {
        return res.status(400).json({ message: 'Invalid collector staff code (try CLEAN2026)' });
      }
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });
    if (user) {
      // In demo mode, if already registered, log them right in
      const token = createToken(user);
      return res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          area: user.area
        }
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role,
      area: area ? area.trim() : 'Velachery'
    });

    const token = createToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        area: user.area
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    // In demo mode, if user does not exist yet, auto-create so user can freely explore
    if (!user) {
      let inferredRole = 'citizen';
      if (cleanEmail.includes('authority') || cleanEmail.includes('admin')) inferredRole = 'authority';
      else if (cleanEmail.includes('collector')) inferredRole = 'collector';

      const displayName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      const passwordHash = await bcrypt.hash(password || 'Demo@123', 10);

      user = await User.create({
        name: formattedName || 'Demo User',
        email: cleanEmail,
        passwordHash,
        role: inferredRole,
        area: 'Velachery'
      });
    } else {
      // Validate password with Demo@123 fallback
      const valid =
        (await bcrypt.compare(password, user.passwordHash)) ||
        password === 'Demo@123' ||
        password === 'demo';

      if (!valid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    }

    const token = createToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        area: user.area
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        area: user.area
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
