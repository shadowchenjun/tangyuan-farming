import request from '../utils/request'

export interface BenlaiOrder {
  id: number
  out_trade_no: string
  order_id?: string
  receive_contact?: string
  receive_phone?: string
  province?: string
  city?: string
  county?: string
  receive_address?: string
  order_price: number
  ship_price: number
  order_discount: number
  order_status: string
  order_status_remark: string
  create_date?: string
  expire_date?: string
  order_detail?: any[]
  do_list?: string[]
  box_list?: string[]
  verification_code?: string
  verified: boolean
  verified_at?: string
  user_id?: string
  created_at: string
}

export interface PageResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export const benlaiApi = {
  // 获取订单列表
  getOrders(params?: {
    page?: number
    page_size?: number
    status?: string
    phone?: string
    out_trade_no?: string
  }) {
    return request.get<PageResponse<BenlaiOrder>>('/admin/benlai/orders', { params })
  },

  // 获取单个订单
  getOrder(id: number) {
    return request.get<BenlaiOrder>(`/admin/benlai/orders/${id}`)
  },

  // 创建订单
  createOrder(data: {
    out_trade_no: string
    order_id?: string
    receive_contact?: string
    receive_phone?: string
    province?: string
    city?: string
    county?: string
    receive_address?: string
    order_price?: number
    ship_price?: number
    order_status?: string
    order_status_remark?: string
    order_detail?: any[]
  }) {
    return request.post('/admin/benlai/orders', data)
  },

  // 批量创建订单
  batchCreateOrders(orders: any[]) {
    return request.post('/admin/benlai/orders/batch', { orders })
  },

  // 更新订单状态
  updateOrder(id: number, data: { order_status?: string; order_status_remark?: string }) {
    return request.put(`/admin/benlai/orders/${id}`, data)
  },

  // 删除订单
  deleteOrder(id: number) {
    return request.delete(`/admin/benlai/orders/${id}`)
  }
}
