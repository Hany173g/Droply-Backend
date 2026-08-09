import cloudinary from "./cloudinary.js"

export interface VideoUploadResult {
    publicId: string
    originalUrl: string
    duration: number
    hash: string
    width: number
    height: number
    bytes: number
}

export async function uploadReelToCloudinary(
    filePath: string,
    folder: string,
): Promise<VideoUploadResult> {
    const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: "video",
        type: "authenticated",
        eager: [
            { streaming_profile: "hd", format: "m3u8" },
            { format: "jpg", start_offset: "5", type: "upload" },
        ],
        eager_async: true,
    })

    return {
        publicId: result.public_id,
        originalUrl: result.secure_url,
        duration: result.duration,
        hash: result.etag,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
    }
}

export async function uploadVideoToCloudinary(
    filePath: string,
    options: { folder: string },
): Promise<VideoUploadResult> {
    const result = await cloudinary.uploader.upload(filePath, {
        folder: options.folder,
        resource_type: "video",
        type: "authenticated",
        eager: [
            { streaming_profile: "full_hd", format: "m3u8" },
            { format: "jpg", start_offset: "auto", type: "upload" },
        ],
        eager_async: true,
    })

    return {
        publicId: result.public_id,
        originalUrl: result.secure_url,
        duration: result.duration,
        hash: result.etag,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
    }
}
