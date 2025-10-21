/**File to Interact with Images Table using Prisma */ 
import prisma from '../database/prisma';

/** Retrieve all images*/
export async function getAllImages(){
    return await prisma.images.findMany();
}

/** Retrieve Image by base Image Id */
export async function getImageById(id: string){
    return await prisma.images.findUnique({
        where: {baseId:id}
    })
}
/**Create a Base Image */
export async function createImage(data: any){
    return await prisma.images.create({
        data
    });
}
/*Delete a Base Image */
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

/**Retrieve image by Iso ID */
export async function getImagesByIsoId(isoId: string) {
  return await prisma.images.findMany({
    where: { isoId }
  });
}
/*Increment the number of overlays that has been created for this base Image */
export async function incrementOverlayCount(baseId: string) {
  return await prisma.images.update({
    where: { baseId },
    data: { overlayCount: { increment: 1 } }
  });
}

/*Derement the number of overlays that has been created for this base Image */
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
