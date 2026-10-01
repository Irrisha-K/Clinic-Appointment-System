import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
} from "../api/appointmentApi";
import { getDoctorAvailability } from "../api/doctorApi";
import AppointmentCard from "../components/AppointmentCard";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Alert from "../components/common/Alert";
import Loader from "../components/common/Loader";

const UPCOMING_STATUSES = ["pending", "confirmed"];
const PAST_STATUSES = ["cancelled", "completed", "no_show"];

const getTodayDateString = () => new Date().toISOString().slice(0, 10);

const PatientDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleError, setRescheduleError] = useState(null);

  const loadAppointments = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    return getMyAppointments()
      .then((res) => setAppointments(res.data.appointments || []))
      .catch((err) =>
        setLoadError(err.response?.data?.message || t("dashboard.loadError")),
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Bucketed by ACTUAL status, not by date — this is what determines
  // whether Cancel/Reschedule are even offered, matching the backend's
  // own transition rules exactly.
  const upcoming = appointments
    .filter((a) => UPCOMING_STATUSES.includes(a.status))
    .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

  const past = appointments
    .filter((a) => PAST_STATUSES.includes(a.status))
    .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

  // ---------- Cancel ----------
  const openCancelModal = (appointment) => {
    setCancelTarget(appointment);
    setCancelReason("");
    setCancelError(null);
  };

  const confirmCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelAppointment(cancelTarget._id, {
        cancelReason: cancelReason.trim() || undefined,
      });
      setCancelTarget(null);
      setActionMessage(t("dashboard.cancelSuccess"));
      await loadAppointments();
    } catch (err) {
      setCancelError(err.response?.data?.message || t("dashboard.actionError"));
    } finally {
      setCancelling(false);
    }
  };

  // ---------- Reschedule ----------
  const openRescheduleModal = (appointment) => {
    setRescheduleTarget(appointment);
    setNewDate("");
    setAvailabilityResult(null);
    setRescheduleError(null);
  };

  const handleNewDateChange = async (e) => {
    const date = e.target.value;
    setNewDate(date);
    setAvailabilityResult(null);
    if (!date || !rescheduleTarget?.doctor?._id) return;

    setCheckingAvailability(true);
    try {
      const res = await getDoctorAvailability(
        rescheduleTarget.doctor._id,
        date,
      );
      setAvailabilityResult(res.data);
    } catch (err) {
      setAvailabilityResult({
        available: false,
        reason: err.response?.data?.message || t("dashboard.actionError"),
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const confirmReschedule = async () => {
    setRescheduling(true);
    setRescheduleError(null);
    try {
      await rescheduleAppointment(rescheduleTarget._id, {
        newAppointmentDate: newDate,
      });
      setRescheduleTarget(null);
      setActionMessage(t("dashboard.rescheduleSuccess"));
      await loadAppointments();
    } catch (err) {
      setRescheduleError(
        err.response?.data?.message || t("dashboard.actionError"),
      );
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <div className="page">
      <h1>{t("dashboard.welcome").replace("{name}", user?.firstName || "")}</h1>

      <div className="profile-summary">
        <div className="detail-row">
          <p className="detail-label">{t("dashboard.profileName")}</p>
          <p className="detail-value">
            {user?.firstName} {user?.lastName}
          </p>
        </div>
        <div className="detail-row">
          <p className="detail-label">{t("dashboard.profileEmail")}</p>
          <p className="detail-value">{user?.email}</p>
        </div>
        <div className="detail-row">
          <p className="detail-label">{t("dashboard.profilePhone")}</p>
          <p className="detail-value">{user?.phone}</p>
        </div>
      </div>

      {actionMessage && (
        <Alert variant="success" className="dashboard-action-message">
          {actionMessage}
        </Alert>
      )}

      {loading && <Loader label={t("common.loading")} />}
      {loadError && !loading && <Alert variant="error">{loadError}</Alert>}

      {!loading && !loadError && (
        <>
          <section className="dashboard-section">
            <h2 className="dashboard-section__title">
              {t("dashboard.upcomingHeading")}
            </h2>
            {upcoming.length === 0 ? (
              <div className="dashboard-empty">
                <p>{t("dashboard.noUpcoming")}</p>
                <Link to="/book-appointment">
                  <Button variant="primary">{t("nav.bookAppointment")}</Button>
                </Link>
              </div>
            ) : (
              <div className="appointment-list">
                {upcoming.map((appt) => (
                  <AppointmentCard
                    key={appt._id}
                    appointment={appt}
                    onCancel={openCancelModal}
                    onReschedule={openRescheduleModal}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-section dashboard-section--past">
            <h2 className="dashboard-section__title">
              {t("dashboard.pastHeading")}
            </h2>
            {past.length === 0 ? (
              <p className="dashboard-empty-text">{t("dashboard.noPast")}</p>
            ) : (
              <div className="appointment-list appointment-list--past">
                {past.map((appt) => (
                  <AppointmentCard key={appt._id} appointment={appt} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <Modal
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title={t("dashboard.cancelModalTitle")}
      >
        <p>{t("dashboard.cancelModalMessage")}</p>
        <Input
          id="cancelReason"
          label={t("dashboard.cancelReasonLabel")}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
        {cancelError && <Alert variant="error">{cancelError}</Alert>}
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

      <Modal
        isOpen={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        title={t("dashboard.rescheduleModalTitle")}
      >
        <p>{t("dashboard.rescheduleModalMessage")}</p>
        <Input
          id="newDate"
          type="date"
          label={t("booking.dateLabel")}
          min={getTodayDateString()}
          value={newDate}
          onChange={handleNewDateChange}
        />
        {checkingAvailability && (
          <Loader label={t("booking.checkingAvailability")} />
        )}
        {!checkingAvailability && availabilityResult?.available === true && (
          <Alert variant="success">
            {t("booking.availableMessage")
              .replace("{day}", t(`days.${availabilityResult.day}`))
              .replace("{start}", availabilityResult.startTime)
              .replace("{end}", availabilityResult.endTime)}
          </Alert>
        )}
        {!checkingAvailability && availabilityResult?.available === false && (
          <Alert variant="error">{availabilityResult.reason}</Alert>
        )}
        {rescheduleError && <Alert variant="error">{rescheduleError}</Alert>}
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
            disabled={rescheduling || availabilityResult?.available !== true}
          >
            {rescheduling
              ? t("dashboard.rescheduling")
              : t("dashboard.confirmReschedule")}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default PatientDashboard;
