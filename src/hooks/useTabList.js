import { useCallback, useRef } from 'react';

/**
 * Pure key resolution for an ARIA tablist. Returns the key that should become
 * active, or null when the pressed key is not a tab-navigation key.
 */
export function nextTabKey(keys, activeKey, pressedKey) {
  const index = keys.indexOf(activeKey);
  if (index === -1) return null;

  if (pressedKey === 'ArrowRight') return keys[(index + 1) % keys.length];
  if (pressedKey === 'ArrowLeft') return keys[(index - 1 + keys.length) % keys.length];
  if (pressedKey === 'Home') return keys[0];
  if (pressedKey === 'End') return keys[keys.length - 1];
  return null;
}

/**
 * Roving-tabindex keyboard support for an ARIA tablist: ArrowLeft/ArrowRight
 * wrap between tabs, Home/End jump to the ends. The caller owns the selected
 * key (usually a URL search param) and renders `tabIndex={active ? 0 : -1}`.
 */
export function useTabList(keys, activeKey, onChange) {
  const listRef = useRef(null);

  const handleKeyDown = useCallback(
    (event) => {
      const nextKey = nextTabKey(keys, activeKey, event.key);
      if (nextKey === null) return;

      event.preventDefault();
      onChange(nextKey);
      const nextIndex = keys.indexOf(nextKey);
      listRef.current?.querySelectorAll('[role="tab"]')[nextIndex]?.focus();
    },
    [activeKey, keys, onChange],
  );

  return { listRef, handleKeyDown };
}
