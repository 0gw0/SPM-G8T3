"use client";

import React, { useEffect } from "react";
import { createClient } from "@/utils/supabase/client.js";

export default function TeamArrangements() {
    const supabase = createClient();

    useEffect(() => {
        async function fetchArrangements() {
            const { data, error } = await supabase.auth.getSession();
            if (error || !data.session) {
                return;
            }
            await fetch("/api/schedule/view-team", {
                headers: {
                    Authorization: `Bearer ${data.session.access_token}`,
                },
            });
        }
        fetchArrangements();
    }, []);

    return null;
}
