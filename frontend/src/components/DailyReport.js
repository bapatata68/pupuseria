import React from 'react';
import { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';

function DailyReport({ onNavigate, selectedDate, onDateChange }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadReport();
  }, [selectedDate]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getDaily(selectedDate);
      setReport(response.data);
    } catch (err) {
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

  if (loading) return <div className="text-center py-12">Cargando reporte...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Reporte Diario</h2>
          <button onClick={() => onNavigate('dashboard')} className="text-gray-600">← Volver</button>
        </div>
      </div>

      {/* Selector de Fecha */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium mb-2">Seleccionar Fecha</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        />
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-500 text-white rounded-lg shadow p-4">
          <p className="text-sm opacity-90">Pedidos</p>
          <p className="text-2xl font-bold">{report?.totals.orders || 0}</p>
        </div>
        <div className="bg-green-500 text-white rounded-lg shadow p-4">
          <p className="text-sm opacity-90">Ventas</p>
          <p className="text-2xl font-bold">${(report?.totals.sales || 0).toFixed(2)}</p>
        </div>
        <div className="bg-purple-500 text-white rounded-lg shadow p-4">
          <p className="text-sm opacity-90">Entregas</p>
          <p className="text-2xl font-bold">{report?.totals.delivery_orders || 0}</p>
        </div>
        <div className="bg-orange-500 text-white rounded-lg shadow p-4">
          <p className="text-sm opacity-90">Envíos</p>
          <p className="text-2xl font-bold">${(report?.totals.delivery || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Botón Exportar */}
      <button
        onClick={handleExport}
        disabled={exporting || !report?.totals.orders}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50"
      >
        {exporting ? 'Exportando...' : '📥 Exportar a CSV'}
      </button>

      {/* Productos Vendidos */}
      {report?.products && report.products.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="font-semibold">Detalle de Ventas por Producto</h3>
          </div>
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Masa</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {report.products.map((product, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {product.name}
                    {product.is_small && (
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">3x1$</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm capitalize">{product.masa}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">{product.quantity}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">${product.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No hay datos para este día</p>
        </div>
      )}

      {/* Top Productos */}
      {report?.top_products && report.top_products.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">Top 5 Productos</h3>
          <div className="space-y-3">
            {report.top_products.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl font-bold text-gray-400">{idx + 1}</span>
                  <span className="font-medium">{product.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{product.quantity} uds</div>
                  <div className="text-sm text-gray-600">${product.total.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyReport;
