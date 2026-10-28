import mongoose from 'mongoose';

const executionSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    jobName: {
      type: String,
      default: '',
    },
    occurrenceId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'retrying'],
      default: 'pending',
      index: true,
    },
    triggerSource: {
      type: String,
      enum: ['scheduler', 'manual', 'tick', 'telegram', 'retry'],
      default: 'scheduler',
    },
    scheduledFor: {
      type: Date,
      required: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 10,
    },
    nextRetryAt: {
      type: Date,
      default: null,
      index: true,
    },
    requestDetails: {
      url: String,
      method: String,
      headers: mongoose.Schema.Types.Mixed,
      body: String,
    },
    responseStatus: {
      type: Number,
      default: null,
    },
    responseHeaders: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    responseBody: {
      type: String,
      default: '',
    },
    responseTruncated: {
      type: Boolean,
      default: false,
    },
    errorDetails: {
      message: { type: String, default: '' },
      code: { type: String, default: '' },
      stack: { type: String, default: '' },
    },
    workerId: {
      type: String,
      default: null,
    },
    lockedUntil: {
      type: Date,
      default: null,
      index: true,
    },
    logs: [
      {
        timestamp: { type: Date, default: Date.now },
        level: { type: String, default: 'INFO' },
        message: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual getters for frontend compatibility
executionSchema.virtual('id').get(function () {
  return this._id ? this._id.toString() : '';
});

executionSchema.virtual('httpStatus').get(function () {
  return this.responseStatus;
});

executionSchema.virtual('attempt').get(function () {
  return this.attemptCount || 1;
});

executionSchema.virtual('errorDetail').get(function () {
  return this.errorDetails?.message || null;
});

executionSchema.virtual('startedMinutesAgo').get(function () {
  const time = this.startedAt || this.createdAt;
  if (!time) return 0;
  return Math.max(0, Math.round((Date.now() - new Date(time).getTime()) / 60000));
});

// Indexes for fast querying & worker queue processing
executionSchema.index({ status: 1, scheduledFor: 1 });
executionSchema.index({ status: 1, nextRetryAt: 1 });
executionSchema.index({ status: 1, lockedUntil: 1 });
executionSchema.index({ createdAt: -1 });

export const Execution = mongoose.model('Execution', executionSchema);
export default Execution;
