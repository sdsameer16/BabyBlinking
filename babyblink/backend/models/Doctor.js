import mongoose from 'mongoose';

const DoctorSchema = new mongoose.Schema({
  parentId: { type: String, required: true, index: true },
  doctorName: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: false
});

const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
export default Doctor;
