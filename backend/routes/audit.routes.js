import { Router } from 'express';
import documentController from '../controllers/document.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const auditRouter = Router();

// All routes require authentication
auditRouter.use(authenticateToken);

// Audit routes
auditRouter.get('/:docId', documentController.getDocumentAudit);

export default auditRouter;
