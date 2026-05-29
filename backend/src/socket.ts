import { Server } from 'socket.io';

let io: Server;
let connectedClients = 0;

export function setIO(instance: Server) {
  io = instance;
}

export function getIO(): Server {
  return io;
}

export function getConnectedCount(): number {
  return connectedClients;
}

export function incrementClients() {
  connectedClients++;
}

export function decrementClients() {
  if (connectedClients > 0) connectedClients--;
}
