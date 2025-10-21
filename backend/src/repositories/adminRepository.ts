import prisma from "../database/prisma";


export async function registerUser(name: string, password: string) {
  return await prisma.users.create({
    data: { name, password },
  });
}

// Find user by name
export async function findUserByName(name: string) {
  return await prisma.users.findUnique({
      where: { name },
  });
}
