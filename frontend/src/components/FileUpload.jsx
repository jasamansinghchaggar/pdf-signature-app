import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';

const FileUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace('.pdf', ''));
      }
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('title', title);

      const response = await axiosInstance.post('/docs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onUploadSuccess?.(response.data.data.document);
      setFile(null);
      setTitle('');
    } catch (error) {
      alert(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setTitle('');
  };

  return (
    <Card>
      <CardHeader className="pb-2 md:pb-4">
        <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
          <Upload className="h-4 w-4 md:h-5 md:w-5" />
          <span>Upload PDF Document</span>
        </CardTitle>
        <CardDescription className="text-sm">
          Upload a PDF document to add signatures
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4">
        {!file ? (
          <div
            className={`border-2 border-dashed rounded-lg p-4 md:p-8 text-center cursor-pointer transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/10' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <Upload className="mx-auto h-8 w-8 md:h-12 md:w-12 text-gray-400 mb-2 md:mb-4" />
            <p className="text-base md:text-lg font-medium mb-1 md:mb-2">
              Drop your PDF here or click to browse
            </p>
            <p className="text-xs md:text-sm text-gray-500">
              Only PDF files are supported (Max 10MB)
            </p>
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileSelect(e.target.files[0])}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg gap-2">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <FileText className="h-6 w-6 md:h-8 md:w-8 text-red-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm md:text-base truncate">{file.name}</p>
                  <p className="text-xs md:text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={removeFile} className="shrink-0 self-start sm:self-center">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm md:text-base">Document Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter document title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-sm md:text-base"
              />
            </div>

            <Button onClick={handleUpload} disabled={uploading} className="w-full text-sm md:text-base">
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUpload;
