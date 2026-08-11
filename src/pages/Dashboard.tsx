import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-emerald-50">
      <div className="w-full max-w-lg p-10 bg-white rounded-3xl shadow-xl text-center">
        <h2 className="text-4xl font-extrabold text-emerald-900 mb-6">Dashboard</h2>
        <p className="text-gray-600 mb-8">
          Welcome back. Book with the form flow or talk to the voice agent.
        </p>
        <div className="flex flex-col gap-4">
          <button
            className="px-8 py-4 text-lg font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 hover:scale-105 transition-all shadow-md"
            onClick={() => navigate("/patient-info")}
          >
            Patient intake form
          </button>
          <button
            className="px-8 py-4 text-lg font-bold text-emerald-800 bg-lime-100 rounded-xl hover:bg-lime-200 hover:scale-105 transition-all shadow-md border border-lime-300"
            onClick={() => navigate("/voice-agent")}
          >
            Voice booking agent
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
