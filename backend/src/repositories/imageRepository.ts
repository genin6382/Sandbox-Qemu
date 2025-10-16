import prisma from '../database/prisma';


export async function getAllImages(){
    return await prisma.images.findMany();
}

export async function getImageById(id: string){
    return await prisma.images.findUnique({
        where: {baseId:id}
    })
}

export async function createImage(data: any){
    return await prisma.images.create({
        data
    });
}

export async function deleteImage(id: string){
    return await prisma.images.deleteMany({
        where: {baseId:id}
    });
}