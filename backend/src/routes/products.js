/**
 * ============================================
 * RUTAS - PRODUCTOS
 * ============================================
 * Manejo de CRUD para productos (pupusas y adicionales)
 * - Listar productos
 * - Crear producto
 * - Actualizar producto
 * - Eliminar producto (con restricción si está en pedidos)
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ============================================
// GET /api/products - Listar todos los productos
// ============================================
// En backend/src/routes/products.js
// ============================================
// GET /api/products - Listar productos únicos (masa maíz)
// ============================================
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        MIN(id) AS id,          -- Tomamos un ID representativo
        name,                   -- Nombre base del producto
        MIN(price) AS price,    -- Precio base (solo para mostrar referencia)
        BOOL_OR(is_small) AS has_small_version, -- Indica si hay versión pequeña
        COUNT(DISTINCT masa) AS masas_disponibles -- Verifica si tiene maíz y arroz
      FROM products
      GROUP BY name
      ORDER BY name;
    `);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    next(error);
  }
});
// Al crear producto, insertar DOS registros (maíz y arroz)
router.post('/', async (req, res, next) => {
  try {
    const { name, price, is_small } = req.body;

    // Insertar para ambas masas
    await db.query('BEGIN');

    const resultMaiz = await db.query(
      `INSERT INTO products (name, masa, price, is_small)
       VALUES ($1, 'maíz', $2, $3) RETURNING *`,
      [name, parseFloat(price), is_small || false]
    );

    await db.query(
      `INSERT INTO products (name, masa, price, is_small)
       VALUES ($1, 'arroz', $2, $3)`,
      [name, parseFloat(price), is_small || false]
    );

    await db.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: resultMaiz.rows[0]
    });
  } catch (error) {
    await db.query('ROLLBACK');
    next(error);
  }
});

// Al actualizar, actualizar AMBAS masas
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, is_small } = req.body;

    // Obtener el nombre actual del producto
    const current = await db.query(
      'SELECT name FROM products WHERE id = $1',
      [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    const currentName = current.rows[0].name;

    // Actualizar TODOS los productos con ese nombre
    const result = await db.query(
      `UPDATE products 
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           is_small = COALESCE($3, is_small)
       WHERE name = $4
       RETURNING *`,
      [name, price ? parseFloat(price) : null, is_small, currentName]
    );

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Al eliminar, eliminar AMBAS masas
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await db.query(
      'SELECT name FROM products WHERE id = $1',
      [id]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    const productName = product.rows[0].name;

    // Verificar que no esté en uso
    const inUse = await db.query(
      `SELECT oi.id FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE p.name = $1 LIMIT 1`,
      [productName]
    );

    if (inUse.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar: producto usado en pedidos existentes'
      });
    }

    // Eliminar AMBAS masas
    await db.query('DELETE FROM products WHERE name = $1', [productName]);

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
});
module.exports = router;
