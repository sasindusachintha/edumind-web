import React, { useState } from "react";
import { sendOTP, verifyOTP } from "../phoneAuth";

const PhoneAuthExample = () => {
  const [phoneNumber, setPhoneNumber] = useState("+947");
  const [otpCode, setOtpCode] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleSendOTP = async () => {
    setError("");
    setStatus("Sending OTP...");

    const response = await sendOTP(phoneNumber);
    if (response.success) {
      setStatus(response.message);
      console.log("OTP request result:", response);
    } else {
      setStatus("");
      setError(response.message);
    }
  };

  const handleVerifyOTP = async () => {
    setError("");
    setStatus("Verifying OTP...");

    const response = await verifyOTP(otpCode);
    if (response.success) {
      setStatus(response.message);
      console.log("Authenticated user:", response.user);
    } else {
      setStatus("");
      setError(response.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded-xl shadow-sm bg-white">
      <h2 className="text-2xl font-semibold mb-4">Firebase Phone Authentication</h2>

      <label className="block mb-2 font-medium" htmlFor="phoneNumber">
        Mobile number (international format)
      </label>
      <input
        id="phoneNumber"
        type="tel"
        value={phoneNumber}
        onChange={(event) => setPhoneNumber(event.target.value)}
        placeholder="+947XXXXXXXX"
        className="w-full p-3 border rounded-md mb-3"
      />

      <button
        type="button"
        onClick={handleSendOTP}
        className="w-full py-3 mb-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Send OTP
      </button>

      <div id="recaptcha-container" className="mb-4"></div>

      <label className="block mb-2 font-medium" htmlFor="otpCode">
        Verification code
      </label>
      <input
        id="otpCode"
        type="text"
        value={otpCode}
        onChange={(event) => setOtpCode(event.target.value)}
        placeholder="Enter OTP"
        className="w-full p-3 border rounded-md mb-3"
      />

      <button
        type="button"
        onClick={handleVerifyOTP}
        className="w-full py-3 mb-4 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        Verify OTP
      </button>

      {status && <p className="text-sm text-gray-700">{status}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default PhoneAuthExample;
