import mongoose from 'mongoose';

const systemLockSchema = new mongoose.Schema(
  {
    lockName: {
      type: String,
      required: true,
      unique: true,
    },
    lockedBy: {
      type: String,
      required: true,
    },
    lockedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically prune expired locks
systemLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SystemLock = mongoose.model('SystemLock', systemLockSchema);
export default SystemLock;
