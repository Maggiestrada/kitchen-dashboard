export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      negocio: {
        Row: {
          id: string;
          nombre: string;
          tipo: 'restaurante' | 'local' | 'delivery' | 'otro';
          pais: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['negocio']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['negocio']['Insert']>;
      };
      usuarios: {
        Row: {
          id: string;
          negocio_id: string;
          nombre: string;
          rol: 'admin' | 'cocinero';
          pin: string | null;
          activo: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['usuarios']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['usuarios']['Insert']>;
      };
      pedidos: {
        Row: {
          id: string;
          negocio_id: string;
          proveedor_nombre: string;
          proveedor_id: string | null;
          estado: 'en_espera' | 'en_camino' | 'recibido' | 'con_diferencias' | 'pago_efectivo';
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
        Insert: Omit<Database['public']['Tables']['pedidos']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['pedidos']['Insert']>;
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
        Insert: Omit<Database['public']['Tables']['proveedores']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['proveedores']['Insert']>;
      };
      insumos: {
        Row: {
          id: string;
          negocio_id: string;
          nombre: string;
          categoria: string;
          unidad: 'kg' | 'lt' | 'u' | 'paq' | 'atado' | 'otro';
          costo_por_unidad: number | null;
          proveedor_id: string | null;
          tipo: 'ingrediente' | 'apoyo';
          activo: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['insumos']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['insumos']['Insert']>;
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
        Insert: Omit<Database['public']['Tables']['recetas']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['recetas']['Insert']>;
      };
      menus_mes: {
        Row: {
          id: string;
          negocio_id: string;
          label: string;
          receta_ids: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['menus_mes']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['menus_mes']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
