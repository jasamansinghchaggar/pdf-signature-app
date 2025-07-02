import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Document title is required'],
        trim: true,
        maxlength: [100, 'Title must not exceed 100 characters']
    },
    filename: {
        type: String,
        required: [true, 'Filename is required']
    },
    originalName: {
        type: String,
        required: [true, 'Original filename is required']
    },
    filePath: {
        type: String,
        required: [true, 'File path is required']
    },
    fileSize: {
        type: Number,
        required: [true, 'File size is required']
    },
    mimeType: {
        type: String,
        required: [true, 'MIME type is required'],
        validate: {
            validator: function(v) {
                return v === 'application/pdf';
            },
            message: 'Only PDF files are allowed'
        }
    },
    pageCount: {
        type: Number,
        default: 0
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    },
    status: {
        type: String,
        enum: ['uploaded', 'signing', 'signed', 'completed'],
        default: 'uploaded'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for better query performance
documentSchema.index({ uploadedBy: 1, createdAt: -1 });
documentSchema.index({ status: 1 });

export default mongoose.model('Document', documentSchema);
