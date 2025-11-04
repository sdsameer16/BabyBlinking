import mongoose from 'mongoose';

const HospitalSchema = new mongoose.Schema({
  parentId: { type: String, required: true, index: true },
  hospitalName: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: false
});

const Hospital = mongoose.models.Hospital || mongoose.model('Hospital', HospitalSchema);
export default Hospital;
