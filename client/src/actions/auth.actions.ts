import type {
  IAuthResponse,
  ILoginRequest,
  IRegisterRequest,
} from "../types/Auth";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const login = async (formData: ILoginRequest) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      const result = data.data as IAuthResponse;
      if (result) {
        localStorage.setItem("accessToken", result.accessToken);
      }
    }

    return data;
  } catch (error) {
    console.error("Login error:", error);
  }
};

export const register = async (formData: IRegisterRequest) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    return data as IAuthResponse;
  } catch (error) {
    console.error("Registration error:", error);
  }
};
