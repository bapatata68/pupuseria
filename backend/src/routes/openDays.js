/**
 * ============================================
 * RUTAS - DÍAS ABIERTOS/CERRADOS
 * ============================================
 * Control de días de operación del negocio
 * - Listar días abiertos/cerrados
 * - Marcar día como abierto o cerrado
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ============================================
// GET /api/open-days - Listar días
// ============================================
router.get('/', async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    let query = 'SELECT * FROM open_days';
    let params = [];

    // Filtrar por rango de fechas si se proporciona
    if (start_date && end_date) {
      query += ' WHERE date BETWEEN $1 AND $2';
      params = [start_date, end_date];
    } else if (start_date) {
      query += ' WHERE date >= $1';
      params = [start_date];
    } else if (end_date) {
      query += ' WHERE date <= $1';
      params = [end_date];
    }

    query += ' ORDER BY date DESC';

    const result = await db.query(query, params);

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
// GET /api/open-days/:date - Obtener estado de un día
// ============================================
router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;

    // Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de fecha inválido (usar YYYY-MM-DD)'
      });
    }

    const result = await db.query(
      'SELECT * FROM open_days WHERE date = $1',
      [date]
    );

    if (result.rows.length === 0) {
      // Si no existe el registro, asumir que está abierto por defecto
      return res.json({
        success: true,
        data: {
          date,
          is_open: true,
          note: 'Sin registro, asumido como abierto'
        }
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
// PUT /api/open-days/:date - Marcar día como abierto/cerrado
// ============================================
router.put('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const { is_open } = req.body;

    // Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de fecha inválido (usar YYYY-MM-DD)'
      });
    }

    // Validar is_open
    if (typeof is_open !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'is_open debe ser true o false'
      });
    }

    // Upsert: insertar o actualizar
    const result = await db.query(
      `INSERT INTO open_days (date, is_open)
       VALUES ($1, $2)
       ON CONFLICT (date) 
       DO UPDATE SET is_open = $2
       RETURNING *`,
      [date, is_open]
    );

    res.json({
      success: true,
      message: `Día marcado como ${is_open ? 'abierto' : 'cerrado'}`,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// POST /api/open-days - Marcar múltiples días
// ============================================
router.post('/', async (req, res, next) => {
  try {
    const { dates } = req.body;

    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de fechas'
      });
    }

    // Insertar/actualizar cada fecha
    const results = [];
    for (const { date, is_open } of dates) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        continue; // Saltar fechas inválidas
      }

      const result = await db.query(
        `INSERT INTO open_days (date, is_open)
         VALUES ($1, $2)
         ON CONFLICT (date) 
         DO UPDATE SET is_open = $2
         RETURNING *`,
        [date, is_open]
      );

      results.push(result.rows[0]);
    }

    res.json({
      success: true,
      message: `${results.length} días actualizados`,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// DELETE /api/open-days/:date - Eliminar registro de día
// ============================================
router.delete('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;

    // Validar formato
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de fecha inválido (usar YYYY-MM-DD)'
      });
    }

    const result = await db.query(
      'DELETE FROM open_days WHERE date = $1 RETURNING *',
      [date]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Registro no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Registro eliminado'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
