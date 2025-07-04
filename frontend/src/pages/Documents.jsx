import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import FileUpload from '../components/FileUpload';
import PDFViewer from '../components/PDFViewer';
import SignatureList from '../components/SignatureList';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Upload, 
  Calendar, 
  User, 
  Eye, 
  Trash2,
  Plus
} from 'lucide-react';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axiosInstance.get('/docs');
      setDocuments(response.data.data.documents);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (document) => {
    setDocuments(prev => [document, ...prev]);
    setShowUpload(false);
    setSelectedDocument(document);
  };

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document and all associated signatures?')) {
      try {
        await axiosInstance.delete(`/docs/${documentId}`);
        setDocuments(prev => prev.filter(doc => doc._id !== documentId));
        if (selectedDocument?._id === documentId) {
          setSelectedDocument(null);
        }
      } catch (error) {
        alert('Failed to delete document');
      }
    }
  };

  const handleRefresh = () => {
    fetchDocuments();
    setRefreshTrigger(prev => prev + 1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'uploaded':
        return 'bg-blue-100 text-blue-800';
      case 'signing':
        return 'bg-yellow-100 text-yellow-800';
      case 'signed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center space-x-2 md:space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="p-1 md:p-2">
              <ArrowLeft className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Back to Dashboard</span>
            </Button>
            <FileText className="h-5 w-5 md:h-6 md:w-6" />
            <h1 className="text-lg md:text-xl font-semibold">Documents</h1>
          </div>
          <div className="ml-auto flex items-center space-x-2 md:space-x-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
        {/* Sidebar - Document List */}
        <div className="w-full lg:w-1/3 border-b lg:border-r lg:border-b-0 p-4 overflow-y-auto max-h-[40vh] lg:max-h-none">
          {showUpload ? (
            <div className="space-y-4">
              <Button
                variant="outline"
                onClick={() => setShowUpload(false)}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Documents
              </Button>
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>
          ) : (
            <div className="h-max space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base md:text-lg font-semibold">Your Documents</h2>
                <Button size="sm" onClick={() => setShowUpload(true)}>
                  <Upload className="h-4 w-4" />
                </Button>
              </div>

              {documents.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-center">
                      No documents yet. Upload your first PDF to get started.
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => setShowUpload(true)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload PDF
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <Card
                      key={doc._id}
                      className={`cursor-pointer transition-colors ${
                        selectedDocument?._id === doc._id
                          ? 'ring-2 ring-primary'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setSelectedDocument(doc)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-sm font-medium truncate pr-2">
                            {doc.title}
                          </CardTitle>
                          <Badge className={`${getStatusColor(doc.status)} text-xs shrink-0`}>
                            {doc.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span className="truncate">{new Date(doc.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {doc.pageCount} pages
                          </div>
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            <span className="truncate">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDocument(doc);
                            }}
                            className="text-xs px-2 py-1"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDocument(doc._id);
                            }}
                            className="text-xs px-2 py-1 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Content - PDF Viewer */}
        <div className="flex-1 p-2 md:p-4 overflow-y-auto">
          {selectedDocument ? (
            <div className="space-y-4">
              <PDFViewer 
                document={selectedDocument} 
                onSignatureAdded={handleRefresh} 
                refreshTrigger={refreshTrigger}
              />
              {/* Add the SignatureList component */}
              <SignatureList 
                documentId={selectedDocument._id} 
                key={`signatures-${selectedDocument._id}-${refreshTrigger}`} 
              />
            </div>
          ) : (
            <Card className="h-full">
              <CardContent className="flex flex-col items-center justify-center h-full p-6">
                <FileText className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mb-4" />
                <p className="text-base md:text-lg font-medium text-gray-500 mb-2 text-center">
                  Select a document to view
                </p>
                <p className="text-sm text-gray-400 text-center">
                  Choose a document from the list {window.innerWidth >= 1024 ? 'on the left' : 'above'} to preview it here
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documents;
