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
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT 
        id,
        name,
        masa,
        price,
        is_small,
        created_at
      FROM products
      ORDER BY is_small, name, masa`
    );
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET /api/products/:id - Obtener un producto específico
// ============================================
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// POST /api/products - Crear nuevo producto
// ============================================
router.post('/', async (req, res, next) => {
  try {
    const { name, masa, price, is_small } = req.body;
    
    // Validaciones
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y precio son requeridos'
      });
    }
    
    if (price <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El precio debe ser mayor a cero'
      });
    }
    
    if (masa && !['maíz', 'arroz'].includes(masa)) {
      return res.status(400).json({
        success: false,
        error: 'Masa debe ser "maíz" o "arroz"'
      });
    }
    
    const result = await db.query(
      `INSERT INTO products (name, masa, price, is_small)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, masa || null, parseFloat(price), is_small || false]
    );
    
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: result.rows[0]
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
    
    // Verificar que el producto existe
    const exists = await db.query(
      'SELECT id FROM products WHERE id = $1',
      [id]
    );
    
    if (exists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }
    
    // Validaciones
    if (price !== undefined && price <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El precio debe ser mayor a cero'
      });
    }
    
    if (masa && !['maíz', 'arroz'].includes(masa)) {
      return res.status(400).json({
        success: false,
        error: 'Masa debe ser "maíz" o "arroz"'
      });
    }
    
    const result = await db.query(
      `UPDATE products 
       SET name = COALESCE($1, name),
           masa = COALESCE($2, masa),
           price = COALESCE($3, price),
           is_small = COALESCE($4, is_small)
       WHERE id = $5
       RETURNING *`,
      [name, masa, price ? parseFloat(price) : null, is_small, id]
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

// ============================================
// DELETE /api/products/:id - Eliminar producto
// ============================================
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verificar que el producto existe
    const exists = await db.query(
      'SELECT id FROM products WHERE id = $1',
      [id]
    );
    
    if (exists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }
    
    // Verificar que no esté usado en pedidos
    const inUse = await db.query(
      'SELECT id FROM order_items WHERE product_id = $1 LIMIT 1',
      [id]
    );
    
    if (inUse.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar: producto usado en pedidos existentes'
      });
    }
    
    await db.query('DELETE FROM products WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
