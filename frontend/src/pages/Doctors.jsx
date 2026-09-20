import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { getDoctors } from "../api/doctorApi";
import { getDepartments } from "../api/departmentApi";
import Button from "../components/common/Button";
import Select from "../components/common/Select";
import Alert from "../components/common/Alert";
import Loader from "../components/common/Loader";

const Doctors = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // The selected department lives in the URL, so a filtered list can be
  // linked to directly (this is how the Departments page links here).
  const selectedDepartment = searchParams.get("department") || "";

  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  // Departments are fetched once, only to populate the filter dropdown.
  useEffect(() => {
    let isMounted = true;

    getDepartments()
      .then((res) => {
        if (isMounted) setDepartments(res.data.departments || []);
      })
      .catch(() => {
        // A failed department fetch only costs us the filter dropdown —
        // the doctor list below can still load and display normally.
        if (isMounted) setDepartments([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Doctors are re-fetched whenever the department filter changes.
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadFailed(false);

    const params = selectedDepartment ? { department: selectedDepartment } : {};

    getDoctors(params)
      .then((res) => {
        if (isMounted) setDoctors(res.data.doctors || []);
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
  }, [selectedDepartment]);

  const handleFilterChange = (event) => {
    const value = event.target.value;
    setSearchParams(value ? { department: value } : {});
  };

  const departmentOptions = departments.map((dept) => ({
    value: dept._id,
    label: dept.name,
  }));

  const emptyMessage = selectedDepartment
    ? t("doctors.emptyForDepartment")
    : t("doctors.empty");

  return (
    <div className="page">
      <h1>{t("doctors.pageHeading")}</h1>
      <p className="page__lead">{t("doctors.pageIntro")}</p>

      {departmentOptions.length > 0 && (
        <div className="filter-bar">
          <div className="filter-bar__field">
            <Select
              id="department-filter"
              label={t("doctors.filterLabel")}
              value={selectedDepartment}
              onChange={handleFilterChange}
              options={departmentOptions}
              placeholder={t("doctors.allDepartments")}
            />
          </div>
          {!loading && !loadFailed && doctors.length > 0 && (
            <p className="filter-bar__count">
              {t("doctors.resultCount").replace("{count}", doctors.length)}
            </p>
          )}
        </div>
      )}

      {loading && <Loader label={t("common.loading")} />}

      {loadFailed && !loading && (
        <Alert variant="error">{t("doctors.loadError")}</Alert>
      )}

      {!loading && !loadFailed && doctors.length === 0 && (
        <Alert variant="info">{emptyMessage}</Alert>
      )}

      {!loading && !loadFailed && doctors.length > 0 && (
        <div className="doctor-grid">
          {doctors.map((doctor) => (
            <article key={doctor._id} className="doctor-card">
              <h2 className="doctor-card__name">
                Dr. {doctor.firstName} {doctor.lastName}
              </h2>

              {doctor.department?.name && (
                <p className="doctor-card__department">
                  {doctor.department.name}
                </p>
              )}

              <div className="doctor-card__details">
                {doctor.qualification && (
                  <div className="doctor-card__row">
                    <p className="doctor-card__label">
                      {t("doctors.qualification")}
                    </p>
                    <p className="doctor-card__value">{doctor.qualification}</p>
                  </div>
                )}
                {doctor.experience !== undefined && (
                  <div className="doctor-card__row">
                    <p className="doctor-card__label">
                      {t("doctors.experience")}
                    </p>
                    <p className="doctor-card__value">
                      {doctor.experience} {t("doctors.years")}
                    </p>
                  </div>
                )}
                {doctor.consultationFee !== undefined && (
                  <div className="doctor-card__row">
                    <p className="doctor-card__label">
                      {t("doctors.consultationFee")}
                    </p>
                    <p className="doctor-card__value">
                      Rs. {doctor.consultationFee}
                    </p>
                  </div>
                )}
              </div>

              <div className="doctor-card__actions">
                {/* Doctor id is passed through the URL so the booking page
                    can pre-select this doctor once that page is built. */}
                <Link to={`/book-appointment?doctor=${doctor._id}`}>
                  <Button variant="primary">
                    {t("doctors.bookWithDoctor")}
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

export default Doctors;
