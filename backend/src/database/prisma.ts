/* Prisma Client setup

This file sets up and exports a Prisma Client instance for database interactions.

*/
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export default prisma;
