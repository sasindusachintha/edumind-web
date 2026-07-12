import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgdey5bi_TFPwxzG3eM0xkwdHAvBMWyAM",
  authDomain: "edumind-1276b.firebaseapp.com",
  projectId: "edumind-1276b",
  storageBucket: "edumind-1276b.firebasestorage.app",
  messagingSenderId: "607523299064",
  appId: "1:607523299064:web:094c9422dc86e365e5a50d"
};

// Initialize Firebase app and auth correctly
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Global references for the verifier and confirmation result
window.recaptchaVerifier = null;
window.confirmationResult = null;

const PHONE_PATTERN = /^\+947\d{8}$/;
const phoneInput = document.getElementById("phoneNumber");
const otpInput = document.getElementById("otpCode");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const messageEl = document.getElementById("message");

const setMessage = (text, type = "info") => {
  messageEl.textContent = text;
  messageEl.className = "message";
  if (type === "error") {
    messageEl.classList.add("error");
  } else if (type === "success") {
    messageEl.classList.add("success");
  }
};

const setButtonState = (button, isLoading) => {
  button.disabled = isLoading;
  button.textContent = isLoading ? "Please wait..." : button.dataset.originalText;
};

const resetRecaptcha = () => {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
      console.log("Firebase reCAPTCHA instance cleared.");
    } catch (error) {
      console.warn("Could not clear existing reCAPTCHA instance.", error);
    }
    window.recaptchaVerifier = null;
  }
  const container = document.getElementById("recaptcha-container");
  if (container) {
    container.innerHTML = "";
  }
};

const ensureRecaptcha = async () => {

  if (window.recaptchaVerifier) {
    return window.recaptchaVerifier;
  }

  window.recaptchaVerifier = new RecaptchaVerifier(
    auth,
    "recaptcha-container",
    {
      size: "normal",

      callback: () => {
        console.log("✅ reCAPTCHA solved");
        setMessage("reCAPTCHA solved.", "success");
      },

      "expired-callback": () => {
        console.log("⚠️ reCAPTCHA expired");
        setMessage("reCAPTCHA expired. Try again.", "error");
      }
    }
  );


  try {

    const widgetId = await window.recaptchaVerifier.render();

    console.log(
      "✅ reCAPTCHA rendered:",
      widgetId
    );

  } catch(error){

    console.error(
      "❌ reCAPTCHA render failed:",
      error
    );

    throw error;
  }


  return window.recaptchaVerifier;
};

const validatePhoneNumber = (value) => {
  const phone = value.trim();
  if (!PHONE_PATTERN.test(phone)) {
    throw new Error("Invalid phone number. Use Sri Lanka E.164 format: +947XXXXXXXX.");
  }
  return phone;
};

const sendOTP = async () => {
  try {
    setMessage("Preparing OTP send request...");
    setButtonState(sendOtpBtn, true);

    const phoneNumber = validatePhoneNumber(phoneInput.value);
    const appVerifier = await ensureRecaptcha();

    console.log("Calling signInWithPhoneNumber with:", phoneNumber);
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);

    window.confirmationResult = confirmationResult;
    console.log("OTP sent. confirmationResult stored globally.", confirmationResult);

    setMessage("OTP sent successfully. Enter the 6-digit code you received.", "success");
  } catch (error) {
    console.error("sendOTP failed:", error);
    if (error?.code === "auth/invalid-phone-number") {
      setMessage("Firebase rejected the phone number. Use format +947XXXXXXXX.", "error");
    } else if (error?.code === "auth/too-many-requests") {
      setMessage("Too many requests. Wait a minute and try again.", "error");
    } else {
      setMessage(error.message || "Unable to send OTP. Check console for details.", "error");
    }
    resetRecaptcha();
  } finally {
    setButtonState(sendOtpBtn, false);
  }
};

const verifyOTP = async () => {
  try {
    setMessage("Verifying OTP...");
    setButtonState(verifyOtpBtn, true);

    const code = otpInput.value.trim();
    if (!/^[0-9]{6}$/.test(code)) {
      throw new Error("OTP must be a 6-digit numeric code.");
    }

    if (!window.confirmationResult) {
      throw new Error("No OTP session available. Please send OTP first.");
    }

    const result = await window.confirmationResult.confirm(code);
    console.log("OTP verified successfully. Firebase user:", result.user);

    setMessage(`Authentication succeeded for ${result.user.phoneNumber}.`, "success");
  } catch (error) {
    console.error("verifyOTP failed:", error);
    if (error?.code === "auth/invalid-verification-code") {
      setMessage("Invalid OTP code. Please try again.", "error");
    } else if (error?.code === "auth/missing-verification-code") {
      setMessage("Please enter the 6-digit OTP code.", "error");
    } else {
      setMessage(error.message || "OTP verification failed. Check console for details.", "error");
    }
  } finally {
    setButtonState(verifyOtpBtn, false);
  }
};

const init = async () => {
  if (window.location.protocol === "file:") {
    setMessage("Firebase Phone Auth requires localhost or HTTPS. Do not open this file directly.", "error");
    console.error("Invalid protocol. Use http://localhost or https://.");
    return;
  }

  sendOtpBtn.dataset.originalText = sendOtpBtn.textContent;
  verifyOtpBtn.dataset.originalText = verifyOtpBtn.textContent;

  sendOtpBtn.addEventListener("click", sendOTP);
  verifyOtpBtn.addEventListener("click", verifyOTP);

  try {
    await ensureRecaptcha();
  } catch (error) {
    console.error("Initial reCAPTCHA setup failed.", error);
  }
};

window.addEventListener("DOMContentLoaded", init);
