import { useLanguage } from "../../context/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__clinic-name">{t("common.clinicName")}</p>
        <p className="footer__notice">{t("footer.emergencyNotice")}</p>
        <p className="footer__copyright">
          &copy; {new Date().getFullYear()} {t("common.clinicName")}.{" "}
          {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
