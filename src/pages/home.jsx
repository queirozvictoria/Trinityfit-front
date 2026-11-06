
function Home({ mudarTela, nomeUsuario = "Aluno" }) {
  const menuItens = [
    {
      nome: "Agenda",
      sub: "Seus horários",
      icone: "📅",
      tela: "agenda",
    },
    {
      nome: "Plano",
      sub: "Seu programa",
      icone: "📋",
      tela: "plano",
    },
    {
      nome: "Treino",
      sub: "Começar agora",
      icone: "🏋️",
      tela: "treino",
    },
    {
      nome: "Progresso",
      sub: "Sua evolução",
      icone: "📈",
      tela: "progresso",
    },
  ];

  return (
    <main className="tela">
      {/* Cabeçalho */}
      <header className="home-topo">
        <div>
          <p className="saudacao-pequena">
            Bem-vindo(a) de volta
          </p>

          <h2 className="saudacao-nome">
            {nomeUsuario}
          </h2>
        </div>

        <div className="avatar" aria-label="Avatar do usuário">
          {nomeUsuario.charAt(0).toUpperCase()}
        </div>
      </header>

      {/* Treino de hoje */}
      <section className="card-destaque">
        <p className="card-label">Treino de hoje</p>
        <p className="card-titulo">Pernas &amp; Core</p>
      </section>

      {/* Menu principal */}
      <nav className="menu-grade" aria-label="Menu principal">
        {menuItens.map((item) => (
          <button
            className="menu-card"
            key={item.nome}
            type="button"
            onClick={() => mudarTela(item.tela)}
            aria-label={`${item.nome}: ${item.sub}`}
          >
            <span className="menu-icone" aria-hidden="true">
              {item.icone}
            </span>

            <span className="menu-nome">{item.nome}</span>

            <span className="menu-sub">{item.sub}</span>
          </button>
        ))}
      </nav>

      {/* Sair */}
      <button
        className="btn-sair"
        type="button"
        onClick={() => mudarTela("login")}
      >
        Sair
      </button>
    </main>
  );
}

export default Home;
