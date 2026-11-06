import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

const API_URL = "http://localhost:3000";

function Login() {
    const navigate = useNavigate();

    const [tipoUsuario, setTipoUsuario] = useState("aluno");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState("");

    const entrar = async (e) => {
        e.preventDefault();
        setErro("");

        try {
            setCarregando(true);

            const rotaLogin =
                tipoUsuario === "aluno"
                    ? "/alunos/login"
                    : "/personal/login";

            const response = await fetch(`${API_URL}${rotaLogin}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    senha
                })
            });

            const dados = await response.json();

            if (!response.ok) {
                throw new Error(
                    dados.erro || "Não foi possível realizar o login."
                );
            }

            if (!dados.usuario) {
                throw new Error("Dados do usuário não encontrados.");
            }

            if (
                tipoUsuario === "aluno" &&
                !dados.usuario.codigoAluno
            ) {
                throw new Error("Código do aluno não encontrado.");
            }

            if (
                tipoUsuario === "personal" &&
                !dados.usuario.codigoPersonal
            ) {
                throw new Error("Código do personal não encontrado.");
            }

            localStorage.setItem(
                "usuario",
                JSON.stringify(dados.usuario)
            );

            if (tipoUsuario === "aluno") {
                navigate("/aluno");
            } else {
                navigate("/personal");
            }

        } catch (error) {
            console.error("Erro ao realizar login:", error);
            setErro(error.message || "Erro ao conectar com o servidor.");
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="login">
            <h1>Bem-vindo!</h1>

            <p className="descricao">
                Entre na sua conta para continuar.
            </p>

            <div className="tipos">
                <button
                    type="button"
                    className={`tipo ${tipoUsuario === "aluno" ? "ativo" : ""}`}
                    onClick={() => {
                        setTipoUsuario("aluno");
                        setErro("");
                    }}
                >
                    <strong>Aluno</strong>
                    <span>Acessar como aluno</span>
                </button>

                <button
                    type="button"
                    className={`tipo ${tipoUsuario === "personal" ? "ativo" : ""}`}
                    onClick={() => {
                        setTipoUsuario("personal");
                        setErro("");
                    }}
                >
                    <strong>Personal</strong>
                    <span>Acessar como personal</span>
                </button>
            </div>

            <form onSubmit={entrar}>
                <label htmlFor="email">E-mail</label>

                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    required
                    disabled={carregando}
                />

                <label htmlFor="senha">Senha</label>

                <input
                    id="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    disabled={carregando}
                />

                {erro && (
                    <p className="erro-login">
                        {erro}
                    </p>
                )}

                <button
                    type="submit"
                    className="entrar"
                    disabled={carregando}
                >
                    {carregando ? "Entrando..." : "Entrar"}
                </button>

                <button
                    type="button"
                    className="cadastrar"
                    onClick={() => navigate("/cadastro")}
                    disabled={carregando}
                >
                    Cadastrar-se
                </button>
            </form>
        </div>
    );
}

export default Login;