import type { IProduct, IProductCreate } from "@/types/Product";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const getProducts = async () => {
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
    return {
      ok: response.ok,
      status: response.status,
      data: data,
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export const getProductById = async (id: number) => {
  try {
    const response = await fetch(`${BASE_URL}/product/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = (await response.json()) as IProduct;
    return {
      ok: response.ok,
      status: response.status,
      data: data,
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
};

export const createProduct = async (productData: IProductCreate) => {
  try {
    const accessToken = localStorage.getItem("accessToken");

    const response = await fetch(`${BASE_URL}/product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = (await response.json()) as IProduct;
    return {
      ok: response.ok,
      status: response.status,
      data: data,
    };
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
};

export const updateProduct = async (
  id: number,
  productData: Partial<IProductCreate>
) => {
  try {
    const accessToken = localStorage.getItem("accessToken");

    const response = await fetch(`${BASE_URL}/product/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = (await response.json()) as IProduct;
    return {
      ok: response.ok,
      status: response.status,
      data: data,
    };
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export const deleteProduct = async (id: number) => {
  try {
    const accessToken = localStorage.getItem("accessToken");

    const response = await fetch(`${BASE_URL}/product/${id}`, {
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
    console.error("Error deleting product:", error);
    throw error;
  }
};
