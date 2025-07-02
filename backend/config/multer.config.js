import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directories if they don't exist
const uploadsDocumentsDir = 'uploads/documents';
const uploadsSignaturesDir = 'uploads/signatures';

if (!fs.existsSync(uploadsDocumentsDir)) {
    fs.mkdirSync(uploadsDocumentsDir, { recursive: true });
}

if (!fs.existsSync(uploadsSignaturesDir)) {
    fs.mkdirSync(uploadsSignaturesDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'signature') {
            cb(null, uploadsSignaturesDir);
        } else {
            cb(null, uploadsDocumentsDir);
        }
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter to allow only PDFs or images
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'signature') {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG and PNG images are allowed for signatures!'), false);
        }
    } else if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed for documents!'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    }
});

export default upload;
