/**
 * ============================================
 * REPORTE DIARIO - Exportación y Análisis
 * ============================================
 * Vista completa de reportes con:
 * - Resumen de métricas
 * - Detalle de productos vendidos
 * - Top 5 productos más vendidos
 * - Exportación a CSV
 */

import React from 'react';
import { useState, useEffect } from 'react';
import { reportsAPI } from './services/api';

function DailyReport({ onNavigate, selectedDate, onDateChange }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReport();
  }, [selectedDate]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportsAPI.getDaily(selectedDate);
      setReport(response.data);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await reportsAPI.exportCSV(selectedDate);
      alert('CSV exportado exitosamente');
    } catch (err) {
      alert('Error exportando CSV: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-50 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Reporte Diario</h2>
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Volver
          </button>
        </div>
      </div>

      {/* Selector de Fecha */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-50 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Fecha
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-slideDown">
          {error}
        </div>
      )}

      {/* Resumen - Cards de Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Pedidos */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl shadow-lg p-5 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium opacity-90">Pedidos</p>
            <span className="text-2xl opacity-80">📋</span>
          </div>
          <p className="text-3xl font-bold">{report?.totals.orders || 0}</p>
          <div className="mt-2 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden">
            <div className="h-full bg-white bg-opacity-40 rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Ventas */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-xl shadow-lg p-5 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium opacity-90">Ventas</p>
            <span className="text-2xl opacity-80">💰</span>
          </div>
          <p className="text-3xl font-bold">${(report?.totals.sales || 0).toFixed(2)}</p>
          <div className="mt-2 flex items-center text-xs opacity-80">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            Total del día
          </div>
        </div>

        {/* Entregas */}
        <div className="bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-xl shadow-lg p-5 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium opacity-90">Entregas</p>
            <span className="text-2xl opacity-80">🚚</span>
          </div>
          <p className="text-3xl font-bold">{report?.totals.delivery_orders || 0}</p>
          <div className="mt-2 text-xs opacity-80">
            {report?.totals.orders > 0 && (
              <span>
                {Math.round((report.totals.delivery_orders / report.totals.orders) * 100)}% del total
              </span>
            )}
          </div>
        </div>

        {/* Costo de Envíos */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-xl shadow-lg p-5 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium opacity-90">Costo Envíos</p>
            <span className="text-2xl opacity-80">🏍️</span>
          </div>
          <p className="text-3xl font-bold">${(report?.totals.delivery || 0).toFixed(2)}</p>
          <div className="mt-2 text-xs opacity-80">
            Ingresos adicionales
          </div>
        </div>
      </div>

      {/* Botón Exportar */}
      <button
        onClick={handleExport}
        disabled={exporting || !report?.totals.orders}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] hover:shadow-xl flex items-center justify-center space-x-2 group"
      >
        <span className="text-xl group-hover:animate-bounce">📥</span>
        <span>{exporting ? 'Exportando...' : 'Exportar a CSV'}</span>
        {exporting && (
          <svg className="animate-spin h-5 w-5 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
      </button>

      {/* Productos Vendidos - Tabla Detallada */}
      {report?.products && report.products.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100 animate-slideUp">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-sky-50 border-b border-blue-100">
            <h3 className="font-bold text-lg text-blue-900 flex items-center">
              <span className="mr-2">📊</span>
              Detalle de Ventas por Producto
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-blue-100">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Masa
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 bg-white">
                {report.products.map((product, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-blue-50 transition-colors duration-200 animate-fadeIn"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                        {product.is_small && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-sm animate-pulse">
                            3x1$
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 capitalize font-medium">{product.masa}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold text-blue-700 bg-blue-100">
                        {product.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-teal-600">
                        ${product.total.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gradient-to-r from-blue-50 to-sky-50">
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-right text-sm font-bold text-blue-900">
                    TOTAL GENERAL:
                  </td>
                  <td className="px-6 py-4 text-right text-lg font-bold text-blue-700">
                    ${(report?.totals.sales || 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-blue-200 animate-fadeIn">
          <div className="text-6xl mb-4 animate-bounce">📭</div>
          <h3 className="text-xl font-bold text-blue-900 mb-2">No hay datos para este día</h3>
          <p className="text-blue-600">Selecciona una fecha diferente o crea pedidos</p>
        </div>
      )}

      {/* Top 5 Productos */}
      {report?.top_products && report.top_products.length > 0 && (
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg p-6 border border-blue-100 animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <h3 className="font-bold text-xl mb-6 text-blue-900 flex items-center">
            <span className="mr-2">🏆</span>
            Top 5 Productos Más Vendidos
          </h3>
          <div className="space-y-4">
            {report.top_products.map((product, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-blue-100 hover:border-blue-300 transform hover:scale-[1.02] animate-fadeIn"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center space-x-4">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full font-bold text-xl
                    ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white shadow-lg' :
                      idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-md' :
                        idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md' :
                          'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700'}
                  `}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </div>
                  <span className="font-semibold text-gray-800 text-lg">{product.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-700 text-lg">{product.quantity} uds</div>
                  <div className="text-sm text-teal-600 font-semibold">${product.total.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estilos CSS para animaciones */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

export default DailyReport;
