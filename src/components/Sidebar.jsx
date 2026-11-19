
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import "./Sidebar.css";

const menus = {
  Personal: [
    { nome: "Início", caminho: "/personal", icone: "⌂" },
    { nome: "Meus alunos", caminho: "/meus-alunos", icone: "♙" },
    { nome: "Minha agenda", caminho: "/minha-agenda", icone: "▦" },
    { nome: "Disponibilidade", caminho: "/disponibilidade", icone: "◷" },
    { nome: "Agendar horário", caminho: "/agendar", icone: "＋" },
    { nome: "Planilhas de treino", caminho: "/planilhas", icone: "▤" },
  ],

  Aluno: [
    { nome: "Início", caminho: "/aluno", icone: "⌂" },
    { nome: "Agendar horário", caminho: "/agendar-aluno", icone: "＋" },
    {
      nome: "Meus horários",
      caminho: "/meus-horarios-aluno",
      icone: "▦",
    },
    {
      nome: "Minha planilha",
      caminho: "/minha-planilha-de-treino",
      icone: "▤",
    },
  ],
};

export default function Sidebar() {
  const [aberta, setAberta] = useState(false);
  const navigate = useNavigate();

  let usuario = {};

  try {
    usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
  } catch {
    usuario = {};
  }

  const tipoOriginal = String(usuario.tipo ?? "").toLowerCase();

  const tipo = tipoOriginal.includes("personal")
    ? "Personal"
    : "Aluno";

  const nome =
    usuario.nome ||
    usuario.nomePersonal ||
    usuario.nomeAluno ||
    "Usuário";

  const itensMenu = menus[tipo];

  function sair() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setAberta(false);
    navigate("/");
  }

  function fecharMenu() {
    setAberta(false);
  }

  return (
    <>
      <button
        className="sidebar-hamburguer"
        type="button"
        onClick={() => setAberta(!aberta)}
        aria-label="Abrir ou fechar menu"
        aria-expanded={aberta}
      >
        <span />
        <span />
        <span />
      </button>

      {aberta && (
        <div
          className="sidebar-overlay"
          onClick={fecharMenu}
        />
      )}

      <aside className={`sidebar ${aberta ? "sidebar-aberta" : ""}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icone">FIT</div>

          <div>
            <h2>TrinityFit</h2>
            <span>Gestão de treinos</span>
          </div>
        </div>

        <div className="sidebar-perfil">
          <div className="sidebar-avatar">
            {nome.charAt(0).toUpperCase()}
          </div>

          <div className="sidebar-perfil-info">
            <strong>{nome}</strong>
            <span>{tipo}</span>
          </div>
        </div>

        <div className="sidebar-separador" />

        <nav className="sidebar-navegacao">
          <span className="sidebar-titulo-menu">
            MENU PRINCIPAL
          </span>

          {itensMenu.map((item) => (
            <NavLink
              key={item.caminho}
              to={item.caminho}
              end={
                item.caminho === "/personal" ||
                item.caminho === "/aluno"
              }
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "sidebar-link-ativo" : ""}`
              }
              onClick={fecharMenu}
            >
              <span className="sidebar-icone">{item.icone}</span>
              <span>{item.nome}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-rodape">
          <button
            type="button"
            className="sidebar-sair"
            onClick={sair}
          >
            <span className="sidebar-icone">↪</span>
            Sair da conta
          </button>

          <span className="sidebar-versao">
            Trinityfit © 2026
          </span>
        </div>
      </aside>
    </>
  );
}
;