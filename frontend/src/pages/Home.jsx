import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { getDepartments } from "../api/departmentApi";
import { getDoctors } from "../api/doctorApi";
import Button from "../components/common/Button";
import Alert from "../components/common/Alert";
import Loader from "../components/common/Loader";
import heroImage from "../assets/hero.png";

const DOCTOR_PREVIEW_COUNT = 3;

const Home = () => {
  const { t } = useLanguage();

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getDepartments(), getDoctors()])
      .then(([deptRes, docRes]) => {
        if (!isMounted) return;
        setDepartments(deptRes.data.departments || []);
        setDoctors((docRes.data.doctors || []).slice(0, DOCTOR_PREVIEW_COUNT));
      })
      .catch(() => {
        if (isMounted) setLoadFailed(true);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero__inner">
          <div className="hero__content">
            <h1 className="hero__heading">{t("home.heroHeading")}</h1>
            <p className="hero__text">{t("home.heroText")}</p>
            <div className="hero__actions">
              <Link to="/book-appointment">
                <Button variant="primary" size="lg">
                  {t("nav.bookAppointment")}
                </Button>
              </Link>
              <Link to="/doctors">
                <Button variant="outline" size="lg">
                  {t("home.viewDoctors")}
                </Button>
              </Link>
            </div>
          </div>
          <div className="hero__image-wrap">
            <img src={heroImage} alt="" className="hero__image" />
          </div>
        </div>
      </section>

      <div className="emergency-notice">
        <Alert variant="warning">{t("footer.emergencyNotice")}</Alert>
      </div>

      {loading && <Loader label={t("common.loading")} />}

      {loadFailed && !loading && (
        <div className="home-section">
          <Alert variant="error">{t("home.loadError")}</Alert>
        </div>
      )}

      {!loading && !loadFailed && (
        <>
          <section className="home-section">
            <h2 className="home-section__heading">
              {t("home.departmentsHeading")}
            </h2>
            {departments.length === 0 ? (
              <p className="home-section__message">
                {t("home.departmentsEmpty")}
              </p>
            ) : (
              <div className="department-grid">
                {departments.map((dept) => (
                  <article key={dept._id} className="department-card">
                    <h3 className="department-card__name">{dept.name}</h3>
                    {dept.description && (
                      <p className="department-card__description">
                        {dept.description}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="home-section">
            <h2 className="home-section__heading">
              {t("home.doctorsHeading")}
            </h2>
            {doctors.length === 0 ? (
              <p className="home-section__message">{t("home.doctorsEmpty")}</p>
            ) : (
              <>
                <div className="doctor-grid">
                  {doctors.map((doctor) => (
                    <article key={doctor._id} className="doctor-card">
                      <h3 className="doctor-card__name">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </h3>
                      {doctor.department?.name && (
                        <p className="doctor-card__department">
                          {doctor.department.name}
                        </p>
                      )}
                      <div className="doctor-card__details">
                        {doctor.qualification && (
                          <div className="doctor-card__row">
                            <p className="doctor-card__label">
                              {t("home.qualification")}
                            </p>
                            <p className="doctor-card__value">
                              {doctor.qualification}
                            </p>
                          </div>
                        )}
                        {doctor.experience !== undefined && (
                          <div className="doctor-card__row">
                            <p className="doctor-card__label">
                              {t("home.experience")}
                            </p>
                            <p className="doctor-card__value">
                              {doctor.experience} {t("home.years")}
                            </p>
                          </div>
                        )}
                        {doctor.consultationFee !== undefined && (
                          <div className="doctor-card__row">
                            <p className="doctor-card__label">
                              {t("home.consultationFee")}
                            </p>
                            <p className="doctor-card__value">
                              Rs. {doctor.consultationFee}
                            </p>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
                <div className="home-section__footer">
                  <Link to="/doctors">
                    <Button variant="outline">
                      {t("home.viewAllDoctors")}
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </section>
        </>
      )}

      <section className="how-it-works">
        <div className="home-section">
          <h2 className="home-section__heading">
            {t("home.howItWorksHeading")}
          </h2>
          <ol className="steps">
            <li className="step">
              <h3 className="step__title">{t("home.step1Title")}</h3>
              <p className="step__text">{t("home.step1Text")}</p>
            </li>
            <li className="step">
              <h3 className="step__title">{t("home.step2Title")}</h3>
              <p className="step__text">{t("home.step2Text")}</p>
            </li>
            <li className="step">
              <h3 className="step__title">{t("home.step3Title")}</h3>
              <p className="step__text">{t("home.step3Text")}</p>
            </li>
            <li className="step">
              <h3 className="step__title">{t("home.step4Title")}</h3>
              <p className="step__text">{t("home.step4Text")}</p>
            </li>
          </ol>
        </div>
      </section>
    </>
  );
};

export default Home;
