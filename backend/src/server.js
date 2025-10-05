/**
 * ============================================
 * SERVIDOR PRINCIPAL - Sistema Pupusería
 * ============================================
 * Servidor Express que maneja todas las operaciones del sistema de ventas
 * - Gestión de productos (pupusas y adicionales)
 * - Registro y edición de pedidos diarios
 * - Cálculo automático de totales y promociones
 * - Reportes y exportación a CSV
 * - Control de días abiertos/cerrados
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const db = require('./config/database');

// Importar rutas
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const reportsRoutes = require('./routes/reports');
const openDaysRoutes = require('./routes/openDays');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARES
// ============================================

// Seguridad básica con helmet
app.use(helmet());

// CORS - permitir peticiones desde el frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parser de JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger simple de requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// RUTAS API
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Pupuseria Sales API'
  });
});

// Rutas principales
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/open-days', openDaysRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API Sistema de Ventas - Pupusería',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      orders: '/api/orders',
      reports: '/api/reports',
      openDays: '/api/open-days',
      health: '/health'
    }
  });
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('ERROR:', err);

  // Error de base de datos
  if (err.code === '23503') {
    return res.status(400).json({
      error: 'No se puede eliminar: elemento usado en otros registros'
    });
  }

  if (err.code === '23505') {
    return res.status(400).json({
      error: 'Registro duplicado'
    });
  }

  // Error genérico
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

// Verificar conexión a base de datos antes de iniciar
db.query('SELECT NOW()')
  .then(() => {
    console.log('✅ Conexión a base de datos establecida');

    app.listen(PORT, () => {
      console.log('🚀 Servidor corriendo en puerto:', PORT);
      console.log('📊 Ambiente:', process.env.NODE_ENV || 'development');
      console.log('🌐 API disponible en: http://localhost:' + PORT);
    });
  })
  .catch(err => {
    console.error('❌ Error conectando a base de datos:', err);
    process.exit(1);
  });

// Manejo graceful de shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  db.end(() => {
    console.log('Pool de base de datos cerrado');
    process.exit(0);
  });
});

module.exports = app;
