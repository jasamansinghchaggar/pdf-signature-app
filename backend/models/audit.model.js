import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: [true, 'Document reference is required']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    action: {
        type: String,
        enum: ['upload', 'view', 'sign', 'download', 'share', 'delete'],
        required: [true, 'Action is required']
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, {
    timestamps: true
});

// Index for better query performance
auditSchema.index({ documentId: 1, createdAt: -1 });
auditSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Audit', auditSchema);
