//clientSocket Module uses a javascript-ism the Object Singleton pattern
//I firmly believe that the class implementation in javascript is unncessary
//and leads to confusing prototype semantics
import socketIOClient from "socket.io-client";

const _socket = socketIOClient("http://localhost:3000");
let _listeners = [];

_socket.on("msg", data => _listeners.forEach(listener => listener(data)));
const socketClient = {
  addListener: fn => _listeners.push(fn),
  removeListener: fn => (_listeners = _listeners.filter(l => l !== fn))
};

Object.freeze(socketClient);
export default socketClient;
