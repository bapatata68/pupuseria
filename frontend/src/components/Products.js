import React from 'react';
import { useState, useEffect } from 'react';
import { productsAPI } from '../services/api';

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
    if (!window.confirm('¿Eliminar este producto?')) return; try {
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

  if (loading) return <div className="text-center py-12">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Productos</h2>
        <button onClick={() => onNavigate('dashboard')} className="text-gray-600">← Volver</button>
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg"
      >
        {showForm ? 'Cancelar' : '➕ Agregar Producto'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Masa</label>
            <select
              value={formData.masa}
              onChange={(e) => setFormData({ ...formData, masa: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="maíz">Maíz</option>
              <option value="arroz">Arroz</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Precio ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_small}
              onChange={(e) => setFormData({ ...formData, is_small: e.target.checked })}
              className="w-4 h-4 text-orange-500"
            />
            <label className="ml-2 text-sm">Aplica promoción 3x1$</label>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={resetForm} className="flex-1 bg-gray-300 py-2 rounded-lg">
              Cancelar
            </button>
            <button type="submit" className="flex-1 bg-orange-500 text-white py-2 rounded-lg">
              {editing ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Masa</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map(product => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {product.name}
                  {product.is_small && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">3x1$</span>
                  )}
                </td>
                <td className="px-4 py-3 capitalize">{product.masa}</td>
                <td className="px-4 py-3 text-right font-semibold">${parseFloat(product.price).toFixed(2)}</td>
                <td className="px-4 py-3 text-center space-x-2">
                  <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-800">
                    ✏️
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800">
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Products;
