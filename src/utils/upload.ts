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
    save(file: any) {
        return new Promise(async (resolve, reject) => {
            try {
                const { data, mimetype, filename } = file

                let hashFilename = await randomBytesPromisify(16).then(hash => `${hash.toString("hex")}-${filename}`)
                const fileBuffer: Buffer = data

                if (process.env.STORAGE_TYPE === "s3") {
                    const result: any = await s3.upload({ Key: hashFilename, Bucket: process.env.AWS_BUCKET || '', Body: fileBuffer }).promise()
                    resolve({ Location: result.Location, type: this._getFileType(mimetype) })
                } else {
                    const readable = new Readable()
                    readable.push(fileBuffer)
                    readable.push(null)

                    await pump(readable, fs.createWriteStream(`./uploads/${hashFilename}`))
                    resolve({ Location: `${process.env.LOCALHOST_UPLOADS_URL}/${hashFilename}`, type: this._getFileType(mimetype) })
                }
            } catch (error) {
                reject(error)
            }
        })
    },

    remove() {

    },

    _getFileType(mimeType: string) {
        const type = mimeType.split('/')
        return type[0] === 'application' ? 'document' : type[0]
    }
}