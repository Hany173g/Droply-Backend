import { v2 as cloudinary } from 'cloudinary';
import {env} from "./env.js"
cloudinary.config({
  cloud_name: env.cloudinary.CLOUDINARY_CLOUD_NAME,
  api_key: env.cloudinary.CLOUDINARY_API_KEY,
  api_secret: env.cloudinary.CLOUDINARY_API_SECRET,
});


export default cloudinary;