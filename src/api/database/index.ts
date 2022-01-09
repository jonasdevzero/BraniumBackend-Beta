import "reflect-metadata"
import { createConnection } from "typeorm"

createConnection()
    .then(() => console.log("Database connected"))
    .catch(error => {
        console.error(error)
        process.exit(0)
    })
    