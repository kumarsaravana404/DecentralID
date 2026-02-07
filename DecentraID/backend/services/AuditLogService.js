const { supabase } = require('../supabaseClient');

/**
 * Supabase Service for Audit Logs
 * Replaces the Mongoose AuditLog model
 */

class AuditLogService {
    /**
     * Create a new audit log entry
     * @param {Object} logData - { did, action, details, txHash }
     * @returns {Promise<Object>}
     */
    static async create(logData) {
        const { data, error } = await supabase
            .from('audit_logs')
            .insert([{
                did: logData.did,
                action: logData.action,
                details: logData.details,
                tx_hash: logData.txHash || 'OFF-CHAIN',
                timestamp: logData.timestamp || new Date().toISOString()
            }])
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create audit log: ${error.message}`);
        }

        return data;
    }

    /**
     * Find audit logs with optional filtering
     * @param {Object} query - { did } (optional)
     * @param {Object} options - { limit, sort }
     * @returns {Promise<Array>}
     */
    static async find(query = {}, options = {}) {
        let queryBuilder = supabase.from('audit_logs').select('*');

        // Apply filters
        if (query.did) {
            queryBuilder = queryBuilder.eq('did', query.did);
        }

        // Apply sorting
        const sortField = options.sort?.timestamp === -1 ? 'timestamp' : 'timestamp';
        const sortOrder = options.sort?.timestamp === -1 ? { ascending: false } : { ascending: true };
        queryBuilder = queryBuilder.order(sortField, sortOrder);

        // Apply limit
        if (options.limit) {
            queryBuilder = queryBuilder.limit(options.limit);
        }

        const { data, error } = await queryBuilder;

        if (error) {
            throw new Error(`Failed to fetch audit logs: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Find a single audit log
     * @param {Object} query
     * @returns {Promise<Object|null>}
     */
    static async findOne(query) {
        let queryBuilder = supabase.from('audit_logs').select('*');

        Object.keys(query).forEach(key => {
            queryBuilder = queryBuilder.eq(key, query[key]);
        });

        const { data, error } = await queryBuilder.single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw new Error(`Failed to fetch audit log: ${error.message}`);
        }

        return data;
    }

    /**
     * Delete audit logs older than specified days
     * @param {number} days
     * @returns {Promise<number>}
     */
    static async deleteOlderThan(days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const { data, error } = await supabase
            .from('audit_logs')
            .delete()
            .lt('timestamp', cutoffDate.toISOString())
            .select();

        if (error) {
            throw new Error(`Failed to delete old audit logs: ${error.message}`);
        }

        return data?.length || 0;
    }
}

module.exports = AuditLogService;
