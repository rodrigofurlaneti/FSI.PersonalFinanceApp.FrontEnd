// assets/js/auth/login.js
const loginUrl = API_ROUTES.AUTHENTICATION_CREATE;
// Ajuste a porta/base conforme seu back-end.

document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();

  const body = {
    username: e.target.username.value.trim(),
    password: e.target.password.value
  };

  toggleLoading(true);

  try {
    const resp = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    // 400 → ModelState; 201 → Created; 200 → Ok (caso vc mude no controller)
    if (!resp.ok) throw await resp.json();

    // No controller o método Create devolve 201 + AuthenticationDto no body
    const dto = await resp.json();

    if (!dto.isAuthentication) {
      throw { errorMessage: dto.errorMessage ?? "Falha de autenticação." };
    }

    /* ------------------------------------------------------------------
       Onde/quando guardar o estado? 
       • Token/JWT → dto.token (quando vc incluir). 
       • Expiração  → dto.expiration
       ------------------------------------------------------------------ */
    localStorage.setItem("mealtracker:user", JSON.stringify({
      username: dto.username,
      expiration: dto.expiration
    }));

    // Redireciona para home ou página protegida
    window.location.hash = "dashboard/home";
  }
  catch (err) {
    console.error(err);
    document.getElementById("loginError").textContent =
      err.errorMessage || "Erro ao efetuar login.";
    document.getElementById("loginError").hidden = false;
  }
  finally {
    toggleLoading(false);
  }
});

function toggleLoading(state) {
  document.getElementById("btnLogin").disabled = state;
}

function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === "password" ? "text" : "password";
}

document.querySelectorAll("#loginForm input").forEach(input => {
  input.addEventListener("input", () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const button = document.getElementById("btnLogin");
    
    button.disabled = !(username && password.length >= 6);
  });
});