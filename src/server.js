const express = require('express');
const { PrismaClient } = require("@prisma/client");
const cookieParser = require("cookie-parser"); // Corrigido de coockieParser para cookieParser
const bcrypt = require("bcrypt");
const jwt = require("./jwt"); // Corrigido de {createTokens, validaToken} para jwt

const app = express();
app.use(express.json());

app.use(cookieParser()); // Corrigido de coockieParser para cookieParser

const prisma = new PrismaClient();

app.post("/register", async (req, res) => {
    try {
        const { email, nome, senha } = req.body; // Adicionado destructuring dos dados do usuário

        const userExist = await prisma.user.findFirst({
            where: {
                email,
            },
        });

        if (userExist) {
            return res.status(400).json({ error: "Email already in use" });
        } else {
            const pSenha = await bcrypt.hash(senha, 10);

            const user = await prisma.user.create({
                data: {
                    email,
                    nome,
                    senha: pSenha,
                },
            });

            const token = jwt.createTokens({ userId: user.id }); 

            res.json({ Mensagem: "User registered successfully!", token });
        }
    } catch (error) {
        res.json({ error });
    }
})

app.post("/login", async (req, res) => {
    const { nome, senha } = req.body;
    const user = await prisma.user.findFirst({
        where: { nome },
    });
    if (!user) {
        res.status(404).json({ error: "Esse usuario não existe" });
    }
    const pSenha = user.senha;
    bcrypt.compare(senha, pSenha).then((match) => {
        if (!match) {
            res.json({ error: "senha incorreta" });
        } else {
            const acessToken = jwt.createTokens(user); 
            res.cookie("acess-token", acessToken, {
                httpOnly: false,
            });
            res.json("Logged In");
        }
    });
});

app.get("/searchUser/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id, 10) },
        });
        res.json(user);
    } catch (error) {
        res.json(error);
    }
});

app.get("/searchUsers", async (req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
});

app.put("/updateUser/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email } = req.body;

        let user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
        });
        if (!user) {
            return res.json({ error: "ERROR: Usuario não existente" })
        }

        user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { nome, email },
            select: {
                nome: true,
                email: true
            }
        });

        res.json(user); // Adicionado retorno do usuário atualizado
    } catch (error) {
        res.json(error)
    }
});

app.delete("/deleteUser/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
        });

        if (!user) {
            return res.json({ error: "ERROR: esse usuario não existe" })
        }

        await prisma.user.delete({
            where: { id: parseInt(id) }
        });
        return res.json("usuario deletado, com sucesso")

    } catch (error) {
        res.json(error);
    }
})

app.get("/perfil", jwt.validaToken, (req, res) => { // Corrigido de validaToken para jwt.validaToken
    res.json("entrou no perfil");
});

app.listen(8080, () => {
    console.log("rodando na porta 8080")
});
