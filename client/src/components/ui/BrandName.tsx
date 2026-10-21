interface Props {
  className?: string;
  /** Color of "Finance": the page's text color by default (black, or white in dark mode) */
  budgetClassName?: string;
  /** Color of "UB-" */
  flyClassName?: string;
}

/** The UB-Finance wordmark: "UB-" in the brand blue, "Finance" in the text color */
export function BrandName({
  className = '',
  budgetClassName = 'text-text',
  flyClassName = 'text-brand-600',
}: Props) {
  return (
    <span className={className}>
      <span className={flyClassName}>UB-</span>
      <span className={budgetClassName}>Finance</span>
    </span>
  );
}
