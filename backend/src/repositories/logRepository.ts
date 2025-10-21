import prisma from '../database/prisma';

/**Create a Log Entry for the given NodeID */
export async function createLogEntry(nodeId: string, message: string) {
    return await prisma.logs.create({
        data: {
            nodeId,
            message
        }
    });
}
/**Retrieve Log for given NodeID */
export async function getLogById(nodeId: string) {
    return await prisma.logs.findMany({
        where: { nodeId }
    });
}