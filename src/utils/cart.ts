import type { ICartItem, IProduct } from "../types/products";

const CART_KEY = "cart";

const formateadorPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatearPrecio(valor: number): string {
  return formateadorPrecio.format(valor);
}

// Valida que lo leído de localStorage tenga la forma de un ICartItem,
// por si el valor guardado fue modificado o quedó corrupto.
function esCartItem(valor: unknown): valor is ICartItem {
  if (typeof valor !== "object" || valor === null) return false;
  const v = valor as Record<string, unknown>;
  return (
    typeof v.id === "number" &&
    typeof v.nombre === "string" &&
    typeof v.precio === "number" &&
    typeof v.imagen === "string" &&
    typeof v.stock === "number" &&
    typeof v.cantidad === "number" &&
    v.cantidad > 0
  );
}

export function getCartItems(): ICartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(esCartItem) : [];
  } catch {
    return [];
  }
}

function saveCart(items: ICartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

// Agrega un producto. Si ya estaba en el carrito, suma la cantidad
// en lugar de duplicar el ítem
export function addToCart(product: IProduct, cantidad: number = 1): boolean {
  const items = getCartItems();
  const existente = items.find((item) => item.id === product.id);
  const cantidadActual = existente ? existente.cantidad : 0;

  if (cantidadActual + cantidad > product.stock) return false;

  if (existente) {
    existente.cantidad += cantidad;
  } else {
    items.push({
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      imagen: product.imagen,
      stock: product.stock,
      cantidad,
    });
  }

  saveCart(items);
  return true;
}

// Fija la cantidad de un ítem. Con 0 o menos lo quita del carrito;
// nunca deja pasar el stock disponible.
export function updateQuantity(id: number, cantidad: number): ICartItem[] {
  const items = getCartItems();
  const item = items.find((i) => i.id === id);
  if (!item) return items;

  if (cantidad <= 0) return removeFromCart(id);

  item.cantidad = Math.min(cantidad, item.stock);
  saveCart(items);
  return items;
}

export function removeFromCart(id: number): ICartItem[] {
  const items = getCartItems().filter((item) => item.id !== id);
  saveCart(items);
  return items;
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
}

export function getSubtotal(item: ICartItem): number {
  return item.precio * item.cantidad;
}

// Total general: suma de los subtotales de cada producto.
export function getCartTotal(items: ICartItem[] = getCartItems()): number {
  return items.reduce((total, item) => total + getSubtotal(item), 0);
}

// Cantidad total de unidades (para el indicador de la barra superior).
export function getCartCount(items: ICartItem[] = getCartItems()): number {
  return items.reduce((total, item) => total + item.cantidad, 0);
}
