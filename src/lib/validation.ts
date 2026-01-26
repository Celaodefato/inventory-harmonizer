import { z } from 'zod';

const urlSchema = z.string().url({ message: 'URL inválida' }).or(z.literal(''));

export const vicariusConfigSchema = z.object({
  baseUrl: urlSchema,
  apiKey: z.string().max(500, 'API Key muito longa'),
});

export const cortexConfigSchema = z.object({
  baseUrl: urlSchema,
  apiToken: z.string().max(500, 'Token muito longo'),
});

export const warpConfigSchema = z.object({
  baseUrl: urlSchema,
  apiToken: z.string().max(500, 'Token muito longo'),
});

export const apiConfigSchema = z.object({
  vicarius: vicariusConfigSchema,
  cortex: cortexConfigSchema,
  warp: warpConfigSchema,
});

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

export function validateUrl(url: string): { valid: boolean; message?: string } {
  if (!url) {
    return { valid: true }; // Empty is valid (not configured)
  }
  
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, message: 'URL inválida. Use formato: https://exemplo.com' };
  }
}

export type VicariusConfig = z.infer<typeof vicariusConfigSchema>;
export type CortexConfig = z.infer<typeof cortexConfigSchema>;
export type WarpConfig = z.infer<typeof warpConfigSchema>;
export type ApiConfigValidation = z.infer<typeof apiConfigSchema>;
