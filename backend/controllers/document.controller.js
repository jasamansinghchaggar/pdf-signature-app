import documentService from '../services/document.service.js';

class DocumentController {
    // Upload PDF document
    async uploadDocument(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const { title } = req.body;
            const auditData = {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            };

            const document = await documentService.uploadDocument(
                req.file, 
                req.user._id, 
                title, 
                auditData
            );

            res.status(201).json({
                success: true,
                message: 'Document uploaded successfully',
                data: { document }
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get all user documents
    async getUserDocuments(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await documentService.getUserDocuments(req.user._id, page, limit);

            res.status(200).json({
                success: true,
                message: 'Documents retrieved successfully',
                data: result
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get specific document
    async getDocument(req, res) {
        try {
            const { id } = req.params;
            const auditData = {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            };

            const document = await documentService.getDocument(id, req.user._id, auditData);

            res.status(200).json({
                success: true,
                message: 'Document retrieved successfully',
                data: { document }
            });

        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    // Download document file
    async downloadDocument(req, res) {
        try {
            const { id } = req.params;
            const fileData = await documentService.getDocumentFile(id, req.user._id);

            res.setHeader('Content-Type', fileData.mimeType);
            res.setHeader('Content-Disposition', `inline; filename="${fileData.filename}"`);
            
            res.sendFile(fileData.filePath, { root: process.cwd() });

        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    // Delete document
    async deleteDocument(req, res) {
        try {
            const { id } = req.params;
            const auditData = {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            };

            const result = await documentService.deleteDocument(id, req.user._id, auditData);

            res.status(200).json({
                success: true,
                message: result.message
            });

        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get document audit logs
    async getDocumentAudit(req, res) {
        try {
            const { docId } = req.params;
            const auditLogs = await documentService.getDocumentAudit(docId, req.user._id);

            res.status(200).json({
                success: true,
                message: 'Audit logs retrieved successfully',
                data: { auditLogs }
            });

        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }
}

export default new DocumentController();
