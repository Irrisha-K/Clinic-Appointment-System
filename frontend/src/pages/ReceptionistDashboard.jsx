import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  getAppointments,
  getTodayAppointments,
  searchAppointments,
  confirmAppointment,
  cancelAppointment,
  rescheduleAppointment,
  completeAppointment,
  markNoShow,
  createWalkIn,
} from "../api/appointmentApi";
import { getDoctors, getDoctorAvailability } from "../api/doctorApi";
import { getDepartments } from "../api/departmentApi";
import ReceptionistAppointmentCard from "../components/ReceptionistAppointmentCard";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Button from "../components/common/Button";
import Alert from "../components/common/Alert";
import Loader from "../components/common/Loader";

const getTodayDateString = () => new Date().toISOString().slice(0, 10);

const EMPTY_WALKIN = {
  department: "",
  doctor: "",
  date: getTodayDateString(),
  firstName: "",
  lastName: "",
  age: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  symptoms: "",
  paymentMethod: "",
};

const ReceptionistDashboard = () => {
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState("pending");

  const [pending, setPending] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState(null);

  const [today, setToday] = useState([]);
  const [todayLoading, setTodayLoading] = useState(true);
  const [todayError, setTodayError] = useState(null);
  const [todayDoctorFilter, setTodayDoctorFilter] = useState("");

  const [all, setAll] = useState([]);
  const [allLoading, setAllLoading] = useState(true);
  const [allError, setAllError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [lastSearchTerm, setLastSearchTerm] = useState("");

  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newDoctorId, setNewDoctorId] = useState("");
  const [rescheduleAvailability, setRescheduleAvailability] = useState(null);
  const [checkingRescheduleAvailability, setCheckingRescheduleAvailability] =
    useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInDoctors, setWalkInDoctors] = useState([]);
  const [walkInForm, setWalkInForm] = useState(EMPTY_WALKIN);
  const [walkInAvailability, setWalkInAvailability] = useState(null);
  const [checkingWalkInAvailability, setCheckingWalkInAvailability] =
    useState(false);
  const [walkInErrors, setWalkInErrors] = useState({});
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInError, setWalkInError] = useState(null);

  // ---------- Reference data loaded once ----------
  useEffect(() => {
    getDoctors()
      .then((res) => setDoctors(res.data.doctors || []))
      .catch(() => setDoctors([]));
    getDepartments()
      .then((res) => setDepartments(res.data.departments || []))
      .catch(() => setDepartments([]));
  }, []);

  // ---------- Pending ----------
  const loadPending = useCallback(() => {
    setPendingLoading(true);
    setPendingError(null);
    return getAppointments({ status: "pending" })
      .then((res) => setPending(res.data.appointments || []))
      .catch((err) =>
        setPendingError(
          err.response?.data?.message || t("receptionist.loadError"),
        ),
      )
      .finally(() => setPendingLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "pending") loadPending();
  }, [activeTab, loadPending]);

  // ---------- Today ----------
  const loadToday = useCallback(() => {
    setTodayLoading(true);
    setTodayError(null);
    const params = todayDoctorFilter ? { doctor: todayDoctorFilter } : {};
    return getTodayAppointments(params)
      .then((res) => setToday(res.data.appointments || []))
      .catch((err) =>
        setTodayError(
          err.response?.data?.message || t("receptionist.loadError"),
        ),
      )
      .finally(() => setTodayLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayDoctorFilter]);

  useEffect(() => {
    if (activeTab === "today") loadToday();
  }, [activeTab, loadToday]);

  // ---------- All / filtered / search ----------
  const loadAll = useCallback(
    (search = lastSearchTerm) => {
      setAllLoading(true);
      setAllError(null);

      const request = search
        ? searchAppointments(search)
        : getAppointments({
            ...(statusFilter && { status: statusFilter }),
            ...(doctorFilter && { doctor: doctorFilter }),
            ...(dateFilter && { date: dateFilter }),
          });

      return request
        .then((res) => setAll(res.data.appointments || []))
        .catch((err) =>
          setAllError(
            err.response?.data?.message || t("receptionist.loadError"),
          ),
        )
        .finally(() => setAllLoading(false));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusFilter, doctorFilter, dateFilter, lastSearchTerm],
  );

  useEffect(() => {
    if (activeTab === "all") loadAll();
  }, [activeTab, loadAll]);

  const refreshActiveTab = () => {
    if (activeTab === "pending") loadPending();
    else if (activeTab === "today") loadToday();
    else loadAll();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setLastSearchTerm(searchTerm.trim());
    loadAll(searchTerm.trim());
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setLastSearchTerm("");
    loadAll("");
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    setDoctorFilter("");
    setDateFilter("");
  };

  // ---------- Simple actions ----------
  const handleConfirm = async (appointment) => {
    setActionError(null);
    try {
      const res = await confirmAppointment(appointment._id);
      setActionMessage(
        t("receptionist.confirmSuccess").replace(
          "{token}",
          res.data.appointment.tokenNumber,
        ),
      );
      refreshActiveTab();
    } catch (err) {
      setActionError(
        err.response?.data?.message || t("receptionist.actionError"),
      );
    }
  };

  const handleComplete = async (appointment) => {
    setActionError(null);
    try {
      await completeAppointment(appointment._id);
      setActionMessage(t("receptionist.completeSuccess"));
      refreshActiveTab();
    } catch (err) {
      setActionError(
        err.response?.data?.message || t("receptionist.actionError"),
      );
    }
  };

  const handleNoShow = async (appointment) => {
    setActionError(null);
    try {
      await markNoShow(appointment._id);
      setActionMessage(t("receptionist.noShowSuccess"));
      refreshActiveTab();
    } catch (err) {
      setActionError(
        err.response?.data?.message || t("receptionist.actionError"),
      );
    }
  };

  // ---------- Cancel modal ----------
  const openCancelModal = (appointment) => {
    setCancelTarget(appointment);
    setCancelReason("");
    setActionError(null);
  };

  const confirmCancel = async () => {
    setCancelling(true);
    try {
      await cancelAppointment(cancelTarget._id, {
        cancelReason: cancelReason.trim() || undefined,
      });
      setCancelTarget(null);
      setActionMessage(t("receptionist.cancelSuccess"));
      refreshActiveTab();
    } catch (err) {
      setActionError(
        err.response?.data?.message || t("receptionist.actionError"),
      );
    } finally {
      setCancelling(false);
    }
  };

  // ---------- Reschedule modal ----------
  const openRescheduleModal = (appointment) => {
    setRescheduleTarget(appointment);
    setNewDate("");
    setNewDoctorId(appointment.doctor?._id || "");
    setRescheduleAvailability(null);
    setActionError(null);
  };

  const checkRescheduleAvailability = async (date, doctorId) => {
    if (!date || !doctorId) return;
    setCheckingRescheduleAvailability(true);
    try {
      const res = await getDoctorAvailability(doctorId, date);
      setRescheduleAvailability(res.data);
    } catch (err) {
      setRescheduleAvailability({
        available: false,
        reason: err.response?.data?.message || t("receptionist.actionError"),
      });
    } finally {
      setCheckingRescheduleAvailability(false);
    }
  };

  const handleRescheduleDateChange = (e) => {
    const date = e.target.value;
    setNewDate(date);
    setRescheduleAvailability(null);
    checkRescheduleAvailability(date, newDoctorId);
  };

  const handleRescheduleDoctorChange = (e) => {
    const doctorId = e.target.value;
    setNewDoctorId(doctorId);
    setRescheduleAvailability(null);
    if (newDate) checkRescheduleAvailability(newDate, doctorId);
  };

  const confirmReschedule = async () => {
    setRescheduling(true);
    try {
      const payload = { newAppointmentDate: newDate };
      if (newDoctorId && newDoctorId !== rescheduleTarget.doctor?._id) {
        payload.newDoctorId = newDoctorId;
      }
      await rescheduleAppointment(rescheduleTarget._id, payload);
      setRescheduleTarget(null);
      setActionMessage(t("receptionist.rescheduleSuccess"));
      refreshActiveTab();
    } catch (err) {
      setActionError(
        err.response?.data?.message || t("receptionist.actionError"),
      );
    } finally {
      setRescheduling(false);
    }
  };

  // ---------- Walk-in modal ----------
  const openWalkInModal = () => {
    setWalkInForm(EMPTY_WALKIN);
    setWalkInDoctors([]);
    setWalkInAvailability(null);
    setWalkInErrors({});
    setWalkInError(null);
    setWalkInOpen(true);
  };

  const handleWalkInDepartmentChange = (e) => {
    const departmentId = e.target.value;
    setWalkInForm((prev) => ({
      ...prev,
      department: departmentId,
      doctor: "",
    }));
    setWalkInAvailability(null);
    if (!departmentId) {
      setWalkInDoctors([]);
      return;
    }
    getDoctors({ department: departmentId })
      .then((res) => setWalkInDoctors(res.data.doctors || []))
      .catch(() => setWalkInDoctors([]));
  };

  const checkWalkInAvailability = async (doctorId, date) => {
    if (!doctorId || !date) return;
    setCheckingWalkInAvailability(true);
    try {
      const res = await getDoctorAvailability(doctorId, date);
      setWalkInAvailability(res.data);
    } catch (err) {
      setWalkInAvailability({
        available: false,
        reason: err.response?.data?.message || t("receptionist.actionError"),
      });
    } finally {
      setCheckingWalkInAvailability(false);
    }
  };

  const handleWalkInDoctorChange = (e) => {
    const doctorId = e.target.value;
    setWalkInForm((prev) => ({ ...prev, doctor: doctorId }));
    checkWalkInAvailability(doctorId, walkInForm.date);
  };

  const handleWalkInDateChange = (e) => {
    const date = e.target.value;
    setWalkInForm((prev) => ({ ...prev, date }));
    checkWalkInAvailability(walkInForm.doctor, date);
  };

  const handleWalkInFieldChange = (field) => (e) => {
    setWalkInForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validateWalkIn = () => {
    const errors = {};
    if (!walkInForm.department) errors.department = t("booking.errorRequired");
    if (!walkInForm.doctor) errors.doctor = t("booking.errorRequired");
    if (!walkInForm.date) errors.date = t("booking.errorRequired");
    if (!walkInForm.firstName.trim())
      errors.firstName = t("booking.errorRequired");
    if (!walkInForm.lastName.trim())
      errors.lastName = t("booking.errorRequired");
    if (walkInForm.age === "" || Number(walkInForm.age) < 0)
      errors.age = t("booking.errorInvalidAge");
    if (!walkInForm.gender) errors.gender = t("booking.errorRequired");
    if (!/^\d{7,15}$/.test(walkInForm.phone.trim()))
      errors.phone = t("booking.errorInvalidPhone");
    if (!/^\S+@\S+\.\S+$/.test(walkInForm.email.trim()))
      errors.email = t("booking.errorInvalidEmail");
    if (!walkInForm.address.trim()) errors.address = t("booking.errorRequired");
    if (walkInForm.symptoms.trim().length < 3)
      errors.symptoms = t("booking.errorSymptomsShort");
    if (!walkInForm.paymentMethod)
      errors.paymentMethod = t("booking.errorRequired");
    setWalkInErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    setWalkInError(null);
    if (!validateWalkIn()) return;

    setWalkInSubmitting(true);
    try {
      const res = await createWalkIn({
        doctor: walkInForm.doctor,
        appointmentDate: walkInForm.date,
        symptoms: walkInForm.symptoms.trim(),
        paymentMethod: walkInForm.paymentMethod,
        guestInfo: {
          firstName: walkInForm.firstName.trim(),
          lastName: walkInForm.lastName.trim(),
          age: Number(walkInForm.age),
          gender: walkInForm.gender,
          phone: walkInForm.phone.trim(),
          email: walkInForm.email.trim(),
          address: walkInForm.address.trim(),
        },
      });
      setWalkInOpen(false);
      setActionMessage(
        t("receptionist.walkInSuccess").replace(
          "{token}",
          res.data.appointment.tokenNumber,
        ),
      );
      setActiveTab("today");
      loadToday();
    } catch (err) {
      setWalkInError(
        err.response?.data?.message || t("receptionist.walkInError"),
      );
    } finally {
      setWalkInSubmitting(false);
    }
  };

  const genderOptions = [
    { value: "male", label: t("booking.genderMale") },
    { value: "female", label: t("booking.genderFemale") },
    { value: "other", label: t("booking.genderOther") },
  ];
  const paymentOptions = [
    { value: "mock_esewa", label: t("booking.paymentMockEsewa") },
    { value: "pay_at_clinic", label: t("booking.paymentAtClinic") },
  ];
  const doctorOptions = doctors.map((d) => ({
    value: d._id,
    label: `Dr. ${d.firstName} ${d.lastName}`,
  }));
  const departmentOptions = departments.map((d) => ({
    value: d._id,
    label: d.name,
  }));
  const walkInDoctorOptions = walkInDoctors.map((d) => ({
    value: d._id,
    label: `Dr. ${d.firstName} ${d.lastName}`,
  }));

  const renderList = (list, loading, error, emptyKey, handlers) => {
    if (loading) return <Loader label={t("common.loading")} />;
    if (error) return <Alert variant="error">{error}</Alert>;
    if (list.length === 0) return <Alert variant="info">{t(emptyKey)}</Alert>;
    return (
      <div className="appointment-list">
        {list.map((appt) => (
          <ReceptionistAppointmentCard
            key={appt._id}
            appointment={appt}
            {...handlers}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <h1>{t("receptionist.heading")}</h1>
          <p className="page__lead">{t("receptionist.subtitle")}</p>
        </div>
        <Button variant="primary" onClick={openWalkInModal}>
          {t("receptionist.newWalkIn")}
        </Button>
      </div>

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
        <button
          className={`tab-button ${activeTab === "pending" ? "tab-button--active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          {t("receptionist.tabPending")}
        </button>
        <button
          className={`tab-button ${activeTab === "today" ? "tab-button--active" : ""}`}
          onClick={() => setActiveTab("today")}
        >
          {t("receptionist.tabToday")}
        </button>
        <button
          className={`tab-button ${activeTab === "all" ? "tab-button--active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          {t("receptionist.tabAll")}
        </button>
      </div>

      {activeTab === "pending" &&
        renderList(
          pending,
          pendingLoading,
          pendingError,
          "receptionist.noPending",
          {
            onConfirm: handleConfirm,
            onCancel: openCancelModal,
            onReschedule: openRescheduleModal,
          },
        )}

      {activeTab === "today" && (
        <>
          <div className="filter-bar">
            <div className="filter-bar__field">
              <Select
                id="todayDoctorFilter"
                label={t("receptionist.filterDoctor")}
                value={todayDoctorFilter}
                onChange={(e) => setTodayDoctorFilter(e.target.value)}
                options={doctorOptions}
                placeholder={t("receptionist.filterDoctorAll")}
              />
            </div>
          </div>
          {renderList(today, todayLoading, todayError, "receptionist.noToday", {
            onCancel: openCancelModal,
            onReschedule: openRescheduleModal,
            onComplete: handleComplete,
            onNoShow: handleNoShow,
          })}
        </>
      )}

      {activeTab === "all" && (
        <>
          <form className="search-bar" onSubmit={handleSearchSubmit}>
            <div className="search-bar__field">
              <Input
                id="search"
                label={t("receptionist.searchLabel")}
                placeholder={t("receptionist.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="search-bar__actions">
              <Button type="submit" variant="primary">
                {t("receptionist.searchButton")}
              </Button>
              {lastSearchTerm && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearSearch}
                >
                  {t("receptionist.clearSearch")}
                </Button>
              )}
            </div>
          </form>

          {!lastSearchTerm && (
            <>
              <div className="filter-bar">
                <div className="filter-bar__field">
                  <Select
                    id="statusFilter"
                    label={t("receptionist.filterStatus")}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={[
                      { value: "pending", label: t("dashboard.statusPending") },
                      {
                        value: "confirmed",
                        label: t("dashboard.statusConfirmed"),
                      },
                      {
                        value: "cancelled",
                        label: t("dashboard.statusCancelled"),
                      },
                      {
                        value: "completed",
                        label: t("dashboard.statusCompleted"),
                      },
                      { value: "no_show", label: t("dashboard.statusNoShow") },
                    ]}
                    placeholder={t("receptionist.filterStatusAll")}
                  />
                </div>
                <div className="filter-bar__field">
                  <Select
                    id="doctorFilter"
                    label={t("receptionist.filterDoctor")}
                    value={doctorFilter}
                    onChange={(e) => setDoctorFilter(e.target.value)}
                    options={doctorOptions}
                    placeholder={t("receptionist.filterDoctorAll")}
                  />
                </div>
                <div className="filter-bar__field">
                  <Input
                    id="dateFilter"
                    type="date"
                    label={t("receptionist.filterDate")}
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
                {(statusFilter || doctorFilter || dateFilter) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearFilters}
                  >
                    {t("receptionist.clearFilters")}
                  </Button>
                )}
              </div>
              <p className="filter-note">{t("receptionist.filterNote")}</p>
            </>
          )}

          {renderList(all, allLoading, allError, "receptionist.noResults", {
            onConfirm: handleConfirm,
            onCancel: openCancelModal,
            onReschedule: openRescheduleModal,
            onComplete: handleComplete,
            onNoShow: handleNoShow,
          })}
        </>
      )}

      {/* ---------- Cancel modal ---------- */}
      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title={t("receptionist.cancelModalTitle")}
      >
        <p>{t("receptionist.cancelModalMessage")}</p>
        <Input
          id="cancelReason"
          label={t("dashboard.cancelReasonLabel")}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
        <div className="modal-actions">
          <Button
            variant="outline"
            onClick={() => setCancelTarget(null)}
            disabled={cancelling}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="danger"
            onClick={confirmCancel}
            disabled={cancelling}
          >
            {cancelling
              ? t("dashboard.cancelling")
              : t("dashboard.confirmCancel")}
          </Button>
        </div>
      </Modal>

      {/* ---------- Reschedule modal ---------- */}
      <Modal
        isOpen={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        title={t("receptionist.rescheduleModalTitle")}
      >
        <Select
          id="rescheduleDoctor"
          label={t("receptionist.rescheduleDoctorLabel")}
          value={newDoctorId}
          onChange={handleRescheduleDoctorChange}
          options={doctorOptions}
          placeholder={t("receptionist.rescheduleKeepDoctor")}
        />
        <Input
          id="newDate"
          type="date"
          label={t("booking.dateLabel")}
          min={getTodayDateString()}
          value={newDate}
          onChange={handleRescheduleDateChange}
        />
        {checkingRescheduleAvailability && (
          <Loader label={t("booking.checkingAvailability")} />
        )}
        {!checkingRescheduleAvailability &&
          rescheduleAvailability?.available === true && (
            <Alert variant="success">
              {t("booking.availableMessage")
                .replace("{day}", t(`days.${rescheduleAvailability.day}`))
                .replace("{start}", rescheduleAvailability.startTime)
                .replace("{end}", rescheduleAvailability.endTime)}
            </Alert>
          )}
        {!checkingRescheduleAvailability &&
          rescheduleAvailability?.available === false && (
            <Alert variant="error">{rescheduleAvailability.reason}</Alert>
          )}
        <div className="modal-actions">
          <Button
            variant="outline"
            onClick={() => setRescheduleTarget(null)}
            disabled={rescheduling}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={confirmReschedule}
            disabled={
              rescheduling || rescheduleAvailability?.available !== true
            }
          >
            {rescheduling
              ? t("dashboard.rescheduling")
              : t("dashboard.confirmReschedule")}
          </Button>
        </div>
      </Modal>

      {/* ---------- Walk-in modal ---------- */}
      <Modal
        isOpen={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        title={t("receptionist.walkInTitle")}
      >
        <Alert variant="info">{t("receptionist.walkInLimitationNote")}</Alert>
        <form onSubmit={handleWalkInSubmit} noValidate>
          <div className="walkin-form-grid">
            <Select
              id="walkInDepartment"
              label={t("receptionist.walkInDepartment")}
              value={walkInForm.department}
              onChange={handleWalkInDepartmentChange}
              options={departmentOptions}
              placeholder={t("booking.departmentPlaceholder")}
              error={walkInErrors.department}
            />
            <Select
              id="walkInDoctor"
              label={t("receptionist.walkInDoctor")}
              value={walkInForm.doctor}
              onChange={handleWalkInDoctorChange}
              options={walkInDoctorOptions}
              placeholder={t("booking.doctorPlaceholder")}
              error={walkInErrors.doctor}
            />
            <div className="field field--full">
              <Input
                id="walkInDate"
                type="date"
                label={t("receptionist.walkInDate")}
                min={getTodayDateString()}
                value={walkInForm.date}
                onChange={handleWalkInDateChange}
                error={walkInErrors.date}
              />
            </div>
          </div>

          {checkingWalkInAvailability && (
            <Loader label={t("booking.checkingAvailability")} />
          )}
          {!checkingWalkInAvailability &&
            walkInAvailability?.available === true && (
              <Alert variant="success">
                {t("booking.availableMessage")
                  .replace("{day}", t(`days.${walkInAvailability.day}`))
                  .replace("{start}", walkInAvailability.startTime)
                  .replace("{end}", walkInAvailability.endTime)}
              </Alert>
            )}
          {!checkingWalkInAvailability &&
            walkInAvailability?.available === false && (
              <Alert variant="error">{walkInAvailability.reason}</Alert>
            )}

          <div className="walkin-form-grid">
            <Input
              id="walkInFirstName"
              label={t("booking.firstName")}
              value={walkInForm.firstName}
              onChange={handleWalkInFieldChange("firstName")}
              error={walkInErrors.firstName}
            />
            <Input
              id="walkInLastName"
              label={t("booking.lastName")}
              value={walkInForm.lastName}
              onChange={handleWalkInFieldChange("lastName")}
              error={walkInErrors.lastName}
            />
            <Input
              id="walkInAge"
              type="number"
              min="0"
              label={t("booking.age")}
              value={walkInForm.age}
              onChange={handleWalkInFieldChange("age")}
              error={walkInErrors.age}
            />
            <Select
              id="walkInGender"
              label={t("booking.gender")}
              value={walkInForm.gender}
              onChange={handleWalkInFieldChange("gender")}
              options={genderOptions}
              placeholder={t("booking.genderPlaceholder")}
              error={walkInErrors.gender}
            />
            <Input
              id="walkInPhone"
              label={t("booking.phone")}
              value={walkInForm.phone}
              onChange={handleWalkInFieldChange("phone")}
              error={walkInErrors.phone}
            />
            <Input
              id="walkInEmail"
              type="email"
              label={t("booking.email")}
              value={walkInForm.email}
              onChange={handleWalkInFieldChange("email")}
              error={walkInErrors.email}
            />
            <div className="field field--full">
              <Input
                id="walkInAddress"
                label={t("booking.address")}
                value={walkInForm.address}
                onChange={handleWalkInFieldChange("address")}
                error={walkInErrors.address}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="walkInSymptoms" className="field__label">
              {t("booking.symptoms")}
            </label>
            <textarea
              id="walkInSymptoms"
              rows={3}
              className="booking-textarea"
              placeholder={t("booking.symptomsPlaceholder")}
              value={walkInForm.symptoms}
              onChange={handleWalkInFieldChange("symptoms")}
            />
            {walkInErrors.symptoms && (
              <p className="field__error">{walkInErrors.symptoms}</p>
            )}
          </div>

          <Select
            id="walkInPayment"
            label={t("booking.paymentLabel")}
            value={walkInForm.paymentMethod}
            onChange={handleWalkInFieldChange("paymentMethod")}
            options={paymentOptions}
            placeholder={t("booking.paymentPlaceholder")}
            error={walkInErrors.paymentMethod}
          />

          {walkInError && <Alert variant="error">{walkInError}</Alert>}

          <div className="modal-actions">
            <Button
              type="button"
              variant="outline"
              onClick={() => setWalkInOpen(false)}
              disabled={walkInSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={walkInSubmitting}>
              {walkInSubmitting
                ? t("receptionist.walkInSubmitting")
                : t("receptionist.walkInSubmit")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ReceptionistDashboard;
