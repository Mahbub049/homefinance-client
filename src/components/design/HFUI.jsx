import React, { useId } from 'react';
import HFIcon from './HFIcon';
import { formatTaka, formatBanglaMonth } from './format';

const cx = (...items) => items.filter(Boolean).join(' ');

export function HFButton({ children, variant = 'primary', size = 'md', loading = false, disabled, icon, className = '', type = 'button', ...props }) {
  return <button type={type} className={cx('hf-button', `hf-button--${variant}`, `hf-button--${size}`, className)} disabled={disabled || loading} {...props}>
    {loading ? <span className="hf-spinner" aria-hidden="true"/> : icon ? <HFIcon name={icon} size={16}/> : null}
    <span>{children}</span>
  </button>;
}

export function HFCard({ as: Element = 'section', children, className = '', ...props }) {
  return <Element className={cx('hf-card', className)} {...props}>{children}</Element>;
}

export function HFBadge({ children, tone = 'neutral', className = '' }) {
  return <span className={cx('hf-badge', `hf-badge--${tone}`, className)}>{children}</span>;
}

export function HFField({ label, htmlFor, hint, error, required, children, className = '' }) {
  const id = useId();
  return <div className={cx('hf-field', className)}>
    {label && <label htmlFor={htmlFor} className="hf-field-label">{label}{required ? <span aria-hidden="true"> *</span> : null}</label>}
    <div aria-describedby={hint || error ? id : undefined}>{children}</div>
    {(hint || error) && <p id={id} className={cx('hf-field-hint', error && 'hf-field-error')}>{error || hint}</p>}
  </div>;
}

export const HFInput = React.forwardRef(function HFInput({ className = '', invalid = false, ...props }, ref) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={cx('hf-input', className)} {...props}/>;
});

export const HFSelect = React.forwardRef(function HFSelect({ className = '', children, ...props }, ref) {
  return <select ref={ref} className={cx('hf-input', className)} {...props}>{children}</select>;
});

export const HFTextarea = React.forwardRef(function HFTextarea({ className = '', ...props }, ref) {
  return <textarea ref={ref} className={cx('hf-input', 'hf-textarea', className)} {...props}/>;
});

export function HFPageTitle({ title, description, action }) {
  return <div className="hf-page-heading">
    <div className="hf-page-heading-text"><h1>{title}</h1>{description && <p>{description}</p>}</div>
    {action && <div className="hf-page-heading-action">{action}</div>}
  </div>;
}

export function HFStat({ label, value, detail, tone = 'neutral', children }) {
  return <HFCard className="hf-stat"><div className="hf-stat-label">{label}</div>
    <strong className={cx('hf-stat-value', `hf-text--${tone}`)}>{typeof value === 'number' ? formatTaka(value) : value}</strong>
    {detail && <div className="hf-stat-detail">{detail}</div>}{children}
  </HFCard>;
}

export function HFMonthPicker({ label = 'মাস', value, onChange, ...props }) {
  return <label className="hf-month-picker"><span>{label}</span><span className="hf-month-picker-control"><HFIcon name="calendar" size={17}/>
    <span className="hf-month-picker-readable" aria-hidden="true">{formatBanglaMonth(value)}</span>
    <input type="month" value={value || ''} onChange={(event) => onChange?.(event.target.value)} aria-label={label} {...props}/>
  </span></label>;
}

export function HFEmpty({ title = 'এখনও কোনো তথ্য নেই', description, action }) {
  return <div className="hf-empty"><HFIcon name="info" size={25}/><strong>{title}</strong>{description && <p>{description}</p>}{action}</div>;
}

export function HFTable({ children, className = '' }) {
  return <div className={cx('hf-table-scroll', className)}><table className="hf-table">{children}</table></div>;
}
