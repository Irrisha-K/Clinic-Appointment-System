import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Alert from "../components/common/Alert";
import Loader from "../components/common/Loader";

const DASHBOARD_PATH = {
  patient: "/patient/dashboard",
  receptionist: "/receptionist/dashboard",
  admin: "/admin/dashboard",
};

const Login = () => {
  const { user, loading: authLoading, login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // An already-authenticated visitor shouldn't be able to sit on /login —
  // send them straight to the dashboard matching their real role.
  useEffect(() => {
    if (!authLoading && user) {
      navigate(DASHBOARD_PATH[user.role] || "/", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = t("booking.errorRequired");
    else if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      next.email = t("booking.errorInvalidEmail");
    if (!password) next.password = t("booking.errorRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const loggedInUser = await login({ email: email.trim(), password });
      navigate(DASHBOARD_PATH[loggedInUser.role] || "/", { replace: true });
    } catch (err) {
      setSubmitError(err.response?.data?.message || t("auth.loginError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <Loader label={t("common.loading")} />;
  }

  return (
    <div className="page page--narrow">
      <div className="auth-card">
        <h1>{t("auth.loginHeading")}</h1>
        <p className="page__lead">{t("auth.loginSubtitle")}</p>

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="email"
            type="email"
            label={t("auth.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <Input
            id="password"
            type="password"
            label={t("auth.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />

          {submitError && <Alert variant="error">{submitError}</Alert>}

          <div className="auth-submit-row">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting}
            >
              {submitting ? t("auth.loggingIn") : t("auth.loginButton")}
            </Button>
          </div>
        </form>

        <p className="auth-switch">
          {t("auth.noAccount")}{" "}
          <Link to="/register">{t("auth.registerLink")}</Link>
        </p>
        <p className="auth-switch">
          <Link to="/">{t("auth.backHome")}</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
