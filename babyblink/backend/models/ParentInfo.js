import mongoose from 'mongoose';

const ParentInfoSchema = new mongoose.Schema({
  parentId: { type: String, required: true, unique: true, index: true },
  pediatrician: { type: String },
  emergencyNumber: { type: String },
  poisonControl: { type: String },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: false
});

const ParentInfo = mongoose.models.ParentInfo || mongoose.model('ParentInfo', ParentInfoSchema);
export default ParentInfo;
