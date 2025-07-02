import signatureService from '../services/signature.service.js';
import Document from '../models/document.model.js';
import Signature from '../models/signature.model.js';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

class SignatureController {
    // Save signature position
    async saveSignature(req, res) {
        try {
            const auditData = {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            };

            const signature = await signatureService.saveSignature(
                req.body, 
                req.user._id, 
                auditData
            );

            res.status(201).json({
                success: true,
                message: 'Signature saved successfully',
                data: { signature }
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get signatures for a document
    async getDocumentSignatures(req, res) {
        try {
            const { id } = req.params;
            const signatures = await signatureService.getDocumentSignatures(id, req.user._id);

            res.status(200).json({
                success: true,
                message: 'Signatures retrieved successfully',
                data: { signatures }
            });

        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    // Finalize signatures - embed into PDF
    async finalizeSignatures(req, res) {
        try {
            const { documentId } = req.body;
            const auditData = {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            };

            const result = await signatureService.finalizeSignatures(
                documentId, 
                req.user._id, 
                auditData
            );

            res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    signatureCount: result.signatureCount,
                    document: result.document
                }
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Delete a signature
    async deleteSignature(req, res) {
        try {
            const { id } = req.params;
            const auditData = {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            };

            const result = await signatureService.deleteSignature(id, req.user._id, auditData);

            res.status(200).json({
                success: true,
                message: result.message
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Embed signature in PDF
    async embedSignature(req, res) {
        try {
            const { documentId, pageNumber, x, y, width, height, xPercent, yPercent, widthPercent, heightPercent } = req.body;
            const signatureFile = req.file;
            
            if (!signatureFile) {
                return res.status(400).json({ success: false, message: 'No signature image uploaded' });
            }
            
            // Find the document
            const document = await Document.findById(documentId);
            if (!document) {
                return res.status(404).json({ success: false, message: 'Document not found' });
            }
            
            // Load PDF
            const pdfBytes = fs.readFileSync(document.filePath);
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const page = pdfDoc.getPage(Number(pageNumber) - 1);
            
            // Get page dimensions
            const { width: pageWidth, height: pageHeight } = page.getSize();
            
            // Embed signature image
            const imgBytes = fs.readFileSync(signatureFile.path);
            let img;
            if (signatureFile.mimetype === 'image/png') {
                img = await pdfDoc.embedPng(imgBytes);
            } else {
                img = await pdfDoc.embedJpg(imgBytes);
            }
            
            // Calculate coordinates based on percentage if available, otherwise use pixel coordinates
            let finalX, finalY, finalWidth, finalHeight;
            let positionData = {};
            
            if (xPercent !== undefined && yPercent !== undefined) {
                // Use percentage coordinates (more accurate)
                finalX = (Number(xPercent) / 100) * pageWidth;
                finalY = (Number(yPercent) / 100) * pageHeight;
                finalWidth = (Number(widthPercent) / 100) * pageWidth;
                finalHeight = (Number(heightPercent) / 100) * pageHeight;
                
                // Store percentage values for better reuse
                positionData = {
                    x: finalX,
                    y: finalY,
                    width: finalWidth,
                    height: finalHeight,
                    xPercent: Number(xPercent),
                    yPercent: Number(yPercent),
                    widthPercent: Number(widthPercent),
                    heightPercent: Number(heightPercent)
                };
                
                // Convert Y coordinate from top-left to bottom-left for PDF
                finalY = pageHeight - finalY - finalHeight;
            } else {
                // Use pixel coordinates (fallback)
                finalX = Number(x);
                finalY = pageHeight - Number(y) - Number(height);
                finalWidth = Number(width);
                finalHeight = Number(height);
                
                positionData = {
                    x: Number(x),
                    y: Number(y),
                    width: Number(width),
                    height: Number(height)
                };
            }
            
            // Validate coordinates are within page bounds
            if (finalX < 0 || finalX > pageWidth || finalY < 0 || finalY > pageHeight) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Coordinates outside page bounds. Page: ${pageWidth}x${pageHeight}, Coords: ${finalX}, ${finalY}` 
                });
            }
            
            // Place signature at requested position
            page.drawImage(img, {
                x: finalX,
                y: finalY,
                width: finalWidth,
                height: finalHeight,
            });
            
            // Save new PDF
            const newPdfBytes = await pdfDoc.save();
            fs.writeFileSync(document.filePath, newPdfBytes);
            
            // Save the signature metadata to the database
            console.log("Signature file details:", {
                path: signatureFile.path,
                filename: signatureFile.filename,
                mimetype: signatureFile.mimetype
            });

            const signatureData = {
                documentId: documentId,
                userId: req.user._id,
                pageNumber: Number(pageNumber),
                position: positionData,
                signatureType: 'image',
                signatureData: `uploads/signatures/${signatureFile.filename}`, // Store the relative path to the signature image
                isFinalized: true  // Mark as finalized since it's already embedded
            };
            
            console.log("Saving signature with data:", signatureData);
            
            // Create signature record
            const signature = new Signature(signatureData);
            await signature.save();
            
            // Update document status
            document.status = 'signed';
            await document.save();
            
            // Create audit log
            const auditData = {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            };
            
            await signatureService.createAuditLog(
                documentId, 
                req.user._id, 
                'sign', 
                `Signature image added to page ${pageNumber}`,
                { pageNumber, signatureType: 'image', position: positionData },
                auditData
            );
            
            return res.json({ 
                success: true, 
                message: 'Signature embedded successfully',
                data: { signature }
            });
        } catch (err) {
            // If there was an error and we have a signature file, we should clean it up
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (unlinkError) {
                    console.error('Error deleting signature file after error:', unlinkError);
                }
            }
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}

export default new SignatureController();
