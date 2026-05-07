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
  cors: { origin: '*', credentials: true }
});

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  }
});

let documents = [];
let notifications = [];

app.post('/api/documents/upload', upload.array('files', 20), (req, res) => {
  const files = req.files;
  const isBulk = files.length > 3;
  const uploadedFiles = files.map(file => ({
    id: Date.now() + Math.random(),
    original_name: file.originalname,
    file_size: file.size,
    file_path: file.path,
    upload_date: new Date().toISOString()
  }));
  documents = [...uploadedFiles, ...documents];
  
  if (isBulk) {
    const notification = {
      id: Date.now(),
      message: `${files.length} files uploaded successfully`,
      type: 'success',
      timestamp: new Date().toISOString(),
      is_read: false
    };
    notifications = [notification, ...notifications];
    io.emit('notification', notification);
  }
  res.json({ success: true, files: uploadedFiles, isBulk });
});

app.get('/api/documents', (req, res) => res.json(documents));
app.get('/api/documents/download/:id', (req, res) => {
  const doc = documents.find(d => d.id == req.params.id);
  if (doc) res.download(doc.file_path, doc.original_name);
  else res.status(404).json({ error: 'Not found' });
});
app.delete('/api/documents/:id', (req, res) => {
  const index = documents.findIndex(d => d.id == req.params.id);
  if (index !== -1) {
    if (fs.existsSync(documents[index].file_path)) fs.unlinkSync(documents[index].file_path);
    documents.splice(index, 1);
  }
  res.json({ success: true });
});
app.get('/api/notifications', (req, res) => res.json(notifications));
app.get('/api/notifications/unread/count', (req, res) => {
  res.json({ count: notifications.filter(n => !n.is_read).length });
});
app.patch('/api/notifications/:id/read', (req, res) => {
  const n = notifications.find(n => n.id == req.params.id);
  if (n) n.is_read = true;
  res.json({ success: true });
});
app.patch('/api/notifications/read-all', (req, res) => {
  notifications.forEach(n => n.is_read = true);
  res.json({ success: true });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`✅ Server on port ${PORT}`));
