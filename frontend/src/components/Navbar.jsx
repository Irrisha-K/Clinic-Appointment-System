import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageToggle from "./common/LanguageToggle";
import Button from "./common/Button";

const DASHBOARD_PATH = {
  patient: "/patient/dashboard",
  receptionist: "/receptionist/dashboard",
  admin: "/admin/dashboard",
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand">
          {t("common.clinicName")}
        </Link>

        <nav className="navbar__links">
          <Link to="/" className="navbar__link">
            {t("nav.home")}
          </Link>
          <Link to="/doctors" className="navbar__link">
            {t("nav.doctors")}
          </Link>
          <Link to="/departments" className="navbar__link">
            {t("nav.departments")}
          </Link>
          {!user && (
            <>
              <Link to="/login" className="navbar__link">
                {t("nav.login")}
              </Link>
              <Link to="/register" className="navbar__link">
                {t("nav.register")}
              </Link>
            </>
          )}
        </nav>

        <div className="navbar__actions">
          <LanguageToggle />
          <Link to="/book-appointment">
            <Button variant="primary">{t("nav.bookAppointment")}</Button>
          </Link>
          {user && (
            <>
              <Link
                to={DASHBOARD_PATH[user.role] || "/"}
                className="navbar__dashboard-link"
              >
                {t("nav.dashboard")}
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                {t("nav.logout")}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
