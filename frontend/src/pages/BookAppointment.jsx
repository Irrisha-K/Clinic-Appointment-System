import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { getDepartments } from "../api/departmentApi";
import {
  getDoctors,
  getDoctorById,
  getDoctorSchedule,
  getDoctorAvailability,
} from "../api/doctorApi";
import { createAppointment } from "../api/appointmentApi";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Button from "../components/common/Button";
import Alert from "../components/common/Alert";
import Loader from "../components/common/Loader";
import Modal from "../components/common/Modal";

const GENDER_OPTIONS_KEYS = [
  { value: "male", key: "genderMale" },
  { value: "female", key: "genderFemale" },
  { value: "other", key: "genderOther" },
];

const PAYMENT_OPTIONS_KEYS = [
  { value: "mock_esewa", key: "paymentMockEsewa" },
  { value: "pay_at_clinic", key: "paymentAtClinic" },
];

const getTodayDateString = () => new Date().toISOString().slice(0, 10);

const EMPTY_GUEST_INFO = {
  firstName: "",
  lastName: "",
  age: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
};

const BookAppointment = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();

  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  const [doctorSchedule, setDoctorSchedule] = useState([]);

  const [appointmentDate, setAppointmentDate] = useState("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);

  const [guestInfo, setGuestInfo] = useState(EMPTY_GUEST_INFO);
  const [symptoms, setSymptoms] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedAppointment, setSubmittedAppointment] = useState(null);

  // ---------- eSewa simulated payment modal state ----------
  const [showEsewaModal, setShowEsewaModal] = useState(false);
  const [esewaStep, setEsewaStep] = useState("form"); // form | processing | success
  const [esewaId, setEsewaId] = useState("");
  const [esewaPin, setEsewaPin] = useState("");
  const [esewaErrors, setEsewaErrors] = useState({});
  const [pendingPayload, setPendingPayload] = useState(null);

  const selectedDepartmentObj = departments.find(
    (d) => d._id === selectedDepartment,
  );
  const selectedDoctorObj = doctors.find((d) => d._id === selectedDoctorId);

  useEffect(() => {
    getDepartments()
      .then((res) => setDepartments(res.data.departments || []))
      .catch(() => setDepartments([]));

    const doctorIdFromUrl = searchParams.get("doctor");
    if (doctorIdFromUrl) {
      getDoctorById(doctorIdFromUrl)
        .then((res) => {
          const doctor = res.data.doctor;
          if (doctor?.department?._id) {
            setSelectedDepartment(doctor.department._id);
            setSelectedDoctorId(doctor._id);
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedDepartment) {
      setDoctors([]);
      return;
    }
    let active = true;
    getDoctors({ department: selectedDepartment })
      .then((res) => {
        if (active) setDoctors(res.data.doctors || []);
      })
      .catch(() => {
        if (active) setDoctors([]);
      });
    return () => {
      active = false;
    };
  }, [selectedDepartment]);

  useEffect(() => {
    if (!selectedDoctorId) {
      setDoctorSchedule([]);
      return;
    }
    let active = true;
    getDoctorSchedule(selectedDoctorId)
      .then((res) => {
        if (active) setDoctorSchedule(res.data.schedule || []);
      })
      .catch(() => {
        if (active) setDoctorSchedule([]);
      });
    return () => {
      active = false;
    };
  }, [selectedDoctorId]);

  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
    setSelectedDoctorId("");
    setAppointmentDate("");
    setAvailabilityResult(null);
  };

  const handleDoctorChange = (e) => {
    setSelectedDoctorId(e.target.value);
    setAppointmentDate("");
    setAvailabilityResult(null);
  };

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setAppointmentDate(date);
    setAvailabilityResult(null);

    if (!date || !selectedDoctorId) return;

    setCheckingAvailability(true);
    try {
      const res = await getDoctorAvailability(selectedDoctorId, date);
      setAvailabilityResult(res.data);
    } catch (err) {
      setAvailabilityResult({
        available: false,
        reason: err.response?.data?.message || t("booking.submitError"),
      });
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleGuestFieldChange = (field) => (e) => {
    setGuestInfo((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validate = () => {
    const errors = {};

    if (!selectedDepartment) errors.department = t("booking.errorRequired");
    if (!selectedDoctorId) errors.doctor = t("booking.errorRequired");
    if (!appointmentDate) errors.appointmentDate = t("booking.errorRequired");

    if (!user) {
      if (!guestInfo.firstName.trim())
        errors.firstName = t("booking.errorRequired");
      if (!guestInfo.lastName.trim())
        errors.lastName = t("booking.errorRequired");
      if (guestInfo.age === "" || Number(guestInfo.age) < 0)
        errors.age = t("booking.errorInvalidAge");
      if (!guestInfo.gender) errors.gender = t("booking.errorRequired");
      if (!/^\d{7,15}$/.test(guestInfo.phone.trim()))
        errors.phone = t("booking.errorInvalidPhone");
      if (!/^\S+@\S+\.\S+$/.test(guestInfo.email.trim()))
        errors.email = t("booking.errorInvalidEmail");
      if (!guestInfo.address.trim())
        errors.address = t("booking.errorRequired");
    }

    if (symptoms.trim().length < 3)
      errors.symptoms = t("booking.errorSymptomsShort");
    if (!paymentMethod) errors.paymentMethod = t("booking.errorRequired");

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = () => {
    const payload = {
      department: selectedDepartment,
      doctor: selectedDoctorId,
      appointmentDate,
      symptoms: symptoms.trim(),
      paymentMethod,
    };
    if (!user) {
      payload.guestInfo = { ...guestInfo, age: Number(guestInfo.age) };
    }
    return payload;
  };

  // Actually creates the appointment via the real backend. Called either
  // directly (Pay at Clinic) or after the simulated eSewa flow completes.
  const submitAppointment = async (payload) => {
    setSubmitting(true);
    try {
      const res = await createAppointment(payload);
      const patientName = user
        ? `${user.firstName} ${user.lastName}`
        : `${guestInfo.firstName} ${guestInfo.lastName}`;

      setSubmittedAppointment({
        id: res.data.appointment._id,
        status: res.data.appointment.status,
        doctorName: `Dr. ${selectedDoctorObj.firstName} ${selectedDoctorObj.lastName}`,
        departmentName: selectedDepartmentObj?.name,
        date: appointmentDate,
        day: availabilityResult?.day,
        patientName,
        paymentMethod,
      });
      setShowEsewaModal(false);
    } catch (err) {
      setSubmitError(err.response?.data?.message || t("booking.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    const payload = buildPayload();

    // eSewa is never actually charged here — this only opens the simulated
    // payment screen below. The real POST /appointments call (with
    // paymentMethod: "mock_esewa", unchanged for the backend) happens only
    // after the user completes the demo payment and clicks Continue.
    if (paymentMethod === "mock_esewa") {
      setPendingPayload(payload);
      setEsewaStep("form");
      setEsewaId("");
      setEsewaPin("");
      setEsewaErrors({});
      setShowEsewaModal(true);
      return;
    }

    await submitAppointment(payload);
  };

  const validateEsewaForm = () => {
    const errors = {};
    if (!/^\d{10}$/.test(esewaId.trim()))
      errors.esewaId = t("booking.esewaErrorId");
    if (esewaPin.trim().length < 4)
      errors.esewaPin = t("booking.esewaErrorPin");
    setEsewaErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEsewaPay = (e) => {
    e.preventDefault();
    if (!validateEsewaForm()) return;
    setEsewaStep("processing");
    // Purely a UI simulation of a processing delay — no network call here.
    setTimeout(() => setEsewaStep("success"), 1500);
  };

  const handleEsewaContinue = async () => {
    await submitAppointment(pendingPayload);
  };

  const handleEsewaCancel = () => {
    setShowEsewaModal(false);
    setEsewaStep("form");
  };

  const resetForNewBooking = () => {
    setSubmittedAppointment(null);
    setSelectedDepartment("");
    setSelectedDoctorId("");
    setAppointmentDate("");
    setAvailabilityResult(null);
    setGuestInfo(EMPTY_GUEST_INFO);
    setSymptoms("");
    setPaymentMethod("");
    setFormErrors({});
  };

  if (authLoading) {
    return <Loader label={t("common.loading")} />;
  }

  if (submittedAppointment) {
    return (
      <div className="page">
        <h1>{t("booking.successHeading")}</h1>
        <p className="page__lead">{t("booking.successIntro")}</p>

        <div className="summary-card">
          <div className="detail-row">
            <p className="detail-label">{t("booking.doctorLabelSuccess")}</p>
            <p className="detail-value">{submittedAppointment.doctorName}</p>
          </div>
          <div className="detail-row">
            <p className="detail-label">
              {t("booking.departmentLabelSuccess")}
            </p>
            <p className="detail-value">
              {submittedAppointment.departmentName}
            </p>
          </div>
          <div className="detail-row">
            <p className="detail-label">{t("booking.dateLabelSuccess")}</p>
            <p className="detail-value">
              {submittedAppointment.date}
              {submittedAppointment.day
                ? ` (${t(`days.${submittedAppointment.day}`)})`
                : ""}
            </p>
          </div>
          <div className="detail-row">
            <p className="detail-label">{t("booking.patientLabelSuccess")}</p>
            <p className="detail-value">{submittedAppointment.patientName}</p>
          </div>
          <div className="detail-row">
            <p className="detail-label">{t("booking.statusLabelSuccess")}</p>
            <p className="detail-value">{t("booking.statusPending")}</p>
          </div>
          <div className="detail-row">
            <p className="detail-label">{t("booking.paymentLabelSuccess")}</p>
            <p className="detail-value">
              {submittedAppointment.paymentMethod === "mock_esewa"
                ? t("booking.paymentMockEsewa")
                : t("booking.paymentAtClinic")}
            </p>
          </div>
        </div>

        <div className="booking-success__notice">
          <Alert variant="info">{t("booking.emailNotice")}</Alert>
        </div>

        <div className="booking-success__actions">
          <Button variant="outline" onClick={resetForNewBooking}>
            {t("booking.bookAnother")}
          </Button>
          <Link to="/">
            <Button variant="primary">{t("booking.backHome")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const departmentOptions = departments.map((d) => ({
    value: d._id,
    label: d.name,
  }));
  const doctorOptions = doctors.map((d) => ({
    value: d._id,
    label: `Dr. ${d.firstName} ${d.lastName}`,
  }));
  const genderOptions = GENDER_OPTIONS_KEYS.map((g) => ({
    value: g.value,
    label: t(`booking.${g.key}`),
  }));
  const paymentOptions = PAYMENT_OPTIONS_KEYS.map((p) => ({
    value: p.value,
    label: t(`booking.${p.key}`),
  }));

  const workingDayNames = doctorSchedule
    .filter((s) => s.isActive)
    .map((s) => t(`days.${s.dayOfWeek}`))
    .join(", ");

  const canShowDateStep = Boolean(selectedDoctorId);
  const canShowDetailsStep = availabilityResult?.available === true;

  return (
    <div className="page">
      <h1>{t("booking.pageHeading")}</h1>
      <p className="page__lead">{t("booking.pageIntro")}</p>

      <Alert variant="warning" className="booking-guest-notice">
        {t("footer.emergencyNotice")}
      </Alert>

      <form onSubmit={handleSubmit} noValidate>
        <div className="booking-section">
          <h2 className="booking-section__title">{t("booking.step1Title")}</h2>
          <Select
            id="department"
            label={t("booking.departmentLabel")}
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            options={departmentOptions}
            placeholder={t("booking.departmentPlaceholder")}
            error={formErrors.department}
          />
        </div>

        {selectedDepartment && (
          <div className="booking-section">
            <h2 className="booking-section__title">
              {t("booking.step2Title")}
            </h2>
            {doctorOptions.length === 0 ? (
              <Alert variant="info">{t("booking.doctorsEmpty")}</Alert>
            ) : (
              <Select
                id="doctor"
                label={t("booking.doctorLabel")}
                value={selectedDoctorId}
                onChange={handleDoctorChange}
                options={doctorOptions}
                placeholder={t("booking.doctorPlaceholder")}
                error={formErrors.doctor}
              />
            )}
          </div>
        )}

        {canShowDateStep && (
          <div className="booking-section">
            <h2 className="booking-section__title">
              {t("booking.step3Title")}
            </h2>
            {workingDayNames && (
              <p className="booking-hint">
                {t("booking.scheduleHint").replace("{days}", workingDayNames)}
              </p>
            )}
            <Input
              id="appointmentDate"
              type="date"
              label={t("booking.dateLabel")}
              min={getTodayDateString()}
              value={appointmentDate}
              onChange={handleDateChange}
              error={formErrors.appointmentDate}
            />

            <div className="booking-availability">
              {checkingAvailability && (
                <Loader label={t("booking.checkingAvailability")} />
              )}

              {!checkingAvailability &&
                availabilityResult?.available === true && (
                  <Alert variant="success">
                    {t("booking.availableMessage")
                      .replace("{day}", t(`days.${availabilityResult.day}`))
                      .replace("{start}", availabilityResult.startTime)
                      .replace("{end}", availabilityResult.endTime)}
                  </Alert>
                )}

              {!checkingAvailability &&
                availabilityResult?.available === false && (
                  <Alert variant="error">{availabilityResult.reason}</Alert>
                )}
            </div>
          </div>
        )}

        {canShowDetailsStep && (
          <div className="booking-section">
            <h2 className="booking-section__title">
              {t("booking.step4Title")}
            </h2>

            {user ? (
              <p className="booking-account-summary">
                {t("booking.bookingAsPatient")
                  .replace("{name}", `${user.firstName} ${user.lastName}`)
                  .replace("{email}", user.email)}
              </p>
            ) : (
              <>
                <Alert variant="info" className="booking-guest-notice">
                  {t("booking.guestNotice")}
                </Alert>
                <Input
                  id="firstName"
                  label={t("booking.firstName")}
                  value={guestInfo.firstName}
                  onChange={handleGuestFieldChange("firstName")}
                  error={formErrors.firstName}
                />
                <Input
                  id="lastName"
                  label={t("booking.lastName")}
                  value={guestInfo.lastName}
                  onChange={handleGuestFieldChange("lastName")}
                  error={formErrors.lastName}
                />
                <Input
                  id="age"
                  type="number"
                  min="0"
                  label={t("booking.age")}
                  value={guestInfo.age}
                  onChange={handleGuestFieldChange("age")}
                  error={formErrors.age}
                />
                <Select
                  id="gender"
                  label={t("booking.gender")}
                  value={guestInfo.gender}
                  onChange={handleGuestFieldChange("gender")}
                  options={genderOptions}
                  placeholder={t("booking.genderPlaceholder")}
                  error={formErrors.gender}
                />
                <Input
                  id="phone"
                  label={t("booking.phone")}
                  value={guestInfo.phone}
                  onChange={handleGuestFieldChange("phone")}
                  error={formErrors.phone}
                />
                <Input
                  id="email"
                  type="email"
                  label={t("booking.email")}
                  value={guestInfo.email}
                  onChange={handleGuestFieldChange("email")}
                  error={formErrors.email}
                />
                <Input
                  id="address"
                  label={t("booking.address")}
                  value={guestInfo.address}
                  onChange={handleGuestFieldChange("address")}
                  error={formErrors.address}
                />
              </>
            )}

            <div className="field">
              <label htmlFor="symptoms" className="field__label">
                {t("booking.symptoms")}
              </label>
              <textarea
                id="symptoms"
                rows={4}
                className="booking-textarea"
                placeholder={t("booking.symptomsPlaceholder")}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
              {formErrors.symptoms && (
                <p className="field__error">{formErrors.symptoms}</p>
              )}
            </div>
          </div>
        )}

        {canShowDetailsStep && (
          <div className="booking-section">
            <h2 className="booking-section__title">
              {t("booking.step5Title")}
            </h2>
            <Select
              id="paymentMethod"
              label={t("booking.paymentLabel")}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={paymentOptions}
              placeholder={t("booking.paymentPlaceholder")}
              error={formErrors.paymentMethod}
            />
          </div>
        )}

        {canShowDetailsStep && (
          <div className="booking-submit-row">
            {submitError && <Alert variant="error">{submitError}</Alert>}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting}
            >
              {submitting
                ? t("booking.submitting")
                : paymentMethod === "mock_esewa"
                  ? t("booking.proceedToPayment")
                  : t("booking.submit")}
            </Button>
          </div>
        )}
      </form>

      {/* ---------- Simulated eSewa payment modal ---------- */}
      <Modal
        isOpen={showEsewaModal}
        onClose={handleEsewaCancel}
        title={
          esewaStep === "success"
            ? t("booking.esewaSuccessTitle")
            : t("booking.esewaTitle")
        }
      >
        <div className="esewa-demo-banner">{t("booking.esewaDemoNotice")}</div>

        {esewaStep === "form" && (
          <form onSubmit={handleEsewaPay} noValidate>
            <div className="esewa-header">
              <span className="esewa-logo">eSewa</span>
              <span className="esewa-tagline">{t("booking.esewaTagline")}</span>
            </div>

            <div className="esewa-amount-box">
              <p className="esewa-amount-label">
                {t("booking.esewaAmountLabel")}
              </p>
              <p className="esewa-amount-value">
                Rs. {selectedDoctorObj?.consultationFee ?? "-"}
              </p>
              <p className="esewa-amount-note">
                Dr. {selectedDoctorObj?.firstName} {selectedDoctorObj?.lastName}
                {selectedDepartmentObj?.name
                  ? ` · ${selectedDepartmentObj.name}`
                  : ""}
              </p>
            </div>

            <Input
              id="esewaId"
              label={t("booking.esewaIdLabel")}
              placeholder={t("booking.esewaIdPlaceholder")}
              value={esewaId}
              onChange={(e) => setEsewaId(e.target.value)}
              error={esewaErrors.esewaId}
            />
            <Input
              id="esewaPin"
              type="password"
              label={t("booking.esewaPinLabel")}
              value={esewaPin}
              onChange={(e) => setEsewaPin(e.target.value)}
              error={esewaErrors.esewaPin}
            />

            <div className="modal-actions">
              <Button
                type="button"
                variant="outline"
                onClick={handleEsewaCancel}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" variant="secondary">
                {t("booking.esewaPayButton")}
              </Button>
            </div>
          </form>
        )}

        {esewaStep === "processing" && (
          <Loader label={t("booking.esewaProcessing")} />
        )}

        {esewaStep === "success" && (
          <div className="esewa-success">
            <p className="esewa-success-icon">✓</p>
            <p>{t("booking.esewaSuccessMessage")}</p>
            <p className="esewa-amount-value">
              Rs. {selectedDoctorObj?.consultationFee ?? "-"}
            </p>
            <div className="modal-actions">
              <Button
                variant="primary"
                onClick={handleEsewaContinue}
                disabled={submitting}
              >
                {submitting
                  ? t("booking.submitting")
                  : t("booking.esewaContinueButton")}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookAppointment;
