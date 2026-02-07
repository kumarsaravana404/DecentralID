const { supabase } = require('../supabaseClient');

/**
 * Supabase Service for Verification Requests
 * Replaces the Mongoose VerificationRequest model
 */

class VerificationRequestService {
    /**
     * Create a new verification request
     * @param {Object} requestData - { requestId, verifierDid, userDid, purpose, status }
     * @returns {Promise<Object>}
     */
    static async create(requestData) {
        const { data, error } = await supabase
            .from('verification_requests')
            .insert([{
                request_id: requestData.requestId,
                verifier_did: requestData.verifierDid,
                user_did: requestData.userDid,
                purpose: requestData.purpose,
                status: requestData.status || 'PENDING'
            }])
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create verification request: ${error.message}`);
        }

        return data;
    }

    /**
     * Find a verification request by query
     * @param {Object} query - { requestId, verifierDid, userDid, status }
     * @returns {Promise<Object|null>}
     */
    static async findOne(query) {
        let queryBuilder = supabase.from('verification_requests').select('*');

        // Map camelCase to snake_case for database columns
        const columnMap = {
            requestId: 'request_id',
            verifierDid: 'verifier_did',
            userDid: 'user_did',
            status: 'status'
        };

        Object.keys(query).forEach(key => {
            const dbColumn = columnMap[key] || key;
            queryBuilder = queryBuilder.eq(dbColumn, query[key]);
        });

        const { data, error } = await queryBuilder.single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw new Error(`Failed to fetch verification request: ${error.message}`);
        }

        // Convert snake_case back to camelCase for consistency
        if (data) {
            return {
                id: data.id,
                requestId: data.request_id,
                verifierDid: data.verifier_did,
                userDid: data.user_did,
                purpose: data.purpose,
                status: data.status,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                // Add save method for compatibility
                save: async function() {
                    return await VerificationRequestService.update(this.requestId, {
                        status: this.status
                    });
                }
            };
        }

        return null;
    }

    /**
     * Update a verification request
     * @param {number} requestId
     * @param {Object} updates - { status }
     * @returns {Promise<Object>}
     */
    static async update(requestId, updates) {
        const updateData = {};
        
        if (updates.status) updateData.status = updates.status;

        const { data, error } = await supabase
            .from('verification_requests')
            .update(updateData)
            .eq('request_id', requestId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update verification request: ${error.message}`);
        }

        return data;
    }

    /**
     * Find all verification requests matching query
     * @param {Object} query
     * @param {Object} options - { limit, sort }
     * @returns {Promise<Array>}
     */
    static async find(query = {}, options = {}) {
        let queryBuilder = supabase.from('verification_requests').select('*');

        // Apply filters
        const columnMap = {
            requestId: 'request_id',
            verifierDid: 'verifier_did',
            userDid: 'user_did',
            status: 'status'
        };

        Object.keys(query).forEach(key => {
            const dbColumn = columnMap[key] || key;
            queryBuilder = queryBuilder.eq(dbColumn, query[key]);
        });

        // Apply sorting
        if (options.sort) {
            const sortField = Object.keys(options.sort)[0];
            const sortOrder = options.sort[sortField] === -1 ? { ascending: false } : { ascending: true };
            queryBuilder = queryBuilder.order(sortField, sortOrder);
        }

        // Apply limit
        if (options.limit) {
            queryBuilder = queryBuilder.limit(options.limit);
        }

        const { data, error } = await queryBuilder;

        if (error) {
            throw new Error(`Failed to fetch verification requests: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Delete a verification request
     * @param {number} requestId
     * @returns {Promise<boolean>}
     */
    static async delete(requestId) {
        const { error } = await supabase
            .from('verification_requests')
            .delete()
            .eq('request_id', requestId);

        if (error) {
            throw new Error(`Failed to delete verification request: ${error.message}`);
        }

        return true;
    }
}

module.exports = VerificationRequestService;
