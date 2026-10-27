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
      index: true,
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
  }
);

// Indexes for fast querying & worker queue processing
executionSchema.index({ status: 1, scheduledFor: 1 });
executionSchema.index({ status: 1, nextRetryAt: 1 });
executionSchema.index({ status: 1, lockedUntil: 1 });
executionSchema.index({ createdAt: -1 });

export const Execution = mongoose.model('Execution', executionSchema);
export default Execution;
