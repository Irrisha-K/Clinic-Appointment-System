const Select = ({
  label,
  id,
  error,
  options = [],
  placeholder,
  className = "",
  ...rest
}) => (
  <div className="field">
    {label && (
      <label htmlFor={id} className="field__label">
        {label}
      </label>
    )}
    <select
      id={id}
      className={`field__control ${error ? "field__control--error" : ""} ${className}`.trim()}
      {...rest}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="field__error">{error}</p>}
  </div>
);

export default Select;
