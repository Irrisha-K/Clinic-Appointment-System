import { useLanguage } from "../../context/LanguageContext";

const LanguageToggle = () => {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="language-toggle">
      <button
        onClick={() => changeLanguage("en")}
        className={`language-toggle__option ${language === "en" ? "language-toggle__option--active" : ""}`}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage("ne")}
        className={`language-toggle__option ${language === "ne" ? "language-toggle__option--active" : ""}`}
      >
        ने
      </button>
    </div>
  );
};

export default LanguageToggle;
