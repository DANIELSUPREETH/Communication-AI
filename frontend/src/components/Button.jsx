import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * Button, or a router link styled as a button when `to` is set.
 * variant: primary | secondary | ghost | danger   size: sm | md | lg
 * Hover/press scale is handled in CSS so it respects prefers-reduced-motion.
 */
const Button = forwardRef(function Button(
  { to, variant = 'secondary', size = 'md', block = false, icon = false, className = '', children, ...rest },
  ref,
) {
  const classes = [
    'btn',
    variant !== 'secondary' && `btn-${variant}`,
    size !== 'md' && `btn-${size}`,
    block && 'btn-block',
    icon && 'btn-icon',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button ref={ref} type="button" className={classes} {...rest}>
      {children}
    </button>
  );
});

export default Button;
