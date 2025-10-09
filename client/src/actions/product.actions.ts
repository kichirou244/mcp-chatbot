import type { IProduct } from "../types/Product";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function getProducts() {
  try {
    const response = await fetch(`${BASE_URL}/product`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = (await response.json()) as IProduct[];
    return data;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}
