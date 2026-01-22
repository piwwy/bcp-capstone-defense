import { supabase } from '../supabaseClient';

export const ApiService = {
  // LOGIN: Check database for credentials
  login: async (email: string, password: string) => {
    try {
      // 1. Hanapin ang user sa database matching email & password
      const { data: user, error } = await supabase
        .from('alumni_accounts')
        .select('*')
        .eq('email', email)
        .eq('password', password) // Note: Plain text check for academic demo
        .single();

      if (error || !user) {
        return { success: false, error: 'Invalid email or password.' };
      }

      // 2. Check kung APPROVED na ba ng Admin
      if (user.status === 'pending') {
        return { 
          success: false, 
          error: 'Your account is currently under verification by the Registrar.' 
        };
      }

      // 3. Check kung REJECTED
      if (user.status === 'rejected') {
        return { 
          success: false, 
          error: 'Your application was declined. Please contact the Alumni Office.' 
        };
      }

      // 4. Success! Check role para sa 2FA logic
      const isAlumni = user.role === 'alumni';
      
      return { 
        success: true, 
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role
        },
        requires2FA: isAlumni // Alumni lang ang may 2FA required
      };

    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  // REGISTER: Save new applicant to database
  register: async (formData: any) => {
    try {
      // 1. Check kung existing na ang email
      const { data: existingUser } = await supabase
        .from('alumni_accounts')
        .select('email')
        .eq('email', formData.email)
        .single();

      if (existingUser) {
        return { success: false, error: 'Email is already registered.' };
      }

      // 2. Insert new record with 'pending' status
      const { error } = await supabase
        .from('alumni_accounts')
        .insert([
          {
            first_name: formData.firstName,
            last_name: formData.lastName,
            middle_name: formData.middleName,
            maiden_name: formData.maidenName,
            birthday: formData.birthday,
            mobile: formData.mobile,
            email: formData.email,
            password: formData.password, // Saving password directly (Hash this in real prod)
            batch_year: formData.batchYear,
            course: formData.course,
            verification_answer: formData.verificationAnswer, // Thesis Adviser / Section
            role: 'alumni',
            status: 'pending' // Default status
          }
        ]);

      if (error) {
        console.error('Registration Error:', error);
        return { success: false, error: 'Failed to register. Please try again.' };
      }

      return { success: true, message: 'Registration successful!' };

    } catch (err) {
      return { success: false, error: 'System error occurred.' };
    }
  }
};

export default ApiService;