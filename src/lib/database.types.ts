export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      orders: {
        Row: {
          awb_number: string | null
          billing_city: string
          billing_company_name: string | null
          billing_country: string
          billing_county: string | null
          billing_name: string
          billing_postal_code: string
          billing_registration_number: string | null
          billing_street: string
          billing_vat_number: string | null
          courier_name: string | null
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          delivered_at: string | null
          discount_amount: number
          discount_code: string | null
          id: string
          internal_notes: string | null
          items: Json
          order_number: string
          paid_at: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          shipped_at: string | null
          shipping_city: string
          shipping_cost: number
          shipping_country: string
          shipping_county: string | null
          shipping_name: string
          shipping_notes: string | null
          shipping_phone: string | null
          shipping_postal_code: string
          shipping_street: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax_amount: number
          total_amount: number
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          awb_number?: string | null
          billing_city: string
          billing_company_name?: string | null
          billing_country?: string
          billing_county?: string | null
          billing_name: string
          billing_postal_code: string
          billing_registration_number?: string | null
          billing_street: string
          billing_vat_number?: string | null
          courier_name?: string | null
          created_at?: string
          currency?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          delivered_at?: string | null
          discount_amount?: number
          discount_code?: string | null
          id?: string
          internal_notes?: string | null
          items?: Json
          order_number?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          shipped_at?: string | null
          shipping_city: string
          shipping_cost?: number
          shipping_country?: string
          shipping_county?: string | null
          shipping_name: string
          shipping_notes?: string | null
          shipping_phone?: string | null
          shipping_postal_code: string
          shipping_street: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax_amount?: number
          total_amount: number
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          awb_number?: string | null
          billing_city?: string
          billing_company_name?: string | null
          billing_country?: string
          billing_county?: string | null
          billing_name?: string
          billing_postal_code?: string
          billing_registration_number?: string | null
          billing_street?: string
          billing_vat_number?: string | null
          courier_name?: string | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          delivered_at?: string | null
          discount_amount?: number
          discount_code?: string | null
          id?: string
          internal_notes?: string | null
          items?: Json
          order_number?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          shipped_at?: string | null
          shipping_city?: string
          shipping_cost?: number
          shipping_country?: string
          shipping_county?: string | null
          shipping_name?: string
          shipping_notes?: string | null
          shipping_phone?: string | null
          shipping_postal_code?: string
          shipping_street?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "sent"
        | "delivered"
        | "cancelled"
        | "refunded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

// Helper types for order items
export interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  sku?: string
  variant?: string
  image_url?: string
}

export type Order = Tables<"orders">
export type OrderInsert = TablesInsert<"orders">
export type OrderUpdate = TablesUpdate<"orders">
export type OrderStatus = Enums<"order_status">
