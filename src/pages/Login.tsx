import React from "react";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center min-h-screen bg-emerald-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-emerald-900 mb-8">Login</h2>
        <div className="space-y-4">
          <input 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="User ID" 
          />
          <input 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            type="password" 
            placeholder="Password" 
          />
          <button 
            className="w-full py-3 mt-4 text-white font-bold bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
            onClick={() => navigate("/dashboard")}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
export{};