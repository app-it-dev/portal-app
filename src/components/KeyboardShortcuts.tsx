'use client';

import { useHotkeys } from 'react-hotkeys-hook';
import { useSupabaseStore as useStore } from '@/store/supabase-store';

export function KeyboardShortcuts() {
  const { posts, activeId, next, prev, reject, undoReject, setShowPastePostsModal } = useStore();

  const activePost = activeId ? posts.find(p => p.id === activeId) : null;

  // J - Next post
  useHotkeys('j', () => {
    next();
  }, { preventDefault: true });

  // K - Previous post
  useHotkeys('k', () => {
    prev();
  }, { preventDefault: true });

  // V - View active post URL in new tab
  useHotkeys('v', () => {
    if (activePost) {
      window.open(activePost.url, '_blank');
    }
  }, { preventDefault: true });

  // R - Toggle reject on active post
  useHotkeys('r', () => {
    if (activePost) {
      if (activePost.status === 'rejected') {
        undoReject(activePost.id);
      } else {
        reject(activePost.id, 'Manually rejected via keyboard shortcut');
      }
    }
  }, { preventDefault: true });

  // P - Open paste posts modal (when no input is focused)
  useHotkeys('p', () => {
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement as HTMLElement).contentEditable === 'true'
    );
    
    if (!isInputFocused) {
      setShowPastePostsModal(true);
    }
  }, { preventDefault: true });

  return null; // This component doesn't render anything
}
