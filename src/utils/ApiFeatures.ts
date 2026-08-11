import { Query, Document } from "mongoose"
import type { HydratedDocument } from "mongoose"
import type { ParsedQs } from "qs"

export class ApiFeatures<T> {
    public query: Query<HydratedDocument<T>[], HydratedDocument<T>, {}, T>
    private queryString: Record<string, any>
    constructor(
        query: Query<HydratedDocument<T>[], HydratedDocument<T>, {}, T>,
        queryString: ParsedQs,
    ) {
        this.query = query
        this.queryString = queryString
    }
    filter() {
        const queryObj = { ...this.queryString }
        const excludedFields = ["sort", "limit", "skip", "select"]
        excludedFields.forEach((field) => delete queryObj[field])

        this.query = this.query.find(queryObj)
        return this
    }
    sort() {
        if (this.queryString.sort && typeof this.queryString.sort === "string") {
            const sortBy = this.queryString.sort.split(",").join(" ")
            this.query = this.query.sort(sortBy)
        }
        return this
    }
    pagination() {
        if (this.queryString.limit || this.queryString.skip) {
            const defaultLimit = 20
            const maxLimit = 50
            let limit = Number(this.queryString.limit) || defaultLimit
            limit = limit > maxLimit ? maxLimit : limit
            let skip = Number(this.queryString.skip) || 0
            skip = skip < 0 ? 0 : skip
            this.query.skip(skip).limit(limit)
        }
        return this
    }
    select() {
        if (this.queryString.select && typeof this.queryString.select === "string") {
            const selectFields = this.queryString.select.split(",").join(" ")
            this.query = this.query.select(selectFields)
        }
        return this
    }
}
