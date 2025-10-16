import {z} from 'zod';

export const imageSchema = z.object({
    name: z.string().min(3),
    size: z.number().positive().min(1).max(30),
    logoUrl: z.string().url().optional(),
    osType: z.string().min(2)
})

export type ImageInput = z.infer<typeof imageSchema>;