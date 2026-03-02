import { api } from "./client";

export async function addToCart(payload) {
  const { data } = await api.post("/add", payload);
  return data;
}

export async function getCart() {
  const { data } = await api.get("/");
  return data;
}

export async function updateCartItem(itemId, quantity) {
  const { data } = await api.put("/update", { itemId, quantity });
  return data;
}

export async function removeCartItem(itemId) {
  const { data } = await api.delete(`/remove/${itemId}`);
  return data;
}

export async function clearCart() {
  const { data } = await api.delete("/clear");
  return data;
}

export async function getCheckoutProfile() {
  const { data } = await api.get("/me");
  return data;
}

export async function updateCheckoutProfile(payload) {
  const { data } = await api.put("/me", payload);
  return data;
}

export async function createOrder(payload) {
  const { data } = await api.post("/api/orders", payload);
  return data;
}

export async function getDeliverySettings() {
  const { data } = await api.get("/api/delivery-settings");
  return data;
}
