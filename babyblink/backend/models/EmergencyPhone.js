import mongoose from 'mongoose';

const EmergencyPhoneSchema = new mongoose.Schema({
  parentId: { type: String, required: true, index: true },
  phoneNumber: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: false
});

const EmergencyPhone = mongoose.models.EmergencyPhone || mongoose.model('EmergencyPhone', EmergencyPhoneSchema);
export default EmergencyPhone;
