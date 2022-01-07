import aws from "aws-sdk"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { pipeline, Readable } from "stream"
import { randomBytes } from "crypto"

const s3 = new aws.S3()
const pump = promisify(pipeline)
const randomBytesPromisify = promisify(randomBytes)

export default {
    save(file: any): Promise<{ Location: string | undefined, type: string }> {
        return new Promise(async (resolve, reject) => {
            try {
                const { mimetype, filename } = file
                const type = this._getFileType(mimetype)

                let hashFilename = await randomBytesPromisify(16).then(hash => `${hash.toString("hex")}-${filename}`)
                const fileBuffer: Buffer = await file.toBuffer()

                if (process.env.STORAGE_TYPE === "s3") {
                    const result: any = await s3.upload({ Key: hashFilename, Bucket: process.env.AWS_BUCKET || '', Body: fileBuffer }).promise()
                    resolve({ Location: result.Location, type })
                } else {
                    const readable = new Readable()
                    readable.push(fileBuffer)
                    readable.push(null)

                    await pump(readable, fs.createWriteStream(`./uploads/${hashFilename}`))
                    resolve({ Location: `${process.env.UPLOADS_URL}/${hashFilename}`, type })
                }
            } catch (error) {
                reject(error)
            }
        })
    },

    remove(key: string) {
        return new Promise(async (resolve, reject) => {
            try {
                if (process.env.STORAGE_TYPE === "s3") {
                    const picture_key = key.split(`${process.env.S3_BASE_URL}/`)[1]
                    s3.deleteObject({ Bucket: "zero-chat", Key: picture_key })        
                    resolve('ok')
                } else {
                    const picture_key = key.split(`${process.env.UPLOADS_URL}/`)[1]
                    await promisify(fs.unlink)(path.resolve(__dirname, "..", "..", "..", "uploads", picture_key))
                    resolve('ok')
                };
            } catch (error) {
                reject(error)
            }
        })
    },

    parseBody(body: any) {
        if (!body) return {};
        for (const key of Object.keys(body)) 
            !Array.isArray(body[key]) && !body[key]?.filename ? body[key] = body[key].value : null;
            
        return body
    },

    _getFileType(mimeType: string) {
        const type = mimeType.split('/')
        return type[0] === 'application' ? 'document' : type[0]
    }
}