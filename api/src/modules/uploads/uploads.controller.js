import path from 'path';
import fs from 'fs';
import { UPLOADS_DIR } from '../attachments/attachments.upload.js';

/**
 * POST /uploads/media
 * Generic file upload — no ticket scope required.
 * Returns the hosted URL for the uploaded file.
 */
export const uploadMedia = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const url = `/uploads/${file.filename}`;

    res.status(201).json({
      url,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /uploads/media
 * Body: { url: "/uploads/<filename>" }
 * Deletes the file from disk. Silent success if file not found.
 */
export const deleteMedia = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url is required' });
    }

    // Only allow deleting files inside /uploads/ — prevent path traversal
    const filename = path.basename(url);
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
