





export const rateLimterGlobal = {
    window: 1 * 60 * 1000 ,
    max: 50
}



export const rateLimterAuth = {
    window: 15 * 60 * 1000,
    max: 10,
}

export const upload = {
        window: 15 * 60 * 1000,
        max : 20,  
}

export const subscriptionLimiterConfig = {
    window: 5 * 60 * 1000,
    max: 10,
}

export const refreshLimiterConfig = {
    window: 1 * 60 * 1000,
    max: 10,
}

export const watchSessionLimiterConfig = {
    window: 1 * 60 * 1000,
    max: 15,
}

export const notificationToggleLimiterConfig = {
    window: 1 * 60 * 1000,
    max: 10,
}