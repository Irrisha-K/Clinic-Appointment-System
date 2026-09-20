import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { getDepartments } from "../api/departmentApi";
import Button from "../components/common/Button";
import Alert from "../components/common/Alert";
import Loader from "../components/common/Loader";

const Departments = () => {
  const { t } = useLanguage();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getDepartments()
      .then((res) => {
        if (isMounted) setDepartments(res.data.departments || []);
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
    <div className="page">
      <h1>{t("departments.pageHeading")}</h1>
      <p className="page__lead">{t("departments.pageIntro")}</p>

      {loading && <Loader label={t("common.loading")} />}

      {loadFailed && !loading && (
        <Alert variant="error">{t("departments.loadError")}</Alert>
      )}

      {!loading && !loadFailed && departments.length === 0 && (
        <Alert variant="info">{t("departments.empty")}</Alert>
      )}

      {!loading && !loadFailed && departments.length > 0 && (
        <div className="department-grid">
          {departments.map((dept) => (
            <article key={dept._id} className="department-card">
              <h2 className="department-card__name">{dept.name}</h2>

              {dept.description && (
                <p className="department-card__description">
                  {dept.description}
                </p>
              )}

              <div className="department-card__actions">
                {/* Links to the Doctors page with this department pre-filtered,
                    reusing the ?department= param the Doctors page reads. */}
                <Link to={`/doctors?department=${dept._id}`}>
                  <Button variant="outline">
                    {t("departments.viewDoctors")}
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Departments;
