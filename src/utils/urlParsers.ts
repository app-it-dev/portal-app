/**
 * URL parsing utilities for paste functionality
 */

export interface ParsedImageItem {
  url: string;
  caption?: string;
}

/**
 * Normalizes a URL for deduplication
 * - Converts to lowercase
 * - Removes trailing slash
 * - Keeps query parameters
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const normalized = urlObj.toString().toLowerCase();
    return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parses post URLs from multiline text
 * - Ignores empty lines and comments (lines starting with #)
 * - Trims whitespace
 * - Validates URLs
 * - Deduplicates by normalized URL
 * - Optionally ignores first line if it's a label like "posts"
 */
export function parsePostUrlsFromText(text: string): { urls: string[]; skipped: number } {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) {
    return { urls: [], skipped: 0 };
  }

  // Check if first line is a label (case-insensitive)
  const firstLine = lines[0].toLowerCase();
  const isLabel = firstLine === 'posts' || firstLine === 'post' || firstLine === 'urls' || firstLine === 'url';
  
  const startIndex = isLabel ? 1 : 0;
  const urlLines = lines.slice(startIndex);
  
  const validUrls: string[] = [];
  const normalizedUrls = new Set<string>();
  let skipped = 0;

  for (const line of urlLines) {
    // Skip comments
    if (line.startsWith('#')) {
      skipped++;
      continue;
    }

    // Skip empty lines (already filtered, but just in case)
    if (!line) {
      skipped++;
      continue;
    }

    // Validate URL
    if (!isValidUrl(line)) {
      skipped++;
      continue;
    }

    // Deduplicate by normalized URL
    const normalized = normalizeUrl(line);
    if (!normalizedUrls.has(normalized)) {
      normalizedUrls.add(normalized);
      validUrls.push(line);
    }
  }

  return { urls: validUrls, skipped };
}

/**
 * Parses image URLs from multiline text
 * Supports two formats:
 * 1. URL only per line
 * 2. URL + caption separated by comma or tab
 */
export function parseImageItemsFromText(text: string): { items: ParsedImageItem[]; skipped: number } {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) {
    return { items: [], skipped: 0 };
  }

  const validItems: ParsedImageItem[] = [];
  const normalizedUrls = new Set<string>();
  let skipped = 0;

  for (const line of lines) {
    // Skip comments
    if (line.startsWith('#')) {
      skipped++;
      continue;
    }

    // Skip empty lines
    if (!line) {
      skipped++;
      continue;
    }

    // Try to parse URL and optional caption
    let url: string;
    let caption: string | undefined;

    // Check for comma or tab separator
    const commaIndex = line.indexOf(',');
    const tabIndex = line.indexOf('\t');
    
    if (commaIndex !== -1 && (tabIndex === -1 || commaIndex < tabIndex)) {
      // Comma separator
      url = line.substring(0, commaIndex).trim();
      caption = line.substring(commaIndex + 1).trim();
    } else if (tabIndex !== -1) {
      // Tab separator
      url = line.substring(0, tabIndex).trim();
      caption = line.substring(tabIndex + 1).trim();
    } else {
      // No separator, just URL
      url = line;
    }

    // Validate URL
    if (!isValidUrl(url)) {
      skipped++;
      continue;
    }

    // Deduplicate by normalized URL
    const normalized = normalizeUrl(url);
    if (!normalizedUrls.has(normalized)) {
      normalizedUrls.add(normalized);
      validItems.push({ url, caption: caption || undefined });
    }
  }

  return { items: validItems, skipped };
}
