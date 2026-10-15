import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Tag } from '@zwantum/blog-types';
import { BlogClient } from '@zwantum/blog-core';

export interface TagInputProps {
  availableTags: Tag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  client?: BlogClient;
  onTagCreated?: (newTag: Tag) => void;
  placeholder?: string;
  className?: string;
}

const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const TagInput: React.FC<TagInputProps> = ({
  availableTags = [],
  selectedTagIds = [],
  onChange,
  client,
  onTagCreated,
  placeholder = 'Type tags, comma-separated...',
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [localTags, setLocalTags] = useState<Tag[]>(availableTags);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external available tags with local tag catalog
  useEffect(() => {
    setLocalTags((prev) => {
      const map = new Map<string, Tag>();
      prev.forEach((t) => map.set(t.id, t));
      availableTags.forEach((t) => map.set(t.id, t));
      return Array.from(map.values());
    });
  }, [availableTags]);

  // Selected tags objects
  const selectedTags = useMemo(() => {
    return selectedTagIds
      .map((id) => localTags.find((t) => t.id === id))
      .filter((t): t is Tag => !!t);
  }, [selectedTagIds, localTags]);

  // Autocomplete suggestions for remaining unselected tags
  const suggestions = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return [];
    return localTags.filter(
      (t) =>
        !selectedTagIds.includes(t.id) &&
        (t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q))
    );
  }, [inputValue, localTags, selectedTagIds]);

  const exactMatchExists = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return false;
    return localTags.some(
      (t) => t.name.toLowerCase() === q || t.slug.toLowerCase() === generateSlug(q)
    );
  }, [inputValue, localTags]);

  // Process a batch of raw tag strings (e.g. from comma typing or pasting)
  const processTagStrings = async (rawStrings: string[]) => {
    const nextTagIds = [...selectedTagIds];
    const newTagsCreated: Tag[] = [];

    for (const raw of rawStrings) {
      const name = raw.trim();
      if (!name) continue;

      const slug = generateSlug(name);
      if (!slug) continue;

      // Check if already in selected
      const isAlreadySelected = nextTagIds.some((id) => {
        const found = localTags.find((t) => t.id === id);
        return (
          found &&
          (found.name.toLowerCase() === name.toLowerCase() ||
            found.slug.toLowerCase() === slug.toLowerCase())
        );
      });
      if (isAlreadySelected) continue;

      // Check if exists in local catalog
      let existingTag = localTags.find(
        (t) =>
          t.name.toLowerCase() === name.toLowerCase() ||
          t.slug.toLowerCase() === slug.toLowerCase()
      );

      if (!existingTag && client) {
        try {
          const created = await client.tags.create({
            name,
            slug,
          });
          existingTag = created;
          newTagsCreated.push(created);
          onTagCreated?.(created);
        } catch {
          // Fallback in-memory tag
          const tempTag: Tag = {
            id: `temp-tag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name,
            slug,
            post_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          existingTag = tempTag;
          newTagsCreated.push(tempTag);
        }
      } else if (!existingTag) {
        const tempTag: Tag = {
          id: `temp-tag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          slug,
          post_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        existingTag = tempTag;
        newTagsCreated.push(tempTag);
      }

      if (existingTag && !nextTagIds.includes(existingTag.id)) {
        nextTagIds.push(existingTag.id);
      }
    }

    if (newTagsCreated.length > 0) {
      setLocalTags((prev) => [...prev, ...newTagsCreated]);
    }

    onChange(nextTagIds);
    setInputValue('');
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        // Select highlighted suggestion
        const selected = suggestions[highlightedIndex];
        if (!selectedTagIds.includes(selected.id)) {
          onChange([...selectedTagIds, selected.id]);
        }
        setInputValue('');
        setHighlightedIndex(-1);
      } else if (inputValue.trim()) {
        processTagStrings([inputValue]);
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedTagIds.length > 0) {
      // Remove last tag on Backspace if input is empty
      e.preventDefault();
      onChange(selectedTagIds.slice(0, -1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const max = suggestions.length + (!exactMatchExists && inputValue.trim() ? 1 : 0);
      setHighlightedIndex((prev) => (prev + 1 < max ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const max = suggestions.length + (!exactMatchExists && inputValue.trim() ? 1 : 0);
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : max - 1));
    } else if (e.key === 'Escape') {
      setInputValue('');
      setHighlightedIndex(-1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (text.includes(',')) {
      e.preventDefault();
      const parts = text.split(',');
      processTagStrings(parts);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTagIds.filter((id) => id !== tagId));
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`zw-tag-input-container ${className}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Pills & Input Box */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 10px',
          background: '#ffffff',
          border: `1px solid ${isFocused ? '#eab308' : '#cbd5e1'}`,
          borderRadius: '8px',
          boxShadow: isFocused ? '0 0 0 3px rgba(255, 204, 0, 0.25)' : 'none',
          minHeight: '42px',
          cursor: 'text',
          transition: 'all 0.15s ease',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 9px',
              fontSize: '12px',
              fontWeight: 600,
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
              borderRadius: '20px',
              userSelect: 'none',
              lineHeight: 1.2,
            }}
          >
            <span>{tag.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(tag.id);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#b45309',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 700,
                lineHeight: 1,
              }}
              title={`Remove ${tag.name}`}
            >
              ✕
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            const val = e.target.value;
            if (val.includes(',')) {
              processTagStrings(val.split(','));
            } else {
              setInputValue(val);
              setHighlightedIndex(0);
            }
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          placeholder={selectedTags.length === 0 ? placeholder : 'Add more...'}
          style={{
            flex: 1,
            minWidth: '120px',
            border: 'none',
            outline: 'none',
            fontSize: '13px',
            color: '#0f172a',
            background: 'transparent',
            padding: '2px 0',
          }}
        />
      </div>

      {/* Auto-suggest dropdown */}
      {isFocused && inputValue.trim().length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 9999,
          }}
        >
          {suggestions.map((suggestion, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <div
                key={suggestion.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (!selectedTagIds.includes(suggestion.id)) {
                    onChange([...selectedTagIds, suggestion.id]);
                  }
                  setInputValue('');
                  setHighlightedIndex(-1);
                }}
                style={{
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: isHighlighted ? '#fefce8' : '#ffffff',
                  color: isHighlighted ? '#854d0e' : '#0f172a',
                  fontSize: '13px',
                  fontWeight: 500,
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <span>{suggestion.name}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>/{suggestion.slug}</span>
              </div>
            );
          })}

          {!exactMatchExists && inputValue.trim() && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                processTagStrings([inputValue]);
              }}
              style={{
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                background: highlightedIndex === suggestions.length ? '#fefce8' : '#f8fafc',
                color: '#0f172a',
                fontSize: '12.5px',
                fontWeight: 600,
              }}
            >
              <span style={{ color: '#eab308', fontSize: '15px' }}>+</span>
              <span>
                Create new tag: <strong>"{inputValue.trim()}"</strong>{' '}
                <span style={{ color: '#64748b', fontWeight: 400 }}>
                  (slug: {generateSlug(inputValue)})
                </span>
              </span>
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: '11px', color: '#64748b' }}>
        Press <kbd style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '3px', padding: '1px 4px' }}>Enter</kbd> or <kbd style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '3px', padding: '1px 4px' }}>,</kbd> to add tag. Paste comma-separated tags to add in bulk.
      </div>
    </div>
  );
};
