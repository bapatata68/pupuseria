/**
 * ============================================
 * SERVICIO API - Comunicación con Backend
 * ============================================
 * Centraliza todas las llamadas HTTP al backend
 * Maneja errores y formatos de respuesta
 */

const API_URL = process.env.REACT_APP_API_URL || 'https://pupuseria-backend.onrender.com/api';
// Helper para manejar respuestas
const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Error en la petición');
  }

  return data;
};

// Helper para manejar errores
const handleError = (error) => {
  console.error('API Error:', error);
  throw error;
};

// ============================================
// PRODUCTOS
// ============================================
export const productsAPI = {
  // Obtener todos los productos
  getAll: async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Obtener un producto por ID
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Crear producto
  create: async (productData) => {
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Actualizar producto
  update: async (id, productData) => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Eliminar producto
  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============================================
// PEDIDOS
// ============================================
export const ordersAPI = {
  // Obtener pedidos por fecha
  getByDate: async (date) => {
    try {
      const response = await fetch(`${API_URL}/orders?date=${date}`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Obtener un pedido por ID
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Crear pedido
  create: async (orderData) => {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Actualizar pedido
  update: async (id, orderData) => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Eliminar pedido
  delete: async (id) => {
    try {
      const response = await fetch(`${API_URL}/orders/${id}`, {
        method: 'DELETE'
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============================================
// REPORTES
// ============================================
export const reportsAPI = {
  // Obtener reporte diario
  getDaily: async (date) => {
    try {
      const response = await fetch(`${API_URL}/reports/daily/${date}`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Exportar CSV
  exportCSV: async (date) => {
    try {
      const response = await fetch(`${API_URL}/reports/daily/${date}/export`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al exportar CSV');
      }

      // Descargar archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ventas_${date}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    } catch (error) {
      return handleError(error);
    }
  },

  // Obtener resumen de período
  getSummary: async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await fetch(`${API_URL}/reports/summary?${params}`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

// ============================================
// DÍAS ABIERTOS
// ============================================
export const openDaysAPI = {
  // Obtener todos los días
  getAll: async (startDate, endDate) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const url = `${API_URL}/open-days${params.toString() ? '?' + params : ''}`;
      const response = await fetch(url);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Obtener estado de un día
  getByDate: async (date) => {
    try {
      const response = await fetch(`${API_URL}/open-days/${date}`);
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Actualizar estado de un día
  update: async (date, isOpen) => {
    try {
      const response = await fetch(`${API_URL}/open-days/${date}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: isOpen })
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  },

  // Marcar múltiples días
  updateMultiple: async (dates) => {
    try {
      const response = await fetch(`${API_URL}/open-days`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dates })
      });
      return await handleResponse(response);
    } catch (error) {
      return handleError(error);
    }
  }
};

export default {
  products: productsAPI,
  orders: ordersAPI,
  reports: reportsAPI,
  openDays: openDaysAPI
};
