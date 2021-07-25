import SocketClient from './socket'

const webSocketURL = process.env.WEBSOCKET_SERVER || 'http://localhost:9000'

export default new SocketClient(webSocketURL)
