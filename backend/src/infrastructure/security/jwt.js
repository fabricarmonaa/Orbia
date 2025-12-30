import jwt from 'jsonwebtoken';

export function signToken(payload, options = {}) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h', ...options });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}
