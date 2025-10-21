// utils/portManager.ts
import * as nodeRepository from '../repositories/nodeRepository';
import * as net from 'net';

export async function allocateVncPort() {
  const lastPort = await nodeRepository.getLastUsedVncPort();
  return lastPort ? lastPort + 1 : 5901;
}

export async function waitForVNCPort(port: number, maxRetries = 10, delayMs = 500): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const socket = net.createConnection(port, 'localhost');
        
        socket.on('connect', () => {
          socket.end();
          resolve();
        });
        
        socket.on('error', () => {
          reject();
        });
        
        setTimeout(() => {
          socket.destroy();
          reject();
        }, 1000);
      });
      
      console.log(`VNC port ${port} is ready`);
      return true;
    } catch (err) {
      if (i < maxRetries - 1) {
        console.log(`VNC port ${port} not ready, retrying... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  console.error(`VNC port ${port} did not become ready after ${maxRetries} retries`);
  return false;
}