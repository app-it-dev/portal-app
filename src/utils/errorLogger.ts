/**
 * Enhanced error logging utility
 * Provides consistent error logging across the application
 */

export interface ErrorDetails {
  type: string;
  constructor: string;
  message: string;
  stack?: string;
  stringified: string;
  supabaseCode?: string;
  supabaseDetails?: string;
  supabaseHint?: string;
}

/**
 * Logs an error with enhanced details for debugging
 * @param error - The error to log
 * @param context - Optional context about where the error occurred
 */
export function logError(error: unknown, context?: string): ErrorDetails {
  const errorDetails: ErrorDetails = {
    type: typeof error,
    constructor: error?.constructor?.name || 'Unknown',
    message: error instanceof Error ? error.message : 'No message',
    stack: error instanceof Error ? error.stack : undefined,
    stringified: JSON.stringify(error, null, 2),
  };

  // Log the error with context
  console.error(`${context ? `[${context}] ` : ''}Error occurred:`);
  console.error('Error type:', errorDetails.type);
  console.error('Error constructor:', errorDetails.constructor);
  console.error('Error message:', errorDetails.message);
  console.error('Error stack:', errorDetails.stack);
  console.error('Error stringified:', errorDetails.stringified);
  console.error('Full error object:', error);

  // If it's a Supabase error, log additional details
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as any;
    errorDetails.supabaseCode = supabaseError.code;
    errorDetails.supabaseDetails = supabaseError.details;
    errorDetails.supabaseHint = supabaseError.hint;
    
    console.error('Supabase error code:', errorDetails.supabaseCode);
    console.error('Supabase error details:', errorDetails.supabaseDetails);
    console.error('Supabase error hint:', errorDetails.supabaseHint);
  }

  return errorDetails;
}

/**
 * Logs a Supabase-specific error with enhanced details
 * @param error - The Supabase error to log
 * @param context - Optional context about where the error occurred
 */
export function logSupabaseError(error: any, context?: string): void {
  console.error(`${context ? `[${context}] ` : ''}Supabase error occurred:`);
  console.error('Error code:', error?.code);
  console.error('Error message:', error?.message);
  console.error('Error details:', error?.details);
  console.error('Error hint:', error?.hint);
  console.error('Full error object:', error);
}
