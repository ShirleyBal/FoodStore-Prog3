import type { ICartItem } from "../../../types/products";
import {
  clearCart,
  formatearPrecio,
  getCartCount,
  getCartItems,
  getCartTotal,
  getSubtotal,
  removeFromCart,
  updateQuantity,
} from "../../../utils/cart";

function obtener<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`No se encontró el elemento ${selector}`);
  return el;
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const mensajeVacio = obtener<HTMLParagraphElement>("#carritoVacio");
const contenido = obtener<HTMLElement>("#carritoContenido");
const lista = obtener<HTMLUListElement>("#carritoLista");
const totalEl = obtener<HTMLElement>("#total");
const contadorCarrito = obtener<HTMLSpanElement>("#cartCount");
const botonVaciar = obtener<HTMLButtonElement>("#vaciar");

function crearFila(item: ICartItem): string {
  return `
    <li class="line">
      <div>
        <p class="line-name">${escapar(item.nombre)}</p>
        <p class="line-unit">${formatearPrecio(item.precio)} c/u</p>
      </div>
      <div class="qty" role="group" aria-label="Cantidad de ${escapar(item.nombre)}">
        <button type="button" data-action="restar" data-id="${item.id}" aria-label="Quitar una unidad">−</button>
        <output>${item.cantidad}</output>
        <button type="button" data-action="sumar" data-id="${item.id}" aria-label="Agregar una unidad" ${item.cantidad >= item.stock ? "disabled" : ""}>+</button>
      </div>
      <p class="line-subtotal">${formatearPrecio(getSubtotal(item))}</p>
      <button type="button" class="link-danger" data-action="quitar" data-id="${item.id}">Quitar</button>
    </li>`;
}

function render(): void {
  const items = getCartItems();

  mensajeVacio.hidden = items.length > 0;
  contenido.hidden = items.length === 0;

  lista.innerHTML = items.map(crearFila).join("");
  totalEl.textContent = formatearPrecio(getCartTotal(items));
  contadorCarrito.textContent = String(getCartCount(items));
}

lista.addEventListener("click", (evento) => {
  const boton = (evento.target as HTMLElement).closest<HTMLButtonElement>("button[data-action]");
  if (!boton || boton.disabled) return;

  const id = Number(boton.dataset.id);
  const item = getCartItems().find((i) => i.id === id);
  if (!item) return;

  switch (boton.dataset.action) {
    case "sumar":
      updateQuantity(id, item.cantidad + 1);
      break;
    case "restar":
      updateQuantity(id, item.cantidad - 1);
      break;
    case "quitar":
      removeFromCart(id);
      break;
  }
  render();
});

botonVaciar.addEventListener("click", () => {
  if (window.confirm("¿Querés vaciar el carrito?")) {
    clearCart();
    render();
  }
});

const botonPagar = document.querySelector<HTMLButtonElement>("#pagar");

botonPagar?.addEventListener("click", () => {
  // No realizado ya que no se solicita en el parcial
});

render();
