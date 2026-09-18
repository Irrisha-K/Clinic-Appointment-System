const Input = ({ label, id, error, className = "", ...rest }) => (
  <div className="field">
    {label && (
      <label htmlFor={id} className="field__label">
        {label}
      </label>
    )}
    <input
      id={id}
      className={`field__control ${error ? "field__control--error" : ""} ${className}`.trim()}
      {...rest}
    />
    {error && <p className="field__error">{error}</p>}
  </div>
);

export default Input;
