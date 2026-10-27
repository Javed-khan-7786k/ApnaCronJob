import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ['Owner', 'Admin', 'Editor', 'Viewer'],
      default: 'Editor',
    },
    status: {
      type: String,
      enum: ['Active', 'Invited'],
      default: 'Active',
    },
    initials: {
      type: String,
      default: '',
    },
    workspaceId: {
      type: String,
      default: 'default_workspace',
    },
    invitedBy: {
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

teamMemberSchema.virtual('id').get(function () {
  return this._id ? this._id.toString() : '';
});

export const TeamMember = mongoose.model('TeamMember', teamMemberSchema);
export default TeamMember;
