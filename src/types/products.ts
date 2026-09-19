import type { ICategoria } from "./category";

export interface IProduct {
  id: number;
  eliminado: boolean;
  createdAt: string;
  nombre: string;
  precio: number;
  descripcion: string;
  stock: number;
  imagen: string;
  disponible: boolean;
  categorias: ICategoria[];
}

export interface ICartItem {
  id: number;
  nombre: string;
  precio: number;
  imagen: string;
  stock: number;
  cantidad: number;
}