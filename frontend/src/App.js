/**
 * ============================================
 * APLICACIÓN PRINCIPAL - Sistema Pupusería
 * ============================================
 * Componente raíz que maneja la navegación y estado global
 * Sistema mobile-first para control de ventas de pupusas
 * 
 * NUEVA PALETA DE COLORES:
 * - Azul primario: from-blue-600 to-cyan-600
 * - Verde esmeralda: para ventas y confirmaciones
 * - Índigo/Púrpura: para entregas y elementos secundarios
 * - Fondo: gradient from-slate-50 to-blue-50
 */

import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import NewOrder from './components/NewOrder';
import OrdersList from './components/OrdersList';
import Products from './components/Products';
import DailyReport from './components/DailyReport';
import OpenDays from './components/OpenDays';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    const titles = {
      dashboard: 'Dashboard',
      newOrder: 'Nuevo Pedido',
      orders: 'Pedidos del Día',
      products: 'Productos',
      report: 'Reporte Diario',
      openDays: 'Días Abiertos'
    };
    document.title = `${titles[currentView]} - Negocios de mi linda<3`;
  }, [currentView]);

  const navigate = (view, options = {}) => {
    setCurrentView(view);
    if (options.editOrder) {
      setEditingOrder(options.editOrder);
    } else {
      setEditingOrder(null);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={navigate} selectedDate={selectedDate} />;

      case 'newOrder':
        return (
          <NewOrder
            onNavigate={navigate}
            editingOrder={editingOrder}
            selectedDate={selectedDate}
          />
        );

      case 'orders':
        return (
          <OrdersList
            onNavigate={navigate}
            selectedDate={selectedDate}
          />
        );

      case 'products':
        return <Products onNavigate={navigate} />;

      case 'report':
        return (
          <DailyReport
            onNavigate={navigate}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        );

      case 'openDays':
        return <OpenDays onNavigate={navigate} />;

      default:
        return <Dashboard onNavigate={navigate} selectedDate={selectedDate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header con gradiente azul */}
      <header className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-500 text-white shadow-xl">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">♥</div>
              <div>
                <h1 className="text-xl font-bold">negocios de mi linda</h1>
                <p className="text-xs opacity-90">espero que vendas mucho preciosa</p>
              </div>
            </div>
            <button
              onClick={() => navigate('dashboard')}
              className="text-sm bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              Inicio
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {renderView()}
      </main>

      <footer className="bg-white border-t border-blue-100 mt-8 py-4 shadow-sm">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p className="font-medium">Sistema de Ventas de mi linda y asociados </p>
          <p className="text-xs mt-1 text-gray-500">
            {new Date().toLocaleDateString('es-SV', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
