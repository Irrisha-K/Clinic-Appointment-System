import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
  deleteDepartment,
} from "../api/departmentApi";
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  updateDoctorStatus,
  deleteDoctor,
  getDoctorSchedule,
  createDoctorSchedule,
  updateDoctorSchedule,
  updateDoctorScheduleStatus,
  deleteDoctorSchedule,
} from "../api/doctorApi";
import { getAppointments, getTodayAppointments } from "../api/appointmentApi";
import ReceptionistAppointmentCard from "../components/ReceptionistAppointmentCard";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Button from "../components/common/Button";
import Alert from "../components/common/Alert";
import Loader from "../components/common/Loader";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const EMPTY_DEPT_FORM = { name: "", description: "" };
const EMPTY_DOCTOR_FORM = {
  firstName: "",
  lastName: "",
  department: "",
  qualification: "",
  specialization: "",
  experience: "",
  consultationFee: "",
  biography: "",
  phone: "",
  email: "",
};
const EMPTY_SCHEDULE_FORM = {
  dayOfWeek: "",
  startTime: "",
  endTime: "",
  breakStart: "",
  breakEnd: "",
};

const AdminDashboard = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  const refreshDepartments = useCallback(
    () =>
      getDepartments().then((res) =>
        setDepartments(res.data.departments || []),
      ),
    [],
  );
  const refreshDoctors = useCallback(
    () => getDoctors().then((res) => setDoctors(res.data.doctors || [])),
    [],
  );

  useEffect(() => {
    refreshDepartments().catch(() => setDepartments([]));
    refreshDoctors().catch(() => setDoctors([]));
  }, [refreshDepartments, refreshDoctors]);

  // ================= OVERVIEW =================
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(null);
  const [stats, setStats] = useState({
    doctors: 0,
    departments: 0,
    pending: 0,
    today: 0,
  });

  useEffect(() => {
    if (activeTab !== "overview") return;
    setOverviewLoading(true);
    setOverviewError(null);
    Promise.all([
      getDoctors(),
      getDepartments(),
      getAppointments({ status: "pending" }),
      getTodayAppointments(),
    ])
      .then(([docRes, deptRes, pendingRes, todayRes]) => {
        setStats({
          doctors: docRes.data.count ?? (docRes.data.doctors || []).length,
          departments:
            deptRes.data.count ?? (deptRes.data.departments || []).length,
          pending:
            pendingRes.data.count ??
            (pendingRes.data.appointments || []).length,
          today:
            todayRes.data.count ?? (todayRes.data.appointments || []).length,
        });
      })
      .catch((err) =>
        setOverviewError(err.response?.data?.message || t("admin.loadError")),
      )
      .finally(() => setOverviewLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ================= DEPARTMENTS =================
  const [deptFormOpen, setDeptFormOpen] = useState(false);
  const [deptFormMode, setDeptFormMode] = useState("create");
  const [deptEditingId, setDeptEditingId] = useState(null);
  const [deptForm, setDeptForm] = useState(EMPTY_DEPT_FORM);
  const [deptFormErrors, setDeptFormErrors] = useState({});
  const [deptSaving, setDeptSaving] = useState(false);
  const [deptFormError, setDeptFormError] = useState(null);
  const [deptDeleteTarget, setDeptDeleteTarget] = useState(null);
  const [deptDeleting, setDeptDeleting] = useState(false);

  const openCreateDept = () => {
    setDeptFormMode("create");
    setDeptEditingId(null);
    setDeptForm(EMPTY_DEPT_FORM);
    setDeptFormErrors({});
    setDeptFormError(null);
    setDeptFormOpen(true);
  };

  const openEditDept = (dept) => {
    setDeptFormMode("edit");
    setDeptEditingId(dept._id);
    setDeptForm({ name: dept.name, description: dept.description || "" });
    setDeptFormErrors({});
    setDeptFormError(null);
    setDeptFormOpen(true);
  };

  const validateDeptForm = () => {
    const errors = {};
    if (!deptForm.name.trim() || deptForm.name.trim().length < 2) {
      errors.name = t("booking.errorRequired");
    }
    setDeptFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    setDeptFormError(null);
    if (!validateDeptForm()) return;

    setDeptSaving(true);
    try {
      if (deptFormMode === "create") {
        await createDepartment(deptForm);
        setActionMessage(t("admin.departmentCreated"));
      } else {
        await updateDepartment(deptEditingId, deptForm);
        setActionMessage(t("admin.departmentUpdated"));
      }
      setDeptFormOpen(false);
      await refreshDepartments();
    } catch (err) {
      setDeptFormError(err.response?.data?.message || t("admin.actionError"));
    } finally {
      setDeptSaving(false);
    }
  };

  const handleDeptStatusToggle = async (dept) => {
    setActionError(null);
    const newStatus = dept.status === "active" ? "inactive" : "active";
    try {
      await updateDepartmentStatus(dept._id, newStatus);
      setActionMessage(t("admin.departmentStatusUpdated"));
      await refreshDepartments();
    } catch (err) {
      setActionError(err.response?.data?.message || t("admin.actionError"));
    }
  };

  const confirmDeptDelete = async () => {
    setDeptDeleting(true);
    try {
      await deleteDepartment(deptDeleteTarget._id);
      setDeptDeleteTarget(null);
      setActionMessage(t("admin.departmentDeleted"));
      await refreshDepartments();
    } catch (err) {
      setActionError(err.response?.data?.message || t("admin.actionError"));
    } finally {
      setDeptDeleting(false);
    }
  };

  // ================= DOCTORS =================
  const [doctorFormOpen, setDoctorFormOpen] = useState(false);
  const [doctorFormMode, setDoctorFormMode] = useState("create");
  const [doctorEditingId, setDoctorEditingId] = useState(null);
  const [doctorForm, setDoctorForm] = useState(EMPTY_DOCTOR_FORM);
  const [doctorFormErrors, setDoctorFormErrors] = useState({});
  const [doctorSaving, setDoctorSaving] = useState(false);
  const [doctorFormError, setDoctorFormError] = useState(null);
  const [doctorDeleteTarget, setDoctorDeleteTarget] = useState(null);
  const [doctorDeleting, setDoctorDeleting] = useState(false);

  const openCreateDoctor = () => {
    setDoctorFormMode("create");
    setDoctorEditingId(null);
    setDoctorForm(EMPTY_DOCTOR_FORM);
    setDoctorFormErrors({});
    setDoctorFormError(null);
    setDoctorFormOpen(true);
  };

  const openEditDoctor = (doc) => {
    setDoctorFormMode("edit");
    setDoctorEditingId(doc._id);
    setDoctorForm({
      firstName: doc.firstName,
      lastName: doc.lastName,
      department: doc.department?._id || "",
      qualification: doc.qualification,
      specialization: doc.specialization,
      experience: String(doc.experience),
      consultationFee: String(doc.consultationFee),
      biography: doc.biography || "",
      phone: doc.phone || "",
      email: doc.email || "",
    });
    setDoctorFormErrors({});
    setDoctorFormError(null);
    setDoctorFormOpen(true);
  };

  const handleDoctorFieldChange = (field) => (e) => {
    setDoctorForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validateDoctorForm = () => {
    const errors = {};
    if (!doctorForm.firstName.trim())
      errors.firstName = t("booking.errorRequired");
    if (!doctorForm.lastName.trim())
      errors.lastName = t("booking.errorRequired");
    if (!doctorForm.department) errors.department = t("booking.errorRequired");
    if (!doctorForm.qualification.trim())
      errors.qualification = t("booking.errorRequired");
    if (!doctorForm.specialization.trim())
      errors.specialization = t("booking.errorRequired");
    if (doctorForm.experience === "" || Number(doctorForm.experience) < 0) {
      errors.experience = t("admin.errorInvalidNumber");
    }
    if (
      doctorForm.consultationFee === "" ||
      Number(doctorForm.consultationFee) < 0
    ) {
      errors.consultationFee = t("admin.errorInvalidNumber");
    }
    if (doctorForm.phone && !/^\d{7,15}$/.test(doctorForm.phone.trim())) {
      errors.phone = t("booking.errorInvalidPhone");
    }
    if (doctorForm.email && !/^\S+@\S+\.\S+$/.test(doctorForm.email.trim())) {
      errors.email = t("booking.errorInvalidEmail");
    }
    setDoctorFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    setDoctorFormError(null);
    if (!validateDoctorForm()) return;

    const payload = {
      ...doctorForm,
      experience: Number(doctorForm.experience),
      consultationFee: Number(doctorForm.consultationFee),
    };

    setDoctorSaving(true);
    try {
      if (doctorFormMode === "create") {
        await createDoctor(payload);
        setActionMessage(t("admin.doctorCreated"));
      } else {
        await updateDoctor(doctorEditingId, payload);
        setActionMessage(t("admin.doctorUpdated"));
      }
      setDoctorFormOpen(false);
      await refreshDoctors();
    } catch (err) {
      setDoctorFormError(err.response?.data?.message || t("admin.actionError"));
    } finally {
      setDoctorSaving(false);
    }
  };

  const handleDoctorStatusChange = async (doctorId, status) => {
    setActionError(null);
    try {
      await updateDoctorStatus(doctorId, status);
      setActionMessage(t("admin.doctorStatusUpdated"));
      await refreshDoctors();
    } catch (err) {
      setActionError(err.response?.data?.message || t("admin.actionError"));
    }
  };

  const confirmDoctorDelete = async () => {
    setDoctorDeleting(true);
    try {
      await deleteDoctor(doctorDeleteTarget._id);
      setDoctorDeleteTarget(null);
      setActionMessage(t("admin.doctorDeleted"));
      await refreshDoctors();
    } catch (err) {
      setActionError(err.response?.data?.message || t("admin.actionError"));
    } finally {
      setDoctorDeleting(false);
    }
  };

  // ================= SCHEDULES =================
  const [scheduleDoctorId, setScheduleDoctorId] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);

  const loadSchedule = useCallback((doctorId) => {
    if (!doctorId) {
      setSchedule([]);
      return;
    }
    setScheduleLoading(true);
    setScheduleError(null);
    getDoctorSchedule(doctorId)
      .then((res) => setSchedule(res.data.schedule || []))
      .catch((err) =>
        setScheduleError(err.response?.data?.message || t("admin.loadError")),
      )
      .finally(() => setScheduleLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSchedule(scheduleDoctorId);
  }, [scheduleDoctorId, loadSchedule]);

  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [scheduleFormMode, setScheduleFormMode] = useState("create");
  const [scheduleEditingId, setScheduleEditingId] = useState(null);
  const [scheduleForm, setScheduleForm] = useState(EMPTY_SCHEDULE_FORM);
  const [scheduleFormErrors, setScheduleFormErrors] = useState({});
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleFormError, setScheduleFormError] = useState(null);
  const [scheduleDeleteTarget, setScheduleDeleteTarget] = useState(null);
  const [scheduleDeleting, setScheduleDeleting] = useState(false);

  const openCreateSchedule = () => {
    setScheduleFormMode("create");
    setScheduleEditingId(null);
    setScheduleForm(EMPTY_SCHEDULE_FORM);
    setScheduleFormErrors({});
    setScheduleFormError(null);
    setScheduleFormOpen(true);
  };

  const openEditSchedule = (entry) => {
    setScheduleFormMode("edit");
    setScheduleEditingId(entry._id);
    setScheduleForm({
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      breakStart: entry.breakStart || "",
      breakEnd: entry.breakEnd || "",
    });
    setScheduleFormErrors({});
    setScheduleFormError(null);
    setScheduleFormOpen(true);
  };

  const handleScheduleFieldChange = (field) => (e) => {
    setScheduleForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validateScheduleForm = () => {
    const errors = {};
    if (!scheduleForm.dayOfWeek) errors.dayOfWeek = t("booking.errorRequired");
    if (!scheduleForm.startTime) errors.startTime = t("booking.errorRequired");
    if (!scheduleForm.endTime) errors.endTime = t("booking.errorRequired");
    setScheduleFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setScheduleFormError(null);
    if (!validateScheduleForm()) return;

    const payload = {
      dayOfWeek: scheduleForm.dayOfWeek,
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
      ...(scheduleForm.breakStart && { breakStart: scheduleForm.breakStart }),
      ...(scheduleForm.breakEnd && { breakEnd: scheduleForm.breakEnd }),
    };

    setScheduleSaving(true);
    try {
      if (scheduleFormMode === "create") {
        await createDoctorSchedule(scheduleDoctorId, payload);
        setActionMessage(t("admin.scheduleCreated"));
      } else {
        await updateDoctorSchedule(
          scheduleDoctorId,
          scheduleEditingId,
          payload,
        );
        setActionMessage(t("admin.scheduleUpdated"));
      }
      setScheduleFormOpen(false);
      loadSchedule(scheduleDoctorId);
    } catch (err) {
      setScheduleFormError(
        err.response?.data?.message || t("admin.actionError"),
      );
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleScheduleStatusToggle = async (entry) => {
    setActionError(null);
    try {
      await updateDoctorScheduleStatus(
        scheduleDoctorId,
        entry._id,
        !entry.isActive,
      );
      setActionMessage(t("admin.scheduleStatusUpdated"));
      loadSchedule(scheduleDoctorId);
    } catch (err) {
      setActionError(err.response?.data?.message || t("admin.actionError"));
    }
  };

  const confirmScheduleDelete = async () => {
    setScheduleDeleting(true);
    try {
      await deleteDoctorSchedule(scheduleDoctorId, scheduleDeleteTarget._id);
      setScheduleDeleteTarget(null);
      setActionMessage(t("admin.scheduleDeleted"));
      loadSchedule(scheduleDoctorId);
    } catch (err) {
      setActionError(err.response?.data?.message || t("admin.actionError"));
    } finally {
      setScheduleDeleting(false);
    }
  };

  // ================= APPOINTMENTS (read-only) =================
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [apptError, setApptError] = useState(null);
  const [apptStatusFilter, setApptStatusFilter] = useState("");
  const [apptDoctorFilter, setApptDoctorFilter] = useState("");
  const [apptDateFilter, setApptDateFilter] = useState("");

  const loadAppointments = useCallback(() => {
    setApptLoading(true);
    setApptError(null);
    getAppointments({
      ...(apptStatusFilter && { status: apptStatusFilter }),
      ...(apptDoctorFilter && { doctor: apptDoctorFilter }),
      ...(apptDateFilter && { date: apptDateFilter }),
    })
      .then((res) => setAppointments(res.data.appointments || []))
      .catch((err) =>
        setApptError(err.response?.data?.message || t("admin.loadError")),
      )
      .finally(() => setApptLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apptStatusFilter, apptDoctorFilter, apptDateFilter]);

  useEffect(() => {
    if (activeTab === "appointments") loadAppointments();
  }, [activeTab, loadAppointments]);

  // ================= Shared option lists =================
  const departmentOptions = departments.map((d) => ({
    value: d._id,
    label: d.name,
  }));
  const doctorOptions = doctors.map((d) => ({
    value: d._id,
    label: `Dr. ${d.firstName} ${d.lastName}`,
  }));
  const dayOptions = DAYS.map((d) => ({ value: d, label: t(`days.${d}`) }));
  const doctorStatusOptions = [
    { value: "active", label: t("admin.statusActive") },
    { value: "inactive", label: t("admin.statusInactive") },
    { value: "on_leave", label: t("admin.statusOnLeave") },
  ];

  return (
    <div className="page">
      <h1>{t("admin.heading")}</h1>
      <p className="page__lead">{t("admin.subtitle")}</p>

      {actionMessage && (
        <Alert variant="success" className="dashboard-action-message">
          {actionMessage}
        </Alert>
      )}
      {actionError && (
        <Alert variant="error" className="dashboard-action-message">
          {actionError}
        </Alert>
      )}

      <div className="tabs">
        {[
          "overview",
          "departments",
          "doctors",
          "schedules",
          "appointments",
        ].map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? "tab-button--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {t(`admin.tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)}
          </button>
        ))}
      </div>

      {/* ================= OVERVIEW TAB ================= */}
      {activeTab === "overview" && (
        <>
          {overviewLoading && <Loader label={t("common.loading")} />}
          {overviewError && <Alert variant="error">{overviewError}</Alert>}
          {!overviewLoading && !overviewError && (
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-value">{stats.doctors}</p>
                <p className="stat-label">{t("admin.statDoctors")}</p>
              </div>
              <div className="stat-card">
                <p className="stat-value">{stats.departments}</p>
                <p className="stat-label">{t("admin.statDepartments")}</p>
              </div>
              <div className="stat-card">
                <p className="stat-value">{stats.pending}</p>
                <p className="stat-label">{t("admin.statPending")}</p>
              </div>
              <div className="stat-card">
                <p className="stat-value">{stats.today}</p>
                <p className="stat-label">{t("admin.statToday")}</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= DEPARTMENTS TAB ================= */}
      {activeTab === "departments" && (
        <>
          <div className="dashboard-header">
            <h2 className="dashboard-section__title">
              {t("admin.departmentsSectionTitle")}
            </h2>
            <Button variant="primary" onClick={openCreateDept}>
              {t("admin.addDepartment")}
            </Button>
          </div>

          {departments.length === 0 ? (
            <Alert variant="info">{t("admin.noDepartments")}</Alert>
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
                  <div className="admin-card-actions">
                    <span
                      className={`status-badge status-badge--${dept.status === "active" ? "confirmed" : "cancelled"}`}
                    >
                      {dept.status === "active"
                        ? t("admin.statusActive")
                        : t("admin.statusInactive")}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => openEditDept(dept)}
                    >
                      {t("admin.edit")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDeptStatusToggle(dept)}
                    >
                      {dept.status === "active"
                        ? t("admin.deactivate")
                        : t("admin.activate")}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setDeptDeleteTarget(dept)}
                    >
                      {t("admin.delete")}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= DOCTORS TAB ================= */}
      {activeTab === "doctors" && (
        <>
          <div className="dashboard-header">
            <h2 className="dashboard-section__title">
              {t("admin.doctorsSectionTitle")}
            </h2>
            <Button variant="primary" onClick={openCreateDoctor}>
              {t("admin.addDoctor")}
            </Button>
          </div>

          {doctors.length === 0 ? (
            <Alert variant="info">{t("admin.noDoctors")}</Alert>
          ) : (
            <div className="doctor-grid">
              {doctors.map((doc) => (
                <article key={doc._id} className="doctor-card">
                  <h3 className="doctor-card__name">
                    Dr. {doc.firstName} {doc.lastName}
                  </h3>
                  {doc.department?.name && (
                    <p className="doctor-card__department">
                      {doc.department.name}
                    </p>
                  )}
                  <div className="doctor-card__details">
                    <div className="detail-row">
                      <p className="detail-label">
                        {t("doctors.qualification")}
                      </p>
                      <p className="detail-value">{doc.qualification}</p>
                    </div>
                    <div className="detail-row">
                      <p className="detail-label">
                        {t("admin.specialization")}
                      </p>
                      <p className="detail-value">{doc.specialization}</p>
                    </div>
                    <div className="detail-row">
                      <p className="detail-label">{t("doctors.experience")}</p>
                      <p className="detail-value">
                        {doc.experience} {t("doctors.years")}
                      </p>
                    </div>
                    <div className="detail-row">
                      <p className="detail-label">
                        {t("doctors.consultationFee")}
                      </p>
                      <p className="detail-value">Rs. {doc.consultationFee}</p>
                    </div>
                  </div>
                  <div className="admin-card-actions">
                    <div className="admin-status-select">
                      <Select
                        id={`status-${doc._id}`}
                        value={doc.status}
                        onChange={(e) =>
                          handleDoctorStatusChange(doc._id, e.target.value)
                        }
                        options={doctorStatusOptions}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => openEditDoctor(doc)}
                    >
                      {t("admin.edit")}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setDoctorDeleteTarget(doc)}
                    >
                      {t("admin.delete")}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= SCHEDULES TAB ================= */}
      {activeTab === "schedules" && (
        <>
          <h2 className="dashboard-section__title">
            {t("admin.schedulesSectionTitle")}
          </h2>
          <Select
            id="scheduleDoctor"
            label={t("admin.selectDoctorLabel")}
            value={scheduleDoctorId}
            onChange={(e) => setScheduleDoctorId(e.target.value)}
            options={doctorOptions}
            placeholder={t("admin.selectDoctorPlaceholder")}
          />

          {!scheduleDoctorId && (
            <Alert variant="info">{t("admin.selectDoctorPrompt")}</Alert>
          )}

          {scheduleDoctorId && (
            <>
              <div className="dashboard-header">
                <span />
                <Button variant="primary" onClick={openCreateSchedule}>
                  {t("admin.addScheduleEntry")}
                </Button>
              </div>

              {scheduleLoading && <Loader label={t("common.loading")} />}
              {scheduleError && <Alert variant="error">{scheduleError}</Alert>}
              {!scheduleLoading && !scheduleError && schedule.length === 0 && (
                <Alert variant="info">{t("admin.noScheduleEntries")}</Alert>
              )}
              {!scheduleLoading && !scheduleError && schedule.length > 0 && (
                <div className="schedule-list">
                  {schedule.map((entry) => (
                    <div
                      key={entry._id}
                      className={`schedule-row ${!entry.isActive ? "schedule-row--inactive" : ""}`}
                    >
                      <div className="schedule-row__info">
                        <span className="schedule-row__day">
                          {t(`days.${entry.dayOfWeek}`)}
                        </span>
                        <span className="schedule-row__time">
                          {entry.startTime} – {entry.endTime}
                          {entry.breakStart && entry.breakEnd
                            ? ` (${t("admin.breakStartLabel").split(" (")[0]}: ${entry.breakStart}–${entry.breakEnd})`
                            : ""}
                        </span>
                      </div>
                      <div className="schedule-row__actions">
                        <Button
                          variant="outline"
                          onClick={() => openEditSchedule(entry)}
                        >
                          {t("admin.edit")}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleScheduleStatusToggle(entry)}
                        >
                          {entry.isActive
                            ? t("admin.deactivate")
                            : t("admin.activate")}
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => setScheduleDeleteTarget(entry)}
                        >
                          {t("admin.delete")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ================= APPOINTMENTS TAB (read-only) ================= */}
      {activeTab === "appointments" && (
        <>
          <h2 className="dashboard-section__title">
            {t("admin.appointmentsSectionTitle")}
          </h2>
          <Alert variant="info" className="readonly-note">
            {t("admin.appointmentsReadOnlyNote")}
          </Alert>

          <div className="filter-bar">
            <div className="filter-bar__field">
              <Select
                id="apptStatusFilter"
                label={t("receptionist.filterStatus")}
                value={apptStatusFilter}
                onChange={(e) => setApptStatusFilter(e.target.value)}
                options={[
                  { value: "pending", label: t("dashboard.statusPending") },
                  { value: "confirmed", label: t("dashboard.statusConfirmed") },
                  { value: "cancelled", label: t("dashboard.statusCancelled") },
                  { value: "completed", label: t("dashboard.statusCompleted") },
                  { value: "no_show", label: t("dashboard.statusNoShow") },
                ]}
                placeholder={t("receptionist.filterStatusAll")}
              />
            </div>
            <div className="filter-bar__field">
              <Select
                id="apptDoctorFilter"
                label={t("receptionist.filterDoctor")}
                value={apptDoctorFilter}
                onChange={(e) => setApptDoctorFilter(e.target.value)}
                options={doctorOptions}
                placeholder={t("receptionist.filterDoctorAll")}
              />
            </div>
            <div className="filter-bar__field">
              <Input
                id="apptDateFilter"
                type="date"
                label={t("receptionist.filterDate")}
                value={apptDateFilter}
                onChange={(e) => setApptDateFilter(e.target.value)}
              />
            </div>
          </div>

          {apptLoading && <Loader label={t("common.loading")} />}
          {apptError && <Alert variant="error">{apptError}</Alert>}
          {!apptLoading && !apptError && appointments.length === 0 && (
            <Alert variant="info">{t("admin.noAppointments")}</Alert>
          )}
          {!apptLoading && !apptError && appointments.length > 0 && (
            <div className="appointment-list">
              {appointments.map((appt) => (
                <ReceptionistAppointmentCard
                  key={appt._id}
                  appointment={appt}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= Department Modal ================= */}
      <Modal
        isOpen={deptFormOpen}
        onClose={() => setDeptFormOpen(false)}
        title={
          deptFormMode === "create"
            ? t("admin.addDepartment")
            : t("admin.editDepartment")
        }
      >
        <form onSubmit={handleDeptSubmit} noValidate>
          <Input
            id="deptName"
            label={t("admin.departmentName")}
            value={deptForm.name}
            onChange={(e) =>
              setDeptForm((p) => ({ ...p, name: e.target.value }))
            }
            error={deptFormErrors.name}
          />
          <Input
            id="deptDescription"
            label={t("admin.departmentDescription")}
            value={deptForm.description}
            onChange={(e) =>
              setDeptForm((p) => ({ ...p, description: e.target.value }))
            }
          />
          {deptFormError && <Alert variant="error">{deptFormError}</Alert>}
          <div className="modal-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeptFormOpen(false)}
              disabled={deptSaving}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={deptSaving}>
              {deptSaving ? t("admin.saving") : t("admin.save")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(deptDeleteTarget)}
        onClose={() => setDeptDeleteTarget(null)}
        title={t("admin.deleteDepartmentTitle")}
      >
        <p>{t("admin.deleteDepartmentMessage")}</p>
        <div className="modal-actions">
          <Button
            variant="outline"
            onClick={() => setDeptDeleteTarget(null)}
            disabled={deptDeleting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="danger"
            onClick={confirmDeptDelete}
            disabled={deptDeleting}
          >
            {deptDeleting ? t("admin.deleting") : t("admin.delete")}
          </Button>
        </div>
      </Modal>

      {/* ================= Doctor Modal ================= */}
      <Modal
        isOpen={doctorFormOpen}
        onClose={() => setDoctorFormOpen(false)}
        title={
          doctorFormMode === "create"
            ? t("admin.addDoctor")
            : t("admin.editDoctor")
        }
      >
        <form onSubmit={handleDoctorSubmit} noValidate>
          <div className="form-grid-2col">
            <Input
              id="docFirstName"
              label={t("booking.firstName")}
              value={doctorForm.firstName}
              onChange={handleDoctorFieldChange("firstName")}
              error={doctorFormErrors.firstName}
            />
            <Input
              id="docLastName"
              label={t("booking.lastName")}
              value={doctorForm.lastName}
              onChange={handleDoctorFieldChange("lastName")}
              error={doctorFormErrors.lastName}
            />
            <div className="field--full">
              <Select
                id="docDepartment"
                label={t("booking.departmentLabel")}
                value={doctorForm.department}
                onChange={handleDoctorFieldChange("department")}
                options={departmentOptions}
                placeholder={t("booking.departmentPlaceholder")}
                error={doctorFormErrors.department}
              />
            </div>
            <Input
              id="docQualification"
              label={t("doctors.qualification")}
              value={doctorForm.qualification}
              onChange={handleDoctorFieldChange("qualification")}
              error={doctorFormErrors.qualification}
            />
            <Input
              id="docSpecialization"
              label={t("admin.specialization")}
              value={doctorForm.specialization}
              onChange={handleDoctorFieldChange("specialization")}
              error={doctorFormErrors.specialization}
            />
            <Input
              id="docExperience"
              type="number"
              min="0"
              label={t("doctors.experience")}
              value={doctorForm.experience}
              onChange={handleDoctorFieldChange("experience")}
              error={doctorFormErrors.experience}
            />
            <Input
              id="docFee"
              type="number"
              min="0"
              label={t("doctors.consultationFee")}
              value={doctorForm.consultationFee}
              onChange={handleDoctorFieldChange("consultationFee")}
              error={doctorFormErrors.consultationFee}
            />
            <Input
              id="docPhone"
              label={t("admin.phoneOptional")}
              value={doctorForm.phone}
              onChange={handleDoctorFieldChange("phone")}
              error={doctorFormErrors.phone}
            />
            <Input
              id="docEmail"
              type="email"
              label={t("admin.emailOptional")}
              value={doctorForm.email}
              onChange={handleDoctorFieldChange("email")}
              error={doctorFormErrors.email}
            />
          </div>
          <div className="field">
            <label htmlFor="docBio" className="field__label">
              {t("admin.biography")}
            </label>
            <textarea
              id="docBio"
              rows={3}
              className="booking-textarea"
              value={doctorForm.biography}
              onChange={handleDoctorFieldChange("biography")}
            />
          </div>
          {doctorFormError && <Alert variant="error">{doctorFormError}</Alert>}
          <div className="modal-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDoctorFormOpen(false)}
              disabled={doctorSaving}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={doctorSaving}>
              {doctorSaving ? t("admin.saving") : t("admin.save")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(doctorDeleteTarget)}
        onClose={() => setDoctorDeleteTarget(null)}
        title={t("admin.deleteDoctorTitle")}
      >
        <p>{t("admin.deleteDoctorMessage")}</p>
        <div className="modal-actions">
          <Button
            variant="outline"
            onClick={() => setDoctorDeleteTarget(null)}
            disabled={doctorDeleting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="danger"
            onClick={confirmDoctorDelete}
            disabled={doctorDeleting}
          >
            {doctorDeleting ? t("admin.deleting") : t("admin.delete")}
          </Button>
        </div>
      </Modal>

      {/* ================= Schedule Modal ================= */}
      <Modal
        isOpen={scheduleFormOpen}
        onClose={() => setScheduleFormOpen(false)}
        title={
          scheduleFormMode === "create"
            ? t("admin.addScheduleEntry")
            : t("admin.editScheduleEntry")
        }
      >
        <form onSubmit={handleScheduleSubmit} noValidate>
          <Select
            id="schDay"
            label={t("admin.dayOfWeekLabel")}
            value={scheduleForm.dayOfWeek}
            onChange={handleScheduleFieldChange("dayOfWeek")}
            options={dayOptions}
            placeholder={t("admin.selectDoctorPlaceholder")}
            error={scheduleFormErrors.dayOfWeek}
          />
          <div className="form-grid-2col">
            <Input
              id="schStart"
              type="time"
              label={t("admin.startTimeLabel")}
              value={scheduleForm.startTime}
              onChange={handleScheduleFieldChange("startTime")}
              error={scheduleFormErrors.startTime}
            />
            <Input
              id="schEnd"
              type="time"
              label={t("admin.endTimeLabel")}
              value={scheduleForm.endTime}
              onChange={handleScheduleFieldChange("endTime")}
              error={scheduleFormErrors.endTime}
            />
            <Input
              id="schBreakStart"
              type="time"
              label={t("admin.breakStartLabel")}
              value={scheduleForm.breakStart}
              onChange={handleScheduleFieldChange("breakStart")}
            />
            <Input
              id="schBreakEnd"
              type="time"
              label={t("admin.breakEndLabel")}
              value={scheduleForm.breakEnd}
              onChange={handleScheduleFieldChange("breakEnd")}
            />
          </div>
          {scheduleFormError && (
            <Alert variant="error">{scheduleFormError}</Alert>
          )}
          <div className="modal-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setScheduleFormOpen(false)}
              disabled={scheduleSaving}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={scheduleSaving}>
              {scheduleSaving ? t("admin.saving") : t("admin.save")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(scheduleDeleteTarget)}
        onClose={() => setScheduleDeleteTarget(null)}
        title={t("admin.deleteScheduleTitle")}
      >
        <p>{t("admin.deleteScheduleMessage")}</p>
        <div className="modal-actions">
          <Button
            variant="outline"
            onClick={() => setScheduleDeleteTarget(null)}
            disabled={scheduleDeleting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="danger"
            onClick={confirmScheduleDelete}
            disabled={scheduleDeleting}
          >
            {scheduleDeleting ? t("admin.deleting") : t("admin.delete")}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
