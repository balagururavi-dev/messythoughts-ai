type MessyThoughtsMarkProps = {
  className?: string;
  title?: string;
};

/** Simple brand mark: layered “thought tabs” without an icon library. */
export function MessyThoughtsMark({
  className = "size-8",
  title = "MessyThoughts",
}: MessyThoughtsMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect
        x="4"
        y="10"
        width="24"
        height="18"
        rx="6"
        fill="currentColor"
        className="text-lavender"
        opacity="0.9"
      />
      <rect
        x="10"
        y="7"
        width="24"
        height="18"
        rx="6"
        fill="currentColor"
        className="text-sky"
        opacity="0.85"
      />
      <rect
        x="12"
        y="12"
        width="24"
        height="18"
        rx="6"
        fill="currentColor"
        className="text-violet"
      />
      <circle cx="20" cy="21" r="2.2" fill="white" />
      <circle cx="26" cy="21" r="2.2" fill="white" opacity="0.85" />
      <circle cx="32" cy="21" r="2.2" fill="white" opacity="0.65" />
    </svg>
  );
}
