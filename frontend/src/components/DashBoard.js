/**
 * ============================================
 * DASHBOARD - Vista Principal
 * ============================================
 * Muestra resumen del día actual con:
 * - Total de ventas
 * - Número de pedidos
 * - Totales por tipo de pupusa
 * - Navegación rápida a funciones principales
 */

import React from 'react';
import { useState, useEffect } from 'react';
import { ordersAPI, reportsAPI } from '../services/api';

function Dashboard({ onNavigate, selectedDate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    totalSales: 0,
    orderCount: 0,
    deliveryCount: 0,
    products: []
  });

  useEffect(() => {
    loadDashboardData();
  }, [selectedDate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener reporte del día
      const reportData = await reportsAPI.getDaily(selectedDate);

      setSummary({
        totalSales: reportData.data.totals.sales,
        orderCount: reportData.data.totals.orders,
        deliveryCount: reportData.data.totals.delivery_orders,
        products: reportData.data.products || []
      });
    } catch (err) {
      setError(err.message);
      console.error('Error cargando dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título y Fecha */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-600 mt-1">
          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-SV', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total de Ventas */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total de Ventas</p>
              <p className="text-3xl font-bold mt-1">
                ${summary.totalSales.toFixed(2)}
              </p>
            </div>
            <div className="text-4xl opacity-80">💰</div>
          </div>
        </div>

        {/* Número de Pedidos */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Pedidos</p>
              <p className="text-3xl font-bold mt-1">{summary.orderCount}</p>
            </div>
            <div className="text-4xl opacity-80">📋</div>
          </div>
        </div>

        {/* Entregas */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Entregas</p>
              <p className="text-3xl font-bold mt-1">{summary.deliveryCount}</p>
            </div>
            <div className="text-4xl opacity-80">🚚</div>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <button
          onClick={() => onNavigate('newOrder')}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition transform hover:scale-105"
        >
          <div className="text-2xl mb-1">➕</div>
          <div>Nuevo Pedido</div>
        </button>

        <button
          onClick={() => onNavigate('orders')}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition transform hover:scale-105"
        >
          <div className="text-2xl mb-1">📋</div>
          <div>Ver Pedidos</div>
        </button>

        <button
          onClick={() => onNavigate('products')}
          className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition transform hover:scale-105"
        >
          <div className="text-2xl mb-1">🫓</div>
          <div>Productos</div>
        </button>

        <button
          onClick={() => onNavigate('report')}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition transform hover:scale-105"
        >
          <div className="text-2xl mb-1">📊</div>
          <div>Reporte</div>
        </button>

        <button
          onClick={() => onNavigate('openDays')}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition transform hover:scale-105"
        >
          <div className="text-2xl mb-1">📅</div>
          <div>Días Abiertos</div>
        </button>

        <button
          onClick={loadDashboardData}
          className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition transform hover:scale-105"
        >
          <div className="text-2xl mb-1">🔄</div>
          <div>Actualizar</div>
        </button>
      </div>

      {/* Resumen por Producto */}
      {summary.products.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-800">
              Ventas por Producto
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Masa
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summary.products.map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {product.name}
                      {product.is_small && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          3x1$
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                      {product.masa}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      {product.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                      ${product.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sin datos */}
      {summary.orderCount === 0 && !loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No hay pedidos aún
          </h3>
          <p className="text-gray-600 mb-4">
            Comienza agregando tu primer pedido del día
          </p>
          <button
            onClick={() => onNavigate('newOrder')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Crear Primer Pedido
          </button>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
