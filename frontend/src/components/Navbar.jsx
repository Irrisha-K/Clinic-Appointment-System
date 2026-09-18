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
          <Link to="/book-appointment" className="navbar__link">
            {t("nav.bookAppointment")}
          </Link>
        </nav>

        <div className="navbar__actions">
          <LanguageToggle />
          {user ? (
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
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline">{t("nav.login")}</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary">{t("nav.register")}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
