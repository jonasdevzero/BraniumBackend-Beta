
declare module "@socket.io/sticky" {
    function setupMaster(httpServer: any, opts: any): void
    function setupWorker(ws: any): void
}