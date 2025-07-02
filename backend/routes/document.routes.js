import { Router } from 'express';
import documentController from '../controllers/document.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import upload from '../config/multer.config.js';

const documentRouter = Router();

// All routes require authentication
documentRouter.use(authenticateToken);

// Document routes
documentRouter.post('/upload', upload.single('pdf'), documentController.uploadDocument);
documentRouter.get('/', documentController.getUserDocuments);
documentRouter.get('/:id', documentController.getDocument);
documentRouter.get('/:id/download', documentController.downloadDocument);
documentRouter.delete('/:id', documentController.deleteDocument);

export default documentRouter;
