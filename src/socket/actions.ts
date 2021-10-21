
type WarnType = "info" | "success" | "error"
export function warn(type: WarnType, message: string) {
    return {
        type,
        message
    }
}

type UpdateArgs = {
    field?: string
    where?: {
        id?: string
    }
    set?: { [key: string]: any }
}

export function update(type: string, args: UpdateArgs) {
    return {
        type,
        ...args
    }
} 
