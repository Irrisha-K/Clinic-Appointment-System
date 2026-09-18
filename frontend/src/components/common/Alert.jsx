const Alert = ({ variant = "info", children, className = "" }) => (
  <div role="alert" className={`alert alert--${variant} ${className}`.trim()}>
    {children}
  </div>
);

export default Alert;
