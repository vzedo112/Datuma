// Inline SVG wordmark. Inherits color via currentColor so it themes with
// `text-*` utilities (text-foreground, text-brand, text-background, etc.).
// The site already loads Geist as a web font, so the rendered text matches
// the brand exactly without needing to embed the font.
export default function Wordmark({ className = "", title = "Datuma" }) {
  return (
    <svg
      viewBox="0 0 720 160"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <text
        x="0"
        y="125"
        fontFamily='"Geist", "Inter", -apple-system, sans-serif'
        fontWeight="600"
        fontSize="160"
        letterSpacing="-6"
        fill="currentColor"
      >
        Datuma.
      </text>
    </svg>
  );
}
