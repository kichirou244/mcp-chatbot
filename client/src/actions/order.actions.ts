import type { IOrder, IOrderCreate, IOrderUpdate, ITopProduct, ITopUser } from "../types/Order";
import type { IResponse } from "../types/Global";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function getOrders(): Promise<IResponse<IOrder[]>> {
  try {
    const response = await fetch(`${BASE_URL}/order`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return { ok: false, data: [] };
  }
}

export async function getOrderById(id: number): Promise<IResponse<IOrder>> {
  try {
    const response = await fetch(`${BASE_URL}/order/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.error("Error fetching order:", error);
    return { ok: false, data: null as any };
  }
}

export async function createOrder(
  order: IOrderCreate
): Promise<IResponse<IOrder>> {
  try {
    const response = await fetch(`${BASE_URL}/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.error("Error creating order:", error);
    return { ok: false, data: null as any };
  }
}

export async function updateOrder(
  id: number,
  order: IOrderUpdate
): Promise<IResponse<IOrder>> {
  try {
    const response = await fetch(`${BASE_URL}/order/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.error("Error updating order:", error);
    return { ok: false, data: null as any };
  }
}

export async function deleteOrder(id: number): Promise<IResponse<void>> {
  try {
    const response = await fetch(`${BASE_URL}/order/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    return { ok: true, data: undefined };
  } catch (error) {
    console.error("Error deleting order:", error);
    return { ok: false, data: undefined };
  }
}

export async function getTopProducts(
  limit: number = 5
): Promise<IResponse<ITopProduct[]>> {
  try {
    const response = await fetch(
      `${BASE_URL}/order/top-products?limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();

    return { ok: true, data };
  } catch (error) {
    console.error("Error fetching top products:", error);
    return { ok: false, data: [] };
  }
}

export async function getTopUsers(
  limit: number = 5
): Promise<IResponse<ITopUser[]>> {
  try {
    const response = await fetch(`${BASE_URL}/order/top-users?limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();

    return { ok: true, data };
  } catch (error) {
    console.error("Error fetching top users:", error);
    return { ok: false, data: [] };
  }
}

export async function getOrdersByProduct(
  productId: number
): Promise<IResponse<IOrder[]>> {
  try {
    const response = await fetch(
      `${BASE_URL}/order/by-product/${productId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.error("Error fetching orders by product:", error);
    return { ok: false, data: [] };
  }
}

export async function getOrdersByUser(
  userId: number
): Promise<IResponse<IOrder[]>> {
  try {
    const response = await fetch(`${BASE_URL}/order/by-user/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.error("Error fetching orders by user:", error);
    return { ok: false, data: [] };
  }
}
