import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    workspaceName: {
      type: String,
      default: 'Production Infrastructure',
    },
    supportEmail: {
      type: String,
      default: 'engineering@acme.dev',
    },
    defaultTimeout: {
      type: Number,
      default: 30,
    },
    retentionDays: {
      type: Number,
      default: 30,
    },
  },
  {
    timestamps: true,
  }
);

export const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
