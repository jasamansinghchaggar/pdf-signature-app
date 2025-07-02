import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";

const SignaturePreview = ({ file }) => {
  const [preview, setPreview] = useState(null);
  
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    
    // Create preview URL for the image
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    
    // Clean up function
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [file]);
  
  if (!preview) {
    return null;
  }
  
  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-medium mb-2">Signature Preview</h3>
          <div className="border p-2 rounded">
            <img 
              src={preview} 
              alt="Signature Preview" 
              className="h-20 max-w-xs object-contain"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignaturePreview;
