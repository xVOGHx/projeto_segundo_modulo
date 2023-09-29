const { sign, verify} = require("jsonwebtoken");

const createTokens = (user) => {
    const acessToken = sign({nome: user.nome, id: user.id},
        "jwtsecret");

    return acessToken;
}

const validaToken = (req, res, next) => {
    const acessToken = req.cookies["acess-token"];
    if(!acessToken) return res.status(404).json("Usuario não autenticado");
    
    try {
        const validToken = verify(acessToken, "jwtsecret");
        if(validToken){
            req.authenticated = true;
            return next();
        }
    } catch (error) {
        return res.status(404).json("Erro")
    }
}

module.exports = { createTokens, validaToken }