import mongoose from 'mongoose';

const signatureSchema = new mongoose.Schema({
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
    pageNumber: {
        type: Number,
        required: [true, 'Page number is required'],
        min: [1, 'Page number must be at least 1']
    },
    position: {
        x: {
            type: Number,
            required: [true, 'X position is required']
        },
        y: {
            type: Number,
            required: [true, 'Y position is required']
        },
        width: {
            type: Number,
            required: [true, 'Width is required']
        },
        height: {
            type: Number,
            required: [true, 'Height is required']
        }
    },
    signatureType: {
        type: String,
        enum: ['text', 'image', 'draw'],
        required: [true, 'Signature type is required']
    },
    signatureData: {
        type: String,
        required: [true, 'Signature data is required']
    },
    isFinalized: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for better query performance
signatureSchema.index({ documentId: 1, userId: 1 });
signatureSchema.index({ documentId: 1, pageNumber: 1 });

export default mongoose.model('Signature', signatureSchema);
