import type { ImportPost, ImportPostInsert, ImportPostUpdate } from '@/types/supabase';
import type { PostRow, ImageItem, ParsedPost, PostStatus } from '@/types';

// Map import post status to app post status
function mapImportStatusToPostStatus(importStatus: string): PostStatus {
  switch (importStatus) {
    case 'pending':
      return 'pending';
    case 'analyzing':
      return 'analyzing';
    case 'analyzed':
      return 'parsed';
    case 'rejected':
      return 'rejected';
    case 'completed':
      return 'ready';
    default:
      return 'pending';
  }
}

// Map app post status to import post status
function mapPostStatusToImportStatus(postStatus: PostStatus): string {
  switch (postStatus) {
    case 'pending':
      return 'pending';
    case 'analyzing':
      return 'analyzing';
    case 'parsed':
      return 'analyzed';
    case 'rejected':
      return 'rejected';
    case 'ready':
      return 'completed';
    case 'inserted':
      return 'completed';
    default:
      return 'pending';
  }
}

/**
 * Convert Supabase ImportPost to frontend PostRow format
 */
export function importPostToPostRow(importPost: ImportPost): PostRow {
  return {
    id: importPost.id,
    url: importPost.url,
    source: importPost.source ?? undefined,
    note: importPost.note ?? undefined,
    status: mapImportStatusToPostStatus(importPost.status),
    rejectionReason: undefined, // This field doesn't exist in the new schema
    rawContent: importPost.raw_content ?? undefined,
    parsedJson: importPost.raw_analysis as unknown as ParsedPost | undefined,
    images: (importPost.images as unknown as ImageItem[]) || [],
    lastUpdatedAt: importPost.updated_at,
    workflowStep: importPost.workflow_step,
    stepCompleted: importPost.step_completed as {
      raw?: boolean;
      details?: boolean;
      images?: boolean;
      pricing?: boolean;
    },
    pricing: {
      carPrice: importPost.car_price ?? undefined,
      customsFees: importPost.customs_fee ?? undefined,
      vat: importPost.vat_amount ?? undefined,
      shipping: importPost.shipping_cost ?? undefined,
      platformFee: importPost.platform_fee ?? undefined,
      total: importPost.total_cost ?? undefined,
    },
  };
}

/**
 * Convert frontend PostRow to Supabase ImportPostInsert format
 */
export function postRowToImportPostInsert(
  postRow: Partial<PostRow> & { url: string },
  adminUserId?: string
): ImportPostInsert {
  return {
    admin_user_id: adminUserId!,
    url: postRow.url,
    source: postRow.source ?? null,
    note: postRow.note ?? null,
    status: (postRow.status ? mapPostStatusToImportStatus(postRow.status) : 'pending') as 'completed' | 'pending' | 'analyzing' | 'analyzed' | 'rejected',
    raw_content: postRow.rawContent ?? null,
    raw_analysis: postRow.parsedJson as unknown as any ?? null,
    images: postRow.images as unknown as any ?? [],
    workflow_step: postRow.workflowStep ?? 'raw',
    step_completed: postRow.stepCompleted ?? {},
    car_price: postRow.pricing?.carPrice ?? null,
    customs_fee: postRow.pricing?.customsFees ?? 0,
    vat_amount: postRow.pricing?.vat ?? 0,
    shipping_cost: postRow.pricing?.shipping ?? 0,
    platform_fee: postRow.pricing?.platformFee ?? 0,
    total_cost: postRow.pricing?.total ?? 0,
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
  if (postRow.status !== undefined) update.status = mapPostStatusToImportStatus(postRow.status) as 'completed' | 'pending' | 'analyzing' | 'analyzed' | 'rejected';
  if (postRow.rawContent !== undefined) update.raw_content = postRow.rawContent ?? null;
  if (postRow.parsedJson !== undefined) update.raw_analysis = postRow.parsedJson as unknown as any ?? null;
  if (postRow.images !== undefined) update.images = postRow.images as unknown as any;
  if (postRow.workflowStep !== undefined) update.workflow_step = postRow.workflowStep;
  if (postRow.stepCompleted !== undefined) update.step_completed = postRow.stepCompleted;
  if (postRow.pricing !== undefined) {
    console.log('🔄 Converting pricing data:', postRow.pricing);
    update.car_price = postRow.pricing.carPrice ?? undefined;
    update.customs_fee = postRow.pricing.customsFees ?? undefined;
    update.vat_amount = postRow.pricing.vat ?? undefined;
    update.shipping_cost = postRow.pricing.shipping ?? undefined;
    update.platform_fee = postRow.pricing.platformFee ?? undefined;
    update.total_cost = postRow.pricing.total ?? undefined;
    console.log('📦 Converted pricing:', {
      car_price: update.car_price,
      customs_fee: update.customs_fee,
      vat_amount: update.vat_amount,
      shipping_cost: update.shipping_cost,
      platform_fee: update.platform_fee,
      total_cost: update.total_cost,
    });
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
    .from('portal_import_posts')
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
