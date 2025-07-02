import { Router } from 'express';
import signatureController from '../controllers/signature.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import upload from '../config/multer.config.js';

const signatureRouter = Router();

// All routes require authentication
signatureRouter.use(authenticateToken);

// Signature routes
signatureRouter.post('/', signatureController.saveSignature);
signatureRouter.get('/:id', signatureController.getDocumentSignatures);
signatureRouter.post('/finalize', signatureController.finalizeSignatures);
signatureRouter.delete('/:id', signatureController.deleteSignature);
signatureRouter.post('/embed', upload.single('signature'), signatureController.embedSignature);

export default signatureRouter;
