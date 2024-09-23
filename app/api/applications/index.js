import supabase from '../supabase/route.js'; // Ensure the path is correct

export default async function handler(req, res) {
  console.log('API route hit'); // Check if the route is hit
  if (req.method === 'GET') {
    try {
      // Simplified Supabase query to fetch all data from "arrangement" table
      const { data, error } = await supabase
        .from("arrangement") // Replace "arrangement" with your table name
        .select("*"); // Select all columns

      // Log the response data and error if any
      console.log('Data:', data);
      if (error) {
        console.error('Supabase Error:', error);
        throw error;
      }

      // Send the data as the response
      res.status(200).json(data);
    } catch (error) {
      console.error('Server Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
