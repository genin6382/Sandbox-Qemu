/**File to  Interact with ISOs table using Prisma*/
import prisma from '../database/prisma';

/**Retrieve All ISOs */
export async function getAllIso() {
    return await prisma.iSOs.findMany();
}
/**Retrieve ISO by ID */
export async function getIsoById(isoId:string){
    return prisma.iSOs.findUnique({ where: { isoId } });
}