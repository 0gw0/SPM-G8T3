'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

export default function DemoClient() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        async function getUser() {
            const supabase = createClient();
            const { data, error } = await supabase.auth.getUser();
            if (error || !data?.user) {
                console.log('no user');
            } else {
                setUser(data.user);
            }
        }
        getUser();
    }, []);
}
