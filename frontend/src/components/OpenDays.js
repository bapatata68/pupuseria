/**
 * ============================================
 * DÍAS ABIERTOS - Gestión de Calendario
 * ============================================
 * Control de días operativos del negocio
 */

import React from 'react';
import { useState, useEffect } from 'react';
import { openDaysAPI } from '../services/api';

function OpenDays({ onNavigate }) {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    loadDays();
  }, []);

  const loadDays = async () => {
    try {
      setLoading(true);
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const response = await openDaysAPI.getAll(startDate, endDate);
      setDays(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (date, currentStatus) => {
    try {
      await openDaysAPI.update(date, !currentStatus);
      loadDays();
    } catch (err) {
      alert('Error actualizando día: ' + err.message);
    }
  };

  const handleAddDay = async () => {
    if (!selectedDate) {
      alert('Selecciona una fecha');
      return;
    }

    try {
      await openDaysAPI.update(selectedDate, true);
      setSelectedDate('');
      loadDays();
    } catch (err) {
      alert('Error: ' + err.message);
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
      <div className="bg-white rounded-xl shadow-sm border border-blue-50 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Días Abiertos/Cerrados</h2>
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Volver
          </button>
        </div>
      </div>

      {/* Agregar Día */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-50 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Marcar Día</h3>
        <div className="flex gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <button
            onClick={handleAddDay}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Lista de Días */}
      <div className="bg-white rounded-xl shadow-sm border border-blue-50 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {days.map(day => (
              <tr key={day.id} className="hover:bg-blue-50 transition-colors duration-150">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('es-SV', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </td>
                <td className="px-6 py-4 text-center">
                  {day.is_open ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                      ✓ Abierto
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      ✕ Cerrado
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleToggle(day.date, day.is_open)}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
                  >
                    Cambiar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {days.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-50 p-8 text-center">
          <p className="text-gray-600">No hay días registrados</p>
        </div>
      )}

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

export default OpenDays;
