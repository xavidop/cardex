# **App Name**: Cardex

## Core Features:

- User Authentication: Secure user authentication using email and Google login.
- Card Scanning: Utilize Gemini Vision to scan and identify Pokémon cards based on images. It will use tools to try to provide the most accurate name, set, and rarity, even with partial information. The user will have the option to correct the identification.
- Card Display: Display identified card information including name, set, rarity, and an image from the Gemini Vision. Allow the user to accept, edit or reject.
- Card Storage: Store identified and user-confirmed card data, with user id.
- Data Management: Allow the user to create, update and delete his data stored into Firestore.

## Style Guidelines:

- Primary color: #3498db (RGB) - A clean, professional blue to evoke trust and security.
- Background color: #ecf0f1 (RGB) - A light, neutral gray to provide a clean backdrop.
- Accent color: #e74c3c (RGB) - A vibrant red for errors or highlighting important actions (like deleting a card).
- Body and headline font: 'Inter' - a grotesque-style sans-serif with a modern, machined, objective, neutral look; suitable for both headlines and body text
- Use a consistent set of outline-style icons throughout the application.
- Employ a grid-based layout to ensure consistency and readability across different screen sizes.
- Subtle animations during card scanning and data saving to provide feedback to the user.