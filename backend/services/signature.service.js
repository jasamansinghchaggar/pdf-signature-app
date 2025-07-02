import Signature from '../models/signature.model.js';
import Document from '../models/document.model.js';
import Audit from '../models/audit.model.js';
import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';

class SignatureService {
    // Save signature position
    async saveSignature(signatureData, userId, auditData) {
        const { documentId, pageNumber, position, signatureType, signatureData: sigData } = signatureData;

        // Verify document exists and belongs to user
        const document = await Document.findOne({
            _id: documentId,
            uploadedBy: userId,
            isDeleted: false
        });

        if (!document) {
            throw new Error('Document not found');
        }

        // Verify page number is valid
        if (pageNumber > document.pageCount || pageNumber < 1) {
            throw new Error('Invalid page number');
        }

        // Create signature record
        const signature = new Signature({
            documentId,
            userId,
            pageNumber,
            position,
            signatureType,
            signatureData: sigData
        });

        await signature.save();

        // Update document status
        document.status = 'signing';
        await document.save();

        // Create audit log
        await this.createAuditLog(documentId, userId, 'sign', 
            `Signature added to page ${pageNumber}`, 
            { pageNumber, signatureType, position }, auditData);

        return signature;
    }

    // Get signatures for a document
    async getDocumentSignatures(documentId, userId) {
        // Verify document exists and belongs to user
        const document = await Document.findOne({
            _id: documentId,
            uploadedBy: userId,
            isDeleted: false
        });

        if (!document) {
            throw new Error('Document not found');
        }

        const signatures = await Signature.find({ documentId })
            .sort({ pageNumber: 1, createdAt: 1 })
            .populate('userId', 'name email');

        return signatures;
    }

    // Finalize signatures - embed them into the PDF
    async finalizeSignatures(documentId, userId, auditData) {
        // Verify document exists and belongs to user
        const document = await Document.findOne({
            _id: documentId,
            uploadedBy: userId,
            isDeleted: false
        });

        if (!document) {
            throw new Error('Document not found');
        }

        // Get all signatures for this document
        const signatures = await Signature.find({ 
            documentId, 
            isFinalized: false 
        });

        if (signatures.length === 0) {
            throw new Error('No signatures found to finalize');
        }

        // Load the PDF
        const pdfBuffer = fs.readFileSync(document.filePath);
        const pdfDoc = await PDFDocument.load(pdfBuffer);

        // Process each signature
        for (const signature of signatures) {
            const page = pdfDoc.getPage(signature.pageNumber - 1);
            const { x, y, width, height } = signature.position;

            // Add signature based on type
            if (signature.signatureType === 'text') {
                page.drawText(signature.signatureData, {
                    x: x,
                    y: page.getHeight() - y - height, // PDF coordinates are bottom-up
                    size: height * 0.8,
                    color: rgb(0, 0, 0)
                });
            }
            // TODO: Handle 'image' and 'draw' signature types

            // Mark signature as finalized
            signature.isFinalized = true;
            await signature.save();
        }

        // Save the modified PDF
        const pdfBytes = await pdfDoc.save();
        const newFilePath = document.filePath.replace('.pdf', '_signed.pdf');
        fs.writeFileSync(newFilePath, pdfBytes);

        // Update document
        document.filePath = newFilePath;
        document.status = 'signed';
        await document.save();

        // Create audit log
        await this.createAuditLog(documentId, userId, 'sign', 
            `Document finalized with ${signatures.length} signature(s)`, 
            { signatureCount: signatures.length }, auditData);

        return {
            message: 'Signatures finalized successfully',
            signatureCount: signatures.length,
            document
        };
    }

    // Delete a signature
    async deleteSignature(signatureId, userId, auditData) {
        const signature = await Signature.findById(signatureId);
        
        if (!signature) {
            throw new Error('Signature not found');
        }

        // Verify document belongs to user
        const document = await Document.findOne({
            _id: signature.documentId,
            uploadedBy: userId,
            isDeleted: false
        });

        if (!document) {
            throw new Error('Document not found');
        }

        if (signature.isFinalized) {
            throw new Error('Cannot delete finalized signature');
        }

        await Signature.findByIdAndDelete(signatureId);

        // Create audit log
        await this.createAuditLog(signature.documentId, userId, 'sign', 
            `Signature removed from page ${signature.pageNumber}`, 
            { pageNumber: signature.pageNumber }, auditData);

        return { message: 'Signature deleted successfully' };
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
}

export default new SignatureService();
