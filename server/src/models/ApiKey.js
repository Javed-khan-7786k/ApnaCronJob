import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    prefix: {
      type: String,
      required: true,
      index: true,
    },
    keyHash: {
      type: String,
      required: true,
    },
    scopes: {
      type: [String],
      default: ['jobs:read', 'jobs:write', 'runs:dispatch'],
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

apiKeySchema.virtual('id').get(function () {
  return this._id ? this._id.toString() : '';
});

apiKeySchema.virtual('createdMinutesAgo').get(function () {
  if (!this.createdAt) return 0;
  return Math.max(0, Math.round((Date.now() - new Date(this.createdAt).getTime()) / 60000));
});

apiKeySchema.virtual('lastUsedMinutesAgo').get(function () {
  if (!this.lastUsedAt) return null;
  return Math.max(0, Math.round((Date.now() - new Date(this.lastUsedAt).getTime()) / 60000));
});

export const ApiKey = mongoose.model('ApiKey', apiKeySchema);
export default ApiKey;
