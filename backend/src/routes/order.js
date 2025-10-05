/**
 * ============================================
 * RUTAS - PEDIDOS
 * ============================================
 * Manejo de pedidos diarios con cálculo automático de totales
 * - Crear pedido con múltiples ítems
 * - Listar pedidos por fecha
 * - Actualizar pedido existente
 * - Eliminar pedido
 * 
 * IMPORTANTE: Todos los cálculos de totales se realizan en el backend
 * para garantizar precisión y consistencia
 */
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ============================================
// FUNCIÓN HELPER: Calcular total de línea
// ============================================
/**
 * Calcula el total de una línea de pedido
 * Aplica promoción 3x1$ si el producto es elegible (is_small = true)
 * 
 * @param {number} quantity - Cantidad de productos
 * @param {number} unitPrice - Precio unitario
 * @param {boolean} isSmall - Si aplica promoción 3x1$
 * @returns {number} Total calculado con 2 decimales
 */
function calculateLineTotal(quantity, unitPrice, isSmall) {
  if (isSmall) {
    // Promoción 3x1$: grupos completos de 3 + ítems restantes
    const completeGroups = Math.floor(quantity / 3);
    const remaining = quantity % 3;
    return parseFloat((completeGroups * 1.00 + remaining * unitPrice).toFixed(2));
  }

  // Sin promoción: cantidad × precio
  return parseFloat((quantity * unitPrice).toFixed(2));
}

// ============================================
// GET /api/orders - Listar pedidos por fecha
// ============================================
router.get('/', async (req, res, next) => {
  try {
    const { date } = req.query;

    // Si no se proporciona fecha, usar hoy
    const businessDay = date || new Date().toISOString().split('T')[0];

    // Obtener pedidos del día
    const ordersResult = await db.query(
      `SELECT 
        id,
        business_day,
        is_delivery,
        delivery_cost,
        total,
        created_at
      FROM orders
      WHERE business_day = $1
      ORDER BY created_at DESC`,
      [businessDay]
    );

    // Para cada pedido, obtener sus ítems
    const ordersWithItems = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await db.query(
          `SELECT 
            oi.id,
            oi.order_id,
            oi.product_id,
            p.name as product_name,
            oi.masa,
            oi.quantity,
            oi.unit_price,
            oi.line_total,
            p.is_small
          FROM order_items oi
          JOIN products p ON p.id = oi.product_id
          WHERE oi.order_id = $1
          ORDER BY oi.id`,
          [order.id]
        );

        return {
          ...order,
          items: itemsResult.rows
        };
      })
    );

    res.json({
      success: true,
      data: ordersWithItems,
      count: ordersWithItems.length,
      date: businessDay
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET /api/orders/:id - Obtener pedido específico
// ============================================
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Obtener pedido
    const orderResult = await db.query(
      `SELECT 
        id,
        business_day,
        is_delivery,
        delivery_cost,
        total,
        created_at
      FROM orders
      WHERE id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Obtener ítems del pedido
    const itemsResult = await db.query(
      `SELECT 
        oi.id,
        oi.order_id,
        oi.product_id,
        p.name as product_name,
        oi.masa,
        oi.quantity,
        oi.unit_price,
        oi.line_total,
        p.is_small
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = $1
      ORDER BY oi.id`,
      [id]
    );

    const order = {
      ...orderResult.rows[0],
      items: itemsResult.rows
    };

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// POST /api/orders - Crear nuevo pedido
// ============================================
router.post('/', async (req, res, next) => {
  const client = await db.pool.connect();

  try {
    const { business_day, is_delivery, delivery_cost, items } = req.body;

    // Validaciones
    if (!business_day) {
      return res.status(400).json({
        success: false,
        message: 'La fecha del pedido (business_day) es requerida'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un ítem en el pedido'
      });
    }

    // Iniciar transacción
    await client.query('BEGIN');

    // Calcular total del pedido
    let orderTotal = 0;

    // Validar y calcular totales de cada ítem
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Cada ítem debe tener product_id y quantity válidos'
        });
      }

      // Obtener información del producto
      const productResult = await client.query(
        'SELECT unit_price, is_small FROM products WHERE id = $1',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: `Producto con ID ${item.product_id} no encontrado`
        });
      }

      const product = productResult.rows[0];
      const lineTotal = calculateLineTotal(item.quantity, product.unit_price, product.is_small);

      item.unit_price = product.unit_price;
      item.line_total = lineTotal;
      orderTotal += lineTotal;
    }

    // Agregar costo de delivery si aplica
    const finalDeliveryCost = is_delivery ? (delivery_cost || 0) : 0;
    orderTotal += finalDeliveryCost;

    // Crear pedido
    const orderResult = await client.query(
      `INSERT INTO orders (business_day, is_delivery, delivery_cost, total)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [business_day, is_delivery || false, finalDeliveryCost, orderTotal]
    );

    const order = orderResult.rows[0];

    // Insertar ítems del pedido
    const insertedItems = [];
    for (const item of items) {
      const itemResult = await client.query(
        `INSERT INTO order_items (order_id, product_id, masa, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [order.id, item.product_id, item.masa || null, item.quantity, item.unit_price, item.line_total]
      );
      insertedItems.push(itemResult.rows[0]);
    }

    // Confirmar transacción
    await client.query('COMMIT');

    // Obtener pedido completo con nombres de productos
    const completeOrderResult = await db.query(
      `SELECT 
        oi.id,
        oi.order_id,
        oi.product_id,
        p.name as product_name,
        oi.masa,
        oi.quantity,
        oi.unit_price,
        oi.line_total,
        p.is_small
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = $1
      ORDER BY oi.id`,
      [order.id]
    );

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: {
        ...order,
        items: completeOrderResult.rows
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// ============================================
// PUT /api/orders/:id - Actualizar pedido
// ============================================
router.put('/:id', async (req, res, next) => {
  const client = await db.pool.connect();

  try {
    const { id } = req.params;
    const { business_day, is_delivery, delivery_cost, items } = req.body;

    // Verificar que el pedido existe
    const orderCheck = await client.query('SELECT id FROM orders WHERE id = $1', [id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Validaciones
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un ítem en el pedido'
      });
    }

    // Iniciar transacción
    await client.query('BEGIN');

    // Eliminar ítems anteriores
    await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);

    // Calcular nuevo total
    let orderTotal = 0;

    // Validar y calcular totales de cada ítem
    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Cada ítem debe tener product_id y quantity válidos'
        });
      }

      // Obtener información del producto
      const productResult = await client.query(
        'SELECT unit_price, is_small FROM products WHERE id = $1',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: `Producto con ID ${item.product_id} no encontrado`
        });
      }

      const product = productResult.rows[0];
      const lineTotal = calculateLineTotal(item.quantity, product.unit_price, product.is_small);

      item.unit_price = product.unit_price;
      item.line_total = lineTotal;
      orderTotal += lineTotal;
    }

    // Agregar costo de delivery si aplica
    const finalDeliveryCost = is_delivery ? (delivery_cost || 0) : 0;
    orderTotal += finalDeliveryCost;

    // Actualizar pedido
    const orderResult = await client.query(
      `UPDATE orders 
       SET business_day = $1, is_delivery = $2, delivery_cost = $3, total = $4
       WHERE id = $5
       RETURNING *`,
      [business_day, is_delivery || false, finalDeliveryCost, orderTotal, id]
    );

    // Insertar nuevos ítems
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, masa, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, item.product_id, item.masa || null, item.quantity, item.unit_price, item.line_total]
      );
    }

    // Confirmar transacción
    await client.query('COMMIT');

    // Obtener pedido completo actualizado
    const completeOrderResult = await db.query(
      `SELECT 
        oi.id,
        oi.order_id,
        oi.product_id,
        p.name as product_name,
        oi.masa,
        oi.quantity,
        oi.unit_price,
        oi.line_total,
        p.is_small
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = $1
      ORDER BY oi.id`,
      [id]
    );

    res.json({
      success: true,
      message: 'Pedido actualizado exitosamente',
      data: {
        ...orderResult.rows[0],
        items: completeOrderResult.rows
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});


module.exports = router;
