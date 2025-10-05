/**
 * ============================================
 * LISTA DE PEDIDOS - Ver Pedidos del Día
 * ============================================
 * Muestra todos los pedidos del día seleccionado
 * Permite editar y eliminar pedidos
 */

import { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';

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
    if (!confirm('¿Estás seguro de eliminar este pedido?')) return;

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Pedidos del Día</h2>
            <p className="text-sm text-gray-600 mt-1">
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
            className="text-gray-600 hover:text-gray-800"
          >
            ← Volver
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-500 text-white rounded-lg shadow p-4">
          <p className="text-sm opacity-90">Total de Pedidos</p>
          <p className="text-2xl font-bold mt-1">{orders.length}</p>
        </div>
        <div className="bg-green-500 text-white rounded-lg shadow p-4">
          <p className="text-sm opacity-90">Total de Ventas</p>
          <p className="text-2xl font-bold mt-1">${totalSales.toFixed(2)}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Lista de Pedidos */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No hay pedidos
          </h3>
          <p className="text-gray-600 mb-4">
            No se encontraron pedidos para este día
          </p>
          <button
            onClick={() => onNavigate('newOrder')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Crear Pedido
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Header del pedido */}
              <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-gray-800">
                    Pedido #{order.id}
                  </span>
                  {order.is_delivery && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      🚚 Entrega
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(order)}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    disabled={deletingId === order.id}
                    className="text-red-600 hover:text-red-800 font-semibold text-sm disabled:opacity-50"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>

              {/* Ítems del pedido */}
              <div className="p-4">
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
                      <tr key={idx}>
                        <td className="py-2">
                          {item.product_name}
                          {item.is_small && (
                            <span className="ml-2 text-xs text-green-600">(3x1$)</span>
                          )}
                        </td>
                        <td className="py-2 capitalize">{item.masa}</td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right font-semibold">
                          ${parseFloat(item.line_total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {order.is_delivery && order.delivery_cost > 0 && (
                      <tr className="bg-purple-50">
                        <td className="py-2" colSpan="3">Costo de envío</td>
                        <td className="py-2 text-right font-semibold">
                          ${parseFloat(order.delivery_cost).toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Total */}
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-800">Total:</span>
                  <span className="text-2xl font-bold text-orange-600">
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
        className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center text-2xl transition transform hover:scale-110"
      >
        ➕
      </button>
    </div>
  );
}

export default OrdersList;
