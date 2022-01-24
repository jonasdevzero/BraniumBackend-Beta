/**
 * Parse `req.body` as Multipart Object and common `req.body`
 */
export default function parseBody(body: any) {
    if (!body) return {};
    if (!isCyclic(body)) return body;

    for (const key of Object.keys(body)) {
        if (Array.isArray(body[key])) {
            !body[key][0]?.filename
                ? (body[key] = body[key].map((d: any) => d.value))
                : null;
        } else {
            !body[key]?.filename ? (body[key] = body[key].value) : null;
        }
    }

    return body;
}

/**
 * Check if a `Object` is a `Circular Object`
 */
function isCyclic(obj: Object) {
    let seenObjects: Array<Object> = [];

    function detect(obj: { [key: string]: any }) {
        if (obj && typeof obj === 'object') {
            if (seenObjects.indexOf(obj) !== -1) {
                return true;
            }

            seenObjects.push(obj);
            for (var key in obj) {
                if (
                    Object.prototype.hasOwnProperty.call(obj, key) &&
                    detect(obj[key])
                ) {
                    return true;
                }
            }
        }
        return false;
    }

    return detect(obj);
}
