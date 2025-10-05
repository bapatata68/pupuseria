/**
 * ============================================
 * CONFIGURACIÓN DE BASE DE DATOS
 * ============================================
 * Pool de conexiones a PostgreSQL usando el paquete 'pg'
 * Maneja todas las queries a la base de datos del sistema
 */

const { Pool } = require('pg');

// Configuración del pool de conexiones
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // Necesario para Render y otros servicios cloud
  } : false,
  max: 20, // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000, // Tiempo antes de cerrar conexión idle
  connectionTimeoutMillis: 2000, // Timeout para establecer conexión
});

// Event listeners para debugging
pool.on('connect', () => {
  console.log('✅ Nueva conexión establecida con la base de datos');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en pool de base de datos:', err);
});

// Helper para queries con manejo de errores
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`Query ejecutada en ${duration}ms:`, text.substring(0, 50) + '...');
    return res;
  } catch (error) {
    console.error('❌ Error en query:', error.message);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
};

// Helper para transacciones
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  transaction,
  pool,
  // Exponer métodos del pool para casos específicos
  connect: () => pool.connect(),
  end: () => pool.end()
};
