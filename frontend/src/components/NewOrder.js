/**
 * ============================================
 * NUEVO PEDIDO - Formulario de Registro
 * ============================================
 * Permite crear y editar pedidos con:
 * - Selección de productos y masa
 * - Cálculo automático de subtotales
 * - Opción de entrega a domicilio
 * - Aplicación automática de promoción 3x1$
 */

import React from 'react';
import { useState, useEffect } from 'react';
import { productsAPI, ordersAPI } from '../services/api';

function NewOrder({ onNavigate, editingOrder, selectedDate }) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryCost, setDeliveryCost] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estado para nuevo ítem
  const [newItem, setNewItem] = useState({
    product_id: '',
    masa: 'maíz',
    quantity: 1
  });

  useEffect(() => {
    loadProducts();
    if (editingOrder) {
      loadOrderForEdit();
    }
  }, [editingOrder]);

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data || []);
    } catch (err) {
      setError('Error cargando productos: ' + err.message);
    }
  };

  const loadOrderForEdit = async () => {
    try {
      const response = await ordersAPI.getById(editingOrder.id);
      const order = response.data;

      setItems(order.items.map(item => ({
        product_id: item.product_id,
        masa: item.masa,
        quantity: item.quantity
      })));

      setIsDelivery(order.is_delivery);
      setDeliveryCost(order.delivery_cost > 0 ? order.delivery_cost.toString() : '');
    } catch (err) {
      setError('Error cargando pedido: ' + err.message);
    }
  };

  // Calcular subtotal de un ítem
  const calculateItemSubtotal = (item) => {
    const product = products.find(p => p.id === parseInt(item.product_id));
    if (!product) return 0;

    const quantity = parseInt(item.quantity) || 0;
    const price = parseFloat(product.price);

    // Si es producto pequeño (3x1$), aplicar promoción
    if (product.is_small) {
      const completeGroups = Math.floor(quantity / 3);
      const remaining = quantity % 3;
      return completeGroups * 1.00 + remaining * price;
    }

    return quantity * price;
  };

  // Calcular total del pedido
  const calculateTotal = () => {
    const itemsTotal = items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
    const delivery = isDelivery ? (parseFloat(deliveryCost) || 0) : 0;
    return itemsTotal + delivery;
  };

  // Agregar ítem a la lista
  const addItem = () => {
    if (!newItem.product_id) {
      setError('Selecciona un producto');
      return;
    }

    if (newItem.quantity <= 0) {
      setError('La cantidad debe ser mayor a cero');
      return;
    }

    setItems([...items, { ...newItem }]);
    setNewItem({ product_id: '', masa: 'maíz', quantity: 1 });
    setError(null);
  };

  // Eliminar ítem de la lista
  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Guardar pedido
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      setError('Agrega al menos un producto');
      return;
    }

    if (isDelivery && (!deliveryCost || parseFloat(deliveryCost) < 0)) {
      setError('Ingresa un costo de envío válido');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const orderData = {
        items,
        is_delivery: isDelivery,
        delivery_cost: isDelivery ? parseFloat(deliveryCost) : 0,
        business_day: selectedDate
      };

      if (editingOrder) {
        await ordersAPI.update(editingOrder.id, orderData);
        setSuccess('Pedido actualizado exitosamente');
      } else {
        await ordersAPI.create(orderData);
        setSuccess('Pedido creado exitosamente');
      }

      // Redirigir después de 1 segundo
      setTimeout(() => onNavigate('orders'), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            {editingOrder ? 'Editar Pedido' : 'Nuevo Pedido'}
          </h2>
          <button
            onClick={() => onNavigate('orders')}
            className="text-gray-600 hover:text-gray-800"
          >
            ✕ Cancelar
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Formulario Agregar Ítem */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Agregar Producto
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Selector de Producto */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Producto
            </label>
            <select
              value={newItem.product_id}
              onChange={(e) => setNewItem({ ...newItem, product_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} - ${product.price.toFixed(2)}
                  {product.is_small ? ' (3x1$)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Masa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Masa
            </label>
            <select
              value={newItem.masa}
              onChange={(e) => setNewItem({ ...newItem, masa: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="maíz">Maíz</option>
              <option value="arroz">Arroz</option>
            </select>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad
            </label>
            <input
              type="number"
              min="1"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={addItem}
          className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          ➕ Agregar
        </button>
      </div>

      {/* Lista de Ítems */}
      {items.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-800">
              Productos del Pedido
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
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Subtotal
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => {
                  const product = products.find(p => p.id === parseInt(item.product_id));
                  const subtotal = calculateItemSubtotal(item);

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {product?.name || 'Producto'}
                        {product?.is_small && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            3x1$
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                        {item.masa}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center font-medium">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                        ${subtotal.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Opciones de Entrega */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="delivery"
            checked={isDelivery}
            onChange={(e) => setIsDelivery(e.target.checked)}
            className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
          />
          <label htmlFor="delivery" className="ml-3 text-sm font-medium text-gray-700">
            ¿Entrega a domicilio?
          </label>
        </div>

        {isDelivery && (
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Costo de envío ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={deliveryCost}
              onChange={(e) => setDeliveryCost(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Total y Guardar */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <span className="text-2xl font-bold text-gray-800">Total:</span>
          <span className="text-3xl font-bold text-orange-600">
            ${calculateTotal().toFixed(2)}
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('orders')}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || items.length === 0}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : editingOrder ? 'Actualizar Pedido' : 'Guardar Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewOrder;
