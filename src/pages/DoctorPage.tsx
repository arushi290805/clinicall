import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

type Doctor = {
  id: string;
  name: string;
  specialty: string;
};

const DoctorPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const minDateTime = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await apiFetch<{ success: boolean; data: Doctor[] }>(
          "/api/doctors"
        );
        setDoctors(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load doctors");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleConfirm = async () => {
    setError("");
    const userId = sessionStorage.getItem("patientUserId");
    if (!userId) {
      setError("No patient on file. Please submit patient info first.");
      return;
    }
    if (!selectedDoctorId) {
      setError("Please select a doctor.");
      return;
    }
    if (!scheduledAt) {
      setError("Please choose a date and time.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiFetch<{ success: boolean; data: unknown }>(
        "/api/appointments",
        {
          method: "POST",
          body: JSON.stringify({
            userId,
            doctorId: selectedDoctorId,
            scheduledAt: new Date(scheduledAt).toISOString(),
            notes: "",
          }),
        }
      );
      navigate("/appointment", { state: { appointment: result.data } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-lime-100 p-6">
      <div className="w-full max-w-lg bg-white/80 backdrop-blur rounded-3xl shadow-xl p-8">
        <h2 className="text-3xl font-extrabold text-emerald-900 mb-2">Select a Doctor</h2>
        <p className="text-gray-600 mb-6">Choose a specialist and appointment time.</p>

        {loading && <p className="text-emerald-700">Loading doctors…</p>}
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="space-y-3 mb-6">
          {doctors.map((doc) => (
            <label
              key={doc.id}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                selectedDoctorId === doc.id
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 hover:border-emerald-300"
              }`}
            >
              <input
                type="radio"
                name="doctor"
                value={doc.id}
                checked={selectedDoctorId === doc.id}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
              />
              <span className="font-medium text-emerald-900">
                {doc.name} – {doc.specialty}
              </span>
            </label>
          ))}
        </div>

        <label className="block mb-6">
          <span className="block text-sm font-medium text-emerald-900 mb-2">
            Appointment date & time
          </span>
          <input
            type="datetime-local"
            min={minDateTime}
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            aria-label="Appointment date and time"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </label>

        <button
          onClick={handleConfirm}
          disabled={submitting || loading}
          className="w-full px-4 py-3 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 disabled:opacity-60 transition"
        >
          {submitting ? "Booking…" : "Confirm appointment"}
        </button>
      </div>
    </div>
  );
};

export default DoctorPage;
