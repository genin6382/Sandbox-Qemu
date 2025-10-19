// utils/portManager.ts
import * as nodeRepository from '../repositories/nodeRepository';

export async function allocateVncPort() {
  const lastPort = await nodeRepository.getLastUsedVncPort();
  return lastPort ? lastPort + 1 : 5901;
}
