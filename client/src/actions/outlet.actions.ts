import type { IOutlet } from "../types/Outlet";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function getOutlets() {
  try {
    const response = await fetch(`${BASE_URL}/outlet`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = (await response.json()) as IOutlet[];
    return {
      ok: response.ok,
      status: response.status,
      data: data,
    };
  } catch (error) {
    console.error("Error fetching outlets:", error);
    throw error;
  }
}

export const getOutletById = async (id: number) => {
  try {
    const response = await fetch(`${BASE_URL}/outlet/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = (await response.json()) as IOutlet;
    return {
      ok: response.ok,
      status: response.status,
      data: data,
    };
  } catch (error) {
    console.error("Error fetching outlet:", error);
    throw error;
  }
};

export const createOutlet = async (outletData: Omit<IOutlet, "id">) => {
  try {
    const accessToken = localStorage.getItem("accessToken");

    const response = await fetch(`${BASE_URL}/outlet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(outletData),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = (await response.json()) as IOutlet;
    return {
      ok: response.ok,
      status: response.status,
      data: data,
    };
  } catch (error) {
    console.error("Error creating outlet:", error);
    throw error;
  }
};

export const updateOutlet = async (
  id: number,
  outletData: Partial<Omit<IOutlet, "id">>
) => {
  try {
    const accessToken = localStorage.getItem("accessToken");

    const response = await fetch(`${BASE_URL}/outlet/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(outletData),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = (await response.json()) as IOutlet;
    return {
      ok: response.ok,
      status: response.status,
      data: data,
    };
  } catch (error) {
    console.error("Error updating outlet:", error);
    throw error;
  }
};

export const deleteOutlet = async (id: number) => {
  try {
    const accessToken = localStorage.getItem("accessToken");

    const response = await fetch(`${BASE_URL}/outlet/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    return {
      ok: response.ok,
      status: response.status,
    };
  } catch (error) {
    console.error("Error deleting outlet:", error);
    throw error;
  }
};
