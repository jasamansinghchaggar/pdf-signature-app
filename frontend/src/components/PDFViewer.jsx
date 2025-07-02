import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axiosInstance from "../utils/axiosInstance";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import SignatureUpload from "./SignatureUpload";
import SignaturePreview from "./SignaturePreview";

const PDFViewer = ({ document, onSignatureAdded, refreshTrigger }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [placement, setPlacement] = useState(null); // { page, x, y }
  const [placing, setPlacing] = useState(false);
  const [pageLayer, setPageLayer] = useState(null); // DOM node for the page layer
  const defaultLayout = defaultLayoutPlugin();

  useEffect(() => {
    let url = null;
    const fetchPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axiosInstance.get(
          `/docs/${document._id}/download?t=${Date.now()}`,
          {
            responseType: "blob",
          }
        );
        url = URL.createObjectURL(res.data);
        setPdfUrl(url);
      } catch (err) {
        setError("Failed to load PDF: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    if (document?._id) fetchPDF();
    return () => {
      if (url) URL.revokeObjectURL(url);
      setPdfUrl(null);
    };
  }, [document?._id, refreshTrigger]);

  // Helper to get page number from a page layer element
  const getPageNumberFromLayer = (el) => {
    if (!el) return 1;
    const attr = el.getAttribute("data-page-number");
    if (attr) return parseInt(attr, 10);
    // fallback: try to find parent with data-page-number
    let parent = el.parentElement;
    while (parent) {
      const pn = parent.getAttribute("data-page-number");
      if (pn) return parseInt(pn, 10);
      parent = parent.parentElement;
    }
    return 1;
  };

  // Handle click on PDF area for signature placement
  const handlePdfClick = (e) => {
    if (!signatureFile) return;

    // Find the PDF page layer under the mouse
    let pageEl = e.target.closest(".rpv-core__page-layer");
    if (!pageEl) {
      // fallback: find any page layer at mouse position
      const layers = document.querySelectorAll(".rpv-core__page-layer");
      for (let layer of layers) {
        const rect = layer.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          pageEl = layer;
          break;
        }
      }
    }

    if (!pageEl) {
      return;
    }

    setPageLayer(pageEl);

    // Get click position relative to page layer
    const rect = pageEl.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const page = getPageNumberFromLayer(pageEl);

    setPlacement({ page, x, y, width: 150, height: 50 });
    setPlacing(true);
  };

  // Send placement to backend
  const handlePlaceSignature = async () => {
    if (!placement || !signatureFile) return;

    // We need to scale the coordinates to match the actual PDF dimensions
    // The coordinates we have are relative to the displayed PDF viewer
    // But we need coordinates relative to the actual PDF page

    // For now, let's send the coordinates as percentages and let backend calculate
    const formData = new FormData();
    formData.append("documentId", document._id);
    formData.append("pageNumber", String(placement.page));

    // Send coordinates as a percentage of the page layer dimensions
    // Backend will convert these to actual PDF coordinates
    const pageEl = pageLayer;
    if (pageEl) {
      const rect = pageEl.getBoundingClientRect();
      const xPercent = (placement.x / rect.width) * 100;
      const yPercent = (placement.y / rect.height) * 100;
      const widthPercent = (placement.width / rect.width) * 100;
      const heightPercent = (placement.height / rect.height) * 100;

      formData.append("xPercent", String(xPercent));
      formData.append("yPercent", String(yPercent));
      formData.append("widthPercent", String(widthPercent));
      formData.append("heightPercent", String(heightPercent));
    } else {
      // Fallback to pixel coordinates
      formData.append("x", String(Math.round(placement.x)));
      formData.append("y", String(Math.round(placement.y)));
      formData.append("width", String(Math.round(placement.width)));
      formData.append("height", String(Math.round(placement.height)));
    }

    formData.append("signature", signatureFile); // field name must be 'signature'
    try {
      setLoading(true);
      await axiosInstance.post("/signatures/embed", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPlacement(null);
      setSignatureFile(null);
      setPlacing(false);

      // Notify parent component about the signature addition
      if (onSignatureAdded) {
        onSignatureAdded();
      } else {
        // Reload PDF with cache busting if onSignatureAdded is not provided
        const res = await axiosInstance.get(
          `/docs/${document._id}/download?t=${Date.now()}`,
          {
            responseType: "blob",
          }
        );
        // Clean up old URL
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
        }
        const url = URL.createObjectURL(res.data);
        setPdfUrl(url);
      }
    } catch (err) {
      setError(
        "Failed to embed signature: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
            <p>Loading PDF...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !pdfUrl) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-red-500">
            <p>{error || "Failed to load PDF"}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-2 md:pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="text-base md:text-lg truncate pr-2">
            {document.title}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 md:p-6">
        <div className="space-y-2 md:space-y-4">
          <SignatureUpload onSignatureReady={setSignatureFile} />
          {signatureFile && !placing && (
            <SignaturePreview file={signatureFile} />
          )}
          <div className="flex items-center">
            <div className="pdf-viewer-height w-full relative border shadow-lg overflow-hidden rounded">
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <div
                  onClick={signatureFile ? handlePdfClick : undefined}
                  style={{
                    cursor: signatureFile ? "crosshair" : "default",
                    height: "100%",
                  }}
                  className="h-full w-full overflow-auto"
                >
                  <Viewer fileUrl={pdfUrl} plugins={[defaultLayout]} />
                  {/* Signature preview overlay - render inside the correct PDF page layer */}
                  {placing &&
                    placement &&
                    signatureFile &&
                    pageLayer &&
                    createPortal(
                      <img
                        src={URL.createObjectURL(signatureFile)}
                        alt="Signature Preview"
                        style={{
                          position: "absolute",
                          left: placement.x,
                          top: placement.y,
                          width: placement.width,
                          height: placement.height,
                          pointerEvents: "none",
                          zIndex: 10,
                        }}
                      />,
                      pageLayer
                    )}
                </div>
              </Worker>
            </div>
          </div>
        </div>
        {placing && placement && (
          <Button
            className="mt-2 w-full sm:w-auto"
            onClick={handlePlaceSignature}
          >
            Place Signature Here
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PDFViewer;
