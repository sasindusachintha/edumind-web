import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "./firebase";

let confirmationResult = null;
const PHONE_REGEX = /^\+947\d{8}$/;

const getRecaptchaVerifier = async () => {
  if (typeof window === "undefined") {
    throw new Error("Firebase phone auth requires a browser environment.");
  }

  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      "recaptcha-container",
      {
        size: "normal",
        badge: "inline",
        callback: (token) => {
          console.log("reCAPTCHA solved", token);
        },
        "expired-callback": () => {
          console.warn("reCAPTCHA expired. Please solve it again.");
        }
      },
      auth
    );

    try {
      const widgetId = await window.recaptchaVerifier.render();
      console.log("Firebase reCAPTCHA rendered, widgetId:", widgetId);
    } catch (error) {
      console.error("Failed to render reCAPTCHA:", error);
      throw error;
    }
  }

  return window.recaptchaVerifier;
};

// Explicit helper to setup recaptcha (callable from UI)
export const setupRecaptcha = async () => {
  try {
    const verifier = await getRecaptchaVerifier();
    console.log("setupRecaptcha: window.recaptchaVerifier ->", window.recaptchaVerifier);
    return verifier;
  } catch (err) {
    console.error("setupRecaptcha failed:", err);
    throw err;
  }
};

export const sendOTP = async (phoneNumber) => {
  try {
    if (!phoneNumber) {
      throw new Error("Phone number is required.");
    }

    const formattedNumber = phoneNumber.trim();
    if (!PHONE_REGEX.test(formattedNumber)) {
      throw new Error(
        "Invalid phone number. Use international format: +947XXXXXXXX."
      );
    }

    // Ensure recaptcha is initialized and rendered before sending OTP
    await setupRecaptcha();
    console.log("recaptchaVerifier:", window.recaptchaVerifier);
    if (!window.recaptchaVerifier) throw new Error("reCAPTCHA not initialized");

    console.log("Sending OTP to", formattedNumber);
    try {
      confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, window.recaptchaVerifier);
      window.firebaseConfirmationResult = confirmationResult;
      console.log("OTP sent successfully. confirmationResult stored globally.");
    } catch (error) {
      console.error("FULL OTP ERROR:", error);
      throw error;
    }
    return {
      success: true,
      message: "OTP sent successfully. Check your phone for the verification code."
    };
  } catch (error) {
    console.error("sendOTP error:", error);
    return {
      success: false,
      message: error?.message || "Failed to send OTP.",
      code: error?.code || null
    };
  }
};

export const verifyOTP = async (code) => {
  try {
    if (!code || typeof code !== "string") {
      throw new Error("OTP code is required.");
    }

    const resolver = window.firebaseConfirmationResult || confirmationResult;
    if (!resolver) {
      throw new Error("No OTP session found. Please request a new code.");
    }

    const result = await resolver.confirm(code.trim());
    console.log("OTP verified successfully:", result.user);

    return {
      success: true,
      user: result.user,
      message: "Phone authentication completed successfully."
    };
  } catch (error) {
    console.error("verifyOTP error:", error);
    return {
      success: false,
      message: error?.message || "OTP verification failed.",
      code: error?.code || null
    };
  }
};

export { confirmationResult };
