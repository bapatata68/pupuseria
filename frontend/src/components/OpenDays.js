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

  if (loading) return <div className="text-center py-12">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Días Abiertos/Cerrados</h2>
          <button onClick={() => onNavigate('dashboard')} className="text-gray-600">← Volver</button>
        </div>
      </div>

      {/* Agregar Día */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-4">Marcar Día</h3>
        <div className="flex gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button
            onClick={handleAddDay}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg"
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Lista de Días */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {days.map(day => (
              <tr key={day.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('es-SV', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </td>
                <td className="px-4 py-3 text-center">
                  {day.is_open ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Abierto
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      ✕ Cerrado
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleToggle(day.date, day.is_open)}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
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
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No hay días registrados</p>
        </div>
      )}
    </div>
  );
}

export default OpenDays;
