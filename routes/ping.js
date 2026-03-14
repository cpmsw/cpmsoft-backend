module.exports = async function (fastify) {
    fastify.get('/ping', {
        config: {
            rateLimit: {
                max: 30,
                timeWindow: '1 minute'
            }
        }
    }, async () => {
        return {
            status: 'ok',
            service: 'cpmsoft-api',
            timestamp: new Date().toISOString()
        };
    });
};
//test123