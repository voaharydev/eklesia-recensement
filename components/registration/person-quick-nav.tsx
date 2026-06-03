"use client";

export type PersonNavItem = {
  id: string;
  label: string;
  kind: "adult" | "child";
  index: number;
  hasError?: boolean;
  isActive?: boolean;
};

type PersonQuickNavProps = {
  items: PersonNavItem[];
  onSelect: (item: PersonNavItem) => void;
};

export function PersonQuickNav({ items, onSelect }: PersonQuickNavProps) {
  if (items.length < 3) {
    return null;
  }

  return (
    <nav
      aria-label="Navigation rapide entre les personnes"
      className="-mx-1 overflow-x-auto px-1 pb-1"
    >
      <ul className="flex gap-2">
        {items.map((item) => (
          <li key={item.id} className="shrink-0">
            <button
              type="button"
              onClick={() => onSelect(item)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                item.isActive
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : item.hasError
                    ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
