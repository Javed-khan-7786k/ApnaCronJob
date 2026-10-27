import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Webhooks', 'Messaging', 'Incident', 'Data', 'DevOps'],
      default: 'Webhooks',
    },
    description: {
      type: String,
      default: '',
    },
    connected: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      enum: ['slack', 'discord', 'teams', 'pagerduty', 'zapier', 'github', 'linear', 'webhook'],
      default: 'webhook',
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

integrationSchema.virtual('id').get(function () {
  return this._id ? this._id.toString() : '';
});

export const Integration = mongoose.model('Integration', integrationSchema);
export default Integration;
