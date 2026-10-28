import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    targetUrl: {
      type: String,
      required: true,
      trim: true,
    },
    httpMethod: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'],
      default: 'GET',
      uppercase: true,
    },
    headers: {
      type: Map,
      of: String,
      default: {},
    },
    headersList: [{
      key: { type: String, default: '' },
      value: { type: String, default: '' },
    }],
    authMode: {
      type: String,
      enum: ['none', 'bearer', 'basic', 'header'],
      default: 'none',
    },
    authToken: {
      type: String,
      default: '',
    },
    hasBody: {
      type: Boolean,
      default: false,
    },
    body: {
      type: String,
      default: '',
    },
    queryParams: {
      type: Map,
      of: String,
      default: {},
    },
    expectedStatusCodes: {
      type: [Number],
      default: [200, 201, 202, 204],
    },
    responseValidation: {
      containsText: { type: String, default: '' },
      jsonPath: { type: String, default: '' },
      expectedValue: { type: String, default: '' },
    },
    scheduleType: {
      type: String,
      enum: ['once', 'daily', 'weekly', 'monthly', 'custom'],
      required: true,
      default: 'daily',
    },
    scheduleTime: {
      type: String, // HH:mm format (e.g. "09:30")
      default: '00:00',
    },
    daysOfWeek: {
      type: [Number], // 0 (Sunday) to 6 (Saturday)
      default: [],
    },
    daysOfMonth: {
      type: [Number], // 1 to 31
      default: [],
    },
    customCron: {
      type: String, // e.g. "*/15 * * * *"
      default: '',
    },
    cronExpression: {
      type: String,
      default: '',
    },
    oneTimeRunAt: {
      type: Date,
      default: null,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'running', 'retrying', 'failed'],
      default: 'active',
    },
    nextRunAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    lastStatus: {
      type: String,
      enum: ['never_run', 'success', 'failure', 'running', 'retrying'],
      default: 'never_run',
    },
    lastHttpStatus: {
      type: Number,
      default: null,
    },
    lastDurationMs: {
      type: Number,
      default: null,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    timeoutMs: {
      type: Number,
      default: 30000, // 30 seconds
      min: 1000,
      max: 120000,
    },
    retryPolicy: {
      maxAttempts: {
        type: Number,
        default: 10,
        min: 1,
        max: 10,
      },
      delaySeconds: {
        type: Number,
        default: 5,
        min: 1,
        max: 3600,
      },
      strategy: {
        type: String,
        enum: ['fixed', 'exponential'],
        default: 'fixed',
      },
      retryOnHttp5xx: {
        type: Boolean,
        default: true,
      },
      retryOn429: {
        type: Boolean,
        default: true,
      },
      retryOnNetworkError: {
        type: Boolean,
        default: true,
      },
    },
    misfirePolicy: {
      type: String,
      enum: ['skip', 'run-once', 'run-all'],
      default: 'run-once',
    },
    notifyEmail: {
      type: Boolean,
      default: true,
    },
    notifyWebhook: {
      type: Boolean,
      default: false,
    },
    notificationSettings: {
      notifyOnSuccess: {
        type: Boolean,
        default: false,
      },
      notifyOnFailure: {
        type: Boolean,
        default: true,
      },
      notifyOnRetryExhausted: {
        type: Boolean,
        default: true,
      },
      telegramChatId: {
        type: String,
        default: '',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual getters for frontend compatibility
jobSchema.virtual('id').get(function () {
  return this._id ? this._id.toString() : '';
});

jobSchema.virtual('url').get(function () {
  return this.targetUrl;
});

jobSchema.virtual('method').get(function () {
  return this.httpMethod;
});

jobSchema.virtual('cron').get(function () {
  if (this.scheduleType === 'once') return null;
  return this.cronExpression || this.customCron || '0 0 * * *';
});

jobSchema.virtual('timeoutSeconds').get(function () {
  return Math.round((this.timeoutMs || 30000) / 1000);
});

jobSchema.virtual('maxRetries').get(function () {
  return typeof this.retryPolicy?.maxAttempts === 'number' ? this.retryPolicy.maxAttempts : 10;
});

jobSchema.virtual('retryBackoff').get(function () {
  return this.retryPolicy?.strategy || 'fixed';
});

jobSchema.virtual('lastRunMinutesAgo').get(function () {
  if (!this.lastRunAt) return null;
  return Math.max(0, Math.round((Date.now() - new Date(this.lastRunAt).getTime()) / 60000));
});

// Compound index for scheduler claiming
jobSchema.index({ enabled: 1, nextRunAt: 1 });
jobSchema.index({ tags: 1 });

export const Job = mongoose.model('Job', jobSchema);
export default Job;
