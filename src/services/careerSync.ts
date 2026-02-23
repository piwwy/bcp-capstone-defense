import { supabase } from './supabaseClient';
import { logAudit, AUDIT_ACTIONS } from './auditLogger';

export const syncHiredAlumni = async (
    alumniId: string,
    jobTitle: string,
    companyName: string,
    jobData: any
) => {
    try {
        // 1. Update alumni_profiles for current position and status
        const { error: profileError } = await supabase
            .from('alumni_profiles')
            .upsert({
                id: alumniId,
                employment_status: 'employed',
                current_position: jobTitle,
                current_company: companyName,
                headline: `Hired as ${jobTitle} at ${companyName}`,
                location: jobData.location || '',
                updated_at: new Date().toISOString()
            });

        if (profileError) throw profileError;

        // 2. Add to job_placement_logs as the CURRENT record
        // First, set all other "is_current" to false for this alumni
        await supabase
            .from('job_placement_logs')
            .update({ is_current: false, end_date: new Date().toISOString().slice(0, 10) })
            .eq('alumni_id', alumniId)
            .eq('is_current', true);

        // Fetch alumni names for the log
        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', alumniId)
            .single();

        const alumniName = profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown Alumni';

        // Insert new current placement
        const { error: logError } = await supabase
            .from('job_placement_logs')
            .insert([{
                alumni_id: alumniId,
                alumni_name: alumniName,
                company_name: companyName,
                job_title: jobTitle,
                industry: jobData.category || '',
                location: jobData.location || '',
                employment_type: jobData.type || 'Full-time',
                start_date: new Date().toISOString().slice(0, 10),
                is_current: true,
                status: 'active',
                description: `Hired via AMS Job Board: ${jobTitle}`
            }]);

        if (logError) throw logError;

        await logAudit(AUDIT_ACTIONS.RECORD_UPDATED, {
            module: 'Career',
            message: `System synchronized profile for hired alumni: ${alumniName}`,
            alumniId
        });

        return { success: true };
    } catch (error) {
        console.error('Career Sync Error:', error);
        return { success: false, error };
    }
};
