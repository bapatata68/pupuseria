/**
 * ============================================
 * PRODUCTOS - Gestión de Productos
 * ============================================
 * Actualizado con iconos Lucide React
 */

import { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';
import {
  Plus,
  X,
  Edit2,
  Trash2,
  Save,
  ArrowLeft,
  Package,
  DollarSign,
  Tag
} from 'lucide-react';

function Products({ onNavigate }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    masa: 'maíz',
    price: '',
    is_small: false
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data || []);
    } catch (err) {
      alert('Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await productsAPI.update(editing.id, formData);
      } else {
        await productsAPI.create(formData);
      }
      resetForm();
      loadProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (product) => {
    setEditing(product);
    setFormData({
      name: product.name,
      masa: product.masa || 'maíz',
      price: product.price,
      is_small: product.is_small
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await productsAPI.delete(id);
      loadProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', masa: 'maíz', price: '', is_small: false });
    setEditing(null);
    setShowForm(false);
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
      <div className="bg-gradient-to-r from-white to-blue-50 rounded-xl shadow-sm border border-blue-100 p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Productos</h2>
        </div>
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>
      </div>

      {/* Botón Agregar */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
      >
        {showForm ? (
          <>
            <X className="w-5 h-5" />
            <span>Cancelar</span>
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" />
            <span>Agregar Producto</span>
          </>
        )}
      </button>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 space-y-4 animate-slideDown">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <span>{editing ? 'Editar Producto' : 'Nuevo Producto'}</span>
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Producto</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Revueltas, Queso, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Masa</label>
            <select
              value={formData.masa}
              onChange={(e) => setFormData({ ...formData, masa: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="maíz">Maíz</option>
              <option value="arroz">Arroz</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
              <DollarSign className="w-4 h-4" />
              <span>Precio</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
          </div>

          <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <input
              type="checkbox"
              id="is_small"
              checked={formData.is_small}
              onChange={(e) => setFormData({ ...formData, is_small: e.target.checked })}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="is_small" className="text-sm font-medium text-green-800">
              Aplica promoción 3x1$ (Pupusas pequeñas)
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 rounded-lg transition-all flex items-center justify-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-2.5 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center space-x-2 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{editing ? 'Actualizar' : 'Guardar'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tabla de Productos */}
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Tipo de Masa
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {products.map((product, idx) => (
                <tr
                  key={product.id}
                  className="hover:bg-blue-50 transition-colors duration-150 animate-fadeIn"
                  style={{ animationDelay: `${idx * 0.03}s` }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{product.name}</span>
                        {product.is_small && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-sm">
                            3x1$
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${product.masa === 'maíz'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-green-100 text-green-800'
                      }`}>
                      {product.masa === 'maíz' ? '🌽 Maíz' : '🌾 Arroz'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold text-blue-700 bg-blue-100">
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-blue-100 rounded"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-100 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer de la tabla */}
        {products.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-3 border-t border-blue-100">
            <p className="text-sm text-gray-600">
              Total de productos: <span className="font-bold text-blue-700">{products.length}</span>
            </p>
          </div>
        )}
      </div>

      {/* Estado vacío */}
      {products.length === 0 && !loading && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-lg p-12 text-center border-2 border-dashed border-blue-200">
          <Package className="w-16 h-16 mx-auto text-blue-300 mb-4" />
          <h3 className="text-xl font-bold text-blue-900 mb-2">No hay productos registrados</h3>
          <p className="text-blue-600 mb-4">Comienza agregando tu primer producto</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2 px-6 rounded-lg transition-all inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Producto</span>
          </button>
        </div>
      )}

      {/* Animaciones CSS */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn { 
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
        }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
      `}</style>
    </div>
  );
}

export default Products;
