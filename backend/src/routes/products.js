/**
 * ============================================
 * RUTAS - PRODUCTOS
 * ============================================
 * Manejo de CRUD para productos (pupusas y adicionales)
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ============================================
// GET /api/products - Listar productos únicos
// ============================================
// ============================================
// GET /api/products - Listar productos únicos (SIN duplicados por masa)
// ============================================
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT ON (name)
        id,
        name,
        price,
        is_small
      FROM products
      ORDER BY name, id
    `);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
});
// ============================================
// POST /api/products - Crear producto
// ============================================
router.post('/', async (req, res, next) => {
  try {
    const { name, masa, price, is_small } = req.body;

    // Si el usuario no seleccionó masa, guardar como null
    const masaValue = masa && masa.trim() !== '' ? masa : null;

    const result = await db.query(
      `INSERT INTO products (name, masa, price, is_small)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, masaValue, parseFloat(price), is_small || false]
    );

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// PUT /api/products/:id - Actualizar producto
// ============================================
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, masa, price, is_small } = req.body;

    const masaValue = masa && masa.trim() !== '' ? masa : null;

    const result = await db.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           masa = $2,
           price = COALESCE($3, price),
           is_small = COALESCE($4, is_small)
       WHERE id = $5
       RETURNING *`,
      [name, masaValue, price ? parseFloat(price) : null, is_small, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// DELETE /api/products/:id - Eliminar producto
// ============================================
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar si existe
    const product = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado',
      });
    }

    const productName = product.rows[0].name;

    // Verificar si está en uso
    const inUse = await db.query(
      `SELECT oi.id FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE p.name = $1
       LIMIT 1`,
      [productName]
    );

    if (inUse.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar: producto usado en pedidos existentes',
      });
    }

    await db.query('DELETE FROM products WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
});
module.exports = router;
