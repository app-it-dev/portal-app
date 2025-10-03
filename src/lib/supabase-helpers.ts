import type { ImportPost, ImportPostInsert, ImportPostUpdate } from '@/types/supabase';
import type { PostRow, ImageItem, ParsedPost } from '@/types';

/**
 * Convert Supabase ImportPost to frontend PostRow format
 */
export function importPostToPostRow(importPost: ImportPost): PostRow {
  return {
    id: importPost.id,
    url: importPost.url,
    source: importPost.source ?? undefined,
    note: importPost.note ?? undefined,
    status: importPost.status,
    rejectionReason: importPost.rejection_reason ?? undefined,
    rawContent: importPost.raw_content ?? undefined,
    parsedJson: importPost.parsed_json as unknown as ParsedPost | undefined,
    images: (importPost.images as unknown as ImageItem[]) || [],
    lastUpdatedAt: importPost.updated_at,
    workflowStep: importPost.workflow_step,
    stepCompleted: importPost.step_completed as {
      raw?: boolean;
      details?: boolean;
      images?: boolean;
      pricing?: boolean;
    },
    pricing: importPost.pricing as {
      carPrice?: number;
      customsFees?: number;
      vat?: number;
      deliveryFees?: number;
      platformFees?: number;
      total?: number;
    } | undefined,
  };
}

/**
 * Convert frontend PostRow to Supabase ImportPostInsert format
 */
export function postRowToImportPostInsert(
  postRow: Partial<PostRow> & { url: string },
  adminId?: string
): ImportPostInsert {
  return {
    admin_id: adminId!,
    url: postRow.url,
    source: postRow.source ?? null,
    note: postRow.note ?? null,
    status: postRow.status ?? 'pending',
    raw_content: postRow.rawContent ?? null,
    raw_analysis: postRow.parsedJson as unknown as any ?? null,
    images: postRow.images as unknown as any ?? [],
    workflow_step: postRow.workflowStep ?? 'raw',
    step_completed: postRow.stepCompleted ?? {},
  };
}

/**
 * Convert frontend PostRow updates to Supabase ImportPostUpdate format
 */
export function postRowToImportPostUpdate(
  postRow: Partial<PostRow>,
  _userId?: string
): ImportPostUpdate {
  const update: ImportPostUpdate = {};

  if (postRow.url !== undefined) update.url = postRow.url;
  if (postRow.source !== undefined) update.source = postRow.source ?? null;
  if (postRow.note !== undefined) update.note = postRow.note ?? null;
  if (postRow.status !== undefined) update.status = postRow.status;
  if (postRow.rejectionReason !== undefined) update.rejection_reason = postRow.rejectionReason ?? null;
  if (postRow.rawContent !== undefined) update.raw_content = postRow.rawContent ?? null;
  if (postRow.parsedJson !== undefined) update.parsed_json = postRow.parsedJson as unknown as any ?? null;
  if (postRow.images !== undefined) update.images = postRow.images as unknown as any;
  if (postRow.workflowStep !== undefined) update.workflow_step = postRow.workflowStep;
  if (postRow.stepCompleted !== undefined) update.step_completed = postRow.stepCompleted;
  if (postRow.pricing !== undefined) {
    console.log('🔄 Converting pricing data:', postRow.pricing);
    update.pricing = postRow.pricing as unknown as any;
    console.log('📦 Converted pricing:', update.pricing);
  }

  console.log('📋 Final update object:', update);
  return update;
}

/**
 * Check if URLs already exist in database (simple duplicate check)
 */
export async function checkUrlsDuplicates(
  urls: string[],
  supabaseClient: any
): Promise<Map<string, { exists: boolean }>> {
  if (!urls || urls.length === 0) {
    return new Map();
  }

  // Check which URLs already exist
  const { data, error } = await supabaseClient
    .from('portal.portal_import_posts')
    .select('url')
    .in('url', urls);
  
  if (error) {
    console.error('Error checking URLs:', error);
    return new Map();
  }

  // Build result map
  const resultMap = new Map();
  const existingUrls = new Set(data?.map((row: any) => row.url) || []);
  
  for (const url of urls) {
    resultMap.set(url, {
      exists: existingUrls.has(url),
    });
  }

  return resultMap;
}
