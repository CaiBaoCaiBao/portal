import { z } from "zod";

export const checksumQuerySchema = z.string().trim().min(1, "Checksum is required");

export type ChecksumQueryForm = z.input<typeof checksumQuerySchema>;
export type ChecksumQueryDTO = z.output<typeof checksumQuerySchema>;