/**
 * ============================================
 * LISTA DE PEDIDOS - Ver Pedidos del Día
 * ============================================
 * Mejoras visuales:
 * - Cards individuales por pedido
 * - Gradientes en resumen
 * - Botón flotante para nuevo pedido
 */

import { useState, useEffect } from 'react';
import { ordersAPI } from './services/api';

function OrdersList({ onNavigate, selectedDate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [selectedDate]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ordersAPI.getByDate(selectedDate);
      setOrders(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este pedido?')) return;
    try {
      setDeletingId(id);
      await ordersAPI.delete(id);
      await loadOrders();
    } catch (err) {
      alert('Error eliminando pedido: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (order) => {
    onNavigate('newOrder', { editOrder: order });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Pedidos del Día</h2>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-SV', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Volver
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-xl shadow-lg p-5 transform transition-all duration-300 hover:scale-105">
          <p className="text-sm opacity-90 font-medium">Total de Pedidos</p>
          <p className="text-2xl font-bold mt-2">{orders.length}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg p-5 transform transition-all duration-300 hover:scale-105">
          <p className="text-sm opacity-90 font-medium">Total de Ventas</p>
          <p className="text-2xl font-bold mt-2">${totalSales.toFixed(2)}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Lista de Pedidos */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-blue-50 p-8 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No hay pedidos
          </h3>
          <p className="text-gray-600 mb-4">
            No se encontraron pedidos para este día
          </p>
          <button
            onClick={() => onNavigate('newOrder')}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Crear Pedido
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-blue-50 overflow-hidden transform transition-all duration-300 hover:shadow-md">
              {/* Header del pedido */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-gray-800">
                    Pedido #{order.id}
                  </span>
                  {order.is_delivery && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      🚚 Entrega
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(order)}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    disabled={deletingId === order.id}
                    className="text-red-500 hover:text-red-700 font-semibold text-sm disabled:opacity-50 transition-colors"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>

              {/* Ítems del pedido */}
              <div className="p-6">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="text-left pb-2">Producto</th>
                      <th className="text-left pb-2">Masa</th>
                      <th className="text-center pb-2">Cant.</th>
                      <th className="text-right pb-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition-colors">
                        <td className="py-3">
                          {item.product_name}
                          {item.is_small && (
                            <span className="ml-2 text-xs text-emerald-600">(3x1$)</span>
                          )}
                        </td>
                        <td className="py-3 capitalize">{item.masa}</td>
                        <td className="py-3 text-center">{item.quantity}</td>
                        <td className="py-3 text-right font-semibold text-blue-600">
                          ${parseFloat(item.line_total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {order.is_delivery && order.delivery_cost > 0 && (
                      <tr className="bg-indigo-50">
                        <td className="py-3" colSpan="3">Costo de envío</td>
                        <td className="py-3 text-right font-semibold text-indigo-600">
                          ${parseFloat(order.delivery_cost).toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Total */}
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-800">Total:</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    ${parseFloat(order.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón flotante para nuevo pedido */}
      <button
        onClick={() => onNavigate('newOrder')}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center text-2xl transition-all duration-300 transform hover:scale-110"
      >
        ➕
      </button>

      {/* Animaciones CSS */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      `}</style>
    </div>
  );
}

export default OrdersList;
