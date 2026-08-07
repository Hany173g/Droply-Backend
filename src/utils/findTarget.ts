import UserVideo from "../modules/videos/models/userVideo.model.js"
import Comment from "../modules/comment/comment.model.js"
import { ApiError } from "./ApiError.js"

const targetModels: Record<string, any> = {
    video: UserVideo,
    comment: Comment,
}

export function getTargetModel(targetType: string): any {
    let Model = targetModels[targetType]
    if (!Model) throw ApiError.badRequest(`Invalid target type: "${targetType}"`)
    return Model
}

export async function findTargetById(targetId: string, targetType: string): Promise<any> {
    let Model = getTargetModel(targetType)
    let doc = await Model.findById(targetId)
    if (!doc) throw ApiError.notFound(`${targetType} not found`)
    return doc
}
