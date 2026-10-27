import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import env from '../config/env.js';

export async function hashPassword(plainText) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function comparePassword(plainText, hash) {
  if (!plainText || !hash) return false;
  return bcrypt.compare(plainText, hash);
}

export function signToken(payload, expiresIn = env.JWT_EXPIRES_IN) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function generateOccurrenceId(jobId, dateObj) {
  const isoTime = new Date(dateObj).toISOString();
  return `${jobId}_${isoTime}`;
}

export function generateRandomHex(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}
