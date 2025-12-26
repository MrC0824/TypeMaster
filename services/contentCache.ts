import { Difficulty, InputMode, PracticeContent } from "../types";

const CACHE_KEY_PREFIX = 'typemaster_cache_v1_';
const MAX_CACHE_SIZE = 50; // Limit per mode/difficulty to prevent LocalStorage quota issues

export const ContentCache = {
  getKey: (mode: InputMode, difficulty: Difficulty) => {
    return `${CACHE_KEY_PREFIX}${mode}_${difficulty}`;
  },

  save: (mode: InputMode, difficulty: Difficulty, content: PracticeContent) => {
    try {
      const key = ContentCache.getKey(mode, difficulty);
      const raw = localStorage.getItem(key);
      let list: PracticeContent[] = [];

      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          // Migration: If old cache was a single object, wrap it in array
          list = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          list = [];
        }
      }

      // Check for duplicates based on text content to avoid storing identical sets
      // This ensures we only append unique practice content
      const isDuplicate = list.some(item => item.text === content.text);

      if (!isDuplicate) {
        // Append new content
        list.push(content);

        // Enforce size limit (FIFO - First In First Out)
        if (list.length > MAX_CACHE_SIZE) {
          list = list.slice(list.length - MAX_CACHE_SIZE);
        }

        localStorage.setItem(key, JSON.stringify(list));
      } else {
        console.log("Duplicate content detected, skipping save.");
      }
    } catch (e) {
      console.error("Failed to save to cache", e);
    }
  },

  get: (mode: InputMode, difficulty: Difficulty): PracticeContent | null => {
    try {
      const item = localStorage.getItem(ContentCache.getKey(mode, difficulty));
      if (!item) return null;

      const parsed = JSON.parse(item);
      const list: PracticeContent[] = Array.isArray(parsed) ? parsed : [parsed];

      if (list.length === 0) return null;

      // Randomly select one practice set from the list
      // This satisfies the requirement to randomly allocate data when entering practice
      const randomIndex = Math.floor(Math.random() * list.length);
      return list[randomIndex];
    } catch (e) {
      console.error("Failed to load from cache", e);
      return null;
    }
  },

  has: (mode: InputMode, difficulty: Difficulty): boolean => {
    const key = ContentCache.getKey(mode, difficulty);
    const item = localStorage.getItem(key);
    if (!item) return false;
    try {
      const parsed = JSON.parse(item);
      return Array.isArray(parsed) ? parsed.length > 0 : true;
    } catch {
      return false;
    }
  },

  // New helper to get count for UI display
  getCount: (mode: InputMode, difficulty: Difficulty): number => {
    try {
      const item = localStorage.getItem(ContentCache.getKey(mode, difficulty));
      if (!item) return 0;
      const parsed = JSON.parse(item);
      return Array.isArray(parsed) ? parsed.length : 1;
    } catch {
      return 0;
    }
  },

  clearAll: () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
};