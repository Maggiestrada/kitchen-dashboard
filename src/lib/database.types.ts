export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      negocio: {
        Row: {
          id: string;
          nombre: string;
          tipo: string;
          pais: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          tipo: string;
          pais: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          tipo?: string;
          pais?: string;
          email?: string;
          updated_at?: string;
        };
      };
      usuarios: {
        Row: {
          id: string;
          negocio_id: string;
          nombre: string;
          rol: string;
          pin: string | null;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          negocio_id: string;
          nombre: string;
          rol: string;
          pin?: string | null;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          nombre?: string;
          rol?: string;
          pin?: string | null;
          activo?: boolean;
        };
      };
      pedidos: {
        Row: {
          id: string;
          negocio_id: string;
          proveedor_nombre: string;
          proveedor_id: string | null;
          estado: string;
          nota: string | null;
          creado_por: string | null;
          recepcionado_por: string | null;
          tiene_efectivo: boolean;
          alertas: Json | null;
          items: Json;
          total: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          negocio_id: string;
          proveedor_nombre: string;
          proveedor_id?: string | null;
          estado?: string;
          nota?: string | null;
          creado_por?: string | null;
          recepcionado_por?: string | null;
          tiene_efectivo?: boolean;
          alertas?: Json | null;
          items?: Json;
          total?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          estado?: string;
          nota?: string | null;
          recepcionado_por?: string | null;
          tiene_efectivo?: boolean;
          alertas?: Json | null;
          updated_at?: string;
        };
      };
      proveedores: {
        Row: {
          id: string;
          negocio_id: string;
          nombre: string;
          categoria: string | null;
          contacto: string | null;
          email: string | null;
          telefono: string | null;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          negocio_id: string;
          nombre: string;
          categoria?: string | null;
          contacto?: string | null;
          email?: string | null;
          telefono?: string | null;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          nombre?: string;
          categoria?: string | null;
          contacto?: string | null;
          email?: string | null;
          telefono?: string | null;
          activo?: boolean;
        };
      };
      insumos: {
        Row: {
          id: string;
          negocio_id: string;
          nombre: string;
          categoria: string;
          unidad: string;
          costo_por_unidad: number | null;
          proveedor_id: string | null;
          tipo: string;
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          negocio_id: string;
          nombre: string;
          categoria?: string;
          unidad: string;
          costo_por_unidad?: number | null;
          proveedor_id?: string | null;
          tipo?: string;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          nombre?: string;
          categoria?: string;
          unidad?: string;
          costo_por_unidad?: number | null;
          proveedor_id?: string | null;
          activo?: boolean;
        };
      };
      recetas: {
        Row: {
          id: string;
          negocio_id: string;
          nombre: string;
          categoria: string | null;
          porciones: number;
          precio_venta: number | null;
          tiempo_prep: number | null;
          ingredientes: Json;
          insumos_apoyo: Json;
          notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          negocio_id: string;
          nombre: string;
          categoria?: string | null;
          porciones?: number;
          precio_venta?: number | null;
          tiempo_prep?: number | null;
          ingredientes?: Json;
          insumos_apoyo?: Json;
          notas?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nombre?: string;
          categoria?: string | null;
          porciones?: number;
          precio_venta?: number | null;
          tiempo_prep?: number | null;
          ingredientes?: Json;
          insumos_apoyo?: Json;
          notas?: string | null;
          updated_at?: string;
        };
      };
      menus_mes: {
        Row: {
          id: string;
          negocio_id: string;
          label: string;
          receta_ids: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          negocio_id: string;
          label: string;
          receta_ids?: string[];
          created_at?: string;
        };
        Update: {
          label?: string;
          receta_ids?: string[];
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
