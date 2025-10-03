import * as XLSX from 'xlsx';

export interface PostRow {
  url: string;
  source?: string;
  note?: string;
}

export interface ImageRow {
  post_url: string;
  image_url: string;
  caption?: string;
}

export const parsePostsXLSX = async (file: File): Promise<PostRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error('No sheets found in the file'));
          return;
        }
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          reject(new Error('File must have at least a header row and one data row'));
          return;
        }
        
        const headers = jsonData[0] as string[];
        const urlIndex = headers.findIndex(h => h?.toLowerCase() === 'url');
        
        if (urlIndex === -1) {
          reject(new Error('Required column "url" not found'));
          return;
        }
        
        const sourceIndex = headers.findIndex(h => h?.toLowerCase() === 'source');
        const noteIndex = headers.findIndex(h => h?.toLowerCase() === 'note');
        
        const posts: PostRow[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as unknown[];
          const url = row[urlIndex];
          
          if (url && typeof url === 'string' && url.trim()) {
            posts.push({
              url: url.trim(),
              source: sourceIndex !== -1 ? (row[sourceIndex] as string) : undefined,
              note: noteIndex !== -1 ? (row[noteIndex] as string) : undefined,
            });
          }
        }
        
        resolve(posts);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export const parseImagesXLSX = async (file: File): Promise<ImageRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error('No sheets found in the file'));
          return;
        }
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          reject(new Error('File must have at least a header row and one data row'));
          return;
        }
        
        const headers = jsonData[0] as string[];
        const postUrlIndex = headers.findIndex(h => h?.toLowerCase() === 'post_url');
        const imageUrlIndex = headers.findIndex(h => h?.toLowerCase() === 'image_url');
        
        if (postUrlIndex === -1 || imageUrlIndex === -1) {
          reject(new Error('Required columns "post_url" and "image_url" not found'));
          return;
        }
        
        const captionIndex = headers.findIndex(h => h?.toLowerCase() === 'caption');
        
        const images: ImageRow[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as unknown[];
          const postUrl = row[postUrlIndex];
          const imageUrl = row[imageUrlIndex];
          
          if (postUrl && imageUrl && typeof postUrl === 'string' && typeof imageUrl === 'string') {
            images.push({
              post_url: postUrl.trim(),
              image_url: imageUrl.trim(),
              caption: captionIndex !== -1 ? (row[captionIndex] as string) : undefined,
            });
          }
        }
        
        resolve(images);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};
