const Button = ({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  onClick,
  className = "",
  ...rest
}) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={`btn btn--${variant} btn--${size} ${className}`.trim()}
    {...rest}
  >
    {children}
  </button>
);

export default Button;
