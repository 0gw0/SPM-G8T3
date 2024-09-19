# Coding Standards

This document outlines basic coding standards for our project. Please follow these guidelines to keep our code consistent and readable.

## JavaScript

1. Indentation: Use 4 spaces
2. Naming:
    - Variables and functions: camelCase (e.g., `userName`, `getData()`)
    - Classes: PascalCase (e.g., `UserProfile`)
    - Constants: UPPERCASE_WITH_UNDERSCORES (e.g., `MAX_ITEMS`)
3. Use `const` for variables that don't change, `let` for variables that do
4. Always use semicolons at the end of statements
5. Keep lines short, around 80 characters if possible

Example:

```javascript
const MAX_ITEMS = 100;

const getUserData = async (userId) => {
	try {
		const { data, error } = await supabase
			.from('users')
			.select('*')
			.eq('id', userId)
			.single();

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error:', error.message);
		return null;
	}
};
```

## React and Next.js

1. Use function components and hooks
2. Keep components small and focused
3. Use clear, descriptive names for components and files
4. Put each component in its own file

Example:

```jsx
import React, { useState, useEffect } from 'react';

const UserProfile = ({ userId }) => {
	const [user, setUser] = useState(null);

	useEffect(() => {
		// Load user data here
	}, [userId]);

	if (!user) return <div>Loading...</div>;

	return (
		<div>
			<h1>{user.name}</h1>
			<p>{user.email}</p>
		</div>
	);
};

export default UserProfile;
```

## Supabase

1. Always handle errors when making database calls
2. Use Supabase's built-in methods (like `select`, `insert`, `update`, `delete`)
3. Never put API keys or sensitive info in your code

Example:

```javascript
const addUser = async (userData) => {
	const { data, error } = await supabase.from('users').insert([userData]);

	if (error) {
		console.error('Error adding user:', error.message);
		return null;
	}
	return data;
};
```

## General Tips

1. Write clear, simple code
2. Add comments to explain complex parts
3. Don't repeat code - if you use something more than once, make it a function
4. Ask for help if you're unsure about something
5. Review each other's code before merging
