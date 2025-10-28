const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Define the upload directory path
// Check if running in Docker container or local development
const isDocker = process.env.NODE_ENV === 'development' && fs.existsSync('/app');
const uploadDir = isDocker 
    ? path.resolve('/app/uploads')  // Docker path for uploads
    : path.resolve(__dirname, "../uploads"); // Local development path for uploads

// Create the directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Debug logging
console.log('File Upload Middleware Debug:');
console.log('isDocker:', isDocker);
console.log('uploadDir:', uploadDir);
console.log('Directory exists:', fs.existsSync(uploadDir));

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
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Sanitize the filename
    const fileExtension = path.extname(file.originalname)
    const fileNameWithoutExt = path.basename(file.originalname, fileExtension)
    const sanitizedFileName = Buffer.from(fileNameWithoutExt, "latin1").toString("utf8")

    // Create sanitized original name
    const sanitizedOriginalName = `${sanitizedFileName}${fileExtension}`

    // Get unique filename with (n) if needed
    const uniqueFilename = getUniqueFilename(sanitizedOriginalName, uploadDir)

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
