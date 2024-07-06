const imageFilter = (req, file, cb) => {
  if (!file) {
    cb(null, true);
  } else {
    if (
      // Check if the file's MIME type matches image MIME types
      file.mimetype === 'image/jpeg' ||
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/gif' ||
      file.mimetype === 'image/svg+xml' ||
      file.mimetype === 'image/webp' ||
      file.mimetype === 'image/bmp'
      // Add more image MIME types as needed
    ) {
      cb(null, true); // Accept the file
    } else {
      cb(new Error('Invalid file type. Only image files are allowed.'));
    }
  }
};

export { imageFilter };
