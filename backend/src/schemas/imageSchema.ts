/**File to verify input while Creating new image */
import {z} from 'zod';

export const imageSchema = z.object({
    name: z.string().min(3),
    size: z.number().positive().min(1).max(30),
})

export type ImageInput = z.infer<typeof imageSchema>;