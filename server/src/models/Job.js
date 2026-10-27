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
  }
);

// Compound index for scheduler claiming
jobSchema.index({ enabled: 1, nextRunAt: 1 });
jobSchema.index({ tags: 1 });

export const Job = mongoose.model('Job', jobSchema);
export default Job;
