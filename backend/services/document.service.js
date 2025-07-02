import Document from '../models/document.model.js';
import Signature from '../models/signature.model.js';
import Audit from '../models/audit.model.js';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

class DocumentService {
    // Upload a new document
    async uploadDocument(file, userId, title, auditData) {
        try {
            // Read PDF to get page count
            const pdfBuffer = fs.readFileSync(file.path);
            const pdfDoc = await PDFDocument.load(pdfBuffer);
            const pageCount = pdfDoc.getPageCount();

            // Create document record
            const document = new Document({
                title: title || file.originalname,
                filename: file.filename,
                originalName: file.originalname,
                filePath: file.path,
                fileSize: file.size,
                mimeType: file.mimetype,
                pageCount: pageCount,
                uploadedBy: userId
            });

            await document.save();

            // Create audit log
            await this.createAuditLog(document._id, userId, 'upload', 
                `Document "${document.title}" uploaded successfully`, 
                { fileSize: file.size, pageCount }, auditData);

            return document;
        } catch (error) {
            // Clean up file if document creation fails
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            throw error;
        }
    }

    // Get all documents for a user
    async getUserDocuments(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        
        const documents = await Document.find({ 
            uploadedBy: userId, 
            isDeleted: false 
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'name email');

        const total = await Document.countDocuments({ 
            uploadedBy: userId, 
            isDeleted: false 
        });

        return {
            documents,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: documents.length,
                totalDocuments: total
            }
        };
    }

    // Get a specific document
    async getDocument(documentId, userId, auditData) {
        const document = await Document.findOne({
            _id: documentId,
            uploadedBy: userId,
            isDeleted: false
        }).populate('uploadedBy', 'name email');

        if (!document) {
            throw new Error('Document not found');
        }

        // Create audit log for viewing
        await this.createAuditLog(documentId, userId, 'view', 
            `Document "${document.title}" viewed`, {}, auditData);

        return document;
    }

    // Delete a document
    async deleteDocument(documentId, userId, auditData) {
        const document = await Document.findOne({
            _id: documentId,
            uploadedBy: userId,
            isDeleted: false
        });

        if (!document) {
            throw new Error('Document not found');
        }

        try {
            // Find all signatures associated with this document
            const signatures = await Signature.find({ documentId });
            
            // Delete each signature file and record
            for (const signature of signatures) {
                if (signature.signatureType === 'image' && signature.signatureData) {
                    // Extract the file path
                    const signatureFilePath = path.join(process.cwd(), signature.signatureData);
                    
                    // Delete the signature file if it exists
                    if (fs.existsSync(signatureFilePath)) {
                        try {
                            fs.unlinkSync(signatureFilePath);
                            console.log(`Deleted signature file: ${signatureFilePath}`);
                        } catch (error) {
                            console.error(`Error deleting signature file: ${signatureFilePath}`, error);
                        }
                    }
                }
            }
            
            // Delete all signature records for this document
            const deleteResult = await Signature.deleteMany({ documentId });
            console.log(`Deleted ${deleteResult.deletedCount} signature records for document ${documentId}`);
        } catch (error) {
            console.error(`Error deleting signatures for document ${documentId}:`, error);
            // Continue with document deletion even if signatures can't be deleted
        }

        // Remove document file from disk
        if (fs.existsSync(document.filePath)) {
            fs.unlinkSync(document.filePath);
        }

        // Remove document from DB
        await Document.deleteOne({ _id: documentId });

        // Create audit log
        await this.createAuditLog(documentId, userId, 'delete', 
            `Document "${document.title}" deleted with ${signatures.length} signatures`, 
            { signaturesRemoved: signatures.length }, 
            auditData);

        return { message: 'Document and all associated signatures deleted successfully' };
    }

    // Get document file
    async getDocumentFile(documentId, userId) {
        const document = await Document.findOne({
            _id: documentId,
            uploadedBy: userId,
            isDeleted: false
        });

        if (!document) {
            throw new Error('Document not found');
        }

        if (!fs.existsSync(document.filePath)) {
            throw new Error('File not found on server');
        }

        return {
            filePath: document.filePath,
            filename: document.originalName,
            mimeType: document.mimeType
        };
    }

    // Create audit log
    async createAuditLog(documentId, userId, action, description, metadata = {}, auditData = {}) {
        const audit = new Audit({
            documentId,
            userId,
            action,
            description,
            metadata,
            ipAddress: auditData.ip,
            userAgent: auditData.userAgent
        });

        await audit.save();
        return audit;
    }

    // Get audit logs for a document
    async getDocumentAudit(documentId, userId) {
        const document = await Document.findOne({
            _id: documentId,
            uploadedBy: userId,
            isDeleted: false
        });

        if (!document) {
            throw new Error('Document not found');
        }

        const auditLogs = await Audit.find({ documentId })
            .sort({ createdAt: -1 })
            .populate('userId', 'name email');

        return auditLogs;
    }
}

// Note: Soft delete logic removed. Now hard delete removes file and DB record.

export default new DocumentService();
