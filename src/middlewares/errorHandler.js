// Último middleware de la cadena: atrapa cualquier error que llegue con next(error).
// Un id mal formado (CastError) es un error del cliente, no del servidor.
const errorHandler = (error, req, res, next) => {
    if (error.name === 'CastError') {
        return res.status(400).send({ status: 'error', error: `Invalid id: ${error.value}` });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).send({ status: 'error', error: error.message });
    }
    console.error(error);
    res.status(500).send({ status: 'error', error: 'Internal server error' });
};

export default errorHandler;
