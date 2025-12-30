const multer = require("multer");
const multerS3 = require("multer-s3");
const s3 = require("../config/s3");
const { v4: uuidv4 } = require("uuid");

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = file.originalname.split(".").pop();
      cb(null, `products/${uuidv4()}.${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
