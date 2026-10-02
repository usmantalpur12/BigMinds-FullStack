const multer = require("multer");
const path = require("path");
const fs = require("fs");

const isServerless = !!process.env.VERCEL;

// Ensure upload directories exist
const createUploadDirs = () => {
  // In serverless environments (e.g. Vercel) the filesystem is read-only
  // for the project directory, so we skip directory creation there.
  if (isServerless) {
    return;
  }

  const dirs = ["./uploads/profiles", "./uploads/courses", "./uploads/documents"];

  dirs.forEach((dir) => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      console.error("Failed to create upload directory:", dir, err);
    }
  });
};

createUploadDirs();

// Configure storage
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "./uploads/";
    
    if (file.fieldname === "avatar" || file.fieldname === "image") {
      uploadPath += "profiles/";
    } else if (file.fieldname === "video") {
      uploadPath += "courses/";
    } else if (file.fieldname === "document") {
      uploadPath += "documents/";
    } else {
      uploadPath += "courses/";
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// For Vercel/serverless we fall back to memory storage to avoid
// writing to the read-only deployment filesystem.
const storage = isServerless ? multer.memoryStorage() : diskStorage;

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(",") || [
    "image/jpeg",
    "image/png",
    "image/gif",
    "video/mp4",
    "application/pdf",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: fileFilter,
});

module.exports = upload; 