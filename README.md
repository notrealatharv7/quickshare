# Collab Notes

This is a Next.js starter project for a real-time collaboration application called Collab Notes.

## Getting Started

To get the project running locally, follow these steps.

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (version 20 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### 2. Set Up Environment Variables

This project uses Genkit with the Google AI plugin for its real-time session capabilities. You will need a Google AI API key to run the application.

1.  Create a new file named `.env.local` in the root of the project folder.
2.  Open the `.env.local` file and add your API key as follows:

    ```env
    GEMINI_API_KEY=your_google_ai_api_key_here
    ```

    You can get a Google AI API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 3. Install Dependencies

Open your terminal, navigate to the project's root directory, and run the following command to install all the required packages:

```bash
npm install
```

### 4. Run the Development Server

After the dependencies are installed, you can start the local development server:

```bash
npm run dev
```

This will start the application on your local machine. You can view it by opening your web browser and navigating to:

[http://localhost:3000](http://localhost:3000)

The application will automatically reload if you make any changes to the code.
