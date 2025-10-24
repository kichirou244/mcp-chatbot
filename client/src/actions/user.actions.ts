import type { IResponse } from "@/types/Global";
import type { IUserResponse } from "@/types/User";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const getUsers = async (): Promise<IResponse<IUserResponse[]>> => {
  try {
    const response = await fetch(`${BASE_URL}/user`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return {
      ok: response.ok,
      data: data,
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { ok: false, data: [] };
  }
};

export const getUserById = async (
  id: number
): Promise<IResponse<IUserResponse>> => {
  try {
    const response = await fetch(`${BASE_URL}/user/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return {
      ok: response.ok,
      data: data,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { ok: false, data: null as any };
  }
};
