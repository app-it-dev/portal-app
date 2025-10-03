import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Store, PostRow, ImageItem, WorkflowStep } from '@/types';
import { aiAnalyzeWithTimeout, adaptAiToParsedPost } from '@/utils/aiAnalyze';

const STORAGE_KEY = 'carsgate_newposts_v1';

const createPostRow = (url: string, source?: string, note?: string): PostRow => ({
  id: nanoid(),
  url,
  source,
  note,
  status: 'pending',
  images: [],
  lastUpdatedAt: new Date().toISOString(),
  workflowStep: 'raw',
  stepCompleted: {
    raw: false,
    details: false,
    images: false,
  },
});

export const useStore = create<Store>((set, get) => ({
  // State
  posts: [],
  activeId: null,
  search: '',
  showPastePostsModal: false,
  inflightByPostId: {},

  // Actions
  importPosts: (rows: { url: string; source?: string; note?: string }[]) => {
    const existingUrls = new Set(get().posts.map(p => p.url));
    const newPosts = rows
      .filter(row => row.url && !existingUrls.has(row.url))
      .map(row => createPostRow(row.url, row.source, row.note));
    
    set(state => ({
      posts: [...state.posts, ...newPosts],
    }));
    get().persist();
  },

  importImages: (rows: { post_url: string; image_url: string; caption?: string }[]) => {
    const posts = get().posts;
    const updatedPosts = posts.map(post => {
      const matchingImages = rows
        .filter(row => row.post_url === post.url)
        .map(row => ({
          url: row.image_url,
          keep: true,
          isMain: false,
          caption: row.caption,
        }));

      if (matchingImages.length > 0) {
        // If no main image exists, make the first one main
        const hasMain = post.images.some(img => img.isMain);
        if (!hasMain && matchingImages.length > 0) {
          matchingImages[0].isMain = true;
        }

        return {
          ...post,
          images: [...post.images, ...matchingImages],
          lastUpdatedAt: new Date().toISOString(),
        };
      }
      return post;
    });

    set({ posts: updatedPosts });
    get().persist();
  },

  setActive: (id: string | null) => {
    const { inflightByPostId } = get();
    
    // Cancel any in-flight requests for other posts
    Object.entries(inflightByPostId).forEach(([postId, controller]) => {
      if (postId !== id && controller) {
        controller.abort();
        // Don't revert status - let the analysis complete naturally
        // The status will be updated when the analysis completes or fails
      }
    });

    // Clear the inflight tracking for cancelled requests
    const newInflightByPostId = id ? { [id]: inflightByPostId[id] } : {};
    
    set({ 
      activeId: id,
      inflightByPostId: newInflightByPostId
    });
    get().persist();
  },


  setSearch: (search: string) => {
    set({ search });
  },

  reject: (id: string, reason?: string) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === id
          ? {
              ...post,
              status: 'rejected' as const,
              rejectionReason: reason,
              lastUpdatedAt: new Date().toISOString(),
            }
          : post
      ),
    }));
    get().persist();
  },

  undoReject: (id: string) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === id
          ? {
              ...post,
              status: 'pending' as const,
              rejectionReason: undefined,
              lastUpdatedAt: new Date().toISOString(),
            }
          : post
      ),
    }));
    get().persist();
  },

  saveRaw: (id: string, text: string) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === id
          ? {
              ...post,
              rawContent: text,
              workflowStep: 'raw' as WorkflowStep,
              stepCompleted: {
                ...post.stepCompleted,
                raw: text.trim().length > 0,
              },
              lastUpdatedAt: new Date().toISOString(),
            }
          : post
      ),
    }));
    get().persist();
  },

  analyze: async (id: string) => {
    const post = get().posts.find(p => p.id === id);
    if (!post || !post.rawContent?.trim()) {
      throw new Error('Post not found or no raw content available');
    }

    // Validate preconditions
    if (post.status === 'rejected') {
      throw new Error('Cannot analyze rejected post');
    }

    // Create abort controller for this request
    const controller = new AbortController();
    
    // Set status to analyzing and track the request
    set(state => ({
      posts: state.posts.map(p =>
        p.id === id
          ? {
              ...p,
              status: 'analyzing' as const,
              lastUpdatedAt: new Date().toISOString(),
            }
          : p
      ),
      inflightByPostId: {
        ...state.inflightByPostId,
        [id]: controller,
      },
    }));

    try {
      // Call the AI API
      const response = await aiAnalyzeWithTimeout(
        { url: post.url, raw: post.rawContent },
        60000, // 60 second timeout
      );


      // Adapt the response to our format
      const parsedJson = adaptAiToParsedPost(response, post.url);

      // Update the post with results
      set(state => ({
        posts: state.posts.map(p =>
          p.id === id
            ? {
                ...p,
                status: 'parsed' as const,
                parsedJson,
                workflowStep: 'raw' as WorkflowStep,
                stepCompleted: {
                  ...p.stepCompleted,
                  analyze: true,
                },
                lastUpdatedAt: new Date().toISOString(),
              }
            : p
        ),
        inflightByPostId: {
          ...state.inflightByPostId,
          [id]: undefined,
        },
      }));

      get().persist();
    } catch (error) {
      // Check if the request was cancelled (aborted)
      const isAborted = error instanceof Error && error.name === 'AbortError';
      
      if (isAborted) {
        // If the request was cancelled, revert status to pending
        // This happens when user switches to another post while analysis is running
        set(state => ({
          posts: state.posts.map(p =>
            p.id === id
              ? {
                  ...p,
                  status: 'pending' as const,
                  lastUpdatedAt: new Date().toISOString(),
                }
              : p
          ),
          inflightByPostId: {
            ...state.inflightByPostId,
            [id]: undefined,
          },
        }));
        // Don't re-throw aborted errors as they're expected when switching posts
        return;
      } else {
        // On actual failure, revert status to pending
        set(state => ({
          posts: state.posts.map(p =>
            p.id === id
              ? {
                  ...p,
                  status: 'pending' as const,
                  lastUpdatedAt: new Date().toISOString(),
                }
              : p
          ),
          inflightByPostId: {
            ...state.inflightByPostId,
            [id]: undefined,
          },
        }));
      }

      // Re-throw the error so the UI can handle it
      throw error;
    }
  },

  setImages: (id: string, images: ImageItem[]) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === id
          ? {
              ...post,
              images,
              lastUpdatedAt: new Date().toISOString(),
            }
          : post
      ),
    }));
    get().persist();
  },

  next: () => {
    const { posts, activeId, search } = get();
    const filteredPosts = getFilteredPosts(posts, search);
    const currentIndex = activeId ? filteredPosts.findIndex(p => p.id === activeId) : -1;
    const nextIndex = currentIndex < filteredPosts.length - 1 ? currentIndex + 1 : 0;
    if (filteredPosts[nextIndex]) {
      get().setActive(filteredPosts[nextIndex].id);
    }
  },

  prev: () => {
    const { posts, activeId, search } = get();
    const filteredPosts = getFilteredPosts(posts, search);
    const currentIndex = activeId ? filteredPosts.findIndex(p => p.id === activeId) : -1;
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredPosts.length - 1;
    if (filteredPosts[prevIndex]) {
      get().setActive(filteredPosts[prevIndex].id);
    }
  },

  reset: () => {
    // Cancel any in-flight requests
    const { inflightByPostId } = get();
    Object.values(inflightByPostId).forEach(controller => {
      if (controller) {
        controller.abort();
      }
    });

    set({
      posts: [],
      activeId: null,
      search: '',
      showPastePostsModal: false,
      inflightByPostId: {},
    });
    localStorage.removeItem(STORAGE_KEY);
  },

  setShowPastePostsModal: (show: boolean) => {
    set({ showPastePostsModal: show });
  },

  // Workflow actions
  setWorkflowStep: (id: string, step: WorkflowStep) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === id
          ? {
              ...post,
              workflowStep: step,
              lastUpdatedAt: new Date().toISOString(),
            }
          : post
      ),
    }));
    get().persist();
  },

  completeStep: (id: string, step: WorkflowStep) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === id
          ? {
              ...post,
              stepCompleted: {
                ...post.stepCompleted,
                [step]: true,
              },
              lastUpdatedAt: new Date().toISOString(),
            }
          : post
      ),
    }));
    get().persist();
  },

  acceptAnalysis: (id: string) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === id
          ? {
              ...post,
              workflowStep: 'details' as WorkflowStep,
              stepCompleted: {
                ...post.stepCompleted,
                details: true,
              },
              lastUpdatedAt: new Date().toISOString(),
            }
          : post
      ),
    }));
    get().persist();
  },

  saveDetails: (id: string, data: any) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === id
          ? {
              ...post,
              parsedJson: data,
              lastUpdatedAt: new Date().toISOString(),
            }
          : post
      ),
    }));
    get().persist();
  },

  savePricing: (id: string, pricing: any) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === id
          ? {
              ...post,
              pricing,
              lastUpdatedAt: new Date().toISOString(),
            }
          : post
      ),
    }));
    get().persist();
  },

  acceptImages: (id: string) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === id
          ? {
              ...post,
              workflowStep: 'complete' as WorkflowStep,
              stepCompleted: {
                ...post.stepCompleted,
                images: true,
              },
              lastUpdatedAt: new Date().toISOString(),
            }
          : post
      ),
    }));
    get().persist();
  },

  finalizePost: (id: string) => {
    set(state => ({
      posts: state.posts.map(post =>
        post.id === id
          ? {
              ...post,
              workflowStep: 'complete' as WorkflowStep,
              status: 'ready' as const,
              stepCompleted: {
                ...post.stepCompleted,
                images: true,
              },
              lastUpdatedAt: new Date().toISOString(),
            }
          : post
      ),
    }));
    get().persist();
  },

  hydrate: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({
          posts: data.posts || [],
          activeId: data.activeId || null,
          search: data.search || '',
          showPastePostsModal: false,
        });
      }
    } catch (error) {
      console.error('Failed to hydrate store:', error);
    }
  },

  persist: () => {
    try {
      const { posts, activeId, search } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        posts,
        activeId,
        search,
      }));
    } catch (error) {
      console.error('Failed to persist store:', error);
    }
  },
}));

// Helper function to filter posts - show all posts since filter widget is removed
const getFilteredPosts = (posts: PostRow[], search: string): PostRow[] => {
  let filtered = posts;

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(post =>
      post.url.toLowerCase().includes(searchLower) ||
      post.source?.toLowerCase().includes(searchLower) ||
      post.note?.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
};
