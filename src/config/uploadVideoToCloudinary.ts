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

export interface UploadVideoOptions {
    folder: string
    streamingProfile?: "hd" | "full_hd"
    thumbnailOffset?: string | "auto"
}

export async function uploadVideoToCloudinary(
    filePath: string,
    options: UploadVideoOptions,
): Promise<VideoUploadResult> {
    const result = await cloudinary.uploader.upload(filePath, {
        folder: options.folder,
        resource_type: "video",
        type: "authenticated",
        eager: [
            { streaming_profile: options.streamingProfile ?? "full_hd", format: "m3u8" },
            { format: "jpg", start_offset: options.thumbnailOffset ?? "auto", type: "upload" },
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
