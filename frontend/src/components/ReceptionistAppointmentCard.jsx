import { useLanguage } from "../context/LanguageContext";
import Button from "./common/Button";

const STATUS_LABEL_KEYS = {
  pending: "statusPending",
  confirmed: "statusConfirmed",
  cancelled: "statusCancelled",
  completed: "statusCompleted",
  no_show: "statusNoShow",
};

const ReceptionistAppointmentCard = ({
  appointment,
  onConfirm,
  onCancel,
  onReschedule,
  onComplete,
  onNoShow,
}) => {
  const { t } = useLanguage();
  const {
    _id,
    patientRef,
    guestInfo,
    doctor,
    department,
    appointmentDate,
    dayOfWeek,
    status,
    tokenNumber,
    paymentMethod,
    paymentStatus,
    symptoms,
  } = appointment;

  const patientName = patientRef
    ? `${patientRef.firstName} ${patientRef.lastName}`
    : guestInfo
      ? `${guestInfo.firstName} ${guestInfo.lastName}`
      : "-";

  const patientContact = patientRef?.phone || guestInfo?.phone || "-";

  return (
    <article className={`appointment-card appointment-card--${status}`}>
      <div className="appointment-card__header">
        <div>
          <div className="patient-identity">
            <h3 className="appointment-card__doctor">{patientName}</h3>
            {!patientRef && (
              <span className="guest-badge">
                {t("receptionist.guestBadge")}
              </span>
            )}
          </div>
          {doctor && (
            <p className="appointment-card__department">
              Dr. {doctor.firstName} {doctor.lastName}
              {department?.name ? ` · ${department.name}` : ""}
            </p>
          )}
        </div>
        <span className={`status-badge status-badge--${status}`}>
          {t(`dashboard.${STATUS_LABEL_KEYS[status]}`)}
        </span>
      </div>

      <div className="appointment-card__details">
        <div className="detail-row">
          <p className="detail-label">{t("receptionist.contactLabel")}</p>
          <p className="detail-value">{patientContact}</p>
        </div>

        <div className="detail-row">
          <p className="detail-label">{t("dashboard.dateLabel")}</p>
          <p className="detail-value">
            {appointmentDate?.slice(0, 10)}
            {dayOfWeek ? ` (${t(`days.${dayOfWeek}`)})` : ""}
          </p>
        </div>

        {status === "confirmed" && tokenNumber != null && (
          <div className="detail-row">
            <p className="detail-label">{t("dashboard.tokenLabel")}</p>
            <p className="detail-value detail-value--token">{tokenNumber}</p>
          </div>
        )}

        {paymentMethod && (
          <div className="detail-row">
            <p className="detail-label">{t("dashboard.paymentMethodLabel")}</p>
            <p className="detail-value">
              {paymentMethod === "mock_esewa"
                ? t("booking.paymentMockEsewa")
                : t("booking.paymentAtClinic")}
            </p>
          </div>
        )}

        {paymentStatus && (
          <div className="detail-row">
            <p className="detail-label">{t("dashboard.paymentStatusLabel")}</p>
            <p className="detail-value">
              {t(`dashboard.paymentStatus_${paymentStatus}`)}
            </p>
          </div>
        )}

        {symptoms && (
          <div className="detail-row">
            <p className="detail-label">{t("dashboard.symptomsLabel")}</p>
            <p className="detail-value">{symptoms}</p>
          </div>
        )}

        <div className="detail-row">
          <p className="detail-label">{t("dashboard.referenceLabel")}</p>
          <p className="detail-value appointment-card__reference">{_id}</p>
        </div>
      </div>

      <div className="appointment-card__actions">
        {status === "pending" && onConfirm && (
          <Button variant="primary" onClick={() => onConfirm(appointment)}>
            {t("receptionist.confirm")}
          </Button>
        )}
        {status === "confirmed" && onComplete && (
          <Button variant="primary" onClick={() => onComplete(appointment)}>
            {t("receptionist.complete")}
          </Button>
        )}
        {status === "confirmed" && onNoShow && (
          <Button variant="outline" onClick={() => onNoShow(appointment)}>
            {t("receptionist.noShow")}
          </Button>
        )}
        {(status === "pending" || status === "confirmed") && onReschedule && (
          <Button variant="outline" onClick={() => onReschedule(appointment)}>
            {t("dashboard.reschedule")}
          </Button>
        )}
        {(status === "pending" || status === "confirmed") && onCancel && (
          <Button variant="danger" onClick={() => onCancel(appointment)}>
            {t("dashboard.cancel")}
          </Button>
        )}
      </div>
    </article>
  );
};

export default ReceptionistAppointmentCard;
