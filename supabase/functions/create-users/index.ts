// Supabase Edge Function: create-users
// Creates auth.users entries server-side using service_role key
// Called from MasterListUpload.tsx via supabase.functions.invoke('create-users', { body })

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface UserPayload {
    student_id: string
    first_name: string
    last_name: string
    middle_name?: string
    course: string
    batch_year: string
    email: string
    password: string
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        // Create admin client with service role key (server-side only)
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        const { users } = await req.json() as { users: UserPayload[] }

        if (!users || !Array.isArray(users) || users.length === 0) {
            return new Response(
                JSON.stringify({ error: 'No users provided' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Cap at 50 users per batch to avoid timeout
        const batch = users.slice(0, 50)
        const results: { email: string; success: boolean; error?: string; password?: string }[] = []

        for (const user of batch) {
            try {
                // Step 1: Create auth user
                const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                    email: user.email,
                    password: user.password,
                    email_confirm: true, // Auto-confirm so they can login immediately
                    user_metadata: {
                        first_name: user.first_name,
                        last_name: user.last_name,
                        student_id: user.student_id,
                    }
                })

                if (authError) {
                    // If user already exists, skip but don't fail
                    if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
                        results.push({ email: user.email, success: false, error: 'Already exists' })
                        continue
                    }
                    throw authError
                }

                // Step 2: Upsert profile record
                const { error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .upsert({
                        id: authData.user.id,
                        student_id: user.student_id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        middle_name: user.middle_name || null,
                        course: user.course,
                        batch_year: user.batch_year,
                        email: user.email,
                        role: 'alumni',
                        status: 'master_list',
                        auth_provider: 'email',
                    }, { onConflict: 'id' })

                if (profileError) {
                    console.error(`Profile upsert error for ${user.email}:`, profileError)
                }

                results.push({ email: user.email, success: true, password: user.password })

            } catch (err: any) {
                console.error(`Error creating user ${user.email}:`, err)
                results.push({ email: user.email, success: false, error: err.message || 'Unknown error' })
            }
        }

        const successCount = results.filter(r => r.success).length
        const failCount = results.filter(r => !r.success).length

        return new Response(
            JSON.stringify({
                message: `Created ${successCount} users, ${failCount} skipped/failed`,
                results,
                successCount,
                failCount,
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Edge function error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
