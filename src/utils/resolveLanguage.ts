import { findLanguage, DEFAULT_LANGUAGE } from "../constants/languages.js"

export function resolveLanguage(acceptLanguage: string | undefined): {
    code: string
    name: string
    nativeName: string
} {
    if (!acceptLanguage) return DEFAULT_LANGUAGE

    let parts = acceptLanguage.split(",")
    for (let part of parts) {
        let pieces = part.split(";")
        let lang = (pieces[0] || "").trim().toLowerCase()
        let segments = lang.split("-")
        let code = segments[0] || ""
        if (!code) continue
        let found = findLanguage(code)
        if (found) return found
    }

    return DEFAULT_LANGUAGE
}
