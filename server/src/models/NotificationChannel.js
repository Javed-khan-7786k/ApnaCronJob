import mongoose from 'mongoose';

const notificationChannelSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['email', 'webhook', 'slack', 'discord', 'telegram'],
      required: true,
      default: 'webhook',
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    target: {
      type: String,
      required: true,
      trim: true,
    },
    events: [{
      type: String,
      enum: ['failures', 'retries', 'recovers', 'warnings'],
      default: ['failures', 'retries'],
    }],
    enabled: {
      type: Boolean,
      default: true,
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

notificationChannelSchema.virtual('id').get(function () {
  return this._id ? this._id.toString() : '';
});

export const NotificationChannel = mongoose.model('NotificationChannel', notificationChannelSchema);
export default NotificationChannel;
