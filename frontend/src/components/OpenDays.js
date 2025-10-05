/**
 * ============================================
 * DÍAS ABIERTOS - Gestión de Calendario
 * ============================================
 * Actualizado con iconos Lucide React
 */

import { useState, useEffect } from 'react';
import { openDaysAPI } from '../services/api';
import {
  Calendar,
  ArrowLeft,
  Plus,
  Check,
  X as CloseIcon,
  ToggleLeft,
  ToggleRight,
  CalendarDays,
  Clock
} from 'lucide-react';

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

  // Calcular estadísticas
  const openDaysCount = days.filter(d => d.is_open).length;
  const closedDaysCount = days.filter(d => !d.is_open).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50 rounded-xl shadow-sm border border-blue-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Días Abiertos/Cerrados</h2>
              <p className="text-sm text-gray-600">Control de operación del negocio</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl shadow-lg p-5 transform transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium opacity-90">Días Abiertos</p>
            <Check className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{openDaysCount}</p>
          <div className="mt-2 text-xs opacity-80">Últimos 30 días</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-xl shadow-lg p-5 transform transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium opacity-90">Días Cerrados</p>
            <CloseIcon className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{closedDaysCount}</p>
          <div className="mt-2 text-xs opacity-80">Últimos 30 días</div>
        </div>
      </div>

      {/* Agregar Día */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <CalendarDays className="w-5 h-5 text-blue-600" />
          <span>Marcar Nuevo Día</span>
        </h3>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          <button
            onClick={handleAddDay}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-2.5 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </div>
      </div>

      {/* Lista de Días */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
          <h3 className="font-bold text-lg text-blue-900 flex items-center">
            <CalendarDays className="w-5 h-5 mr-2" />
            Historial de Días
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {days.map((day, idx) => (
                <tr
                  key={day.id}
                  className="hover:bg-blue-50 transition-colors duration-150 animate-fadeIn"
                  style={{ animationDelay: `${idx * 0.03}s` }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(day.date + 'T00:00:00').toLocaleDateString('es-SV', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {day.is_open ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-sm space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Abierto</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-sm space-x-1">
                        <CloseIcon className="w-3 h-3" />
                        <span>Cerrado</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleToggle(day.date, day.is_open)}
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-semibold text-sm transition-all hover:bg-blue-100 px-3 py-1.5 rounded-lg"
                    >
                      {day.is_open ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          <span>Cerrar</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          <span>Abrir</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {days.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-3 border-t border-blue-100">
            <p className="text-sm text-gray-600">
              Mostrando <span className="font-bold text-blue-700">{days.length}</span> días registrados
            </p>
          </div>
        )}
      </div>

      {/* Estado vacío */}
      {days.length === 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-blue-200">
          <Calendar className="w-16 h-16 mx-auto text-blue-300 mb-4" />
          <h3 className="text-xl font-bold text-blue-900 mb-2">No hay días registrados</h3>
          <p className="text-blue-600 mb-4">Comienza marcando días de operación</p>
          <button
            onClick={() => document.querySelector('input[type="date"]').focus()}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2 px-6 rounded-lg transition-all inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Marcar Primer Día</span>
          </button>
        </div>
      )}

      {/* Animaciones CSS */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { 
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

export default OpenDays;
