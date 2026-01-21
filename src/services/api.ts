// Ito ay isang Mock Service para gumana ang Login kahit wala pang backend
// Dito natin ilalagay ang logic para sa "Quick Login" buttons

export const ApiService = {
  login: async (username: string, password: string) => {
    // Simulate network delay (para kunwari naglo-loading)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // HARDCODED CREDENTIALS (Para sa Demo/Testing)
    
    // 1. Alumni Head Login
    if (username === 'alumni_head' && password === 'alumni123') {
      return { 
        success: true, 
        user: { 
          id: 1, 
          name: 'Ms. Sarah Head', 
          role: 'admin', // or 'alumni_head' kung meron sa types
          email: 'head@bestlink.edu.ph' 
        } 
      };
    }

    // 2. Registrar Staff Login
    if (username === 'staff' && password === 'staff123') {
      return { 
        success: true, 
        user: { 
          id: 2, 
          name: 'Registrar Staff', 
          role: 'registrar', 
          email: 'registrar@bestlink.edu.ph' 
        } 
      };
    }

    // 3. Super Admin Login
    if (username === 'admin' && password === 'admin123') {
      return { 
        success: true, 
        user: { 
          id: 3, 
          name: 'System Admin', 
          role: 'superadmin', 
          email: 'admin@bestlink.edu.ph' 
        } 
      };
    }

    // 4. Regular Alumni Login (Example)
    if (username === 'alumni' && password === 'alumni123') {
      return { 
        success: true, 
        user: { 
          id: 4, 
          name: 'Juan Dela Cruz', 
          role: 'alumni', 
          email: 'juan@gmail.com' 
        },
        requires2FA: true // Pwede natin i-trigger ang 2FA dito
      };
    }

    // Kapag mali ang password
    return { success: false, error: 'Invalid username or password' };
  }
};

export default ApiService;