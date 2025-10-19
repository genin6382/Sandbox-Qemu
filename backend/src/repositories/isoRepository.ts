import prisma from '../database/prisma';

export async function getAllIso() {
    return await prisma.iSOs.findMany();
}

export async function getIsoById(isoId:string){
    return prisma.iSOs.findUnique({ where: { isoId } });
}