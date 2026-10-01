import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Button from "../components/common/Button";
import Alert from "../components/common/Alert";
import Loader from "../components/common/Loader";

const DASHBOARD_PATH = {
  patient: "/patient/dashboard",
  receptionist: "/receptionist/dashboard",
  admin: "/admin/dashboard",
};

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  age: "",
  gender: "",
  address: "",
};

const Register = () => {
  const { user, loading: authLoading, register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate(DASHBOARD_PATH[user.role] || "/", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  // Reusing the same gender options/keys already translated for the
  // booking form — no duplicate translation entries.
  const genderOptions = [
    { value: "male", label: t("booking.genderMale") },
    { value: "female", label: t("booking.genderFemale") },
    { value: "other", label: t("booking.genderOther") },
  ];

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = t("booking.errorRequired");
    if (!form.lastName.trim()) next.lastName = t("booking.errorRequired");
    if (!form.email.trim()) next.email = t("booking.errorRequired");
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
      next.email = t("booking.errorInvalidEmail");
    if (!/^\d{7,15}$/.test(form.phone.trim()))
      next.phone = t("booking.errorInvalidPhone");
    if (!form.password) next.password = t("booking.errorRequired");
    else if (form.password.length < 6)
      next.password = t("auth.errorPasswordShort");
    if (form.confirmPassword !== form.password)
      next.confirmPassword = t("auth.errorPasswordMismatch");
    if (form.age === "" || Number(form.age) < 0)
      next.age = t("booking.errorInvalidAge");
    if (!form.gender) next.gender = t("booking.errorRequired");
    if (!form.address.trim()) next.address = t("booking.errorRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    console.log("REGISTER SUBMIT FIRED"); //remove this
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      // No "role" field is sent at all — the backend hardcodes every public
      // registration to "patient" server-side regardless of request body,
      // so there is nothing safe or meaningful to offer here.
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        age: Number(form.age),
        gender: form.gender,
        address: form.address.trim(),
      });
      setRegistered(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || t("auth.registerError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <Loader label={t("common.loading")} />;
  }

  // The backend's register response has no token, so there is nothing to
  // log the user into automatically — this success screen sends them to
  // the real /login flow instead of faking an authenticated redirect.
  if (registered) {
    return (
      <div className="page page--narrow">
        <div className="auth-card">
          <h1>{t("auth.registerSuccessHeading")}</h1>
          <p className="page__lead">{t("auth.registerSuccessMessage")}</p>
          <Link to="/login">
            <Button variant="primary" size="lg">
              {t("auth.goToLogin")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--narrow">
      <div className="auth-card">
        <h1>{t("auth.registerHeading")}</h1>
        <p className="page__lead">{t("auth.registerSubtitle")}</p>

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="firstName"
            label={t("booking.firstName")}
            value={form.firstName}
            onChange={handleChange("firstName")}
            error={errors.firstName}
          />
          <Input
            id="lastName"
            label={t("booking.lastName")}
            value={form.lastName}
            onChange={handleChange("lastName")}
            error={errors.lastName}
          />
          <Input
            id="email"
            type="email"
            label={t("auth.email")}
            value={form.email}
            onChange={handleChange("email")}
            error={errors.email}
          />
          <Input
            id="phone"
            label={t("booking.phone")}
            value={form.phone}
            onChange={handleChange("phone")}
            error={errors.phone}
          />
          <Input
            id="age"
            type="number"
            min="0"
            label={t("booking.age")}
            value={form.age}
            onChange={handleChange("age")}
            error={errors.age}
          />
          <Select
            id="gender"
            label={t("booking.gender")}
            value={form.gender}
            onChange={handleChange("gender")}
            options={genderOptions}
            placeholder={t("booking.genderPlaceholder")}
            error={errors.gender}
          />
          <Input
            id="address"
            label={t("booking.address")}
            value={form.address}
            onChange={handleChange("address")}
            error={errors.address}
          />
          <Input
            id="password"
            type="password"
            label={t("auth.password")}
            value={form.password}
            onChange={handleChange("password")}
            error={errors.password}
          />
          <Input
            id="confirmPassword"
            type="password"
            label={t("auth.confirmPassword")}
            value={form.confirmPassword}
            onChange={handleChange("confirmPassword")}
            error={errors.confirmPassword}
          />

          {submitError && <Alert variant="error">{submitError}</Alert>}

          <div className="auth-submit-row">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting}
            >
              {submitting ? t("auth.registering") : t("auth.registerButton")}
            </Button>
          </div>
        </form>

        <p className="auth-switch">
          {t("auth.alreadyHaveAccount")}{" "}
          <Link to="/login">{t("auth.loginLink")}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
