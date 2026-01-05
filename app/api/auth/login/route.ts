import { NextRequest, NextResponse } from "next/server"

// Simple HTML login page that doesn't use React components
// This is a workaround for the "Invalid URL" error in NextAuth
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const callbackUrl = searchParams.get("callbackUrl") || "/app"
  const error = searchParams.get("error") || ""

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Iniciar Sesión - Academia</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      padding: 1rem;
    }
    .card {
      background: white;
      border-radius: 1rem;
      padding: 2.5rem;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .logo {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }
    h1 { 
      text-align: center;
      font-size: 1.5rem; 
      font-weight: 700; 
      margin-bottom: 0.5rem;
      color: #1e293b;
    }
    .subtitle {
      text-align: center;
      color: #64748b;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }
    .error {
      background: #fee2e2;
      color: #dc2626;
      padding: 0.75rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }
    label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
      font-size: 1rem;
      transition: border-color 0.2s;
    }
    input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    button {
      width: 100%;
      padding: 0.875rem;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.4);
    }
    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }
    .links {
      margin-top: 1.5rem;
      text-align: center;
    }
    .links a {
      color: #3b82f6;
      text-decoration: none;
      font-size: 0.875rem;
    }
    .links a:hover {
      text-decoration: underline;
    }
    .spinner {
      display: none;
      width: 20px;
      height: 20px;
      border: 2px solid #ffffff40;
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 0.5rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .loading .spinner { display: inline-block; }
    .loading button { opacity: 0.8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🥋</div>
    <h1>Iniciar Sesión</h1>
    <p class="subtitle">Ingresa tus credenciales para acceder</p>
    
    ${error ? `<div class="error">${error === "CredentialsSignin" ? "Credenciales inválidas" : error}</div>` : ""}
    
    <form id="loginForm" action="/api/auth/callback/credentials" method="POST">
      <input type="hidden" name="csrfToken" value="">
      <input type="hidden" name="callbackUrl" value="${callbackUrl}">
      <input type="hidden" name="json" value="true">
      
      <label for="email">Correo Electrónico</label>
      <input type="email" id="email" name="email" placeholder="tu@email.com" required>
      
      <label for="password">Contraseña</label>
      <input type="password" id="password" name="password" placeholder="••••••••" required>
      
      <button type="submit">
        <span class="spinner"></span>
        <span class="text">Iniciar Sesión</span>
      </button>
    </form>
    
    <div class="links">
      <a href="/">Volver al inicio</a>
    </div>
  </div>

  <script>
    // Get CSRF token
    fetch('/api/auth/csrf')
      .then(r => r.json())
      .then(data => {
        document.querySelector('input[name="csrfToken"]').value = data.csrfToken;
      });

    // Handle form submission
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const form = this;
      const button = form.querySelector('button');
      const card = document.querySelector('.card');
      
      card.classList.add('loading');
      button.disabled = true;
      button.querySelector('.text').textContent = 'Iniciando sesión...';
      
      try {
        const formData = new FormData(form);
        const response = await fetch('/api/auth/callback/credentials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(formData),
          redirect: 'follow'
        });
        
        if (response.ok || response.redirected) {
          window.location.href = formData.get('callbackUrl') || '/app';
        } else {
          window.location.href = '/api/auth/login?error=CredentialsSignin&callbackUrl=' + encodeURIComponent(formData.get('callbackUrl'));
        }
      } catch (err) {
        window.location.href = '/api/auth/login?error=Error&callbackUrl=' + encodeURIComponent(form.querySelector('input[name="callbackUrl"]').value);
      }
    });
  </script>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  })
}
