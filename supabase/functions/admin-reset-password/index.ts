// Supabase Edge Function: admin-reset-password
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ResetPayload {
    userId: string
    newPassword: string
}

Deno.serve(async (req) => {
    // 1. Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('CRITICAL: Supabase environment variables are missing!')
            throw new Error('Server configuration error: Missing API Keys.')
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Safe parsing of JSON body
        let body;
        try {
            body = await req.json();
        } catch (e) {
            return new Response(
                JSON.stringify({ error: 'Body must be a valid JSON' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const { userId, newPassword } = body as ResetPayload;

        if (!userId || !newPassword) {
            return new Response(
                JSON.stringify({ error: 'userId and newPassword are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`[Admin Reset] Processing password reset for: ${userId}`)

        // STEP: Update user's password in Auth
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        )

        if (error) {
            console.error(`[Admin Reset] Supabase Auth Error:`, error.message)
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`[Admin Reset] Successfully updated password for: ${data.user.email}`)

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Password updated successfully.',
                userId: data.user.id
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('[Admin Reset] Fatal Error:', error.message)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
