import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type AppointmentState = {
  appointment?: {
    id: string;
    scheduledAt: string;
    doctor?: { name: string; specialty: string };
    user?: { name: string };
  };
};

const Appointment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment } = (location.state as AppointmentState) || {};

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/dashboard");
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const when = appointment?.scheduledAt
    ? new Date(appointment.scheduledAt).toLocaleString()
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-100 to-lime-100 p-6">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-emerald-200">
        <div className="mx-auto mb-5 flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-400">
          <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2.5}>
            <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2.5" fill="#fff" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12l2.5 2.5L16 9" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-emerald-900 mb-2">Appointment Confirmed</h2>
        <p className="text-emerald-700 font-semibold mb-4">Thank you!</p>
        {appointment ? (
          <div className="text-left text-sm text-gray-700 space-y-1 mb-4 bg-emerald-50 rounded-xl p-4">
            {appointment.user?.name && <p><span className="font-semibold">Patient:</span> {appointment.user.name}</p>}
            {appointment.doctor && (
              <p>
                <span className="font-semibold">Doctor:</span>{" "}
                {appointment.doctor.name} – {appointment.doctor.specialty}
              </p>
            )}
            {when && <p><span className="font-semibold">When:</span> {when}</p>}
            <p><span className="font-semibold">ID:</span> {appointment.id}</p>
          </div>
        ) : (
          <p className="text-gray-600 mb-4">Your appointment has been recorded.</p>
        )}
        <p className="text-gray-500 text-sm">Returning to dashboard in 5 seconds…</p>
      </div>
    </div>
  );
};

export default Appointment;
