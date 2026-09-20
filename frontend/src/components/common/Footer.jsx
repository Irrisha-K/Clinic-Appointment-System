import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__columns">
          <div>
            <p className="footer__clinic-name">{t("common.clinicName")}</p>
            <p className="footer__notice">{t("footer.emergencyNotice")}</p>
          </div>

          <div>
            <h3 className="footer__column-heading">
              {t("footer.contactHeading")}
            </h3>
            <ul className="footer__list">
              <li>
                {t("footer.phone")}: {t("footer.clinicPhone")}
              </li>
              <li>
                {t("footer.address")}: {t("footer.clinicAddress")}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="footer__column-heading">
              {t("footer.linksHeading")}
            </h3>
            <ul className="footer__list">
              <li>
                <Link to="/">{t("nav.home")}</Link>
              </li>
              <li>
                <Link to="/doctors">{t("nav.doctors")}</Link>
              </li>
              <li>
                <Link to="/departments">{t("nav.departments")}</Link>
              </li>
              <li>
                <Link to="/book-appointment">{t("nav.bookAppointment")}</Link>
              </li>
            </ul>
          </div>
        </div>

        <hr className="footer__divider" />

        <p className="footer__copyright">
          &copy; {new Date().getFullYear()} {t("common.clinicName")}.{" "}
          {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
