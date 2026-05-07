import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Store uploaded files in memory (since no database)
let documents = [];
let notifications = [];

// Upload endpoint
app.post('/api/documents/upload', upload.array('files', 20), (req, res) => {
  try {
    const files = req.files;
    const isBulk = files.length > 3;
    
    const uploadedFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      filename: file.filename,
      original_name: file.originalname,
      file_size: file.size,
      file_type: file.mimetype,
      file_path: file.path,
      upload_date: new Date().toISOString(),
      status: 'completed'
    }));
    
    documents = [...uploadedFiles, ...documents];
    
    // Create notification for bulk uploads
    if (isBulk) {
      const notification = {
        id: Date.now(),
        message: `${files.length} files uploaded successfully`,
        type: 'success',
        timestamp: new Date().toISOString(),
        is_read: false
      };
      notifications = [notification, ...notifications];
      
      // Send real-time notification
      io.emit('notification', notification);
      io.emit('uploadComplete', { count: files.length });
    }
    
    res.json({
      success: true,
      files: uploadedFiles,
      isBulk,
      count: files.length
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all documents
app.get('/api/documents', (req, res) => {
  res.json(documents);
});

// Download document
app.get('/api/documents/download/:id', (req, res) => {
  const doc = documents.find(d => d.id == req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.download(doc.file_path, doc.original_name);
});

// Delete document
app.delete('/api/documents/:id', (req, res) => {
  const index = documents.findIndex(d => d.id == req.params.id);
  if (index !== -1) {
    const doc = documents[index];
    if (fs.existsSync(doc.file_path)) {
      fs.unlinkSync(doc.file_path);
    }
    documents.splice(index, 1);
  }
  res.json({ success: true });
});

// Get notifications
app.get('/api/notifications', (req, res) => {
  res.json(notifications);
});

// Get unread count
app.get('/api/notifications/unread/count', (req, res) => {
  const count = notifications.filter(n => !n.is_read).length;
  res.json({ count });
});

// Mark as read
app.patch('/api/notifications/:id/read', (req, res) => {
  const id = parseInt(req.params.id);
  const notification = notifications.find(n => n.id === id);
  if (notification) {
    notification.is_read = true;
  }
  res.json({ success: true });
});

// Mark all as read
app.patch('/api/notifications/read-all', (req, res) => {
  notifications.forEach(n => n.is_read = true);
  res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
});
