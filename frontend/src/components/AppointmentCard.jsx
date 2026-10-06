import { useLanguage } from "../context/LanguageContext";
import Button from "./common/Button";

const STATUS_LABEL_KEYS = {
  pending: "statusPending",
  confirmed: "statusConfirmed",
  cancelled: "statusCancelled",
  completed: "statusCompleted",
  no_show: "statusNoShow",
};

const ACTIONABLE_STATUSES = ["pending", "confirmed"];

const AppointmentCard = ({ appointment, onCancel, onReschedule }) => {
  const { t } = useLanguage();
  const {
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

  const canAct = ACTIONABLE_STATUSES.includes(status);

  return (
    <article className={`appointment-card appointment-card--${status}`}>
      <div className="appointment-card__header">
        <h3 className="appointment-card__doctor">
          {doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "-"}
        </h3>
        <span className={`status-badge status-badge--${status}`}>
          {t(`dashboard.${STATUS_LABEL_KEYS[status]}`)}
        </span>
      </div>

      {department?.name && (
        <p className="appointment-card__department">{department.name}</p>
      )}

      <div className="appointment-card__details">
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
      </div>

      {canAct && (onCancel || onReschedule) && (
        <div className="appointment-card__actions">
          {onReschedule && (
            <Button variant="outline" onClick={() => onReschedule(appointment)}>
              {t("dashboard.reschedule")}
            </Button>
          )}
          {onCancel && (
            <Button variant="danger" onClick={() => onCancel(appointment)}>
              {t("dashboard.cancel")}
            </Button>
          )}
        </div>
      )}
    </article>
  );
};

export default AppointmentCard;
