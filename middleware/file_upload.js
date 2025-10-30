const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Define base directories
// Priority for profile: env PROFILE_UPLOAD_DIR -> frontend/public/profile -> backend/uploads (fallback)
const envDir = process.env.PROFILE_UPLOAD_DIR ? path.resolve(process.env.PROFILE_UPLOAD_DIR) : null
const backendDir = path.resolve(__dirname, "..")
const projectRoot = path.resolve(backendDir, "..")
const preferredFrontendProfileDir = path.resolve(projectRoot, "frontend/public/profile")
const preferredFrontendImagesDir = path.resolve(projectRoot, "frontend/public/images")
const preferredFrontendFilesDir = path.resolve(projectRoot, "frontend/public/files")
const backendUploadsFallback = path.resolve(backendDir, "uploads")

// Ensure directories exist if used
const ensureDir = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
    return true
  } catch {
    return false
  }
}

// Default uploadDir for non-workload routes (profile images)
let defaultProfileDir = envDir || preferredFrontendProfileDir
if (!ensureDir(defaultProfileDir)) {
  defaultProfileDir = backendUploadsFallback
  ensureDir(defaultProfileDir)
}

// (Dirs ensured on demand in ensureDir and destination)

// Debug logging
console.log('File Upload Middleware Debug:')
console.log('PROFILE_UPLOAD_DIR (env):', process.env.PROFILE_UPLOAD_DIR || '-')
console.log('Default profile dir:', defaultProfileDir)
console.log('Images dir (frontend):', preferredFrontendImagesDir)
console.log('Files dir (frontend):', preferredFrontendFilesDir)

// Function to get a unique filename by adding (n) to the end
const getUniqueFilename = (originalName, uploadDir) => {
  const fileExtension = path.extname(originalName)
  const fileNameWithoutExt = path.basename(originalName, fileExtension)

  // Check if file exists
  if (!fs.existsSync(path.join(uploadDir, originalName))) {
    return originalName
  }

  // If file exists, find the next available number
  let counter = 1
  let newFilename

  do {
    newFilename = `${fileNameWithoutExt}(${counter})${fileExtension}`
    counter++
  } while (fs.existsSync(path.join(uploadDir, newFilename)))

  return newFilename
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Route workload_form uploads
    const isWorkloadForm = typeof req.path === 'string' && req.path.includes('/workload_form')
    if (isWorkloadForm) {
      const isImage = /^image\//.test(file.mimetype)
      const targetDir = isImage ? preferredFrontendImagesDir : preferredFrontendFilesDir
      if (!ensureDir(targetDir)) {
        // fallback to backend uploads if cannot ensure
        return cb(null, backendUploadsFallback)
      }
      return cb(null, targetDir)
    }
    // Default: profile images
    cb(null, defaultProfileDir)
  },
  filename: (req, file, cb) => {
    // Sanitize the filename
    const fileExtension = path.extname(file.originalname)
    const fileNameWithoutExt = path.basename(file.originalname, fileExtension)
    const sanitizedFileName = Buffer.from(fileNameWithoutExt, "latin1").toString("utf8")

    // Generate collision-resistant filename without needing target dir reference
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const uniqueFilename = `${sanitizedFileName}-${uniqueSuffix}${fileExtension}`

    // Log file information
    console.log(`Uploading file: ${uniqueFilename}, type: ${file.mimetype}, size: ${file.size} bytes`)

    cb(null, uniqueFilename)
  },
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|jpg|jpeg|png|gif|bmp|webp|doc|docx|xls|xlsx|txt/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (extname && mimetype) {
    return cb(null, true)
  } else {
    cb(new Error("Only PDF, images, and document files are allowed!"), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
    files: 10, // Max 10 files per request
  },
})

module.exports = upload
