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

2.  **Install dependencies:** Run the following command in both the `be` (backend) and `fe` (frontend) directories:
    ```bash
    cd be
    npm install
    cd ../fe
    npm install
    cd .. # Return to the project root
    ```

3.  **Configure Environment Variables:**
    * Create a `.env` file in both the `be` and `fe` directories.
    * Refer to the `.env.example` file in each directory for the required keys and their expected format.

4.  **Configure Firebase Admin Access (Backend):**
    * Create a file named `adminConfig.json` in the **root** directory of your project.
    * Obtain your Firebase project configuration from the Firebase Console. Go to your project, then **Project settings** (gear icon) -> **Service accounts** -> **Generate new private key** -> **Firebase SDK snippet**. Copy the `config` object and paste it into `adminConfig.json` or import the .json file and change name to `adminConfig.json`.

  ```json
    {
  "type": "",
  "project_id": "",
  "private_key_id": "",
  "private_key": "",
  "client_email": "",
  "client_id": "",
  "auth_uri": "",
  "token_uri": "",
  "auth_provider_x509_cert_url": "",
  "client_x509_cert_url": "",
  "universe_domain": ""
    }
  ```

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
    *(Note: Ensure your `fe/package.json` has a `start:all` script that handles starting both frontend and backend. You might need to adjust this command based on your specific setup.)*

### ⚙️ Run Backend Only

1.  Navigate to the backend directory:
    ```bash
    cd BOSTR-RAGBOT/be
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