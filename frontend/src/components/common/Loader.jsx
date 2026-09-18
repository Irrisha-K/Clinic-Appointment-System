const Loader = ({ label = "Loading..." }) => (
  <div className="loader">
    <div className="loader__spinner" />
    <p className="loader__label">{label}</p>
  </div>
);

export default Loader;
