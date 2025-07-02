import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

const SignatureUpload = ({ onSignatureReady }) => {
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      onSignatureReady(file);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center space-y-2 sm:space-y-0">
      <input
        type="file"
        accept="image/png, image/jpeg"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Button 
        variant="outline" 
        onClick={() => fileInputRef.current.click()}
        className="w-full sm:w-auto"
      >
        Upload Signature Image
      </Button>
      {preview && (
        <img 
          src={preview} 
          alt="Signature Preview" 
          className="h-16 sm:h-20 w-auto border rounded max-w-full object-contain" 
        />
      )}
    </div>
  );
};

export default SignatureUpload;
