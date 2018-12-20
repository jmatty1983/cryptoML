import socketIOClient from "socket.io-client";

const _socket = socketIOClient("http://localhost:3000");
let _listeners = [];

_socket.on("msg", data => _listeners.forEach(listener => listener(data)));
const socketClient = {
  addListener: fn => _listeners.push(fn),
  removeListener: fn =>
    (_listeners = _listeners.filter(listener => listener !== fn))
};

Object.freeze(socketClient);
export default socketClient;
