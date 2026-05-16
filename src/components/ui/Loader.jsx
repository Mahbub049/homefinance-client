function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Loader({
  text = "Loading...",
  subtext = "",
  size = "md", // sm | md | lg
  fullScreen = false,
  card = true,
  className = "",
}) {
  const sizeMap = {
    sm: "h-7 w-7 border-[3px]",
    md: "h-11 w-11 border-[4px]",
    lg: "h-14 w-14 border-[5px]",
  };

  const content = (
    <div
      className={cx(
        "loader-card flex w-full flex-col items-center justify-center text-center",
        card
          ? "rounded-3xl border border-slate-200 bg-white/90 px-5 py-8 shadow-sm ring-1 ring-slate-100/70 dark:border-white/10 dark:bg-slate-950/70 dark:ring-white/5 sm:px-6 sm:py-10"
          : "",
        className
      )}
    >
      <div className="relative grid place-items-center">
        <div
          className={cx(
            "animate-spin rounded-full border-slate-200 border-t-violet-600 dark:border-white/10 dark:border-t-violet-300",
            sizeMap[size] || sizeMap.md
          )}
        />

        <div className="absolute inset-0 rounded-full bg-violet-400/10 blur-sm dark:bg-violet-300/10" />
      </div>

      <p className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-100">
        {text}
      </p>

      {subtext ? (
        <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
          {subtext}
        </p>
      ) : null}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-3">
        {content}
      </div>
    );
  }

  return content;
}

export function InlineSpinner({
  label = "Loading...",
  tone = "auto", // auto | light | dark
  className = "",
}) {
  const spinnerClass =
    tone === "light"
      ? "border-white/30 border-t-white"
      : tone === "dark"
        ? "border-slate-300 border-t-slate-900"
        : "border-slate-300 border-t-slate-900 dark:border-white/20 dark:border-t-white";

  return (
    <span className={cx("inline-flex items-center gap-2", className)}>
      <span className={cx("h-4 w-4 animate-spin rounded-full border-2", spinnerClass)} />
      <span className="text-current">{label}</span>
    </span>
  );
}
