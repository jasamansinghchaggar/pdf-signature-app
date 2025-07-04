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

const PDFViewer = ({
  document: pdfDocument,
  onSignatureAdded,
  refreshTrigger,
}) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [placement, setPlacement] = useState(null); // { page, x, y }
  const [placing, setPlacing] = useState(false);
  const [pageLayer, setPageLayer] = useState(null); // DOM node for the page layer
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ ready: false });
  const defaultLayout = defaultLayoutPlugin();

  useEffect(() => {
    let url = null;
    const fetchPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axiosInstance.get(
          `/docs/${pdfDocument._id}/download?t=${Date.now()}`,
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
    if (pdfDocument?._id) fetchPDF();
    return () => {
      if (url) URL.revokeObjectURL(url);
      setPdfUrl(null);
    };
  }, [pdfDocument?._id, refreshTrigger]);

  // Handle click on PDF area for signature placement
  const handlePdfClick = (e) => {
    if (!signatureFile || typeof window === "undefined") return;

    // Find the PDF page layer under the mouse
    let pageEl = e.target.closest(".rpv-core__page-layer");
    if (!pageEl) {
      // fallback: find any page layer at mouse position
      const layers = window.document.querySelectorAll(".rpv-core__page-layer");
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
    // Always place signature on page 1
    const page = 1;

    setPlacement({ page, x, y, width: 150, height: 150 });
    setPlacing(true);
  };

  // Handle dragging start
  const handleDragStart = (e) => {
    if (!placement || !pageLayer) return;
    e.preventDefault();
    e.stopPropagation();

    const pageRect = pageLayer.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const offsetX = clientX - pageRect.left - placement.x;
    const offsetY = clientY - pageRect.top - placement.y;

    setIsDragging(true);
    setDragStart({ ready: true, offsetX, offsetY });
  };

  // Handle mouse/touch move for dragging
  const handleMouseMove = (e) => {
    if (!isDragging || !placement || !dragStart.ready || !pageLayer) return;
    e.preventDefault();

    const pageRect = pageLayer.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const mouseX = clientX - pageRect.left;
    const mouseY = clientY - pageRect.top;

    const newX = Math.max(
      0,
      Math.min(mouseX - dragStart.offsetX, pageRect.width - placement.width)
    );
    const newY = Math.max(
      0,
      Math.min(mouseY - dragStart.offsetY, pageRect.height - placement.height)
    );

    setPlacement((prev) => ({
      ...prev,
      x: newX,
      y: newY,
    }));
  };

  // Handle mouse/touch up
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add event listeners for mouse/touch move and up
  useEffect(() => {
    if (isDragging && typeof window !== "undefined") {
      // Mouse events
      window.document.addEventListener("mousemove", handleMouseMove);
      window.document.addEventListener("mouseup", handleMouseUp);
      // Touch events
      window.document.addEventListener("touchmove", handleMouseMove, {
        passive: false,
      });
      window.document.addEventListener("touchend", handleMouseUp);

      return () => {
        window.document.removeEventListener("mousemove", handleMouseMove);
        window.document.removeEventListener("mouseup", handleMouseUp);
        window.document.removeEventListener("touchmove", handleMouseMove);
        window.document.removeEventListener("touchend", handleMouseUp);
      };
    }
  }, [isDragging, dragStart, placement, pageLayer]);

  // Send placement to backend
  const handlePlaceSignature = async () => {
    if (!placement || !signatureFile) return;

    // We need to scale the coordinates to match the actual PDF dimensions
    // The coordinates we have are relative to the displayed PDF viewer
    // But we need coordinates relative to the actual PDF page

    // For now, let's send the coordinates as percentages and let backend calculate
    const formData = new FormData();
    formData.append("documentId", pdfDocument._id);
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
          `/docs/${pdfDocument._id}/download?t=${Date.now()}`,
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
            {pdfDocument.title}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 md:p-6">
        <div className="space-y-2 md:space-y-4">
          <SignatureUpload onSignatureReady={setSignatureFile} />
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
                      <div
                        style={{
                          position: "absolute",
                          left: placement.x,
                          top: placement.y,
                          width: placement.width,
                          height: placement.height,
                          border: "2px dashed #3b82f6",
                          zIndex: 10,
                          touchAction: "none", // Prevent default touch behaviors
                        }}
                      >
                        <img
                          src={URL.createObjectURL(signatureFile)}
                          alt="Signature Preview"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            pointerEvents: "none",
                          }}
                        />
                        {/* Drag handle - only draggable area */}
                        <div
                          style={{
                            position: "absolute",
                            left: -5,
                            top: -5,
                            width: 20,
                            height: 20,
                            backgroundColor: "#3b82f6",
                            cursor: isDragging ? "grabbing" : "grab",
                            border: "2px solid white",
                            borderRadius: "3px",
                            touchAction: "none",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseDown={handleDragStart}
                          onTouchStart={handleDragStart}
                        >
                          {/* Drag icon */}
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              background: "white",
                              borderRadius: "1px",
                              position: "relative",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: "2px",
                                left: "0",
                                width: "8px",
                                height: "1px",
                                backgroundColor: "#3b82f6",
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                top: "4px",
                                left: "0",
                                width: "8px",
                                height: "1px",
                                backgroundColor: "#3b82f6",
                              }}
                            />
                          </div>
                        </div>
                      </div>,
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
