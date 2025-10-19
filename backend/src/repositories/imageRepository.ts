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

/* Find first available base image for a given ISO that has overlayCount below the maximum threshold */
export async function findAvailableImageForISO(isoId: string, maxOverlays: number = 5) {
  return await prisma.images.findFirst({
    where: {
      isoId,
      overlayCount: { lt: maxOverlays }
    },
    orderBy: { overlayCount: 'asc' } 
  });
}

export async function getImagesByIsoId(isoId: string) {
  return await prisma.images.findMany({
    where: { isoId }
  });
}

export async function incrementOverlayCount(baseId: string) {
  return await prisma.images.update({
    where: { baseId },
    data: { overlayCount: { increment: 1 } }
  });
}

export async function decrementOverlayCount(baseId: string) {
  // Read current count first
  const image = await prisma.images.findUnique({ where: { baseId } });
  if (!image) throw new Error('Base image not found');
  if (image.overlayCount <= 0) {
    console.warn(`Overlay count is already ${image.overlayCount}, cannot decrement`);
    return image; 
  }
  return await prisma.images.update({
    where: { baseId },
    data: { overlayCount: { decrement: 1 } }
  });
}
