const { supabase } = require('../supabaseClient');

/**
 * Supabase Service for Gasless Identities
 * Replaces the Mongoose GaslessIdentity model
 */

class GaslessIdentityService {
    /**
     * Create a new gasless identity
     * @param {Object} identityData - { shareHash, did, encryptedData, ipfsHash, onChainStatus }
     * @returns {Promise<Object>}
     */
    static async create(identityData) {
        const { data, error } = await supabase
            .from('gasless_identities')
            .insert([{
                share_hash: identityData.shareHash,
                did: identityData.did,
                encrypted_data: identityData.encryptedData,
                ipfs_hash: identityData.ipfsHash,
                on_chain_status: identityData.onChainStatus || 'PENDING',
                access_count: 0
            }])
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create gasless identity: ${error.message}`);
        }

        return this._mapToObject(data);
    }

    /**
     * Find a gasless identity by query
     * @param {Object} query - { shareHash, did, onChainStatus }
     * @returns {Promise<Object|null>}
     */
    static async findOne(query) {
        let queryBuilder = supabase.from('gasless_identities').select('*');

        // Map camelCase to snake_case for database columns
        const columnMap = {
            shareHash: 'share_hash',
            did: 'did',
            onChainStatus: 'on_chain_status',
            anchoredBy: 'anchored_by'
        };

        Object.keys(query).forEach(key => {
            const dbColumn = columnMap[key] || key;
            queryBuilder = queryBuilder.eq(dbColumn, query[key]);
        });

        const { data, error } = await queryBuilder.single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw new Error(`Failed to fetch gasless identity: ${error.message}`);
        }

        return data ? this._mapToObject(data) : null;
    }

    /**
     * Update a gasless identity
     * @param {string} shareHash
     * @param {Object} updates
     * @returns {Promise<Object>}
     */
    static async update(shareHash, updates) {
        const updateData = {};
        
        // Map camelCase to snake_case
        if (updates.onChainStatus !== undefined) updateData.on_chain_status = updates.onChainStatus;
        if (updates.anchoredBy !== undefined) updateData.anchored_by = updates.anchoredBy;
        if (updates.txHash !== undefined) updateData.tx_hash = updates.txHash;
        if (updates.anchoredAt !== undefined) updateData.anchored_at = updates.anchoredAt;
        if (updates.accessCount !== undefined) updateData.access_count = updates.accessCount;

        const { data, error } = await supabase
            .from('gasless_identities')
            .update(updateData)
            .eq('share_hash', shareHash)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update gasless identity: ${error.message}`);
        }

        return this._mapToObject(data);
    }

    /**
     * Increment access count for a gasless identity
     * @param {string} shareHash
     * @returns {Promise<Object>}
     */
    static async incrementAccessCount(shareHash) {
        // First get current count
        const identity = await this.findOne({ shareHash });
        if (!identity) {
            throw new Error('Identity not found');
        }

        const newCount = (identity.accessCount || 0) + 1;

        const { data, error } = await supabase
            .from('gasless_identities')
            .update({ access_count: newCount })
            .eq('share_hash', shareHash)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to increment access count: ${error.message}`);
        }

        return this._mapToObject(data);
    }

    /**
     * Find all gasless identities matching query
     * @param {Object} query
     * @param {Object} options - { limit, sort }
     * @returns {Promise<Array>}
     */
    static async find(query = {}, options = {}) {
        let queryBuilder = supabase.from('gasless_identities').select('*');

        // Apply filters
        const columnMap = {
            shareHash: 'share_hash',
            did: 'did',
            onChainStatus: 'on_chain_status',
            anchoredBy: 'anchored_by'
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
            throw new Error(`Failed to fetch gasless identities: ${error.message}`);
        }

        return (data || []).map(item => this._mapToObject(item));
    }

    /**
     * Delete a gasless identity
     * @param {string} shareHash
     * @returns {Promise<boolean>}
     */
    static async delete(shareHash) {
        const { error } = await supabase
            .from('gasless_identities')
            .delete()
            .eq('share_hash', shareHash);

        if (error) {
            throw new Error(`Failed to delete gasless identity: ${error.message}`);
        }

        return true;
    }

    /**
     * Map database object to camelCase with save method
     * @private
     */
    static _mapToObject(data) {
        if (!data) return null;

        const obj = {
            id: data.id,
            shareHash: data.share_hash,
            did: data.did,
            encryptedData: data.encrypted_data,
            ipfsHash: data.ipfs_hash,
            onChainStatus: data.on_chain_status,
            anchoredBy: data.anchored_by,
            txHash: data.tx_hash,
            accessCount: data.access_count || 0,
            createdAt: data.created_at,
            anchoredAt: data.anchored_at,
            updatedAt: data.updated_at
        };

        // Add save method for compatibility with Mongoose-style code
        obj.save = async function() {
            return await GaslessIdentityService.update(this.shareHash, {
                onChainStatus: this.onChainStatus,
                anchoredBy: this.anchoredBy,
                txHash: this.txHash,
                anchoredAt: this.anchoredAt,
                accessCount: this.accessCount
            });
        };

        return obj;
    }
}

module.exports = GaslessIdentityService;
