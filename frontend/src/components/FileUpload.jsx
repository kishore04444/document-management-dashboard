import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Minimize2, Maximize2 } from 'lucide-react';
import { uploadFiles } from '../services/api';
import toast from 'react-hot-toast';

const FileUpload = ({ onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const pdfFiles = acceptedFiles.filter(file => file.type === 'application/pdf');
    if (pdfFiles.length !== acceptedFiles.length) {
      toast.error('Only PDF files are allowed');
    }
    
    const newFiles = pdfFiles.map(file => ({
      file,
      id: Math.random().toString(36),
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending'
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
    
    if (newFiles.length > 0) {
      handleUpload([...files, ...newFiles]);
    }
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 20 * 1024 * 1024,
  });

  const handleUpload = async (allFiles) => {
    setUploading(true);
    const formData = new FormData();
    
    allFiles.forEach(file => {
      formData.append('files', file.file);
    });
    
    const intervals = allFiles.map(file => {
      return setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === file.id && f.progress < 90) {
            return { ...f, progress: f.progress + 10 };
          }
          return f;
        }));
      }, 200);
    });
    
    try {
      const result = await uploadFiles(formData);
      
      intervals.forEach(interval => clearInterval(interval));
      
      setFiles(prev => prev.map(f => ({ ...f, progress: 100, status: 'complete' })));
      
      if (result.isBulk) {
        toast.success(`Upload in progress — processing ${allFiles.length} files in background.`);
      } else {
        toast.success(`${allFiles.length} file(s) uploaded successfully`);
      }
      
      setTimeout(() => {
        setFiles([]);
        onUploadComplete();
      }, 2000);
      
    } catch (error) {
      intervals.forEach(interval => clearInterval(interval));
      toast.error('Upload failed');
      setFiles(prev => prev.map(f => ({ ...f, status: 'failed' })));
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
          <p className="text-sm text-gray-500 mt-1">Drag & drop PDF files or click to browse</p>
        </div>
        {files.length > 3 && (
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-500 hover:text-gray-700">
            {isCollapsed ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
          </button>
        )}
      </div>
      
      <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
        <input {...getInputProps()} />
        <Upload className={`mx-auto h-12 w-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className="mt-2 text-sm text-gray-600">{isDragActive ? 'Drop your PDF files here' : 'Drop files here or click to browse'}</p>
        <p className="text-xs text-gray-500 mt-1">PDF only · Up to 20 MB per file</p>
      </div>
      
      {files.length > 0 && !isCollapsed && (
        <div className="mt-6 space-y-3">
          {files.map(file => (
            <div key={file.id} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)} · PDF</p>
                </div>
                {file.status !== 'complete' && (
                  <button onClick={() => removeFile(file.id)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all duration-300 ${file.status === 'failed' ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${file.progress}%` }} />
                </div>
                <span className="text-xs text-gray-600">
                  {file.status === 'pending' && 'Pending'}
                  {file.status === 'uploading' && `${file.progress}%`}
                  {file.status === 'complete' && '✓ Complete'}
                  {file.status === 'failed' && 'Failed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {isCollapsed && files.length > 3 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          {files.length} files uploading in background...
        </div>
      )}
    </div>
  );
};

export default FileUpload;
