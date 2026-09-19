import { PRODUCTS, getCategories } from "../../../data/data";
import type { ICategoria } from "../../../types/category";
import type { IProduct } from "../../../types/products";
import { addToCart, formatearPrecio, getCartCount } from "../../../utils/cart";

// buscador de imagenes
const imagenes = import.meta.glob<string>(
  "/src/**/*.{jpg,jpeg,png,webp,avif,svg}",
  { eager: true, query: "?url", import: "default" },
);

function resolverImagen(nombre: string): string | null {
  const ruta = Object.keys(imagenes).find((r) => r.endsWith("/" + nombre));
  return ruta ? imagenes[ruta] : null;
}

//Utilidades 

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

// Minúsculas y sin tildes.
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Estado y elementos

const productos: IProduct[] = PRODUCTS.filter((p) => !p.eliminado);
const categorias: ICategoria[] = getCategories();

let textoBusqueda = "";
let categoriaActiva: number | null = null;

const inputBusqueda = obtener<HTMLInputElement>("#busqueda");
const listaCategorias = obtener<HTMLUListElement>("#categorias");
const gridProductos = obtener<HTMLElement>("#productos");
const mensajeVacio = obtener<HTMLParagraphElement>("#sinResultados");
const resumen = obtener<HTMLParagraphElement>("#resumen");
const contadorCarrito = obtener<HTMLSpanElement>("#cartCount");
const toast = obtener<HTMLDivElement>("#toast");

// Filtrado

function filtrarProductos(): IProduct[] {
  const texto = normalizar(textoBusqueda.trim());

  return productos.filter((producto) => {
    const coincideNombre = normalizar(producto.nombre).includes(texto);
    const coincideCategoria =
      categoriaActiva === null ||
      producto.categorias.some((c) => c.id === categoriaActiva);
    return coincideNombre && coincideCategoria;
  });
}

// ---------- Render ----------

function renderCategorias(): void {
  const boton = (id: number | null, nombre: string): string => {
    const activa = categoriaActiva === id;
    return `
      <li>
        <button type="button" class="cat-btn" data-id="${id ?? ""}" aria-pressed="${activa}">
          ${escapar(nombre)}
        </button>
      </li>`;
  };

  listaCategorias.innerHTML =
    boton(null, "Todas") + categorias.map((c) => boton(c.id, c.nombre)).join("");
}

function crearTarjeta(producto: IProduct): string {
  const url = resolverImagen(producto.imagen);
  const media = url
    ? `<img src="${url}" alt="${escapar(producto.nombre)}" loading="lazy" />`
    : `<span class="ph" aria-hidden="true">${escapar(producto.nombre.charAt(0))}</span>`;
  const hayStock = producto.disponible && producto.stock > 0;
  const nombresCategorias = producto.categorias.map((c) => c.nombre).join(", ");

  return `
    <article class="card">
      <div class="card-media">${media}</div>
      <div class="card-body">
        <p class="card-cat">${escapar(nombresCategorias)}</p>
        <h3>${escapar(producto.nombre)}</h3>
        <p class="card-desc">${escapar(producto.descripcion)}</p>
        <div class="card-foot">
          <strong class="price">${formatearPrecio(producto.precio)}</strong>
          <button type="button" class="btn" data-id="${producto.id}" ${hayStock ? "" : "disabled"}>
            ${hayStock ? "Agregar" : "Sin stock"}
          </button>
        </div>
      </div>
    </article>`;
}

function textoSinResultados(): string {
  const busqueda = textoBusqueda.trim();
  const categoria = categorias.find((c) => c.id === categoriaActiva);

  if (busqueda && categoria) {
    return `No hay productos que coincidan con “${escapar(busqueda)}” en ${escapar(categoria.nombre)}.`;
  }
  if (busqueda) {
    return `No hay productos que coincidan con “${escapar(busqueda)}”.`;
  }
  return "No hay productos en esta categoría.";
}

function renderProductos(): void {
  const lista = filtrarProductos();

  gridProductos.innerHTML = lista.map(crearTarjeta).join("");
  gridProductos.hidden = lista.length === 0;

  mensajeVacio.hidden = lista.length > 0;
  if (lista.length === 0) {
    mensajeVacio.innerHTML = `<strong>Sin resultados</strong>${textoSinResultados()} Probá con otro nombre o elegí <a href="#" id="verTodo">todo el catálogo</a>.`;
  }

  resumen.textContent = `${lista.length} ${lista.length === 1 ? "producto" : "productos"}`;
}

function actualizarContador(): void {
  contadorCarrito.textContent = String(getCartCount());
}

// ---------- Indicador visual al agregar ----------

let temporizadorToast: number | undefined;

function mostrarToast(mensaje: string, esAviso: boolean = false): void {
  toast.textContent = mensaje;
  toast.classList.toggle("aviso", esAviso);
  toast.classList.add("visible");
  window.clearTimeout(temporizadorToast);
  temporizadorToast = window.setTimeout(() => toast.classList.remove("visible"), 2200);
}

function agregarProducto(id: number, boton: HTMLButtonElement): void {
  const producto = productos.find((p) => p.id === id);
  if (!producto) return;

  if (!addToCart(producto)) {
    mostrarToast(`Ya tenés todo el stock disponible de ${producto.nombre}`, true);
    return;
  }

  actualizarContador();
  mostrarToast(`${producto.nombre} se agregó al carrito`);

  boton.textContent = "Agregado";
  boton.classList.add("added");
  window.setTimeout(() => {
    boton.textContent = "Agregar";
    boton.classList.remove("added");
  }, 1200);
}

// ---------- Eventos ----------

inputBusqueda.addEventListener("input", () => {
  textoBusqueda = inputBusqueda.value;
  renderProductos();
});

listaCategorias.addEventListener("click", (evento) => {
  const boton = (evento.target as HTMLElement).closest<HTMLButtonElement>("button[data-id]");
  if (!boton) return;

  categoriaActiva = boton.dataset.id ? Number(boton.dataset.id) : null;
  renderCategorias();
  renderProductos();
});

gridProductos.addEventListener("click", (evento) => {
  const boton = (evento.target as HTMLElement).closest<HTMLButtonElement>("button[data-id]");
  if (!boton || boton.disabled) return;
  agregarProducto(Number(boton.dataset.id), boton);
});

mensajeVacio.addEventListener("click", (evento) => {
  if ((evento.target as HTMLElement).id !== "verTodo") return;
  evento.preventDefault();
  textoBusqueda = "";
  categoriaActiva = null;
  inputBusqueda.value = "";
  renderCategorias();
  renderProductos();
});

// ---------- Inicio ----------

renderCategorias();
renderProductos();
actualizarContador();



// import { checkAuhtUser, logout } from "../../../utils/auth";

// const buttonLogout = document.getElementById(
//   "logoutButton"
// ) as HTMLButtonElement;
// buttonLogout?.addEventListener("click", () => {
//   logout();
// });


// const initPage = () => {
//   console.log("inicio de pagina");
//   checkAuhtUser(
//     "/src/pages/auth/login/login.html",
//     "/src/pages/admin/home/home.html",
//     "client"
//   );
// };
// initPage();
