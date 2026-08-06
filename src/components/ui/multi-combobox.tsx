import * as React from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

interface MultiComboboxOption {
  label: string
  value: string
}

interface MultiComboboxProps {
  values: string[]
  onValuesChange: (values: string[]) => void
  options: MultiComboboxOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  emptyMessage?: string
  loading?: boolean
  loadingMessage?: string
}

export function MultiCombobox({
  values,
  onValuesChange,
  options,
  placeholder = "Zoeken...",
  disabled = false,
  className,
  emptyMessage = "Geen resultaten gevonden",
  loading = false,
  loadingMessage = "Laden...",
}: MultiComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const [position, setPosition] = React.useState({ top: 0, left: 0, width: 0 })
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)
  const id = React.useId()

  const selectedOptions = options.filter((opt) => values.includes(opt.value))

  const filtered = search
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    })
  }, [])

  const handleToggle = React.useCallback(
    (optValue: string) => {
      if (values.includes(optValue)) {
        onValuesChange(values.filter((v) => v !== optValue))
      } else {
        onValuesChange([...values, optValue])
      }
      // Keep dropdown open for multi-select
      setSearch("")
      inputRef.current?.focus()
    },
    [values, onValuesChange]
  )

  const handleRemove = React.useCallback(
    (optValue: string) => {
      onValuesChange(values.filter((v) => v !== optValue))
    },
    [values, onValuesChange]
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "Enter") {
          e.preventDefault()
          setIsOpen(true)
        }
        return
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev < filtered.length - 1 ? prev + 1 : 0
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filtered.length - 1
          )
          break
        case "Enter":
          e.preventDefault()
          if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
            handleToggle(filtered[highlightedIndex].value)
          }
          break
        case "Escape":
          e.preventDefault()
          setIsOpen(false)
          setSearch("")
          setHighlightedIndex(-1)
          break
      }
    },
    [isOpen, filtered, highlightedIndex, handleToggle]
  )

  React.useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement
      item?.scrollIntoView({ block: "nearest" })
    }
  }, [highlightedIndex])

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setIsOpen(false)
        setSearch("")
        setHighlightedIndex(-1)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  React.useEffect(() => {
    if (isOpen) {
      updatePosition()

      // Prevent Radix Dialog's FocusScope from stealing focus back
      // when this dropdown is portaled outside the dialog DOM tree
      const dropdown = dropdownRef.current
      const stopFocusin = (e: FocusEvent) => e.stopPropagation()
      dropdown?.addEventListener("focusin", stopFocusin)

      inputRef.current?.focus()
      window.addEventListener("scroll", updatePosition, true)
      window.addEventListener("resize", updatePosition)
      return () => {
        dropdown?.removeEventListener("focusin", stopFocusin)
        window.removeEventListener("scroll", updatePosition, true)
        window.removeEventListener("resize", updatePosition)
      }
    }
  }, [isOpen, updatePosition])

  // Manual wheel scroll - Radix Dialog's react-remove-scroll blocks wheel
  // events on elements outside the dialog DOM tree
  React.useEffect(() => {
    if (!isOpen) return
    const list = listRef.current
    if (!list) return

    const handleWheel = (e: WheelEvent) => {
      list.scrollTop += e.deltaY
    }

    list.addEventListener("wheel", handleWheel)
    return () => list.removeEventListener("wheel", handleWheel)
  }, [isOpen])

  const triggerLabel = loading
    ? loadingMessage
    : values.length === 0
      ? placeholder
      : values.length === 1
        ? selectedOptions[0]?.label
        : `${values.length} geselecteerd`

  return (
    <div data-slot="multi-combobox" className={className}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen)
        }}
        disabled={disabled}
        className="flex w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
      >
        <span
          className={
            values.length > 0 ? "text-foreground" : "text-muted-foreground"
          }
        >
          {triggerLabel}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {selectedOptions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {opt.label}
              <button
                type="button"
                onClick={() => handleRemove(opt.value)}
                className="rounded-full p-0.5 hover:bg-border"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            data-dropdown-portal
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: position.width,
              zIndex: 9999,
              pointerEvents: "auto",
            }}
            className="rounded-lg border bg-popover text-popover-foreground shadow-lg"
          >
            <div className="flex items-center gap-2 border-b border-border-light px-3 py-2">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setHighlightedIndex(-1)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Zoeken..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <ul
              ref={listRef}
              id={`${id}-listbox`}
              role="listbox"
              aria-multiselectable="true"
              className="max-h-60 overflow-y-auto overscroll-contain py-1"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  {emptyMessage}
                </li>
              ) : (
                filtered.map((opt, index) => {
                  const isSelected = values.includes(opt.value)
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
                        index === highlightedIndex
                          ? "bg-muted text-foreground"
                          : isSelected
                            ? "bg-muted/50 text-foreground"
                            : "text-secondary-foreground hover:bg-muted/50"
                      )}
                      onClick={() => handleToggle(opt.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <div
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded border",
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-input"
                        )}
                      >
                        {isSelected && (
                          <Check className="size-3 text-primary-foreground" />
                        )}
                      </div>
                      {opt.label}
                    </li>
                  )
                })
              )}
            </ul>
          </div>,
          document.body
        )}
    </div>
  )
}
