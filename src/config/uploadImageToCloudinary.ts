import cloudinary from "./cloudinary.js"

interface UploadOptions {
    folder: string
    width?: number
    height?: number
    crop?: string
    gravity?: string
}

export function uploadImageToCloudinary(
    buffer: Buffer,
    options: UploadOptions,
): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: options.folder,
                resource_type: "image",
                transformation: [
                    {
                        width: options.width || 800,
                        height: options.height || 800,
                        crop: options.crop || "limit",
                    },
                ],
                flags: "strip_profile",
            },
            (error, result) => {
                if (error) return reject(error)
                if (!result) return reject(new Error("Cloudinary upload failed with no result"))
                resolve({ url: result.secure_url, publicId: result.public_id })
            },
        )
        stream.end(buffer)
    })
}
