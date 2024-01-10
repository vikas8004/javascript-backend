import multer from "multer";

const storage = multer.diskStorage({
  destination: (err, file, cb) => {
    cb(null, "./public/temp");
  },
  filename: (err, file, cb) => {
    cb(null, Date.now() + file.originalname);
  },
});
const upload = multer({ storage });

export default upload;
