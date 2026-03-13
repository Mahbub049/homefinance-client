export default function Loader({
  text = "Loading...",
  subtext = "",
  size = "md", // sm | md | lg
  fullScreen = false,
  card = true,
  className = "",
}) {
  const sizeMap = {
    sm: "h-8 w-8 border-[3px]",
    md: "h-12 w-12 border-[4px]",
    lg: "h-16 w-16 border-[5px]",
  };

  const content = (
    <div
      className={[
        "flex flex-col items-center justify-center text-center",
        card ? "rounded-2xl border border-slate-200 bg-white/90 px-6 py-10 shadow-sm" : "",
        className,
      ].join(" ")}
    >
      <div className="relative">
        <div
          className={[
            "rounded-full border-slate-200 border-t-slate-900 animate-spin",
            sizeMap[size] || sizeMap.md,
          ].join(" ")}
        />
        <div className="absolute inset-0 animate-ping rounded-full bg-slate-300/20" />
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-800">{text}</p>

      {subtext ? (
        <p className="mt-1 text-xs text-slate-500">{subtext}</p>
      ) : null}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

export function InlineSpinner({
  label = "Loading...",
  dark = true,
  className = "",
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={[
          "h-4 w-4 animate-spin rounded-full border-2 border-white/30",
          dark ? "border-slate-300 border-t-slate-900" : "border-white/30 border-t-white",
        ].join(" ")}
      />
      <span>{label}</span>
    </span>
  );
}