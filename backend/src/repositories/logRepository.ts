import prisma from '../database/prisma';

export async function createLogEntry(nodeId: string, message: string) {
    return await prisma.logs.create({
        data: {
            nodeId,
            message
        }
    });
}