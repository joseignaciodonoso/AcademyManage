export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen w-full bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="text-5xl">🚫</div>
        <h1 className="text-2xl font-bold">Acceso no autorizado</h1>
        <p className="text-gray-300">
          No tienes permisos para acceder a esta sección del panel. Si crees que es un error,
          contacta al administrador de tu academia.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <a
            href="/auth/signin"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            Iniciar sesión
          </a>
          <a
            href="/"
            className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
