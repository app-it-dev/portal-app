import { create } from 'zustand';
import type { Store, ImageItem, WorkflowStep } from '@/types';
import type { Database } from '@/types/supabase';
import { aiAnalyzeWithTimeout, adaptAiToParsedPost } from '@/utils/aiAnalyze';
import { supabase, getCurrentUser, getSupabase } from '@/lib/supabase';
import {
  importPostToPostRow,
  postRowToImportPostInsert,
  postRowToImportPostUpdate,
  checkUrlsDuplicates,
} from '@/lib/supabase-helpers';
import { logError } from '@/utils/errorLogger';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface SupabaseStoreState extends Store {
  userId: string | null;
  realtimeChannel: RealtimeChannel | null;
  isHydrated: boolean;
  isOnline: boolean;
  signOut: () => Promise<void>;
}

// Prevent multiple hydrations
let isHydrating = false;
let hasHydrated = false;

/**
 * Supabase-integrated store with real-time collaboration
 * 
 * Features:
 * - Real-time sync across users
 * - Duplicate URL detection
 * - Simple, clean schema
 */
// Helper function to get supabase client with error handling
const getSupabaseClient = () => {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase client not available');
  }
  return client;
};

export const useSupabaseStore = create<SupabaseStoreState>((set, get) => ({
  // State
  posts: [],
  activeId: null,
  search: '',
  showPastePostsModal: false,
  inflightByPostId: {},
  userId: null,
  realtimeChannel: null,
  isHydrated: false,
  isOnline: true,

  // Initialize: Auth + Hydrate + Subscribe to Realtime
  hydrate: async () => {
    // Skip on server side
    if (typeof window === 'undefined') {
      return;
    }

    // Prevent multiple hydrations
    if (isHydrating || hasHydrated) {
      console.log('⏭️ Skipping hydration (already done)');
      return;
    }

    isHydrating = true;

    try {
      // Clean up existing channel first
      const existingChannel = get().realtimeChannel;
      if (existingChannel) {
        console.log('Cleaning up existing Realtime channel...');
        await existingChannel.unsubscribe();
        set({ realtimeChannel: null, isOnline: false });
      }

      // 1. Try to get existing user or sign in anonymously
      const user = await getCurrentUser();
      
      console.log('getCurrentUser result:', user);
      
      if (user) {
        console.log('Existing session found:', user.id);
        set({ userId: user.id });
      } else {
        console.log('No auth session - redirecting to login');
        // Redirect to login page if no session
        window.location.href = '/login';
        return;
      }

      // 2. Fetch posts from Supabase (no admin check required)
      console.log('Fetching posts from Supabase...');
      const supabaseClient = getSupabaseClient();
      if (!supabaseClient) {
        console.error('Supabase client not available');
        set({ posts: [], isHydrated: true, isOnline: false });
        return;
      }

      console.log('Fetching posts from Supabase...');
      
      if (!supabase) {
        console.error('Supabase client not initialized');
        set({ posts: [], isHydrated: true, isOnline: false });
        return;
      }

      console.log('Supabase client initialized:', !!supabase);
      
      console.log('About to query portal_import_posts...');
      
      if (!supabase) {
        console.error('Supabase client is null - cannot query database');
        set({ posts: [], isHydrated: true, isOnline: false });
        return;
      }
      
      // First, let's test a simple query to see if Supabase is working
      // Admin membership check is enforced by middleware; no legacy portal_admin access here
      
      let data, error;
      try {
        const result = await getSupabaseClient()
          .schema('portal')
          .schema('portal')
          .from('portal_import_posts')
          .select('*')
          .order('created_at', { ascending: false });
        
        data = result.data;
        error = result.error;
      } catch (queryError) {
        console.error('Query threw an exception:', queryError);
        set({ posts: [], isHydrated: true });
        return;
      }
      
      console.log('Query completed. Data:', data);
      console.log('Query completed. Error:', error);
      console.log('Error type:', typeof error);
      console.log('Error keys:', error ? Object.keys(error) : 'null');

      if (error) {
        // Handle empty error objects
        const errorInfo = {
          message: error?.message || 'Unknown error',
          details: error?.details || 'No details available',
          hint: error?.hint || 'No hint available',
          code: error?.code || 'No code available',
          error: error,
        };
        
        console.error('Error fetching posts:', errorInfo);
        console.error('Full error object:', error);
        console.error('Error stringified:', JSON.stringify(error, null, 2));
        console.error('Error constructor:', error?.constructor?.name);
        console.error('Error prototype:', Object.getPrototypeOf(error));
        
        // Don't throw - mark as hydrated anyway to avoid infinite loading
        set({ posts: [], isHydrated: true });
        return;
      }

      console.log('Raw data from Supabase:', data);
      const posts = data?.map(importPostToPostRow) ?? [];
      set({ posts, isHydrated: true });
      console.log(`✅ Loaded ${posts.length} posts from Supabase`);

      // 3. Subscribe to real-time changes
      console.log('Setting up Realtime subscription...');
      
      // Use a unique channel name to avoid conflicts
      const channelName = `import_posts_${Date.now()}`;
      
      const channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: true },
            presence: { key: user.id },
          },
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'portal',
            table: 'portal_import_posts'
          },
          (payload) => {
            try {
              console.log('🔔 Realtime event received:', payload);
              console.log('Event type:', payload.eventType);
              console.log('New record:', payload.new);
              console.log('Old record:', payload.old);
              const { eventType, new: newRecord, old: oldRecord } = payload;

              if (eventType === 'INSERT' && newRecord) {
                console.log('➕ INSERT event - adding new post');
                const newPost = importPostToPostRow(newRecord as Database['portal']['Tables']['portal_import_posts']['Row']);
                set((state) => {
                  // Check if post already exists (prevent duplicates)
                  const exists = state.posts.some((p) => p.id === newPost.id);
                  if (exists) {
                    console.log('⏭️ Post already exists, skipping INSERT');
                    return state;
                  }
                  return {
                    posts: [newPost, ...state.posts],
                  };
                });
              } else if (eventType === 'UPDATE' && newRecord) {
                console.log('✏️ UPDATE event - updating post');
                const updatedPost = importPostToPostRow(newRecord as Database['portal']['Tables']['portal_import_posts']['Row']);
                set((state) => ({
                  posts: state.posts.map((p) => {
                    if (p.id === updatedPost.id) {
                      // Preserve local parsedJson if it exists and database version is empty
                      const hasLocalParsedJson = p.parsedJson && Object.keys(p.parsedJson).length > 0;
                      const hasDbParsedJson = updatedPost.parsedJson && Object.keys(updatedPost.parsedJson).length > 0;
                      
                      if (hasLocalParsedJson && !hasDbParsedJson) {
                        console.log('🔄 Preserving local parsedJson data');
                        return {
                          ...updatedPost,
                          parsedJson: p.parsedJson
                        };
                      }
                      return updatedPost;
                    }
                    return p;
                  }),
                }));
              } else if (eventType === 'DELETE' && oldRecord) {
                console.log('🗑️ DELETE event - removing post');
                set((state) => ({
                    posts: state.posts.filter((p) => p.id !== (oldRecord as Database['portal']['Tables']['portal_import_posts']['Row']).id),
                }));
              }
            } catch (err) {
              console.error('❌ Error processing realtime event:', err);
              console.log('Problematic payload:', payload);
              // Don't crash the app, just log the error
            }
          }
        )
        .subscribe((status: string, err?: Error) => {
          console.log('📡 Realtime subscription status:', status);
          if (err) {
            console.error('❌ Realtime subscription error:', err);
          }
          
          const isSubscribed = status === 'SUBSCRIBED';
          set({ isOnline: isSubscribed });
          
          if (isSubscribed) {
            console.log('✅ Real-time sync is ACTIVE! Changes will appear instantly.');
          } else {
            console.warn('⚠️ Real-time sync OFFLINE. Status:', status);
          }
        });

      set({ realtimeChannel: channel });
      console.log('Realtime channel created:', channel);
      
      // Mark as successfully hydrated
      hasHydrated = true;
      isHydrating = false;
    } catch (error) {
      logError(error, 'Hydration');
      
      // Mark as hydrated even on error to prevent infinite loading
      set({ isHydrated: true, posts: [] });
      isHydrating = false;
      hasHydrated = true;
    }
  },

  // Import posts with simple duplicate detection
  importPosts: async (rows: { url: string; source?: string; note?: string }[]) => {
    try {
      // Check if we're in demo mode (no authentication)
      const supabaseClient = getSupabaseClient();
      if (!supabaseClient) {
        console.log('Demo mode: Adding posts to local state');
        const newPosts = rows.map((row, index) => ({
          id: `demo-${Date.now()}-${index}`,
          url: row.url,
          source: row.source || 'Demo',
          note: row.note,
          status: 'pending' as const,
          images: [],
          lastUpdatedAt: new Date().toISOString(),
          workflowStep: 'raw' as const,
          stepCompleted: {},
        }));
        
        set((state) => ({
          posts: [...state.posts, ...newPosts]
        }));
        
        console.log(`✅ Demo mode: Added ${newPosts.length} posts`);
        return;
      }

      // Check if user is authenticated
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session?.user) {
        console.log('No authentication - redirecting to login');
        window.location.href = '/login';
        return;
      }

      // We have authentication - save to database
      console.log('User authenticated - saving to database');
      console.log('User ID:', session.user.id);

      // Get the current user's admin status from public.admins
      const { data: adminData, error: adminError } = await getSupabaseClient()
        .from('admins')
        .select('user_id')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .limit(1);
      
      if (adminError || !adminData || adminData.length === 0) {
        console.error('Admin not found or error:', adminError);
        throw new Error('Admin not found');
      }
      
      const adminUserId = (adminData[0] as { user_id: string }).user_id;
      console.log('Using admin user ID:', adminUserId);

      const urls = rows.map((r) => r.url);

      // Skip duplicate check for now to debug the issue
      console.log('Skipping duplicate check for debugging');

      const postsToInsert = rows.map((row) =>
        postRowToImportPostInsert(
          {
            url: row.url,
            source: row.source,
            note: row.note,
            status: 'pending',
          },
          adminUserId
        )
        );

      if (postsToInsert.length === 0) {
        console.log('No new posts to import (all are duplicates)');
        return;
      }

      // Insert to Supabase (realtime will handle UI update)
      const { error } = await getSupabaseClient()
        .schema('portal')
        .from('portal_import_posts')
        .insert(postsToInsert);

      if (error) {
        console.error('Database insert failed:', error);
        throw error;
      }

      console.log(`✅ Imported ${postsToInsert.length} posts to database`);
    } catch (error) {
      logError(error, 'Import Posts');
      throw error;
    }
  },

  // Import images for a post
  importImages: async (rows: { post_url: string; image_url: string; caption?: string }[]) => {
    try {
      const posts = get().posts;

      for (const post of posts) {
        const matchingImages = rows
          .filter((row) => row.post_url === post.url)
          .map((row) => ({
            url: row.image_url,
            keep: true,
            isMain: false,
            caption: row.caption,
          }));

        if (matchingImages.length > 0) {
          const hasMain = post.images.some((img) => img.isMain);
          if (!hasMain && matchingImages.length > 0) {
            matchingImages[0].isMain = true;
          }

          const updatedImages = [...post.images, ...matchingImages];

          // Update in Supabase
          await get().setImages(post.id, updatedImages);
        }
      }
    } catch (error) {
      console.error('Import images error:', error);
      throw error;
    }
  },

  setActive: (id: string | null) => {
    // Don't cancel in-flight requests when switching posts
    // Allow multiple analyses to run simultaneously
    set({
      activeId: id,
    });
  },

  setSearch: (search: string) => {
    set({ search });
  },

  // Cancel a specific analysis
  cancelAnalysis: (id: string) => {
    const { inflightByPostId } = get();
    const controller = inflightByPostId[id];
    if (controller) {
      controller.abort();
      console.log(`Cancelled analysis for post ${id}`);
    }
  },

  reject: async (id: string, reason?: string) => {
    try {
      // Check if user is authenticated and is admin
      const { data: { session } } = await getSupabaseClient().auth.getSession();
      if (!session?.user) {
        throw new Error('Authentication required');
      }

      // Admin check handled by middleware; this action relies on RLS via user JWT

      const update = postRowToImportPostUpdate(
        {
          status: 'rejected',
          rejectionReason: reason,
        },
        get().userId ?? undefined
      );

      const { error } = await getSupabaseClient()
        .schema('portal')
        .from('portal_import_posts')
        .update(update)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Reject error:', error);
      throw error;
    }
  },

  undoReject: async (id: string) => {
    try {
      const update = postRowToImportPostUpdate(
        {
          status: 'pending',
          rejectionReason: undefined,
        },
        get().userId ?? undefined
      );

      const { error } = await getSupabaseClient()
        .schema('portal')
        .from('portal_import_posts')
        .update(update)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Undo reject error:', error);
      throw error;
    }
  },

  saveRaw: async (id: string, text: string) => {
    try {
      const update = postRowToImportPostUpdate(
        {
          rawContent: text,
        },
        get().userId ?? undefined
      );

      const { error } = await getSupabaseClient()
        .schema('portal')
        .from('portal_import_posts')
        .update(update)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Save raw error:', error);
      throw error;
    }
  },

  analyze: async (id: string) => {
    const abortController = new AbortController();
    
    // Track this analysis request
    set((state) => ({
      inflightByPostId: { ...state.inflightByPostId, [id]: abortController },
    }));

    try {
      const post = get().posts.find((p) => p.id === id);
      if (!post) throw new Error('Post not found');

      // Update status to analyzing
      await getSupabaseClient()
        .schema('portal')
        .from('portal_import_posts')
        .update({
          status: 'analyzing',
        })
        .eq('id', id);

      // Run AI analysis (this starts the n8n workflow)
      const aiResult = await aiAnalyzeWithTimeout(
        { url: post.url, raw: post.rawContent ?? '' },
        60000, // Increased to 60 seconds
        abortController.signal
      );

      // Check if this specific analysis was aborted
      if (abortController.signal.aborted) {
        console.log(`Analysis for post ${id} was aborted`);
        return;
      }

      // Adapt the response to our format (same as original working version)
      const parsedJson = adaptAiToParsedPost(aiResult, post.url);

      // Update the local store with results (same as original)
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === id
            ? {
                ...p,
                status: 'parsed' as const,
                parsedJson,
                lastUpdatedAt: new Date().toISOString(),
              }
            : p
        ),
        inflightByPostId: {
          ...state.inflightByPostId,
          [id]: undefined,
        },
      }));

      // Update with parsed result in database
      const update = postRowToImportPostUpdate(
        {
          status: 'parsed',
          parsedJson,
        },
        get().userId ?? undefined
      );

      const { error } = await getSupabaseClient()
        .schema('portal')
        .from('portal_import_posts')
        .update(update)
        .eq('id', id);

      if (error) throw error;

      // Mark the raw step as completed after successful analysis
      await get().completeStep(id, 'raw');
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        logError(error, 'Analysis');
        
        // Revert status on error
        await getSupabaseClient()
          .schema('portal')
          .from('portal_import_posts')
          .update({
            status: 'pending',
          })
          .eq('id', id);
      }
      throw error;
    } finally {
      // Clean up the abort controller for this specific post
      set((state) => {
        const { [id]: _removed, ...rest } = state.inflightByPostId;
        return { inflightByPostId: rest };
      });
    }
  },


  setImages: async (id: string, images: ImageItem[]) => {
    try {
      const update = postRowToImportPostUpdate(
        {
          images,
        },
        get().userId ?? undefined
      );

      const { error } = await getSupabaseClient()
        .schema('portal')
        .from('portal_import_posts')
        .update(update)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Set images error:', error);
      throw error;
    }
  },

  next: () => {
    const { posts, activeId } = get();
    if (posts.length === 0) return;

    const currentIndex = posts.findIndex((p) => p.id === activeId);
    const nextIndex = currentIndex < posts.length - 1 ? currentIndex + 1 : 0;
    get().setActive(posts[nextIndex].id);
  },

  prev: () => {
    const { posts, activeId } = get();
    if (posts.length === 0) return;

    const currentIndex = posts.findIndex((p) => p.id === activeId);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : posts.length - 1;
    get().setActive(posts[prevIndex].id);
  },

  reset: async () => {
    try {
      // Delete all posts for current user
      const userId = get().userId;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const { error } = await getSupabaseClient()
        .schema('portal')
        .from('portal_import_posts')
        .delete()
        .eq('admin_user_id', userId);

      if (error) throw error;

      set({ posts: [], activeId: null, search: '' });
    } catch (error) {
      console.error('Reset error:', error);
      throw error;
    }
  },

  // Deprecated - data comes from Supabase now
  persist: () => {
    console.warn('persist() is deprecated with Supabase integration');
  },

  setShowPastePostsModal: (show: boolean) => {
    set({ showPastePostsModal: show });
  },

  // Workflow actions
  setWorkflowStep: async (id: string, step: WorkflowStep) => {
    try {
      const update = postRowToImportPostUpdate(
        { workflowStep: step },
        get().userId ?? undefined
      );

      const { error } = await getSupabaseClient()
        .schema('portal')
        .from('portal_import_posts')
        .update(update)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Set workflow step error:', error);
      throw error;
    }
  },

  completeStep: async (id: string, step: WorkflowStep) => {
    try {
      const post = get().posts.find((p) => p.id === id);
      if (!post) return;

      const updatedStepCompleted = {
        ...post.stepCompleted,
        [step]: true,
      };

      const update = postRowToImportPostUpdate(
        { stepCompleted: updatedStepCompleted },
        get().userId ?? undefined
      );

      const { error } = await getSupabaseClient()
        .schema('portal')
        .from('portal_import_posts')
        .update(update)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Complete step error:', error);
      throw error;
    }
  },

  acceptAnalysis: async (id: string) => {
    await get().completeStep(id, 'raw');
  },

  saveDetails: async (id: string, data: Record<string, unknown>) => {
    try {
      const post = get().posts.find((p) => p.id === id);
      if (!post) return;

      const updatedParsedJson = {
        ...post.parsedJson,
        ...data,
      };

      const update = postRowToImportPostUpdate(
        { parsedJson: updatedParsedJson },
        get().userId ?? undefined
      );

      const { error } = await getSupabaseClient()
        .schema('portal')
        .from('portal_import_posts')
        .update(update)
        .eq('id', id);

      if (error) throw error;

      // Mark the details step as completed
      await get().completeStep(id, 'details');
    } catch (error) {
      console.error('Save details error:', error);
      throw error;
    }
  },

  acceptImages: async (id: string) => {
    await get().completeStep(id, 'images');
  },

  savePricing: async (id: string, pricing: Record<string, unknown>) => {
    try {
      console.log('💾 Saving pricing data:', { id, pricing });
      
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const update = postRowToImportPostUpdate(
        { pricing },
        get().userId ?? undefined
      );

      console.log('📤 Update payload:', update);

      const { data, error } = await getSupabaseClient()
        .schema('portal')
        .from('portal_import_posts')
        .update(update)
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Pricing saved successfully:', data);

      // Mark the pricing step as completed
      await get().completeStep(id, 'pricing');
    } catch (error) {
      console.error('Save pricing error:', error);
      throw error;
    }
  },

  finalizePost: async (id: string) => {
    try {
      const update = postRowToImportPostUpdate(
        {
          status: 'ready',
          workflowStep: 'complete',
        },
        get().userId ?? undefined
      );

      const { error } = await getSupabaseClient()
        .schema('portal')
        .from('portal_import_posts')
        .update(update)
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Finalize post error:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      const supabaseClient = getSupabaseClient();
      if (supabaseClient) {
        await supabaseClient.auth.signOut();
      }
      
      // Clear the store state
      set({
        posts: [],
        activeId: null,
        search: '',
        showPastePostsModal: false,
        inflightByPostId: {},
        userId: null,
        realtimeChannel: null,
        isHydrated: false,
        isOnline: false,
      });
      
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },
}));

// Auto-hydrate on mount (client-side only)
if (typeof window !== 'undefined') {
  // Clear old localStorage data from previous version
  const oldStorageKey = 'carsgate_newposts_v1';
  if (localStorage.getItem(oldStorageKey)) {
    console.log('🧹 Clearing old localStorage data...');
    localStorage.removeItem(oldStorageKey);
    console.log('✅ Old data cleared. Using Supabase now.');
  }
  
  // Delay hydration slightly to avoid SSR issues
  setTimeout(() => {
    console.log('🚀 Starting Supabase hydration...');
    useSupabaseStore.getState().hydrate();
  }, 100);
}
