import SocketClient from './socket'

const webSocketURL = process.env.WEBSOCKET_SERVER || 'http://localhost:9000'

const socket = new SocketClient(webSocketURL)
socket.connect()

export default socket
