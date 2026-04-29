import { z } from 'zod';

export type ActionResponse<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string };

export function createServerAction<Schema extends z.ZodTypeAny, T>(
  schema: Schema,
  action: (data: z.infer<Schema>) => Promise<T>
) {
  return async (input: unknown): Promise<ActionResponse<T>> => {
    try {
      const validatedData = schema.parse(input);
      const result = await action(validatedData);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          success: false, 
          error: `Validation Error: ${error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}` 
        };
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  };
}
