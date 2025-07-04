import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SignatureList = ({ documentId }) => {
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSignatures = async () => {
      if (!documentId) return;
      
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/signatures/${documentId}`);
        if (response.data.success) {
          const signatureData = response.data.data.signatures || [];
          setSignatures(signatureData);
        }
      } catch (err) {
        console.error('Error fetching signatures:', err);
        setError(err.message || 'Failed to fetch signatures');
      } finally {
        setLoading(false);
      }
    };

    fetchSignatures();
  }, [documentId]);

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-4">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-4">
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!signatures.length) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Signatures</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No signatures added to this document yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2 md:pb-4">
        <CardTitle className="text-base md:text-lg">Signatures ({signatures.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {signatures.map((signature) => (
            <li key={signature._id} className="border-b pb-3 last:border-b-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm md:text-base">
                    {signature.signatureType === 'image' ? 'Image Signature' : 'Text Signature'}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">
                    Page {signature.pageNumber} • Added {new Date(signature.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {signature.signatureType === 'image' && signature.signatureData && (
                  <div className="shrink-0 h-12 w-20 sm:h-12 sm:w-24 bg-gray-100 flex items-center justify-center rounded border">
                    <img 
                      src={`${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}/${signature.signatureData}`}
                      alt="Signature" 
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        console.log('Image failed to load:', e.target.src);
                        e.target.onerror = null;
                        e.target.src = "/placeholder-signature.svg";
                      }}
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default SignatureList;
