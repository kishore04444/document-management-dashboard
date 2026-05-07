import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import FileUpload from './components/FileUpload';
import DocumentList from './components/DocumentList';
import NotificationCenter from './components/NotificationCenter';
import { getDocuments } from './services/api';
import { FileText, Bell } from 'lucide-react';

const socket = io('https://document-management-dashboard.onrender.com');

function App() {
  const [documents, setDocuments] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadDocuments();
    
    socket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      if (notification.type === 'success' && notification.message.includes('files uploaded')) {
        toast.success(notification.message);
      }
    });
    
    socket.on('uploadComplete', () => {
      loadDocuments();
    });
    
    return () => {
      socket.off('notification');
      socket.off('uploadComplete');
    };
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">SWS AI Document Hub</h1>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 z-50">
                  <NotificationCenter
                    notifications={notifications}
                    setNotifications={setNotifications}
                    unreadCount={unreadCount}
                    setUnreadCount={setUnreadCount}
                    onClose={() => setShowNotifications(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FileUpload onUploadComplete={loadDocuments} />
        
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Document Library</h2>
          <DocumentList documents={documents} onRefresh={loadDocuments} />
        </div>
      </main>
      
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
