import supabase from "../supabase/route.js";

/**
 * Fetches approved arrangements from the Supabase database.
 *
 * @returns {Promise<Object>} An object containing data and error.
 */

export const fetchApprovedArrangements = async () => {
    const { data, error } = await supabase
        .from("arrangement")
        .select(`*,employee:staff_id (staff_fname, staff_lname)`)
        .eq("status", "approved")
        .order("date", { ascending: true });

    return { data, error };
};

/**
 * Formats a JavaScript Date object into 'YYYY-MM-DD' string.
 *
 * @param {Date} date - The date to format.
 * @returns {string} Formatted date string.
 */
export const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};
