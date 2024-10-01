const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function populateAuthTable() {
    // Fetch all employees from the employee table
    const { data: employees, error } = await supabase
        .from('employee')
        .select('*');

    if (error) {
        console.error('Error fetching employees:', error);
        return;
    }

    for (const employee of employees) {
        const email = employee.email;
        const password = `${employee.staff_fname.toLowerCase()}${employee.staff_lname.toLowerCase()}${employee.dept.toLowerCase()}`;

        try {
            const { data, error } = await supabase.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true,
                user_metadata: {
                    staff_id: employee.staff_id,
                    role: employee.role,
                },
            });

            if (error) throw error;
            console.log(`User created for ${email}`);
        } catch (error) {
            console.error(`Error creating user for ${email}:`, error.message);
        }
    }
}

populateAuthTable()
    .then(() => console.log('Auth table population complete'))
    .catch((error) => console.error('Error in script execution:', error));