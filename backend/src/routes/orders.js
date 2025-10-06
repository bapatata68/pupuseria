/**
 * ============================================
 * RUTAS - PEDIDOS
 * ============================================
 * Manejo de pedidos diarios con cálculo automático de totales
 */
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ============================================
// FUNCIÓN HELPER: Calcular total de línea
// ============================================
function calculateLineTotal(quantity, unitPrice, isSmall) {
  if (isSmall) {
    const completeGroups = Math.floor(quantity / 3);
    const remaining = quantity % 3;
    return parseFloat((completeGroups * 1.00 + remaining * unitPrice).toFixed(2));
  }
  return parseFloat((quantity * unitPrice).toFixed(2));
}

// ============================================
// GET /api/orders - Listar pedidos por fecha
// ============================================
router.get('/', async (req, res, next) => {
  try {
    const { date } = req.query;
    const businessDay = date || new Date().toISOString().split('T')[0];

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

    await client.query('BEGIN');

    let orderTotal = 0;
    const processedItems = [];

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Cada ítem debe tener product_id y quantity válidos'
        });
      }

      const productResult = await client.query(
        'SELECT price, is_small FROM products WHERE id = $1',
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
      const lineTotal = calculateLineTotal(item.quantity, product.price, product.is_small);

      processedItems.push({
        ...item,
        unit_price: product.price,
        line_total: lineTotal
      });

      orderTotal += lineTotal;
    }

    const finalDeliveryCost = is_delivery ? (delivery_cost || 0) : 0;
    orderTotal += finalDeliveryCost;

    const orderResult = await client.query(
      `INSERT INTO orders (business_day, is_delivery, delivery_cost, total)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [business_day, is_delivery || false, finalDeliveryCost, orderTotal]
    );

    const order = orderResult.rows[0];

    const insertedItems = [];
    for (const item of processedItems) {
      const itemResult = await client.query(
        `INSERT INTO order_items (order_id, product_id, masa, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [order.id, item.product_id, item.masa || null, item.quantity, item.unit_price, item.line_total]
      );
      insertedItems.push(itemResult.rows[0]);
    }

    await client.query('COMMIT');

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

    const orderCheck = await client.query('SELECT id FROM orders WHERE id = $1', [id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un ítem en el pedido'
      });
    }

    await client.query('BEGIN');

    await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);

    let orderTotal = 0;
    const processedItems = [];

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Cada ítem debe tener product_id y quantity válidos'
        });
      }

      const productResult = await client.query(
        'SELECT price, is_small FROM products WHERE id = $1',
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
      const lineTotal = calculateLineTotal(item.quantity, product.price, product.is_small);

      processedItems.push({
        ...item,
        unit_price: product.price,
        line_total: lineTotal
      });

      orderTotal += lineTotal;
    }

    const finalDeliveryCost = is_delivery ? (delivery_cost || 0) : 0;
    orderTotal += finalDeliveryCost;

    const orderResult = await client.query(
      `UPDATE orders 
       SET business_day = $1, is_delivery = $2, delivery_cost = $3, total = $4
       WHERE id = $5
       RETURNING *`,
      [business_day, is_delivery || false, finalDeliveryCost, orderTotal, id]
    );

    for (const item of processedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, masa, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, item.product_id, item.masa || null, item.quantity, item.unit_price, item.line_total]
      );
    }

    await client.query('COMMIT');

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

// ============================================
// DELETE /api/orders/:id - Eliminar pedido
// ============================================
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM orders WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Pedido eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
