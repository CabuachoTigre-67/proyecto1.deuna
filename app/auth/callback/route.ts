import { createClient } from '@/app/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    // Instancia el cliente del servidor respetando tus cookies
    const supabase = await createClient()

    // 1. Canjea el código de OAuth por la sesión de Supabase
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && session?.user) {
      const userEmail = session.user.email
      const fullName = session.user.user_metadata?.full_name || 'Usuario Google'
      
      // Divide el nombre completo proporcionado por Google
      const nameParts = fullName.trim().split(' ')
      const nombre = nameParts[0] || 'Usuario'
      const apellido = nameParts.slice(1).join(' ') || ''

      // 2. Busca si el correo ya existe en tu tabla personalizada 'usuario'
      const { data: usuarioExistente } = await supabase
        .from('usuario')
        .select('id_usuario')
        .eq('correo', userEmail)
        .maybeSingle()

      // 3. Si no existe en tu tabla 'usuario', crea la fila automáticamente
      if (!usuarioExistente) {
        await supabase.from('usuario').insert([
          {
            nombre: nombre,
            apellido: apellido,
            correo: userEmail,
            contrasena: 'OAUTH_GOOGLE_USER', // Identificador en texto para cuentas SSO
            rol: 'usuario'
          }
        ])
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}