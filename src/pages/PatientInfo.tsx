import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }
}

type Form = {
  name: string;
  age: string;
  gender: string;
  contactNumber: string;
  symptoms: string;
  medication: string;
};

const allowedGenders = ["male", "female", "others"];

const PatientInfo: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Form>({
    name: "",
    age: "",
    gender: "",
    contactNumber: "",
    symptoms: "",
    medication: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [isConfirming, setIsConfirming] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const startListening = (field: keyof Form) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("SpeechRecognition not supported.");

    const recog = new SR();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    recog.onresult = (ev: SpeechRecognitionEvent) => {
      let transcript = ev.results[0][0].transcript.trim().replace(/\.+$/, "");
      if (field === "gender") {
        if (/mail/i.test(transcript)) transcript = "Male";
        else if (/femail|femal/i.test(transcript)) transcript = "Female";
        else if (/other/i.test(transcript)) transcript = "Others";
      }
      if (field === "age" || field === "contactNumber") {
        transcript = transcript.replace(/\D/g, "");
      }

      setFormData((prev) => ({
        ...prev,
        [field]: transcript.charAt(0).toUpperCase() + transcript.slice(1),
      }));
    };

    recog.onerror = () => recog.stop();
    recog.start();
  };

  const validateForm = (): Partial<Record<keyof Form, string>> => {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!formData.name.trim()) e.name = "Name is required.";
    const ageNum = Number(formData.age);
    if (!formData.age.trim()) e.age = "Age is required.";
    else if (isNaN(ageNum) || ageNum <= 0) e.age = "Age must be > 0.";
    if (!allowedGenders.includes(formData.gender.toLowerCase()))
      e.gender = "Gender must be Male, Female, or Others.";
    if (!/^\d{9,10}$/.test(formData.contactNumber.trim()))
      e.contactNumber = "Contact number must be 9 or 10 digits.";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) {
      setErrors(errs);
      setIsConfirming(false);
      return;
    }
    setErrors({});
    setIsConfirming(true);
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length) {
      setErrors(errs);
      setIsConfirming(false);
      return;
    }
    try {
      const result = await apiFetch<{
        success: boolean;
        user: { id: string };
      }>("/api/users", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      sessionStorage.setItem("patientUserId", result.user.id);
      sessionStorage.setItem("patientName", formData.name);
      alert("Patient info submitted!");
      setFormData({
        name: "",
        age: "",
        gender: "",
        contactNumber: "",
        symptoms: "",
        medication: "",
      });
      navigate("/doctor");
    } catch (error) {
      alert("Failed to submit patient info.");
    }
    setIsConfirming(false);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-lime-100 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
      <div className="relative w-[92%] sm:w-4/5 max-w-2xl p-[2px] rounded-[2.2rem] bg-gradient-to-r from-emerald-400/60 via-lime-400/40 to-green-400/60 shadow-xl">
        <div className="rounded-[2rem] bg-white/70 backdrop-blur-xl p-10">
          <h1 className="text-center text-emerald-900 font-extrabold tracking-tight mb-10 text-4xl sm:text-5xl md:text-6xl">
            CLINI-CALL
          </h1>

          {isConfirming && (
            <div className="mb-6 flex items-center justify-center gap-2 text-emerald-700 font-medium">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4"
                />
              </svg>
              Please confirm the details below
            </div>
          )}

          <form onSubmit={isConfirming ? handleConfirm : handleSubmit}>
            {(Object.keys(formData) as Array<keyof Form>).map((field) => (
              <div key={field} className="mb-6">
                <div
                  className={`flex items-center rounded-xl overflow-hidden ring-1 
                    ${
                      errors[field]
                        ? "ring-red-400"
                        : "ring-gray-300 hover:ring-emerald-400"
                    } transition`}
                >
                  {field === "gender" ? (
                    <select
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                      disabled={isConfirming}
                      className="flex-1 h-12 px-5 text-sm sm:text-base bg-white/60 focus:outline-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Others">Others</option>
                    </select>
                  ) : (
                    <input
                      type={field === "age" || field === "contactNumber" ? "number" : "text"}
                      name={field}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      value={formData[field]}
                      onChange={handleChange}
                      disabled={isConfirming}
                      className="flex-1 h-12 px-5 text-sm sm:text-base bg-white/60 placeholder-gray-400 focus:outline-none"
                    />
                  )}
                  {field === "age" && <span className="text-xs text-gray-500 pr-3">Years</span>}
                  <button
                    type="button"
                    onClick={() => startListening(field)}
                    disabled={isConfirming}
                    aria-label={`Listen for ${field}`}
                    className="group w-12 h-12 bg-emerald-50 flex items-center justify-center ring-l-1 ring-gray-300 hover:bg-emerald-100 transition flex-shrink-0"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 256 256"
                      className="fill-emerald-700 group-hover:scale-105 transition-transform"
                    >
                      <path d="M128,176a48.05,48.05,0,0,0,48-48V64a48,48,0,0,0-96,0v64A48.05,48.05,0,0,0,128,176ZM96,64a32,32,0,0,1,64,0v64a32,32,0,0,1-64,0Zm40,143.6V232a8,8,0,0,1-16,0V207.6A80.11,80.11,0,0,1,48,128a8,8,0,0,1,16,0,64,64,0,0,0,128,0,8,8,0,0,1,16,0A80.11,80.11,0,0,1,136,207.6Z" />
                    </svg>
                  </button>
                </div>
                {errors[field] && (
                  <p className="mt-2 text-xs text-red-500">{errors[field]}</p>
                )}
              </div>
            ))}

            <button className="w-full h-12 mt-4 relative overflow-hidden rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 transition-transform hover:-translate-y-0.5 active:translate-y-0">
              {isConfirming ? "CONFIRM" : "SUBMIT"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientInfo;

export{}