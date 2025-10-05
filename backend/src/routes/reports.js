/**
 * ============================================
 * RUTAS - REPORTES
 * ============================================
 * Generación de reportes diarios y exportación a CSV
 * - Resumen de ventas por día
 * - Totales por producto
 * - Exportación en formato CSV
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ============================================
// GET /api/reports/daily/:date - Reporte diario
// ============================================
router.get('/daily/:date', async (req, res, next) => {
  try {
    const { date } = req.params;

    // Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de fecha inválido (usar YYYY-MM-DD)'
      });
    }

    // 1. Totales generales del día
    const totalsResult = await db.query(
      `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_sales,
        COALESCE(SUM(delivery_cost), 0) as total_delivery,
        COUNT(CASE WHEN is_delivery THEN 1 END) as delivery_orders
      FROM orders
      WHERE business_day = $1`,
      [date]
    );

    const totals = totalsResult.rows[0];

    // 2. Resumen por producto
    const productSummary = await db.query(
      `SELECT 
        p.name as product_name,
        oi.masa,
        p.is_small,
        SUM(oi.quantity) as total_quantity,
        AVG(oi.unit_price) as avg_price,
        SUM(oi.line_total) as total_sales
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.business_day = $1
      GROUP BY p.name, oi.masa, p.is_small
      ORDER BY total_sales DESC`,
      [date]
    );

    // 3. Top 5 productos más vendidos
    const topProducts = await db.query(
      `SELECT 
        p.name as product_name,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.line_total) as total_sales
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.business_day = $1
      GROUP BY p.name
      ORDER BY total_quantity DESC
      LIMIT 5`,
      [date]
    );

    res.json({
      success: true,
      data: {
        date,
        totals: {
          orders: parseInt(totals.total_orders),
          sales: parseFloat(totals.total_sales),
          delivery: parseFloat(totals.total_delivery),
          delivery_orders: parseInt(totals.delivery_orders)
        },
        products: productSummary.rows.map(row => ({
          name: row.product_name,
          masa: row.masa,
          is_small: row.is_small,
          quantity: parseInt(row.total_quantity),
          avg_price: parseFloat(row.avg_price),
          total: parseFloat(row.total_sales)
        })),
        top_products: topProducts.rows.map(row => ({
          name: row.product_name,
          quantity: parseInt(row.total_quantity),
          total: parseFloat(row.total_sales)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET /api/reports/daily/:date/export - Exportar CSV
// ============================================
router.get('/daily/:date/export', async (req, res, next) => {
  try {
    const { date } = req.params;

    // Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de fecha inválido (usar YYYY-MM-DD)'
      });
    }

    // Obtener todos los pedidos del día con sus ítems
    const result = await db.query(
      `SELECT 
        o.id as order_id,
        o.business_day,
        p.name as product_name,
        oi.masa,
        oi.quantity,
        oi.unit_price,
        oi.line_total,
        o.is_delivery,
        o.delivery_cost,
        o.total as order_total,
        o.created_at
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON p.id = oi.product_id
      WHERE o.business_day = $1
      ORDER BY o.id, oi.id`,
      [date]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No hay pedidos para esta fecha'
      });
    }

    // Construir CSV
    const headers = [
      'Fecha',
      'Pedido',
      'Producto',
      'Masa',
      'Cantidad',
      'Precio Unit.',
      'Subtotal',
      'Entrega',
      'Costo Envío',
      'Total Pedido'
    ];

    let csvContent = headers.join(',') + '\n';

    result.rows.forEach(row => {
      csvContent += [
        row.business_day,
        row.order_id,
        `"${row.product_name}"`, // Comillas para manejar comas en nombres
        row.masa,
        row.quantity,
        row.unit_price.toFixed(2),
        row.line_total.toFixed(2),
        row.is_delivery ? 'Sí' : 'No',
        row.delivery_cost.toFixed(2),
        row.order_total.toFixed(2)
      ].join(',') + '\n';
    });

    // Agregar resumen al final
    const totalSales = result.rows.reduce((sum, row) => {
      // Sumar solo una vez por pedido único
      const orderIds = new Set();
      return sum + (orderIds.has(row.order_id) ? 0 : parseFloat(row.order_total));
    }, 0);

    const uniqueOrders = [...new Set(result.rows.map(r => r.order_id))].length;

    csvContent += '\n';
    csvContent += `RESUMEN DEL DÍA\n`;
    csvContent += `Total de pedidos:,${uniqueOrders}\n`;
    csvContent += `Total de ventas:,$${totalSales.toFixed(2)}\n`;

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=ventas_${date}.csv`);

    // Agregar BOM para UTF-8 (ayuda con acentos en Excel)
    res.write('\uFEFF');
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
});

// ============================================
// GET /api/reports/summary - Resumen general
// ============================================
router.get('/summary', async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    // Si no se proporcionan fechas, usar últimos 7 días
    const endDate = end_date || new Date().toISOString().split('T')[0];
    const startDate = start_date ||
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Ventas por día en el rango
    const dailySales = await db.query(
      `SELECT 
        business_day,
        COUNT(*) as orders,
        SUM(total) as sales
      FROM orders
      WHERE business_day BETWEEN $1 AND $2
      GROUP BY business_day
      ORDER BY business_day DESC`,
      [startDate, endDate]
    );

    // Totales del período
    const periodTotals = await db.query(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(total) as total_sales,
        AVG(total) as avg_order_value
      FROM orders
      WHERE business_day BETWEEN $1 AND $2`,
      [startDate, endDate]
    );

    res.json({
      success: true,
      data: {
        period: {
          start: startDate,
          end: endDate
        },
        totals: periodTotals.rows[0],
        daily_sales: dailySales.rows
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
