// schemas/nodeSchemas.ts
/**FIle to verify input while creating a new Node */
import { z } from 'zod';

export const createNodeSchema = z.object({
    name: z.string().min(1).max(100),
    isoId: z.string(),
});

export type CreateNodeInput = z.infer<typeof createNodeSchema>;
