// schemas/nodeSchemas.ts
import { z } from 'zod';

export const createNodeSchema = z.object({
    name: z.string().min(1).max(100),
    isoId: z.string(),
});

export type CreateNodeInput = z.infer<typeof createNodeSchema>;
