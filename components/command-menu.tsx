"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Item = { label: string; href: string; group: "Pages" | "Clients" };

const isMacPlatform = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="rounded px-1.5 py-0.5 font-data text-[10px] tracking-wide"
      style={{ background: "var(--card-strong)", border: "1px solid var(--chip-border)", color: "var(--text-muted)" }}
    >
      {children}
    </kbd>
  );
}

/** Keyboard command menu (Cmd+K / Ctrl+K): jump to a page or a client. */
export function CommandMenu({ items }: { items: Item[] }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const listId = `${uid}-list`;
  const optionId = (idx: number) => `${uid}-opt-${idx}`;

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(isMacPlatform());
  }, []);

  const needle = query.trim().toLowerCase();
  const pages = items.filter((i) => i.group === "Pages" && i.label.toLowerCase().includes(needle));
  const clients = items.filter((i) => i.group === "Clients" && i.label.toLowerCase().includes(needle));
  const flat = [...pages, ...clients];
  const current = flat.length ? Math.min(active, flat.length - 1) : -1;

  // Clear the query and active row whenever the dialog closes (Esc, backdrop, Enter, click).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => {
      setQuery("");
      setActive(0);
    };
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  // Global shortcut. Reads refs only, so it is registered once.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!((isMacPlatform() ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k")) return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      // Inside the open menu, Cmd/Ctrl+K closes it.
      if (dialog.open) {
        e.preventDefault();
        dialog.close();
        return;
      }
      // Never steal the shortcut while the user is typing somewhere else.
      const target = e.target as HTMLElement | null;
      if (target && (TYPING_TAGS.has(target.tagName) || target.isContentEditable)) return;
      e.preventDefault();
      dialog.showModal();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Keep the active row visible when moving with the arrow keys.
  useEffect(() => {
    if (current >= 0) document.getElementById(optionId(current))?.scrollIntoView({ block: "nearest" });
  }, [current]);

  const openMenu = () => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    inputRef.current?.focus();
  };

  const go = (item: Item) => {
    dialogRef.current?.close();
    router.push(item.href);
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flat.length) setActive(current < 0 ? 0 : (current + 1) % flat.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flat.length) setActive(current <= 0 ? flat.length - 1 : current - 1);
    } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (current >= 0) go(flat[current]);
    }
  };

  const renderRow = (item: Item, idx: number) => {
    const isActive = idx === current;
    return (
      <li
        key={`${item.group}-${item.href}`}
        id={optionId(idx)}
        role="option"
        aria-selected={isActive}
        onMouseEnter={() => setActive(idx)}
        onClick={() => go(item)}
        className="cursor-pointer rounded-canopy-sm px-3 py-2 text-sm font-medium"
        style={isActive ? { background: "var(--primary-tint)", color: "var(--primary)" } : { color: "var(--text)" }}
      >
        {item.label}
      </li>
    );
  };

  const groupHeading = (text: string) => (
    <li
      role="presentation"
      className="px-3 pb-1 pt-3 font-data text-[10px] uppercase tracking-wide"
      style={{ color: "var(--neutral-muted)" }}
    >
      {text}
    </li>
  );

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        className="nav-link mt-2 flex w-full items-center justify-between rounded-canopy-sm px-3 py-2 text-sm font-medium transition-colors"
        style={{ color: "var(--text-muted)" }}
      >
        Search
        <Kbd>{isMac ? "⌘K" : "Ctrl K"}</Kbd>
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Command menu"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialogRef.current?.close();
        }}
        className="card w-[min(560px,calc(100vw-2rem))] overflow-hidden backdrop:bg-black/40"
        style={{ padding: 0 }}
      >
        <div className="flex flex-col">
          <div className="p-3" style={{ borderBottom: "1px solid var(--divider)" }}>
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={current >= 0 ? optionId(current) : undefined}
              placeholder="Search pages and clients"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKeyDown}
              className="input"
            />
          </div>

          <div className="max-h-[50vh] overflow-y-auto px-2 py-2">
            <ul id={listId} role="listbox" aria-label="Pages and clients" className="space-y-0.5">
              {pages.length > 0 && groupHeading("Pages")}
              {pages.map((item, i) => renderRow(item, i))}
              {clients.length > 0 && groupHeading("Clients")}
              {clients.map((item, i) => renderRow(item, pages.length + i))}
            </ul>
            {flat.length === 0 && (
              <p className="px-3 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
                No matches.
              </p>
            )}
          </div>

          <p
            className="px-4 py-2 text-xs"
            style={{ borderTop: "1px solid var(--divider)", color: "var(--text-muted)" }}
          >
            <Kbd>↑↓</Kbd> to move, <Kbd>Enter</Kbd> to open, <Kbd>Esc</Kbd> to close
          </p>
        </div>
      </dialog>
    </>
  );
}
