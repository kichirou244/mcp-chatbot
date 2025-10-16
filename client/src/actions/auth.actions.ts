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

    return {
      ok: response.ok,
      status: response.status,
      ...data,
    };
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

    return {
      ok: response.ok,
      status: response.status,
      ...data,
    };
  } catch (error) {
    console.error("Registration error:", error);
  }
};

export const getMe = async () => {
  try {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) return null;

    const response = await fetch(`${BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      return {
        ok: response.ok,
        status: response.status,
        ...data,
      };
    }
  } catch (error) {
    console.error("Get me error:", error);
  }
};

export const logout = () => {
  localStorage.removeItem("accessToken");
};
