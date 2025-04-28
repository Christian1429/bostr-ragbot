# BOSTR-RAGBOT: Intelligent Information Retrieval Chatbot

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Maintenance](https://img.shields.io/badge/Maintained-Yes-green.svg)

A powerful chatbot leveraging OpenAI and Firebase to provide intelligent information retrieval and storage using a vector database. It features a complete Content Management System (CMS) within an admin panel for seamless management of your knowledge base.

**Key Features:**

* **Intelligent Chat:** Interact with a chatbot powered by OpenAI for insightful answers.
* **Vector Database:** Utilizes vector embeddings for efficient and semantic information retrieval.
* **Firebase Integration:** Leverages Firebase for robust data storage and real-time capabilities.
* **Comprehensive CMS:** Admin panel for easy management of information, including:
    * Storing new data.
    * Deleting existing entries.
    * Retrieving and reviewing information.
* **Flexible Uploads:** Accepts various data formats:
    * PDF documents (`.pdf`)
    * JSON files (`.json`)
    * Web URLs (Scraping)
    * Plain text

## 🚀 Setup

Follow these steps to get the BOSTR-RAGBOT up and running on your local machine.

1.  **Navigate to the project root:**
    ```bash
    cd BOSTR-RAGBOT
    ```

2.  **Install dependencies:** Run the following command in both the `BE` (backend) and `FE` (frontend) directories:
    ```bash
    cd be
    npm install
    cd ../fe
    npm install
    ```

3.  **Configure Environment Variables:**
    * Expected environment comes from:
        * `OPENAI_API`
        ```bash
        https://platform.openai.com/api-keys
        ```
        * `FIREBASE`
        ```bash
        https://firebase.google.com/
        ```

    * Create account and obtain your API keys from the respective platforms.

    * Add your keys to `.env.example` file in `BE` and the required keys.
    * Rename `.env.example` to `.env` file in both the `BE` and `FE` directories.
    
4.  **Configure Firebase Admin Access (Backend):**
    * Create a new Firebase project with a Cloud Firestore or use an existing one.
    * Obtain your Firebase project configuration from the Firebase Console. Go to your project, then **Project settings** (gear icon) -> **Service accounts** -> **Generate new private key** -> **Firebase SDK snippet**. Copy the `config` object and paste it into `adminConfig.example` or import the .json file and change name to `adminConfig.json`.
    * Rename the file named `adminConfig.example` to `adminConfig.json` and add your Firebase keys.


## 🏃 Running the Application

You have several options to start the BOSTR-RAGBOT:

### 🌐 Run Frontend and Backend Simultaneously (Local Development)

1.  Navigate to the project root:
    ```bash
    cd BOSTR-RAGBOT
    ```

2.  Start both servers with a single command:
    ```bash
    cd fe
    npm run start:all
    ```
    *(Note: Ensure your `FE/package.json` has a `start:all` script that handles starting both frontend and backend. You might need to adjust this command based on your specific setup.)*

### ⚙️ Run Backend Only

1.  Navigate to the backend directory:
    ```bash
    cd BOSTR-RAGBOT/BE
    ```

2.  Start the backend server:
    ```bash
    npm run start:backend
    ```

### 🎨 Run Frontend Only

1.  Navigate to the frontend directory:
    ```bash
    cd BOSTR-RAGBOT/fe
    ```

2.  Start the frontend development server:
    ```bash
    npm run start:frontend
    ```

Enjoy exploring the capabilities of your BOSTR-RAGBOT!