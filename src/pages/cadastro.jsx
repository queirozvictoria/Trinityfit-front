import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import "./cadastro.css";

export default function Cadastro() {
  const navigate = useNavigate();

  const [tipo, setTipo] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [senha, setSenha] = useState("");

  async function cadastrar(event) {
    event.preventDefault();

    if (!tipo) {
      alert("Escolha Aluno ou Personal.");
      return;
    }

    if (tipo === "aluno") {
      try {
        const resposta = await api.post("/alunos", {
          nome: nome.trim(),
          email: email.trim(),
          telefone: telefone.trim(),
          dataNascimento,
          sexo,
          senha,
        });

        console.log("Aluno cadastrado:", resposta.data);

        alert("Cadastro realizado com sucesso!");

        navigate("/");
      } catch (error) {
        console.error("Erro ao cadastrar aluno:", error);
        console.error("Status:", error.response?.status);
        console.error(
          "Resposta do servidor:",
          error.response?.data
        );

        alert(
          error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          "Erro ao cadastrar aluno."
        );
      }

      return;
    }

    if (tipo === "personal") {
      try {
        const resposta = await api.post("/personal", {
          nome: nome.trim(),
          email: email.trim(),
          telefone: telefone.trim(),
          dataNascimento,
          sexo,
          senha,
        });

        console.log("Personal cadastrado:", resposta.data);

        alert("Cadastro de Personal realizado com sucesso!");

        navigate("/");
      } catch (error) {
        console.error("Erro ao cadastrar personal:", error);
        console.error("Status:", error.response?.status);
        console.error(
          "Resposta do servidor:",
          error.response?.data
        );

        alert(
          error.response?.data?.erro ||
          error.response?.data?.detalhe ||
          "Erro ao cadastrar personal."
        );
      }
    }
  }

  return (
    <main className="cadastro">
      <div className="cadastro-caixa">
        <h1>Criar conta</h1>

        <p className="descricao-cadastro">
          Escolha seu tipo de conta e preencha seus dados
        </p>

        <div className="tipos-cadastro">
          <button
            type="button"
            className={`tipo-cadastro ${
              tipo === "aluno" ? "ativo" : ""
            }`}
            onClick={() => setTipo("aluno")}
          >
            <strong>Aluno</strong>

            <span>
              Acessar meus treinos
            </span>
          </button>

          <button
            type="button"
            className={`tipo-cadastro ${
              tipo === "personal" ? "ativo" : ""
            }`}
            onClick={() => setTipo("personal")}
          >
            <strong>Personal</strong>

            <span>
              Gerenciar meus alunos
            </span>
          </button>
        </div>

        <form
          className="form-cadastro"
          onSubmit={cadastrar}
        >
          <label htmlFor="nome">
            Nome
          </label>

          <input
            id="nome"
            name="nome"
            type="text"
            placeholder="Digite seu nome"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <label htmlFor="email">
            E-mail
          </label>

          <input
            id="email"
            name="email"
            type="email"
            placeholder="Digite seu e-mail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="telefone">
            Telefone
          </label>

          <input
            id="telefone"
            name="telefone"
            type="tel"
            placeholder="Digite seu telefone"
            required
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />

          <label htmlFor="dataNascimento">
            Data de nascimento
          </label>

          <input
            id="dataNascimento"
            name="dataNascimento"
            type="date"
            required
            value={dataNascimento}
            onChange={(e) => setDataNascimento(e.target.value)}
          />

          <label htmlFor="sexo">
            Sexo
          </label>

          <select
            id="sexo"
            name="sexo"
            required
            value={sexo}
            onChange={(e) => setSexo(e.target.value)}
          >
            <option value="">
              Selecione
            </option>

            <option value="feminino">
              Feminino
            </option>

            <option value="masculino">
              Masculino
            </option>

            <option value="outro">
              Outro
            </option>
          </select>

          <label htmlFor="senha">
            Senha
          </label>

          <input
            id="senha"
            name="senha"
            type="password"
            placeholder="Digite sua senha"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <button
            type="submit"
            className="botao-cadastrar"
          >
            Cadastrar
          </button>

          <button
            type="button"
            className="botao-voltar"
            onClick={() => navigate("/")}
          >
            Voltar para o login
          </button>
        </form>
      </div>
    </main>
  );
}
