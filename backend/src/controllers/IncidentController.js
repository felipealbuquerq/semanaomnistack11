const connection = require('../database/connection');

module.exports = {
    async index(request, response) {
        try {
            const { page = 1 } = request.query;
    
            const [total] = await connection('incidents')
                .count().as("total");
    
            const incidents = await connection('incidents')
                .join('ongs', 'ongs.id', '=', 'incidents.ong_id')
                .limit(5)
                .offset((page - 1) * 5)
                .select(
                    'incidents.*',
                    'ongs.name',
                    'ongs.email',
                    'ongs.whatsapp',
                    'ongs.city',
                    'ongs.uf'
                );
            
            response.header('X-Total-Count', total['count(*)']);
    
            return response.json({ result: incidents, total: total['count(*)'] });            
        } catch (error) {
            console.log(error);
            response.status(500).send();
        }
    },
    async create(request, response) {
        const { title, description, value } = request.body;
        const ong_id = request.headers.authorization;

        const [id] = await connection('incidents').insert({
            title,
            description,
            value,
            ong_id,
        });

        return response.json({ id });
    },
    async delete(request, response) {
        try {
            const { id } = request.params;
            const ong_id = request.headers.authorization;
    
            const incident = await connection('incidents')
                .where('id', id)
                .select('ong_id')
                .first();

            if (!incident || incident.ong_id !== ong_id) {
                return response.status(401).json({ error: 'Operation not permitted.' });
            }
    
            
            await connection('incidents').where('id', id).delete();
    
            return response.status(204).send();                
        } catch (error) {
            console.log(error);

            return response.status(500).send();
        }
    }
}